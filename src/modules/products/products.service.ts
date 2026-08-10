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

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepository: Repository<CompanyUser>,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    await ensureCanManageCompany(
      this.companyUserRepository,
      createProductDto.companyId,
      userId,
    );
    return this.productRepository.save(createProductDto);
  }

  findAll(query: PaginateQuery, companyId: string) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.company', 'company')
      .where('company.id = :companyId', { companyId });

    return paginate(query, queryBuilder, productPaginationConfig);
  }

  simpleList(companyId: string) {
    return this.productRepository.find({
      where: { companyId },
      select: { id: true, companyId: true, name: true },
    });
  }

  findOne(id: string, companyId: string) {
    return this.productRepository.findOneBy({ id, companyId });
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

    return this.productRepository.save(product);
  }

  async remove(id: string, companyId: string, userId: string) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);

    const productExists = await this.productRepository.existsBy({
      id,
      companyId,
    });
    if (!productExists) {
      throw new NotFoundException(
        `Produto com ID ${id} não encontrado para a empresa com ID ${companyId}`,
      );
    }

    return this.productRepository.softDelete({ id, companyId });
  }
}
