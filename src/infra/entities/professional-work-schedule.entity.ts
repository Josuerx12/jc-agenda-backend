import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { CompanyUser } from './company-user.entity';

@Entity({ name: 'professional_work_schedules' })
@Unique('UQ_professional_work_schedule_day', ['professionalId', 'dayOfWeek'])
export class ProfessionalWorkSchedule extends BaseEntity {
  @Column({ name: 'professional_id', type: 'uuid' }) professionalId: string;
  @Column({ name: 'day_of_week', type: 'smallint' }) dayOfWeek: number;
  @Column({ name: 'start_time', type: 'time' }) startTime: string;
  @Column({ name: 'end_time', type: 'time' }) endTime: string;
  @Column({ name: 'lunch_start_time', type: 'time', nullable: true })
  lunchStartTime: string | null;
  @Column({ name: 'lunch_end_time', type: 'time', nullable: true })
  lunchEndTime: string | null;

  @ManyToOne(() => CompanyUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professional_id' })
  professional: Relation<CompanyUser>;
}
