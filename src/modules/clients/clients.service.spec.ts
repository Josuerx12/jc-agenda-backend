import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Client } from '../../infra/entities/client.entity';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  const repository = {
    existsBy: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<Client>;
  const service = new ClientsService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('normaliza o telefone ao cadastrar o cliente', async () => {
    jest.spyOn(repository, 'existsBy').mockResolvedValue(false);
    const save = jest.spyOn(repository, 'save').mockResolvedValue({
      id: 'client-id',
      companyId: 'company-id',
      name: 'Maria Silva',
      phone: '11999999999',
    } as Client);

    await service.create('company-id', {
      name: 'Maria Silva',
      phone: '(11) 99999-9999',
    });

    expect(save).toHaveBeenCalledWith({
      companyId: 'company-id',
      name: 'Maria Silva',
      phone: '11999999999',
    });
  });

  it('rejeita telefone já cadastrado na mesma empresa', async () => {
    jest.spyOn(repository, 'existsBy').mockResolvedValue(true);

    await expect(
      service.create('company-id', {
        name: 'Maria Silva',
        phone: '11999999999',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
