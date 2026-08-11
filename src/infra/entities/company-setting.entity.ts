import { Column, Entity, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';

@Entity({ name: 'company_settings' })
export class CompanySetting extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid', unique: true })
  companyId: string;

  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 100,
    default: 'America/Sao_Paulo',
  })
  timezone: string;

  @Column({ name: 'slot_interval_minutes', type: 'int', default: 60 })
  slotIntervalMinutes: number;

  @OneToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Relation<Company>;
}
