import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  EmailOutbox,
  EmailTemplate,
} from 'src/infra/entities/email-outbox.entity';

export interface QueueEmailInput {
  to: string;
  subject: string;
  template: EmailTemplate;
  context: Record<string, string>;
}

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailOutbox)
    private readonly outboxRepository: Repository<EmailOutbox>,
  ) {}

  async enqueue(
    input: QueueEmailInput,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(EmailOutbox)
      : this.outboxRepository;
    await repository.save(repository.create(input));
  }

  platformUrl(slug: string): string {
    const pattern =
      process.env.PLATFORM_URL_PATTERN ?? 'https://{slug}.jcagenda.com.br';
    return pattern.replace('{slug}', slug);
  }
}
