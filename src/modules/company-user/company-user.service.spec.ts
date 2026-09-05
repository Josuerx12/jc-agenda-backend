import { DataSource, EntityManager, Repository } from 'typeorm';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { CompanyUserService } from '../../infra/entities/company-user-service.entity';
import { Service } from '../../infra/entities/services.entity';
import { User } from '../../infra/entities/user.entity';
import { EmailService } from '../email/email.service';
import { CompanyUserServices } from './company-user.service';
import { MediaService } from '../media/media.service';

describe('CompanyUserService', () => {
  const companyId = '5278972e-a7cc-4ea1-bdd7-beeff90e8e7c';
  const companyUserId = '91a98d0f-28d2-468f-b429-a62f6bd94367';
  const loggedUserId = '0c889d0d-c66e-4f91-a4a3-c25bb418da05';
  const serviceId = '3e16a8bb-2270-47fe-a502-8d7fdd065f00';

  const companyUserRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const userRepository = {
    existsBy: jest.fn(),
    update: jest.fn(),
  };
  const companyUserServiceRepository = {
    create: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
  };
  const servicesQueryBuilder = {
    where: jest.fn(),
    andWhere: jest.fn(),
    getMany: jest.fn(),
  };
  const serviceRepository = {
    createQueryBuilder: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };

  const service = new CompanyUserServices(
    companyUserRepository as unknown as Repository<CompanyUser>,
    dataSource as unknown as DataSource,
    {} as EmailService,
    {} as MediaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();

    servicesQueryBuilder.where.mockReturnValue(servicesQueryBuilder);
    servicesQueryBuilder.andWhere.mockReturnValue(servicesQueryBuilder);
    serviceRepository.createQueryBuilder.mockReturnValue(servicesQueryBuilder);
    companyUserServiceRepository.create.mockImplementation(
      (value: { companyUserId: string; serviceId: string }) => ({ ...value }),
    );
    manager.getRepository.mockImplementation((entity) => {
      if (entity === CompanyUser) return companyUserRepository;
      if (entity === User) return userRepository;
      if (entity === CompanyUserService) return companyUserServiceRepository;
      if (entity === Service) return serviceRepository;
      throw new Error('Repositório inesperado');
    });
    dataSource.transaction.mockImplementation(
      (callback: (entityManager: EntityManager) => unknown) =>
        callback(manager as unknown as EntityManager),
    );

    companyUserRepository.findOne
      .mockResolvedValueOnce({
        id: 'manager-id',
        isAdmin: true,
        isOwner: false,
      })
      .mockResolvedValueOnce({
        id: companyUserId,
        companyId,
        isAdmin: true,
        isProfessional: true,
        user: {
          id: 'target-user-id',
          firstName: 'Josué',
          lastName: 'Carvalho',
          email: 'contato@jcdev.com.br',
          phone: '22997979635',
        },
      });
  });

  it('substitui os serviços pela lista completa enviada', async () => {
    const foundService = { id: serviceId, companyId } as Service;
    servicesQueryBuilder.getMany.mockResolvedValue([foundService]);

    await service.update(companyUserId, loggedUserId, {
      companyId,
      services: [serviceId],
      isAdmin: true,
      isProfessional: true,
    });

    expect(companyUserRepository.findOne).toHaveBeenLastCalledWith({
      where: { id: companyUserId, companyId },
      relations: { user: true },
    });
    expect(servicesQueryBuilder.andWhere).toHaveBeenCalledWith(
      'service.companyId = :companyId',
      { companyId },
    );
    expect(companyUserRepository.update).toHaveBeenCalledWith(companyUserId, {
      isAdmin: true,
      isProfessional: true,
    });
    expect(companyUserServiceRepository.delete).toHaveBeenCalledWith({
      companyUserId,
    });
    expect(companyUserServiceRepository.save).toHaveBeenCalledWith([
      { companyUserId, serviceId },
    ]);
  });

  it('remove todas as relações quando a lista enviada está vazia', async () => {
    await service.update(companyUserId, loggedUserId, {
      companyId,
      services: [],
      isProfessional: true,
    });

    expect(serviceRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(companyUserServiceRepository.delete).toHaveBeenCalledWith({
      companyUserId,
    });
    expect(companyUserServiceRepository.save).not.toHaveBeenCalled();
  });

  it('remove os serviços quando o usuário deixa de ser profissional', async () => {
    await service.update(companyUserId, loggedUserId, {
      companyId,
      isProfessional: false,
    });

    expect(companyUserServiceRepository.delete).toHaveBeenCalledWith({
      companyUserId,
    });
    expect(companyUserServiceRepository.save).not.toHaveBeenCalled();
  });
});
