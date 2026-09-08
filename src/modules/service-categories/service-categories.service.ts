import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, type PaginateQuery } from 'nestjs-paginate';
import { QueryFailedError, Repository } from 'typeorm';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { ServiceCategory } from '../../infra/entities/service-category.entity';
import { Service } from '../../infra/entities/services.entity';
import { ensureCanManageCompany } from '../../infra/authorization/company-permission';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { serviceCategoryPaginationConfig } from './service-category-pagination.config';

@Injectable()
export class ServiceCategoriesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categories: Repository<ServiceCategory>,
    @InjectRepository(Service) private readonly services: Repository<Service>,
    @InjectRepository(CompanyUser)
    private readonly companyUsers: Repository<CompanyUser>,
  ) {}

  async create(dto: CreateServiceCategoryDto, userId: string) {
    await ensureCanManageCompany(this.companyUsers, dto.companyId, userId);
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Nome da categoria é obrigatório');
    try {
      return await this.categories.save({
        ...dto,
        name,
        description: dto.description?.trim() || null,
      });
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('Categoria já cadastrada nesta empresa');
      throw error;
    }
  }

  findAll(query: PaginateQuery, companyId: string) {
    const builder = this.categories
      .createQueryBuilder('category')
      .where('category.companyId = :companyId', { companyId });
    return paginate(query, builder, serviceCategoryPaginationConfig);
  }

  simpleList(companyId: string) {
    return this.categories.find({
      where: { companyId },
      select: { id: true, name: true },
      order: { name: 'ASC' },
    });
  }

  findOne(id: string, companyId: string) {
    return this.categories.findOneBy({ id, companyId });
  }

  async update(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateServiceCategoryDto,
  ) {
    await ensureCanManageCompany(this.companyUsers, companyId, userId);
    const category = await this.categories.findOneBy({ id, companyId });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    if (dto.name !== undefined) {
      category.name = dto.name.trim();
      if (!category.name)
        throw new BadRequestException('Nome da categoria é obrigatório');
    }
    if (dto.description !== undefined)
      category.description = dto.description?.trim() || null;
    try {
      return await this.categories.save(category);
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('Categoria já cadastrada nesta empresa');
      throw error;
    }
  }

  async remove(id: string, companyId: string, userId: string) {
    await ensureCanManageCompany(this.companyUsers, companyId, userId);
    if (!(await this.categories.existsBy({ id, companyId })))
      throw new NotFoundException('Categoria não encontrada');
    if (await this.services.existsBy({ categoryId: id, companyId }))
      throw new ConflictException('A categoria possui serviços vinculados');
    await this.categories.softDelete({ id, companyId });
  }
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === '23505'
  );
}
