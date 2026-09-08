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
import { Service } from './services.entity';

@Entity({ name: 'service_categories' })
export class ServiceCategory extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @Column({ type: 'varchar', length: 100 }) name: string;
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @ManyToOne(() => Company, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company: Relation<Company>;
  @OneToMany(() => Service, (service) => service.category)
  services: Relation<Service[]>;
}
