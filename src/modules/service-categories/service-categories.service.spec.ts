import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { ServiceCategory } from '../../infra/entities/service-category.entity';
import { Service } from '../../infra/entities/services.entity';
import { ServiceCategoriesService } from './service-categories.service';

describe('ServiceCategoriesService', () => {
  const categories = {
    save: jest.fn(),
    existsBy: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as Repository<ServiceCategory>;
  const services = { existsBy: jest.fn() } as unknown as Repository<Service>;
  const companyUsers = {
    findOne: jest.fn(),
  } as unknown as Repository<CompanyUser>;
  const service = new ServiceCategoriesService(
    categories,
    services,
    companyUsers,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(companyUsers, 'findOne').mockResolvedValue({
      id: 'membership-id',
      isAdmin: true,
      isOwner: false,
    } as CompanyUser);
  });

  it('normaliza os dados ao criar uma categoria', async () => {
    const save = jest
      .spyOn(categories, 'save')
      .mockImplementation((value) => Promise.resolve(value as ServiceCategory));

    await service.create(
      {
        companyId: 'company-id',
        name: '  Cabelo  ',
        description: '  Cortes  ',
      },
      'user-id',
    );

    expect(save).toHaveBeenCalledWith({
      companyId: 'company-id',
      name: 'Cabelo',
      description: 'Cortes',
    });
  });

  it('impede excluir categoria que possui serviços', async () => {
    jest.spyOn(categories, 'existsBy').mockResolvedValue(true);
    jest.spyOn(services, 'existsBy').mockResolvedValue(true);
    const softDelete = jest.spyOn(categories, 'softDelete');

    await expect(
      service.remove('category-id', 'company-id', 'user-id'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(softDelete).not.toHaveBeenCalled();
  });
});
