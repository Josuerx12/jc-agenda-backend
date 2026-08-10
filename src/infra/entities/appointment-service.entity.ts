import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Appointment } from './appointment.entity';
import { Service } from './services.entity';

@Entity({ name: 'appointment_services' })
export class AppointmentService extends BaseEntity {
  @Column({ name: 'appointment_id', type: 'uuid' }) appointmentId: string;
  @Column({ name: 'service_id', type: 'uuid' }) serviceId: string;
  @Column({ name: 'name', type: 'varchar', length: 255 }) name: string;
  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
  price: number;
  @Column({ name: 'duration_minutes', type: 'int' }) durationMinutes: number;

  @ManyToOne(() => Appointment, (appointment) => appointment.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Relation<Appointment>;
  @ManyToOne(() => Service, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service: Relation<Service>;
}
