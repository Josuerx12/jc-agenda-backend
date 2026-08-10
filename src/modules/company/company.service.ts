import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/infra/entities/company.entity';
import { Repository } from 'typeorm';
import { CompanyUser } from 'src/infra/entities/company-user.entity';
import { ensureCanManageCompany } from 'src/infra/authorization/company-permission';
import { BadRequestException } from '@nestjs/common';
import { UpdateSchedulingSettingsDto } from './dto/update-scheduling-settings.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepository: Repository<CompanyUser>,
  ) {}

  create(createCompanyDto: CreateCompanyDto) {
    void createCompanyDto;
    return 'This action adds a new company';
  }

  listTimezones() {
    return Intl.supportedValuesOf('timeZone');
  }

  async updateSchedulingSettings(
    companyId: string,
    userId: string,
    settings: UpdateSchedulingSettingsDto,
  ) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    if (!Intl.supportedValuesOf('timeZone').includes(settings.timezone)) {
      throw new BadRequestException('Fuso horário inválido');
    }
    await this.companyRepository.update(companyId, settings);
    return this.companyRepository.findOneBy({ id: companyId });
  }

  findAll() {
    return `This action returns all company`;
  }

  findOne(id: number) {
    return `This action returns a #${id} company`;
  }

  update(id: number, updateCompanyDto: UpdateCompanyDto) {
    void updateCompanyDto;
    return `This action updates a #${id} company`;
  }

  remove(id: number) {
    return `This action removes a #${id} company`;
  }

  async resolveCompanyBySlug(slug: string) {
    const company = await this.companyRepository.findOne({
      where: { slug },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return company;
  }
}
