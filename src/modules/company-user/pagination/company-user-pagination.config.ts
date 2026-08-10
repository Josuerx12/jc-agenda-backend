import { FilterOperator, PaginateConfig } from 'nestjs-paginate';
import { CompanyUser } from 'src/infra/entities/company-user.entity';

export const companyUserPaginationConfig: PaginateConfig<CompanyUser> = {
  sortableColumns: [
    'user.firstName',
    'user.lastName',
    'user.email',
    'user.phone',
    'createdAt',
    'updatedAt',
  ],
  defaultSortBy: [['user.firstName', 'ASC']],
  searchableColumns: [
    'user.firstName',
    'user.lastName',
    'user.email',
    'user.phone',
  ],

  filterableColumns: {
    'user.firstName': [FilterOperator.EQ, FilterOperator.ILIKE],
    'user.lastName': [FilterOperator.EQ, FilterOperator.ILIKE],
    'user.email': [FilterOperator.EQ, FilterOperator.ILIKE],
    'user.phone': [FilterOperator.EQ, FilterOperator.ILIKE],
    createdAt: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
  },

  throwOnInvalidFilter: true,
};
