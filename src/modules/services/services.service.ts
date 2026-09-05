import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from 'src/infra/entities/services.entity';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { servicePaginationConfig } from './pagination/service-pagination.config';
import { CompanyUserService } from 'src/infra/entities/company-user-service.entity';
import { CompanyUser } from 'src/infra/entities/company-user.entity';
import { ensureCanManageCompany } from 'src/infra/authorization/company-permission';
import { MediaService } from '../media/media.service';
import { buildMediaReference } from '../media/media-reference';
import type { UploadedImageFile } from '../media/media.types';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepository: Repository<CompanyUser>,
    @InjectRepository(CompanyUserService)
    private readonly companyUserServiceRepository: Repository<CompanyUserService>,
    private readonly mediaService: MediaService,
  ) {}
  async create(createServiceDto: CreateServiceDto, userId: string) {
    await ensureCanManageCompany(
      this.companyUserRepository,
      createServiceDto.companyId,
      userId,
    );

    const service = await this.serviceRepository.save(createServiceDto);
    return this.withImage(service);
  }

  async findAll(query: PaginateQuery, companyId: string) {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .innerJoin('service.company', 'company')
      .where('company.id = :companyId', { companyId });

    const result = await paginate(query, queryBuilder, servicePaginationConfig);
    return {
      ...result,
      data: result.data.map((service) => this.withImage(service)),
    };
  }

  async simpleList(companyId: string) {
    const services = await this.serviceRepository.find({
      where: { companyId },
      select: {
        id: true,
        companyId: true,
        name: true,
        imageId: true,
      },
    });
    return services.map((service) => this.withImage(service));
  }

  async findOne(id: string, companyId: string) {
    const service = await this.serviceRepository.findOneBy({ id, companyId });
    return service ? this.withImage(service) : null;
  }

  async update(id: string, userId: string, updateServiceDto: UpdateServiceDto) {
    const { companyId, description, durationInMinutes, name, price } =
      updateServiceDto;

    await ensureCanManageCompany(
      this.companyUserRepository,
      companyId!,
      userId,
    );

    const service = await this.serviceRepository.findOneBy({
      id,
      companyId,
    });

    if (!service) {
      throw new NotFoundException(
        `Serviço com ID ${id} não encontrado para a empresa com ID ${updateServiceDto.companyId}`,
      );
    }

    if (description !== undefined) service.description = description;
    if (durationInMinutes !== undefined)
      service.durationInMinutes = durationInMinutes;
    if (name !== undefined) service.name = name;
    if (price !== undefined) service.price = price;

    return this.withImage(await this.serviceRepository.save(service));
  }

  async updateImage(
    id: string,
    companyId: string,
    userId: string,
    file: UploadedImageFile | undefined,
  ) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    const service = await this.serviceRepository.findOneBy({ id, companyId });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    const previousImageId = service.imageId;
    const media = await this.mediaService.storeImage(
      file,
      companyId,
      userId,
      previousImageId,
    );
    try {
      service.imageId = media.id;
      await this.serviceRepository.save(service);
    } catch (error) {
      await this.mediaService.remove(media.id);
      throw error;
    }

    await this.mediaService.remove(previousImageId);
    return media;
  }

  async removeImage(
    id: string,
    companyId: string,
    userId: string,
  ): Promise<void> {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    const service = await this.serviceRepository.findOneBy({ id, companyId });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    const previousImageId = service.imageId;
    service.imageId = null;
    await this.serviceRepository.save(service);
    await this.mediaService.remove(previousImageId);
  }

  async remove(id: string, companyId: string, userId: string) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    const service = await this.serviceRepository.findOneBy({ id, companyId });

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

    const result = await this.serviceRepository.softDelete({ id, companyId });
    await this.mediaService.remove(service.imageId);
    return result;
  }

  private withImage(service: Service) {
    return {
      ...service,
      image: buildMediaReference(service.imageId),
    };
  }
}
