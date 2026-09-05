import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Put,
  UploadedFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { ApiImageUpload } from '../media/image-upload.decorator';
import type { UploadedImageFile } from '../media/media.types';

@ApiTags('Serviços')
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

  @Put(':id/image')
  @ApiOperation({ summary: 'Definir ou substituir a imagem do serviço' })
  @ApiImageUpload()
  updateImage(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @UploadedFile() file: UploadedImageFile | undefined,
  ) {
    return this.servicesService.updateImage(id, companyId, userId, file);
  }

  @Delete(':id/image')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover a imagem do serviço' })
  removeImage(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.servicesService.removeImage(id, companyId, userId);
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
