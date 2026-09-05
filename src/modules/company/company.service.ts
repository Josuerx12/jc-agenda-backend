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
import { MediaService } from '../media/media.service';
import { buildMediaReference } from '../media/media-reference';
import type { UploadedImageFile } from '../media/media.types';
import { CompanyBrandingResponseDto } from './dto/company-branding-response.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepository: Repository<CompanyUser>,
    @InjectRepository(CompanySetting)
    private readonly companySettingRepository: Repository<CompanySetting>,
    private readonly mediaService: MediaService,
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
    const settings = await this.findOrCreateSettings(companyId);
    return this.withLogo(settings);
  }

  async updateSettings(
    companyId: string,
    userId: string,
    settings: UpdateCompanySettingsDto,
  ) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    if (
      settings.timezone !== undefined &&
      !Intl.supportedValuesOf('timeZone').includes(settings.timezone)
    ) {
      throw new BadRequestException('Fuso horário inválido');
    }
    const current = await this.findOrCreateSettings(companyId);
    await this.companySettingRepository.update(current.id, settings);
    const updated = await this.companySettingRepository.findOneByOrFail({
      id: current.id,
    });
    return this.withLogo(updated);
  }

  async updateLogo(
    companyId: string,
    userId: string,
    file: UploadedImageFile | undefined,
  ) {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    const settings = await this.findOrCreateSettings(companyId);
    const previousLogoId = settings.logoImageId;
    const media = await this.mediaService.storeImage(
      file,
      companyId,
      userId,
      previousLogoId,
    );

    try {
      settings.logoImageId = media.id;
      await this.companySettingRepository.save(settings);
    } catch (error) {
      await this.mediaService.remove(media.id);
      throw error;
    }

    await this.mediaService.remove(previousLogoId);
    return media;
  }

  async removeLogo(companyId: string, userId: string): Promise<void> {
    await ensureCanManageCompany(this.companyUserRepository, companyId, userId);
    const settings = await this.findOrCreateSettings(companyId);
    const previousLogoId = settings.logoImageId;
    settings.logoImageId = null;
    await this.companySettingRepository.save(settings);
    await this.mediaService.remove(previousLogoId);
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
    const { trandingName, corporateName, email, phone, additionalPhone } =
      updateCompanyDto;
    const result = await this.companyRepository.update(companyId, {
      trandingName,
      corporateName,
      email: email?.trim().toLowerCase(),
      phone,
      additionalPhone,
    });
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

    return {
      ...company,
      branding: await this.brandingFor(company),
    };
  }

  async getPublicBranding(slug: string): Promise<CompanyBrandingResponseDto> {
    const company = await this.companyRepository.findOne({
      where: { slug },
      select: { id: true, slug: true, trandingName: true },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    return this.brandingFor(company);
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

  private withLogo(settings: CompanySetting) {
    return {
      ...settings,
      logo: buildMediaReference(settings.logoImageId),
    };
  }

  private async brandingFor(
    company: Pick<Company, 'id' | 'slug' | 'trandingName'>,
  ): Promise<CompanyBrandingResponseDto> {
    const settings = await this.findOrCreateSettings(company.id);
    return {
      companyId: company.id,
      slug: company.slug,
      trandingName: company.trandingName,
      logo: buildMediaReference(settings.logoImageId),
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      backgroundColor: settings.backgroundColor,
      surfaceColor: settings.surfaceColor,
      textColor: settings.textColor,
      fontFamily: settings.fontFamily,
      borderRadius: settings.borderRadius,
      welcomeMessage: settings.welcomeMessage,
      showCompanyName: settings.showCompanyName,
    };
  }
}
