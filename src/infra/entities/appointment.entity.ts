import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { CompanyUser } from './company-user.entity';
import { Client } from './client.entity';
import { AppointmentService } from './appointment-service.entity';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  NO_SHOW = 'NO_SHOW',
}

@Entity({ name: 'appointments' })
export class Appointment extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @Column({ name: 'professional_id', type: 'uuid' }) professionalId: string;
  @Column({ name: 'client_id', type: 'uuid' }) clientId: string;
  @Column({ name: 'start_at', type: 'timestamptz' }) startAt: Date;
  @Column({ name: 'end_at', type: 'timestamptz' }) endAt: Date;
  @Column({ name: 'total_duration_minutes', type: 'int' })
  totalDurationMinutes: number;
  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;
  @Column({
    name: 'status',
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @ManyToOne(() => Company, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company: Relation<Company>;
  @ManyToOne(() => CompanyUser, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'professional_id' })
  professional: Relation<CompanyUser>;
  @ManyToOne(() => Client, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: Relation<Client>;
  @OneToMany(() => AppointmentService, (item) => item.appointment)
  services: Relation<AppointmentService[]>;
}
