import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from './addresses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Address } from '../../infra/entities/address.entity';

describe('AddressesService', () => {
  let service: AddressesService;
  const addressRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: getRepositoryToken(Address), useValue: addressRepository },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should normalize the zip code and return the complete address', async () => {
    addressRepository.findOne.mockResolvedValue({
      zipCode: '01001000',
      street: 'Praça da Sé',
      complement: 'lado ímpar',
      neighborhood: 'Sé',
      city: { id: 'city-id', name: 'São Paulo' },
      state: { id: 'state-id', name: 'São Paulo', code: 'SP' },
    });

    await expect(service.findByZipCode('01001-000')).resolves.toEqual({
      zipCode: '01001000',
      street: 'Praça da Sé',
      complement: 'lado ímpar',
      neighborhood: 'Sé',
      city: { id: 'city-id', name: 'São Paulo' },
      state: { id: 'state-id', name: 'São Paulo', code: 'SP' },
    });
    expect(addressRepository.findOne).toHaveBeenCalledWith({
      where: { zipCode: '01001000' },
      relations: { city: true, state: true },
    });
  });

  it('should return null when the zip code is invalid', async () => {
    await expect(service.findByZipCode('123')).resolves.toBeNull();
    expect(addressRepository.findOne).not.toHaveBeenCalled();
  });

  it('should return null when the address is not found', async () => {
    addressRepository.findOne.mockResolvedValue(null);

    await expect(service.findByZipCode('99999999')).resolves.toBeNull();
  });
});
