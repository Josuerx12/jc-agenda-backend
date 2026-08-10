import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { Product } from '../../infra/entities/product.entity';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const productRepository = {
    save: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as Repository<Product>;
  const companyUserRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<CompanyUser>;
  const service = new ProductsService(productRepository, companyUserRepository);

  beforeEach(() => jest.clearAllMocks());

  it.each([
    { isAdmin: true, isOwner: false },
    { isAdmin: false, isOwner: true },
  ])('permite que administrador ou dono crie um produto', async (role) => {
    jest.spyOn(companyUserRepository, 'findOne').mockResolvedValue({
      ...role,
    } as CompanyUser);
    jest.spyOn(productRepository, 'save').mockResolvedValue({
      id: 'product-id',
    } as Product);

    await expect(
      service.create(
        {
          companyId: 'company-id',
          name: 'Produto',
          price: 10,
          description: 'Descrição',
        },
        'user-id',
      ),
    ).resolves.toMatchObject({ id: 'product-id' });
  });

  it('impede usuário sem permissão de criar um produto', async () => {
    jest.spyOn(companyUserRepository, 'findOne').mockResolvedValue({
      isAdmin: false,
      isOwner: false,
    } as CompanyUser);

    await expect(
      service.create(
        {
          companyId: 'company-id',
          name: 'Produto',
          price: 10,
          description: 'Descrição',
        },
        'user-id',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('edita o produto da empresa quando o usuário é administrador', async () => {
    jest.spyOn(companyUserRepository, 'findOne').mockResolvedValue({
      isAdmin: true,
      isOwner: false,
    } as CompanyUser);
    jest.spyOn(productRepository, 'findOneBy').mockResolvedValue({
      id: 'product-id',
      companyId: 'company-id',
      name: 'Antigo',
      price: 10,
      description: 'Descrição',
    } as Product);
    jest
      .spyOn(productRepository, 'save')
      .mockImplementation((product) => Promise.resolve(product as Product));

    await expect(
      service.update('product-id', 'user-id', {
        companyId: 'company-id',
        name: 'Novo',
        price: 0,
      }),
    ).resolves.toMatchObject({ name: 'Novo', price: 0 });
  });

  it('retorna não encontrado ao excluir produto que não pertence à empresa', async () => {
    jest.spyOn(companyUserRepository, 'findOne').mockResolvedValue({
      isAdmin: false,
      isOwner: true,
    } as CompanyUser);
    jest.spyOn(productRepository, 'existsBy').mockResolvedValue(false);

    await expect(
      service.remove('product-id', 'company-id', 'user-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('exclui logicamente o produto quando o usuário é dono', async () => {
    jest.spyOn(companyUserRepository, 'findOne').mockResolvedValue({
      isAdmin: false,
      isOwner: true,
    } as CompanyUser);
    jest.spyOn(productRepository, 'existsBy').mockResolvedValue(true);
    const softDeleteSpy = jest
      .spyOn(productRepository, 'softDelete')
      .mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

    await service.remove('product-id', 'company-id', 'user-id');

    expect(softDeleteSpy).toHaveBeenCalledWith({
      id: 'product-id',
      companyId: 'company-id',
    });
  });
});
