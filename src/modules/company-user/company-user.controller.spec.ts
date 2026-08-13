import { Test, TestingModule } from '@nestjs/testing';
import { CompanyUserController } from './company-user.controller';
import { CompanyUserServices } from './company-user.service';

describe('CompanyUserController', () => {
  let controller: CompanyUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyUserController],
      providers: [CompanyUserServices],
    }).compile();

    controller = module.get<CompanyUserController>(CompanyUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
