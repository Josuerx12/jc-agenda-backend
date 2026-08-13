import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { LessThan, Repository } from 'typeorm';
import { EmailOutbox } from 'src/infra/entities/email-outbox.entity';
import { EMAIL_JOB, EMAIL_QUEUE } from './email.constants';

@Injectable()
export class EmailDispatcher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(EmailDispatcher.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    @InjectRepository(EmailOutbox)
    private readonly outboxRepository: Repository<EmailOutbox>,
    @InjectQueue(EMAIL_QUEUE) private readonly queue: Queue,
  ) {}

  onApplicationBootstrap(): void {
    const interval = Number(process.env.EMAIL_OUTBOX_INTERVAL_MS ?? 3000);
    this.timer = setInterval(() => void this.dispatch(), interval);
    this.timer.unref();
    void this.dispatch();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async dispatch(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const staleAt = new Date(Date.now() - 5 * 60_000);
      const messages = await this.outboxRepository.find({
        where: [
          { status: 'pending' },
          { status: 'queued', updatedAt: LessThan(staleAt) },
        ],
        order: { createdAt: 'ASC' },
        take: Number(process.env.EMAIL_OUTBOX_BATCH_SIZE ?? 100),
      });

      for (const message of messages) {
        try {
          const existing = await this.queue.getJob(message.id);
          if (!existing) {
            await this.queue.add(
              EMAIL_JOB,
              { outboxId: message.id },
              {
                jobId: message.id,
                attempts: Number(process.env.EMAIL_QUEUE_MAX_ATTEMPTS ?? 8),
                backoff: { type: 'exponential', delay: 30_000 },
                removeOnComplete: { age: 86_400, count: 10_000 },
                removeOnFail: { age: 604_800, count: 10_000 },
              },
            );
          }
          await this.outboxRepository.update(
            { id: message.id, status: message.status },
            { status: 'queued', nextAttemptAt: new Date() },
          );
        } catch (error) {
          this.logger.error(
            `Não foi possível publicar o e-mail ${message.id} no Redis: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
