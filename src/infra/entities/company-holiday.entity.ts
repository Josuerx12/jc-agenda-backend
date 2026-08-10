import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';

@Entity({ name: 'company_holidays' })
@Unique('UQ_company_holiday_date', ['companyId', 'date'])
export class CompanyHoliday extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @Column({ name: 'date', type: 'date' }) date: string;
  @Column({ name: 'name', type: 'varchar', length: 150 }) name: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Relation<Company>;
}
