import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  Paginate,
  PaginatedSwaggerDocs,
  type PaginateQuery,
} from 'nestjs-paginate';
import {
  ApiCompanyIdHeader,
  CompanyId,
} from '../../infra/decorators/company.decorator';
import { UserId } from '../../infra/decorators/user.decorator';
import { ServiceCategory } from '../../infra/entities/service-category.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { ServiceCategoriesService } from './service-categories.service';
import { serviceCategoryPaginationConfig } from './service-category-pagination.config';

@ApiTags('Categorias de serviço')
@ApiCompanyIdHeader()
@Controller('service-categories')
export class ServiceCategoriesController {
  constructor(private readonly service: ServiceCategoriesService) {}
  @Post() create(
    @Body() dto: CreateServiceCategoryDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.service.create({ ...dto, companyId }, userId);
  }
  @Get()
  @PaginatedSwaggerDocs(ServiceCategory, serviceCategoryPaginationConfig)
  findAll(@Paginate() query: PaginateQuery, @CompanyId() companyId: string) {
    return this.service.findAll(query, companyId);
  }
  @Get('simple-list') simpleList(@CompanyId() companyId: string) {
    return this.service.simpleList(companyId);
  }
  @Get(':id') findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.service.findOne(id, companyId);
  }
  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.service.update(id, companyId, userId, dto);
  }
  @Delete(':id') @HttpCode(204) remove(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.service.remove(id, companyId, userId);
  }
}
