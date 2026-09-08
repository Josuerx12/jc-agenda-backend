import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Delete,
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
import { AppointmentAttendanceService } from './appointment-attendance.service';
import { AddAppointmentServicesDto } from './dto/add-appointment-services.dto';
import { SetAppointmentProductDto } from './dto/set-appointment-product.dto';
import {
  ProfessionalCategoriesQueryDto,
  ProfessionalServicesQueryDto,
  ServicesProfessionalsQueryDto,
} from './dto/professional-services-query.dto';

@ApiTags('Agendamentos')
@Controller('appointments')
@ApiCompanyIdHeader()
export class AppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly availability: AvailabilityService,
    private readonly attendance: AppointmentAttendanceService,
  ) {}
  @Get('professionals')
  @IsPublic()
  @ApiOperation({ summary: 'Listar profissionais e seus serviços' })
  @ApiOkResponse({ description: 'Profissionais ativos da empresa' })
  professionals(@CompanyId() companyId: string) {
    return this.availability.listProfessionals(companyId);
  }
  @Get('service-categories')
  @IsPublic()
  bookingCategories(
    @CompanyId() companyId: string,
    @Query() query: ProfessionalCategoriesQueryDto,
  ) {
    return this.availability.listBookingCategories(companyId, query.search);
  }
  @Get('services/professionals')
  @IsPublic()
  bookingProfessionals(
    @CompanyId() companyId: string,
    @Query() query: ServicesProfessionalsQueryDto,
  ) {
    return this.availability.listProfessionalsForServices(
      companyId,
      query.serviceIds,
    );
  }
  @Get('services')
  @IsPublic()
  bookingServices(
    @CompanyId() companyId: string,
    @Query() query: ProfessionalServicesQueryDto,
  ) {
    return this.availability.listBookingServices(companyId, query);
  }
  @Get('professionals/:professionalId/service-categories')
  @IsPublic()
  professionalCategories(
    @CompanyId() companyId: string,
    @Param('professionalId') professionalId: string,
    @Query() query: ProfessionalCategoriesQueryDto,
  ) {
    return this.availability.listProfessionalCategories(
      companyId,
      professionalId,
      query.search,
    );
  }
  @Get('professionals/:professionalId/services')
  @IsPublic()
  professionalServices(
    @CompanyId() companyId: string,
    @Param('professionalId') professionalId: string,
    @Query() query: ProfessionalServicesQueryDto,
  ) {
    return this.availability.listProfessionalServices(
      companyId,
      professionalId,
      query,
    );
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

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Consultar o atendimento do profissional' })
  attendanceDetail(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.attendance.detail(id, companyId, userId);
  }

  @Post(':id/attendance/start')
  @ApiOperation({ summary: 'Iniciar atendimento' })
  startAttendance(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.attendance.start(id, companyId, userId);
  }

  @Post(':id/attendance/services')
  @ApiOperation({ summary: 'Adicionar serviços ao atendimento' })
  addAttendanceServices(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() dto: AddAppointmentServicesDto,
  ) {
    return this.attendance.addServices(id, companyId, userId, dto.serviceIds);
  }

  @Put(':id/attendance/products/:productId')
  @ApiOperation({ summary: 'Definir quantidade de produto no atendimento' })
  setAttendanceProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() dto: SetAppointmentProductDto,
  ) {
    return this.attendance.setProduct(
      id,
      productId,
      dto.quantity,
      companyId,
      userId,
    );
  }

  @Delete(':id/attendance/products/:productId')
  @ApiOperation({ summary: 'Remover produto do atendimento' })
  removeAttendanceProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.attendance.removeProduct(id, productId, companyId, userId);
  }

  @Post(':id/attendance/complete')
  @ApiOperation({ summary: 'Finalizar atendimento' })
  completeAttendance(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.attendance.complete(id, companyId, userId);
  }
}
