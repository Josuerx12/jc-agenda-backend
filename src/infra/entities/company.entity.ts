import { Column, Entity, OneToMany, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CompanyUser } from './company-user.entity';
import { CompanyAddress } from './company-address.entity';
import { CompanyUserService } from './company-user-service.entity';
import { Product } from './product.entity';

@Entity({ name: 'companies' })
export class Company extends BaseEntity {
  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 100,
    default: 'America/Sao_Paulo',
  })
  timezone: string;

  @Column({ name: 'slot_interval_minutes', type: 'int', default: 60 })
  slotIntervalMinutes: number;

  @Column({ name: 'tranding_name', type: 'varchar', length: 100 })
  trandingName: string;

  @Column({ name: 'corporate_name', type: 'varchar', length: 100 })
  corporateName: string;

  @Column({ type: 'varchar', length: 14, unique: true })
  slug: string;

  @Column({ name: 'cnpj', type: 'varchar', length: 14 })
  cnpj: string;

  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({
    name: 'additional_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  additionalPhone: string;

  @OneToMany(() => CompanyUser, (companyUser) => companyUser.company)
  users: Relation<CompanyUser[]>;

  @OneToOne(() => CompanyAddress, (address) => address.company)
  address: Relation<CompanyAddress>;

  @OneToMany(
    () => CompanyUserService,
    (companyUserService) => companyUserService.companyUser,
  )
  services: Relation<CompanyUserService[]>;

  @OneToMany(() => Product, (product) => product.company)
  products: Relation<Product[]>;
}
