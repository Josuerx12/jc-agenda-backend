import { Test, TestingModule } from '@nestjs/testing';
import { CompanyUserServices } from './company-user.service';

describe('CompanyUserService', () => {
  let service: CompanyUserServices;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyUserServices],
    }).compile();

    service = module.get<CompanyUserServices>(CompanyUserServices);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
