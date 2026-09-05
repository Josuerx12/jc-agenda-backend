import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { Product } from '../../infra/entities/product.entity';
import { ensureCanManageCompany } from '../../infra/authorization/company-permission';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productPaginationConfig } from './pagination/product-pagination.config';
import { MediaService } from '../media/media.service';
import { buildMediaReference } from '../media/media-reference';
import type { UploadedImageFile } from '../media/media.types';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepository: Repository<CompanyUser>,
    private readonly mediaService: MediaService,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    await ensureCanManageCompany(
      this.companyUserRepository,
      createProductDto.companyId,
      userId,
    );
    const product = await this.productRepository.save(createProductDto);
    return this.withImage(product);
  }

  async findAll(query: PaginateQuery, companyId: string) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.company', 'company')
      .where('company.id = :companyId', { companyId });

    const result = await paginate(query, queryBuilder, productPaginationConfig);
    return {
      ...result,
      data: result.data.map((product) => this.withImage(product)),
    };
  }

  async simpleList(companyId: string) {
    const products = await this.productRepository.find({
      where: { companyId },
      select: { id: true, companyId: true, name: true, imageId: true },
    });
    return products.map((product) => this.withImage(product));
  }

  async findOne(id: string, companyId: string) {
    const product = await this.productRepository.findOneBy({ id, companyId });
    return product ? this.withImage(product) : null;
  }

  async update(id: string, userId: string, updateProductDto: UpdateProductDto) {
    const { companyId } = updateProductDto;
    await ensureCanManageCompany(
      this.companyUserRepository,
      companyId!,
      userId,
    );

    const product = await this.productRepository.findOneBy({ id, companyId });
    if (!product) {
      throw new NotFoundException(
        `Produto com ID ${id} não encontrado para a empresa com ID ${companyId}`,
      );
    }

    if (updateProductDto.name !== undefined)
      product.name = updateProductDto.name;
    if (updateProductDto.price !== undefined)
      product.price = updateProductDto.price;
    if (updateProductDto.description !== undefined)
      product.description = updateProductDto.description;

    return this.withImage(await this.productRepository.save(product));
  }

  async updateImage(
    id: string,
    companyId: string,
    userId: string,
    file: UploadedImageFile | undefined,
  ) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    const product = await this.productRepository.findOneBy({ id, companyId });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const previousImageId = product.imageId;
    const media = await this.mediaService.storeImage(
      file,
      companyId,
      userId,
      previousImageId,
    );
    try {
      product.imageId = media.id;
      await this.productRepository.save(product);
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
    const product = await this.productRepository.findOneBy({ id, companyId });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const previousImageId = product.imageId;
    product.imageId = null;
    await this.productRepository.save(product);
    await this.mediaService.remove(previousImageId);
  }

  async remove(id: string, companyId: string, userId: string) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);

    const product = await this.productRepository.findOneBy({
      id,
      companyId,
    });
    if (!product) {
      throw new NotFoundException(
        `Produto com ID ${id} não encontrado para a empresa com ID ${companyId}`,
      );
    }

    const result = await this.productRepository.softDelete({ id, companyId });
    await this.mediaService.remove(product.imageId);
    return result;
  }

  private withImage(product: Product) {
    return {
      ...product,
      image: buildMediaReference(product.imageId),
    };
  }
}
