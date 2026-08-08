import { Column, Entity, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';

@Entity({ name: 'company_addresses' })
export class CompanyAddress extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'zip_code', type: 'varchar', length: 10 })
  zipCode: string;

  @Column({ name: 'state', type: 'varchar', length: 100 })
  state: string;

  @Column({ name: 'city', type: 'varchar', length: 100 })
  city: string;

  @Column({ name: 'neighborhood', type: 'varchar', length: 100 })
  neighborhood: string;

  @Column({ name: 'address', type: 'varchar', length: 255 })
  address: string;

  @Column({ name: 'number', type: 'varchar', length: 20, nullable: true })
  number: string;

  @Column({ name: 'complement', type: 'varchar', length: 255, nullable: true })
  complement: string;

  @OneToOne(() => Company, (company) => company.address)
  company: Relation<Company>;
}
