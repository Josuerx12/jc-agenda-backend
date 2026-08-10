import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CompanyUser } from './company-user.entity';

@Entity({ name: 'professional_time_offs' })
export class ProfessionalTimeOff extends BaseEntity {
  @Column({ name: 'professional_id', type: 'uuid' }) professionalId: string;
  @Column({ name: 'start_at', type: 'timestamptz' }) startAt: Date;
  @Column({ name: 'end_at', type: 'timestamptz' }) endAt: Date;
  @Column({ name: 'reason', type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @ManyToOne(() => CompanyUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professional_id' })
  professional: Relation<CompanyUser>;
}
