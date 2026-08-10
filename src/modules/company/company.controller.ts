import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { UpdateSchedulingSettingsDto } from './dto/update-scheduling-settings.dto';
import {
  ApiCompanyIdHeader,
  CompanyId,
} from 'src/infra/decorators/company.decorator';
import { UserId } from 'src/infra/decorators/user.decorator';

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

  @Patch('scheduling-settings')
  @ApiCompanyIdHeader()
  @ApiOperation({
    summary: 'Atualizar configurações de agendamento da empresa',
  })
  @ApiOkResponse({ description: 'Configurações atualizadas' })
  @ApiBadRequestResponse({ description: 'Timezone ou intervalo inválido' })
  @ApiForbiddenResponse({ description: 'Apenas dono ou administrador' })
  updateSchedulingSettings(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() settings: UpdateSchedulingSettingsDto,
  ) {
    return this.companyService.updateSchedulingSettings(
      companyId,
      userId,
      settings,
    );
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
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companyService.update(+id, updateCompanyDto);
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
