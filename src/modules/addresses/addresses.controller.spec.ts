import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

describe('AddressesController', () => {
  let controller: AddressesController;
  const addressesService = {
    findByZipCode: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [{ provide: AddressesService, useValue: addressesService }],
    }).compile();

    controller = module.get<AddressesController>(AddressesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate the zip code search to the service', async () => {
    addressesService.findByZipCode.mockResolvedValue(null);

    await expect(controller.findByZipCode('01001-000')).resolves.toBeNull();
    expect(addressesService.findByZipCode).toHaveBeenCalledWith('01001-000');
  });
});
