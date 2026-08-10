import { FilterOperator, PaginateConfig } from 'nestjs-paginate';
import { Product } from '../../../infra/entities/product.entity';

export const productPaginationConfig: PaginateConfig<Product> = {
  sortableColumns: ['name', 'price', 'createdAt', 'updatedAt'],
  defaultSortBy: [['name', 'ASC']],
  searchableColumns: ['name', 'description'],
  filterableColumns: {
    name: [FilterOperator.EQ, FilterOperator.ILIKE],
    price: [
      FilterOperator.EQ,
      FilterOperator.GTE,
      FilterOperator.LTE,
      FilterOperator.BTW,
    ],
    createdAt: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
  },
  throwOnInvalidFilter: true,
};
