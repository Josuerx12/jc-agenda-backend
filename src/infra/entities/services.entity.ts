import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { CompanyUserService } from './company-user-service.entity';
import { Company } from './company.entity';

@Entity({ name: 'services' })
export class Service extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'duration', type: 'int' })
  durationInMinutes: number;

  @OneToMany(
    () => CompanyUserService,
    (companyUserService) => companyUserService.service,
  )
  users: Relation<CompanyUserService[]>;

  @ManyToOne(() => Company, (company) => company.services, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'company_id',
  })
  company: Relation<Company>;
}
