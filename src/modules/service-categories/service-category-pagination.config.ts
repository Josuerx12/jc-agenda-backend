import { FilterOperator, type PaginateConfig } from 'nestjs-paginate';
import { ServiceCategory } from '../../infra/entities/service-category.entity';

export const serviceCategoryPaginationConfig: PaginateConfig<ServiceCategory> =
  {
    sortableColumns: ['name', 'createdAt', 'updatedAt'],
    searchableColumns: ['name', 'description'],
    filterableColumns: { name: [FilterOperator.EQ, FilterOperator.ILIKE] },
    defaultSortBy: [['name', 'ASC']],
  };
