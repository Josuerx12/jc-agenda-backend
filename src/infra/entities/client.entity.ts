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

@Entity({ name: 'clients' })
@Unique('UQ_client_company_phone', ['companyId', 'phone'])
export class Client extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @Column({ name: 'name', type: 'varchar', length: 150 }) name: string;
  @Column({ name: 'phone', type: 'varchar', length: 20 }) phone: string;

  @ManyToOne(() => Company, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company: Relation<Company>;
}
