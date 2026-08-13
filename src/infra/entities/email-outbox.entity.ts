import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum EmailTemplate {
  COMPANY_WELCOME = 'company-welcome',
  USER_INVITATION = 'user-invitation',
  PASSWORD_RESET = 'password-reset',
  PASSWORD_CHANGED = 'password-changed',
}

@Entity({ name: 'email_outbox' })
@Index(['status', 'nextAttemptAt'])
export class EmailOutbox extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  to: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'varchar', length: 50 })
  template: EmailTemplate;

  @Column({ type: 'jsonb' })
  context: Record<string, string>;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'queued' | 'processing' | 'sent' | 'failed';

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({
    name: 'next_attempt_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  nextAttemptAt: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;
}
