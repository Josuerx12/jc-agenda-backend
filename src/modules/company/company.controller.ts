import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  HttpCode,
  Put,
  UploadedFile,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IsPublic } from 'src/infra/decorators/auth.decorator';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import {
  ApiCompanyIdHeader,
  CompanyId,
} from 'src/infra/decorators/company.decorator';
import { UserId } from 'src/infra/decorators/user.decorator';
import { ApiImageUpload } from '../media/image-upload.decorator';
import type { UploadedImageFile } from '../media/media.types';
import { CompanyBrandingResponseDto } from './dto/company-branding-response.dto';

@ApiTags('Empresas')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('timezones')
  @IsPublic()
  @ApiOperation({ summary: 'Listar fusos horários disponíveis' })
  @ApiOkResponse({ description: 'Lista de identificadores IANA de timezone' })
  listTimezones() {
    return this.companyService.listTimezones();
  }

  @Get('settings')
  @ApiCompanyIdHeader()
  @ApiOperation({ summary: 'Consultar configurações privadas da empresa' })
  @ApiOkResponse({ description: 'Configurações da empresa' })
  @ApiForbiddenResponse({ description: 'Apenas dono ou administrador' })
  getSettings(@CompanyId() companyId: string, @UserId() userId: string) {
    return this.companyService.getSettings(companyId, userId);
  }

  @Patch('settings')
  @ApiCompanyIdHeader()
  @ApiOperation({
    summary: 'Atualizar configurações de agendamento da empresa',
  })
  @ApiOkResponse({ description: 'Configurações atualizadas' })
  @ApiBadRequestResponse({ description: 'Timezone ou intervalo inválido' })
  @ApiForbiddenResponse({ description: 'Apenas dono ou administrador' })
  updateSettings(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() settings: UpdateCompanySettingsDto,
  ) {
    return this.companyService.updateSettings(companyId, userId, settings);
  }

  @Put('settings/logo')
  @ApiCompanyIdHeader()
  @ApiOperation({ summary: 'Definir ou substituir o logo da empresa' })
  @ApiImageUpload()
  updateLogo(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @UploadedFile() file: UploadedImageFile | undefined,
  ) {
    return this.companyService.updateLogo(companyId, userId, file);
  }

  @Delete('settings/logo')
  @HttpCode(204)
  @ApiCompanyIdHeader()
  @ApiOperation({ summary: 'Remover o logo da empresa' })
  removeLogo(@CompanyId() companyId: string, @UserId() userId: string) {
    return this.companyService.removeLogo(companyId, userId);
  }

  @Get('branding/:slug')
  @IsPublic()
  @ApiOperation({ summary: 'Consultar a identidade visual pública da empresa' })
  @ApiOkResponse({ type: CompanyBrandingResponseDto })
  getPublicBranding(@Param('slug') slug: string) {
    return this.companyService.getPublicBranding(slug);
  }

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(+id);
  }

  @Patch(':id')
  @ApiCompanyIdHeader()
  @ApiOperation({ summary: 'Atualizar dados básicos da empresa' })
  @ApiOkResponse({
    description: 'Empresa atualizada sem configurações privadas',
  })
  @ApiForbiddenResponse({
    description: 'Apenas dono ou administrador da própria empresa',
  })
  update(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    if (id !== companyId) {
      throw new ForbiddenException('Não é permitido alterar outra empresa');
    }
    return this.companyService.update(companyId, userId, updateCompanyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companyService.remove(+id);
  }

  @Get('resolve/:slug')
  @ApiAcceptedResponse({
    description: 'Resolve a empresa pelo slug',
  })
  @IsPublic()
  async resolveCompanyBySlug(@Param('slug') slug: string) {
    return await this.companyService.resolveCompanyBySlug(slug);
  }
}
