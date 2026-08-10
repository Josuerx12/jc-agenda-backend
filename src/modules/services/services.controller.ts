import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import {
  ApiCompanyIdHeader,
  CompanyId,
} from 'src/infra/decorators/company.decorator';
import {
  Paginate,
  PaginatedSwaggerDocs,
  type PaginateQuery,
} from 'nestjs-paginate';
import { servicePaginationConfig } from './pagination/service-pagination.config';
import { Service } from 'src/infra/entities/services.entity';
import { UserId } from 'src/infra/decorators/user.decorator';

@Controller('services')
@ApiCompanyIdHeader()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(
    @Body() createServiceDto: CreateServiceDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.servicesService.create(
      { ...createServiceDto, companyId },
      userId,
    );
  }

  @Get()
  @PaginatedSwaggerDocs(Service, servicePaginationConfig)
  findAll(@CompanyId() companyId: string, @Paginate() query: PaginateQuery) {
    return this.servicesService.findAll(query, companyId);
  }

  @Get('simple-list')
  simpleList(@CompanyId() companyId: string) {
    return this.servicesService.simpleList(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.servicesService.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, userId, {
      ...updateServiceDto,
      companyId,
    });
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.servicesService.remove(id, companyId, userId);
  }
}
