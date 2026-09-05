import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Company } from './company.entity';
import { CompanyUserService } from './company-user-service.entity';

@Entity({ name: 'company_users' })
export class CompanyUser extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'company_owner', type: 'boolean', default: false })
  isOwner: boolean;

  @Column({ name: 'company_admin', type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({ name: 'company_professional', type: 'boolean', default: false })
  isProfessional: boolean;

  @Column({ name: 'avatar_image_id', type: 'uuid', nullable: true })
  avatarImageId: string | null;

  @ManyToOne(() => User, (user) => user.companies, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_company_users_user',
  })
  user: Relation<User>;

  @ManyToOne(() => Company, (company) => company.users, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'company_id',
    foreignKeyConstraintName: 'FK_company_users_company',
  })
  company: Relation<Company>;

  @OneToMany(
    () => CompanyUserService,
    (companyUserService) => companyUserService.companyUser,
  )
  services: Relation<CompanyUserService[]>;
}
