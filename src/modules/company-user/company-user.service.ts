import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CompanyUser } from 'src/infra/entities/company-user.entity';
import { DataSource, Repository } from 'typeorm';
import { companyUserPaginationConfig } from './pagination/company-user-pagination.config';
import { Service } from 'src/infra/entities/services.entity';
import { User } from 'src/infra/entities/user.entity';
import { hash } from 'bcryptjs';
import { Company } from 'src/infra/entities/company.entity';
import { CompanyUserService } from 'src/infra/entities/company-user-service.entity';
import { ensureCanManageCompany } from 'src/infra/authorization/company-permission';
import { randomBytes } from 'node:crypto';
import { EmailService } from '../email/email.service';
import { EmailTemplate } from 'src/infra/entities/email-outbox.entity';

@Injectable()
export class CompanyUserServices {
  constructor(
    @InjectRepository(CompanyUser)
    private readonly companyUserRepository: Repository<CompanyUser>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
  ) {}

  async create(createCompanyUserDto: CreateCompanyUserDto, userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const { services } = createCompanyUserDto;

      const userRepo = manager.getRepository(User);
      const companyRepo = manager.getRepository(Company);
      const companyUserRepo = manager.getRepository(CompanyUser);
      const servicesRepo = manager.getRepository(Service);
      const companyUserServiceRepo = manager.getRepository(CompanyUserService);

      const company = await companyRepo.findOne({
        where: { id: createCompanyUserDto.companyId },
      });

      await ensureCanManageCompany(
        companyUserRepo,
        createCompanyUserDto.companyId,
        userId,
      );

      if (!company) {
        throw new NotFoundException(
          'A empresa informada não foi encontrada, verifique e tente novamente.',
        );
      }

      const queryBuilder = servicesRepo.createQueryBuilder('service');
      queryBuilder.where('service.id IN (:...services)', { services });

      const temporaryPassword = this.generateTemporaryPassword();
      const hashedPassword = await hash(temporaryPassword, 10);

      let user = userRepo.create({
        firstName: createCompanyUserDto.firstName,
        lastName: createCompanyUserDto.lastName,
        email: createCompanyUserDto.email.trim().toLowerCase(),
        phone: createCompanyUserDto.phone,
        password: hashedPassword,
      });

      const usersExists = await userRepo.existsBy({
        email: createCompanyUserDto.email.trim().toLowerCase(),
      });

      if (usersExists) {
        throw new ConflictException(
          'O e-mail informado já está em uso, por favor utilize outro e-mail.',
        );
      }

      user = await userRepo.save(user);

      let companyUser = companyUserRepo.create({
        user,
        company,
        isAdmin: createCompanyUserDto.isAdmin,
        isProfessional: createCompanyUserDto.isProfessional,
      });

      companyUser = await companyUserRepo.save(companyUser);

      if (createCompanyUserDto.isProfessional) {
        const foundServices = await queryBuilder.getMany();

        if (foundServices.length !== services.length) {
          throw new NotFoundException(
            'Um ou mais serviços não foram encontrados, verifique e tente novamente.',
          );
        }

        const companyUserServices = foundServices.map((service) => {
          return companyUserServiceRepo.create({ companyUser, service });
        });

        await companyUserServiceRepo.save(companyUserServices);
      }

      await this.emailService.enqueue(
        {
          to: user.email,
          subject: `Seu acesso à ${company.trandingName}`,
          template: EmailTemplate.USER_INVITATION,
          context: {
            firstName: user.firstName,
            companyName: company.trandingName,
            temporaryPassword,
            platformUrl: this.emailService.platformUrl(company.slug),
          },
        },
        manager,
      );
    });
  }

  private generateTemporaryPassword(): string {
    // Garante diversidade de caracteres sem depender de uma senha fornecida pelo cliente.
    return `Jc@${randomBytes(9).toString('base64url')}9a`;
  }

  findAll(query: PaginateQuery, companyId: string) {
    const queryBuilder = this.companyUserRepository
      .createQueryBuilder('companyUser')
      .where('companyUser.companyId = :companyId', { companyId });

    return paginate(query, queryBuilder, companyUserPaginationConfig);
  }

  findOne(id: string, companyId: string) {
    return this.companyUserRepository.findOne({
      where: { id, companyId },
      relations: {
        user: true,
        company: true,
        services: {
          service: true,
        },
      },
    });
  }

  async update(
    id: string,
    userId: string,
    updateCompanyUserDto: UpdateCompanyUserDto,
  ) {
    const { services, firstName, lastName, email, phone } =
      updateCompanyUserDto;
    const companyId = updateCompanyUserDto.companyId!;

    return await this.dataSource.transaction(async (manager) => {
      const companyUserRepo = manager.getRepository(CompanyUser);
      const userRepo = manager.getRepository(User);
      const companyUserServiceRepo = manager.getRepository(CompanyUserService);

      await ensureCanManageCompany(companyUserRepo, companyId, userId);

      const companyUser = await companyUserRepo.findOne({
        where: { id, companyId },
        relations: {
          user: true,
        },
      });

      if (!companyUser) {
        throw new NotFoundException(
          'O usuário da empresa informado não foi encontrado, verifique e tente novamente.',
        );
      }

      const isProfessional =
        updateCompanyUserDto.isProfessional ?? companyUser.isProfessional;
      const requestedServiceIds = [...new Set(services ?? [])];
      let foundServices: Service[] = [];

      if (isProfessional && services !== undefined && services.length > 0) {
        const servicesRepo = manager.getRepository(Service);
        const queryBuilder = servicesRepo.createQueryBuilder('service');
        queryBuilder
          .where('service.id IN (:...services)', {
            services: requestedServiceIds,
          })
          .andWhere('service.companyId = :companyId', { companyId });

        foundServices = await queryBuilder.getMany();

        if (foundServices.length !== requestedServiceIds.length) {
          throw new NotFoundException(
            'Um ou mais serviços não foram encontrados, verifique e tente novamente.',
          );
        }
      }

      const normalizedEmail = email?.trim().toLowerCase();
      if (normalizedEmail && normalizedEmail !== companyUser.user.email) {
        const exists = await manager
          .getRepository(User)
          .existsBy({ email: normalizedEmail });

        if (exists) {
          throw new ConflictException(
            'O e-mail informado já está em uso, por favor utilize outro e-mail.',
          );
        }

        await userRepo.update(companyUser.user.id, {
          email: normalizedEmail,
          authVersion: () => 'auth_version + 1',
        });
      }

      if (firstName && firstName !== companyUser.user.firstName) {
        await userRepo.update(companyUser.user.id, { firstName });
      }

      if (lastName && lastName !== companyUser.user.lastName) {
        await userRepo.update(companyUser.user.id, { lastName });
      }

      if (phone && phone !== companyUser.user.phone) {
        await userRepo.update(companyUser.user.id, { phone });
      }

      await companyUserRepo.update(id, {
        isAdmin: updateCompanyUserDto.isAdmin ?? companyUser.isAdmin,
        isProfessional,
      });

      if (services !== undefined || !isProfessional) {
        await companyUserServiceRepo.delete({ companyUserId: id });

        if (isProfessional && foundServices.length > 0) {
          const companyUserServices = foundServices.map((service) =>
            companyUserServiceRepo.create({
              companyUserId: id,
              serviceId: service.id,
            }),
          );

          await companyUserServiceRepo.save(companyUserServices);
        }
      }
    });
  }

  async remove(id: string, companyId: string, userId: string) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);

    const companyUser = await this.companyUserRepository.findOne({
      where: { id, companyId },
    });

    if (!companyUser) {
      throw new NotFoundException(
        'O usuário da empresa informado não foi encontrado, verifique e tente novamente.',
      );
    }

    await this.companyUserRepository.softDelete(id);
  }
}
