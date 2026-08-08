import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Company } from './company.entity';

@Entity({ name: 'company_users' })
export class CompanyUser extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'company_owner', type: 'boolean', default: false })
  companyOwner: boolean;

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
}
