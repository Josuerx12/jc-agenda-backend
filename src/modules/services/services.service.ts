import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from 'src/infra/entities/services.entity';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { servicePaginationConfig } from './pagination/service-pagination.config';
import { CompanyUserService } from 'src/infra/entities/company-user-service.entity';
import { CompanyUser } from 'src/infra/entities/company-user.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepository: Repository<CompanyUser>,
    @InjectRepository(CompanyUserService)
    private readonly companyUserServiceRepository: Repository<CompanyUserService>,
  ) {}
  async create(createServiceDto: CreateServiceDto, userId: string) {
    const companyUserConnected = await this.companyUserRepository.findOne({
      where: { userId, companyId: createServiceDto.companyId },
    });

    if (
      !companyUserConnected ||
      (!companyUserConnected.isAdmin && !companyUserConnected.isOwner)
    ) {
      throw new ForbiddenException(
        `Usuário não tem permissão para criar serviços para a empresa.`,
      );
    }

    await this.serviceRepository.save(createServiceDto);
  }

  findAll(query: PaginateQuery, companyId: string) {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .innerJoin('service.company', 'company')
      .where('company.id = :companyId', { companyId });

    return paginate(query, queryBuilder, servicePaginationConfig);
  }

  simpleList(companyId: string) {
    return this.serviceRepository.find({
      where: { companyId },
      select: {
        id: true,
        companyId: true,
        name: true,
      },
    });
  }

  findOne(id: string, companyId: string) {
    return this.serviceRepository.findOneBy({ id, companyId });
  }

  async update(id: string, userId: string, updateServiceDto: UpdateServiceDto) {
    const { companyId, description, durationInMinutes, name, price } =
      updateServiceDto;

    const companyUserConnected = await this.companyUserRepository.findOne({
      where: { userId, companyId },
    });

    if (
      !companyUserConnected ||
      (!companyUserConnected.isAdmin && !companyUserConnected.isOwner)
    ) {
      throw new ForbiddenException(
        `Usuário não tem permissão para editar serviços da empresa.`,
      );
    }

    const service = await this.serviceRepository.findOneBy({
      id,
      companyId,
    });

    if (!service) {
      throw new NotFoundException(
        `Serviço com ID ${id} não encontrado para a empresa com ID ${updateServiceDto.companyId}`,
      );
    }

    if (description) service.description = description;
    if (durationInMinutes) service.durationInMinutes = durationInMinutes;
    if (name) service.name = name;
    if (price) service.price = price;

    return await this.serviceRepository.save(service);
  }

  async remove(id: string, companyId: string, userId: string) {
    const companyUserConnected = await this.companyUserRepository.findOne({
      where: { userId, companyId },
    });

    if (
      !companyUserConnected ||
      (!companyUserConnected.isAdmin && !companyUserConnected.isOwner)
    ) {
      throw new ForbiddenException(
        `Usuário não tem permissão para deletar serviços da empresa.`,
      );
    }
    const service = await this.serviceRepository.existsBy({ id, companyId });

    if (!service) {
      throw new NotFoundException(
        `Serviço com ID ${id} não encontrado para a empresa com ID ${companyId}`,
      );
    }

    const companyUserService = await this.companyUserServiceRepository.existsBy(
      { serviceId: id },
    );

    if (companyUserService) {
      await this.companyUserServiceRepository.softDelete({ serviceId: id });
    }

    return await this.serviceRepository.softDelete({ id, companyId });
  }
}
