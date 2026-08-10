import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Service } from './services.entity';
import { CompanyUser } from './company-user.entity';

@Entity({ name: 'company_user_services' })
export class CompanyUserService extends BaseEntity {
  @Column({ name: 'company_user_id', type: 'uuid' })
  companyUserId: string;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => Service, (service) => service.users, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'service_id',
  })
  service: Relation<Service>;

  @ManyToOne(() => CompanyUser, (companyUser) => companyUser.services, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'company_user_id',
  })
  companyUser: Relation<CompanyUser>;
}
