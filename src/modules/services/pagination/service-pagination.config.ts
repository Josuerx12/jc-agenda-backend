import { FilterOperator, PaginateConfig } from 'nestjs-paginate';
import { Service } from 'src/infra/entities/services.entity';

export const servicePaginationConfig: PaginateConfig<Service> = {
  sortableColumns: [
    'name',
    'price',
    'durationInMinutes',
    'createdAt',
    'updatedAt',
  ],
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
    durationInMinutes: [
      FilterOperator.EQ,
      FilterOperator.GTE,
      FilterOperator.LTE,
    ],
    createdAt: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
  },

  throwOnInvalidFilter: true,
};
