import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiCompanyIdHeader,
  CompanyId,
} from '../../infra/decorators/company.decorator';
import { UserId } from '../../infra/decorators/user.decorator';
import { SchedulesService } from './schedules.service';
import { ReplaceWorkScheduleDto } from './dto/replace-work-schedule.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateTimeOffDto } from './dto/create-time-off.dto';

@ApiTags('Jornadas e indisponibilidades')
@Controller('schedules')
@ApiCompanyIdHeader()
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}
  @Get('professionals/:professionalId/work-schedule')
  @ApiOperation({ summary: 'Consultar jornada semanal do profissional' })
  @ApiOkResponse({ description: 'Jornada ordenada por dia da semana' })
  workSchedule(@CompanyId() c: string, @Param('professionalId') p: string) {
    return this.service.listWorkSchedule(c, p);
  }
  @Put('professionals/:professionalId/work-schedule')
  @ApiOperation({ summary: 'Substituir jornada semanal do profissional' })
  @ApiOkResponse({ description: 'Jornada atualizada' })
  @ApiBadRequestResponse({ description: 'Jornada ou almoço inválido' })
  @ApiForbiddenResponse({ description: 'Sem permissão para gerenciar' })
  replace(
    @CompanyId() c: string,
    @UserId() u: string,
    @Param('professionalId') p: string,
    @Body() d: ReplaceWorkScheduleDto,
  ) {
    return this.service.replaceWorkSchedule(c, u, p, d);
  }
  @Get('holidays')
  @ApiOperation({ summary: 'Listar feriados da empresa' })
  @ApiOkResponse({ description: 'Feriados cadastrados' })
  holidays(@CompanyId() c: string) {
    return this.service.listHolidays(c);
  }
  @Post('holidays')
  @ApiOperation({ summary: 'Cadastrar feriado da empresa' })
  @ApiCreatedResponse({ description: 'Feriado cadastrado' })
  @ApiForbiddenResponse({ description: 'Apenas dono ou administrador' })
  createHoliday(
    @CompanyId() c: string,
    @UserId() u: string,
    @Body() d: CreateHolidayDto,
  ) {
    return this.service.createHoliday(c, u, d);
  }
  @Delete('holidays/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover feriado' })
  @ApiNoContentResponse({ description: 'Feriado removido' })
  @ApiNotFoundResponse({ description: 'Feriado não encontrado' })
  removeHoliday(
    @Param('id') id: string,
    @CompanyId() c: string,
    @UserId() u: string,
  ) {
    return this.service.removeHoliday(id, c, u);
  }
  @Get('professionals/:professionalId/time-offs')
  @ApiOperation({ summary: 'Listar folgas do profissional' })
  @ApiOkResponse({ description: 'Folgas cadastradas' })
  timeOffs(@CompanyId() c: string, @Param('professionalId') p: string) {
    return this.service.listTimeOffs(c, p);
  }
  @Post('professionals/:professionalId/time-offs')
  @ApiOperation({ summary: 'Cadastrar folga do profissional' })
  @ApiCreatedResponse({ description: 'Folga cadastrada' })
  @ApiBadRequestResponse({ description: 'Intervalo inválido' })
  @ApiForbiddenResponse({ description: 'Sem permissão para gerenciar' })
  createTimeOff(
    @CompanyId() c: string,
    @UserId() u: string,
    @Param('professionalId') p: string,
    @Body() d: CreateTimeOffDto,
  ) {
    return this.service.createTimeOff(c, u, p, d);
  }
  @Delete('professionals/:professionalId/time-offs/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover folga do profissional' })
  @ApiNoContentResponse({ description: 'Folga removida' })
  @ApiNotFoundResponse({ description: 'Folga não encontrada' })
  removeTimeOff(
    @Param('id') id: string,
    @CompanyId() c: string,
    @UserId() u: string,
    @Param('professionalId') p: string,
  ) {
    return this.service.removeTimeOff(id, c, u, p);
  }
}
