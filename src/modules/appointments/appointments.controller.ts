import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IsPublic } from '../../infra/decorators/auth.decorator';
import {
  ApiCompanyIdHeader,
  CompanyId,
} from '../../infra/decorators/company.decorator';
import { UserId } from '../../infra/decorators/user.decorator';
import { AppointmentsService } from './appointments.service';
import { AvailabilityService } from './availability.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@ApiTags('Agendamentos')
@Controller('appointments')
@ApiCompanyIdHeader()
export class AppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly availability: AvailabilityService,
  ) {}
  @Get('professionals')
  @IsPublic()
  @ApiOperation({ summary: 'Listar profissionais e seus serviços' })
  @ApiOkResponse({ description: 'Profissionais ativos da empresa' })
  professionals(@CompanyId() companyId: string) {
    return this.availability.listProfessionals(companyId);
  }
  @Get('availability')
  @IsPublic()
  @ApiOperation({ summary: 'Consultar horários disponíveis' })
  @ApiOkResponse({ description: 'Serviços, totais e horários disponíveis' })
  @ApiBadRequestResponse({ description: 'Data ou serviços inválidos' })
  @ApiNotFoundResponse({
    description: 'Empresa ou profissional não encontrado',
  })
  available(
    @CompanyId() companyId: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.availability.getAvailability(
      companyId,
      query.date,
      query.professionalId,
      query.serviceIds,
    );
  }
  @Post()
  @IsPublic()
  @ApiOperation({ summary: 'Criar um agendamento público' })
  @ApiCreatedResponse({ description: 'Agendamento criado com seus serviços' })
  @ApiConflictResponse({ description: 'Horário não está mais disponível' })
  @ApiBadRequestResponse({ description: 'Dados ou horário inválidos' })
  @ApiNotFoundResponse({
    description: 'Cliente, empresa ou profissional não encontrado',
  })
  create(@CompanyId() companyId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(companyId, dto);
  }
  @Get()
  @ApiOperation({ summary: 'Consultar agenda por período' })
  @ApiOkResponse({ description: 'Agendamentos encontrados' })
  @ApiForbiddenResponse({ description: 'Sem acesso à agenda solicitada' })
  findAll(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Query() query: ListAppointmentsQueryDto,
  ) {
    return this.appointments.findAll(companyId, userId, query);
  }
  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento' })
  @ApiOkResponse({ description: 'Status atualizado' })
  @ApiBadRequestResponse({ description: 'Transição de status inválida' })
  @ApiForbiddenResponse({ description: 'Sem permissão para alterar' })
  @ApiNotFoundResponse({ description: 'Agendamento não encontrado' })
  updateStatus(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointments.updateStatus(id, companyId, userId, dto.status);
  }
}
