import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { Product } from '../../infra/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productPaginationConfig } from './pagination/product-pagination.config';
import { ProductsService } from './products.service';
import { ApiImageUpload } from '../media/image-upload.decorator';
import type { UploadedImageFile } from '../media/media.types';

@ApiTags('Produtos')
@Controller('products')
@ApiCompanyIdHeader()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.productsService.create(
      { ...createProductDto, companyId },
      userId,
    );
  }

  @Get()
  @PaginatedSwaggerDocs(Product, productPaginationConfig)
  findAll(@CompanyId() companyId: string, @Paginate() query: PaginateQuery) {
    return this.productsService.findAll(query, companyId);
  }

  @Get('simple-list')
  simpleList(@CompanyId() companyId: string) {
    return this.productsService.simpleList(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.productsService.findOne(id, companyId);
  }

  @Put(':id/image')
  @ApiOperation({ summary: 'Definir ou substituir a imagem do produto' })
  @ApiImageUpload()
  updateImage(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @UploadedFile() file: UploadedImageFile | undefined,
  ) {
    return this.productsService.updateImage(id, companyId, userId, file);
  }

  @Delete(':id/image')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover a imagem do produto' })
  removeImage(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.productsService.removeImage(id, companyId, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, userId, {
      ...updateProductDto,
      companyId,
    });
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.productsService.remove(id, companyId, userId);
  }
}
