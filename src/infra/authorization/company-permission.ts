import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CompanyUser } from '../entities/company-user.entity';

export async function ensureCanManageCompany(
  companyUserRepository: Repository<CompanyUser>,
  companyId: string,
  userId: string,
): Promise<CompanyUser> {
  const companyUser = await companyUserRepository.findOne({
    where: { companyId, userId },
    select: { id: true, isAdmin: true, isOwner: true },
  });

  if (!companyUser || (!companyUser.isAdmin && !companyUser.isOwner)) {
    throw new ForbiddenException(
      'Usuário não tem permissão para gerenciar recursos da empresa.',
    );
  }

  return companyUser;
}
