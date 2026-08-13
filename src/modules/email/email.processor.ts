import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { compile, TemplateDelegate } from 'handlebars';
import { createTransport, Transporter } from 'nodemailer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Repository } from 'typeorm';
import {
  EmailOutbox,
  EmailTemplate,
} from 'src/infra/entities/email-outbox.entity';
import { EMAIL_JOB, EMAIL_QUEUE } from './email.constants';

interface EmailJobData {
  outboxId: string;
}

@Processor(EMAIL_QUEUE, {
  concurrency: Number(process.env.EMAIL_QUEUE_CONCURRENCY ?? 5),
})
export class EmailProcessor
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly transporter: Transporter;
  private readonly templates = new Map<EmailTemplate, TemplateDelegate>();

  constructor(
    @InjectRepository(EmailOutbox)
    private readonly outboxRepository: Repository<EmailOutbox>,
  ) {
    super();
    this.transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      requireTLS: process.env.SMTP_REQUIRE_TLS !== 'false',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      pool: true,
      maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS ?? 5),
      maxMessages: Number(process.env.SMTP_MAX_MESSAGES ?? 100),
    });

    for (const template of Object.values(EmailTemplate)) {
      const source = readFileSync(
        join(__dirname, 'templates', `${template}.hbs`),
        'utf8',
      );
      this.templates.set(template, compile(source));
    }
  }

  onApplicationBootstrap(): void {
    this.validateConfiguration();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    if (job.name !== EMAIL_JOB) return;
    const message = await this.outboxRepository.findOneBy({
      id: job.data.outboxId,
    });
    if (!message || message.status === 'sent') return;

    await this.outboxRepository.update(message.id, {
      status: 'processing',
      attempts: job.attemptsMade + 1,
    });

    try {
      const render = this.templates.get(message.template);
      if (!render) {
        throw new Error(`Template desconhecido: ${message.template}`);
      }
      await this.transporter.sendMail({
        messageId: `<${message.id}@jcagenda.com.br>`,
        from: process.env.EMAIL_FROM ?? 'JC Agenda <no-reply@jcagenda.com.br>',
        to: message.to,
        subject: message.subject,
        html: render(message.context),
        text: this.textVersion(message),
      });
      await this.outboxRepository.update(message.id, {
        status: 'sent',
        sentAt: new Date(),
        attempts: job.attemptsMade + 1,
        lastError: null,
        context: this.sanitizeDeliveredContext(message),
      });
    } catch (error) {
      const attempts = job.attemptsMade + 1;
      const maxAttempts = Number(job.opts.attempts ?? 1);
      const errorMessage =
        error instanceof Error
          ? error.message.slice(0, 2000)
          : 'Erro desconhecido';
      await this.outboxRepository.update(message.id, {
        status: attempts >= maxAttempts ? 'failed' : 'queued',
        attempts,
        lastError: errorMessage,
      });
      this.logger.error(
        `Falha ao enviar e-mail ${message.id} (tentativa ${attempts}/${maxAttempts})`,
      );
      throw error;
    }
  }

  private textVersion(message: EmailOutbox): string {
    const { firstName, companyName, platformUrl, temporaryPassword, resetUrl } =
      message.context;
    if (message.template === EmailTemplate.PASSWORD_RESET) {
      return `Olá, ${firstName}. Redefina sua senha da JC Agenda: ${resetUrl}`;
    }
    if (message.template === EmailTemplate.PASSWORD_CHANGED) {
      return `Olá, ${firstName}. A senha da sua conta JC Agenda foi alterada. Se não foi você, contate o suporte imediatamente.`;
    }
    if (message.template === EmailTemplate.USER_INVITATION) {
      return `Olá, ${firstName}. Você foi cadastrado na ${companyName}. Acesse ${platformUrl} com a senha temporária: ${temporaryPassword}`;
    }
    return `Olá, ${firstName}. A ${companyName} já está pronta na JC Agenda. Acesse ${platformUrl}`;
  }

  private sanitizeDeliveredContext(
    message: EmailOutbox,
  ): Record<string, string> {
    const context = { ...message.context };
    if (context.temporaryPassword) context.temporaryPassword = '[removida]';
    if (context.resetUrl) context.resetUrl = '[removida]';
    return context;
  }

  private validateConfiguration(): void {
    const production = process.env.MODE?.toUpperCase() !== 'DEV';
    if (production && !process.env.SMTP_HOST) {
      throw new Error('SMTP_HOST deve ser configurado em produção');
    }
    if (process.env.SMTP_USER && !process.env.SMTP_PASSWORD) {
      throw new Error('SMTP_PASSWORD deve ser configurado com SMTP_USER');
    }
    const platformUrl = (
      process.env.PLATFORM_URL_PATTERN ?? 'https://{slug}.jcagenda.com.br'
    ).replace('{slug}', 'empresa');
    const resetUrl = (
      process.env.PASSWORD_RESET_URL_PATTERN ??
      'https://empresa.jcagenda.com.br/reset-password?token={token}'
    ).replace('{token}', 'example');
    if (
      production &&
      [platformUrl, resetUrl].some(
        (value) => new URL(value).protocol !== 'https:',
      )
    ) {
      throw new Error('URLs de e-mail devem utilizar HTTPS em produção');
    }
  }
}
