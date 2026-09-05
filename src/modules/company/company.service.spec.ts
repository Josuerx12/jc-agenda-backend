import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from 'src/infra/entities/company.entity';
import { CompanyUser } from 'src/infra/entities/company-user.entity';
import { CompanySetting } from 'src/infra/entities/company-setting.entity';
import { MediaService } from '../media/media.service';

describe('CompanyService', () => {
  let service: CompanyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: getRepositoryToken(Company), useValue: {} },
        { provide: getRepositoryToken(CompanyUser), useValue: {} },
        { provide: getRepositoryToken(CompanySetting), useValue: {} },
        { provide: MediaService, useValue: {} },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
