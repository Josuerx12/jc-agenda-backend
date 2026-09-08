import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Appointment } from './appointment.entity';
import { Product } from './product.entity';

@Entity({ name: 'appointment_products' })
@Unique('UQ_appointment_product', ['appointmentId', 'productId'])
@Check('CHK_appointment_product_quantity', 'quantity > 0')
export class AppointmentProduct extends BaseEntity {
  @Column({ name: 'appointment_id', type: 'uuid' }) appointmentId: string;
  @Column({ name: 'product_id', type: 'uuid' }) productId: string;
  @Column({ name: 'name', type: 'varchar', length: 255 }) name: string;
  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;
  @Column({ type: 'int' }) quantity: number;
  @Column({ name: 'total_price', type: 'decimal', precision: 14, scale: 2 })
  totalPrice: number;

  @ManyToOne(() => Appointment, (appointment) => appointment.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Relation<Appointment>;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;
}
