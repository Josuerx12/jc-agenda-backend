import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/infra/entities/company.entity';
import { Repository } from 'typeorm';
import { CompanyUser } from 'src/infra/entities/company-user.entity';
import { ensureCanManageCompany } from 'src/infra/authorization/company-permission';
import { BadRequestException } from '@nestjs/common';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { CompanySetting } from 'src/infra/entities/company-setting.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepository: Repository<CompanyUser>,
    @InjectRepository(CompanySetting)
    private readonly companySettingRepository: Repository<CompanySetting>,
  ) {}

  create(createCompanyDto: CreateCompanyDto) {
    void createCompanyDto;
    return 'This action adds a new company';
  }

  listTimezones() {
    return Intl.supportedValuesOf('timeZone');
  }

  async getSettings(companyId: string, userId: string) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    return this.findOrCreateSettings(companyId);
  }

  async updateSettings(
    companyId: string,
    userId: string,
    settings: UpdateCompanySettingsDto,
  ) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    if (!Intl.supportedValuesOf('timeZone').includes(settings.timezone)) {
      throw new BadRequestException('Fuso horário inválido');
    }
    const current = await this.findOrCreateSettings(companyId);
    await this.companySettingRepository.update(current.id, settings);
    return this.companySettingRepository.findOneByOrFail({ id: current.id });
  }

  findAll() {
    return `This action returns all company`;
  }

  findOne(id: number) {
    return `This action returns a #${id} company`;
  }

  async update(
    companyId: string,
    userId: string,
    updateCompanyDto: UpdateCompanyDto,
  ) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    const result = await this.companyRepository.update(
      companyId,
      updateCompanyDto,
    );
    if (!result.affected) throw new NotFoundException('Empresa não encontrada');
    return this.companyRepository.findOneByOrFail({ id: companyId });
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

  private async findOrCreateSettings(companyId: string) {
    const existing = await this.companySettingRepository.findOneBy({
      companyId,
    });
    if (existing) return existing;
    return this.companySettingRepository.save({
      companyId,
      timezone: 'America/Sao_Paulo',
      slotIntervalMinutes: 60,
    });
  }
}
