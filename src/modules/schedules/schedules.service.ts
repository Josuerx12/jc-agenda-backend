import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { ProfessionalWorkSchedule } from '../../infra/entities/professional-work-schedule.entity';
import { CompanyHoliday } from '../../infra/entities/company-holiday.entity';
import { ProfessionalTimeOff } from '../../infra/entities/professional-time-off.entity';
import { ensureCanManageCompany } from '../../infra/authorization/company-permission';
import { ReplaceWorkScheduleDto } from './dto/replace-work-schedule.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateTimeOffDto } from './dto/create-time-off.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(CompanyUser)
    private readonly companyUsers: Repository<CompanyUser>,
    @InjectRepository(ProfessionalWorkSchedule)
    private readonly workSchedules: Repository<ProfessionalWorkSchedule>,
    @InjectRepository(CompanyHoliday)
    private readonly holidays: Repository<CompanyHoliday>,
    @InjectRepository(ProfessionalTimeOff)
    private readonly timeOffs: Repository<ProfessionalTimeOff>,
  ) {}

  private async ensureProfessionalAccess(
    companyId: string,
    userId: string,
    professionalId: string,
  ) {
    const [requester, professional] = await Promise.all([
      this.companyUsers.findOneBy({ companyId, userId }),
      this.companyUsers.findOneBy({
        id: professionalId,
        companyId,
        isProfessional: true,
      }),
    ]);
    if (!professional)
      throw new NotFoundException('Profissional não encontrado');
    if (
      !requester ||
      (!requester.isAdmin &&
        !requester.isOwner &&
        requester.id !== professionalId)
    ) {
      throw new ForbiddenException(
        'Usuário não tem permissão para gerenciar esta agenda',
      );
    }
    return professional;
  }

  listWorkSchedule(companyId: string, professionalId: string) {
    return this.workSchedules.find({
      where: { professional: { id: professionalId, companyId } },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async replaceWorkSchedule(
    companyId: string,
    userId: string,
    professionalId: string,
    dto: ReplaceWorkScheduleDto,
  ) {
    await this.ensureProfessionalAccess(companyId, userId, professionalId);
    if (
      new Set(dto.days.map((day) => day.dayOfWeek)).size !== dto.days.length
    ) {
      throw new BadRequestException(
        'Cada dia da semana deve ser informado apenas uma vez',
      );
    }
    for (const day of dto.days) {
      if (day.startTime >= day.endTime)
        throw new BadRequestException(
          'O início da jornada deve ser anterior ao fim',
        );
      const hasOneLunchLimit =
        Boolean(day.lunchStartTime) !== Boolean(day.lunchEndTime);
      if (hasOneLunchLimit)
        throw new BadRequestException(
          'Início e fim do almoço devem ser informados juntos',
        );
      if (
        day.lunchStartTime &&
        day.lunchEndTime &&
        (day.lunchStartTime <= day.startTime ||
          day.lunchStartTime >= day.lunchEndTime ||
          day.lunchEndTime >= day.endTime)
      ) {
        throw new BadRequestException('O almoço deve estar dentro da jornada');
      }
    }
    await this.workSchedules.manager.transaction(async (manager) => {
      const repository = manager.getRepository(ProfessionalWorkSchedule);
      await repository.delete({ professionalId });
      await repository.save(
        dto.days.map((day) =>
          repository.create({
            ...day,
            professionalId,
            lunchStartTime: day.lunchStartTime ?? null,
            lunchEndTime: day.lunchEndTime ?? null,
          }),
        ),
      );
    });
    return this.listWorkSchedule(companyId, professionalId);
  }

  listHolidays(companyId: string) {
    return this.holidays.find({ where: { companyId }, order: { date: 'ASC' } });
  }
  async createHoliday(
    companyId: string,
    userId: string,
    dto: CreateHolidayDto,
  ) {
    await ensureCanManageCompany(this.companyUsers, companyId, userId);
    return this.holidays.save({ ...dto, companyId });
  }
  async removeHoliday(id: string, companyId: string, userId: string) {
    await ensureCanManageCompany(this.companyUsers, companyId, userId);
    const result = await this.holidays.softDelete({ id, companyId });
    if (!result.affected) throw new NotFoundException('Feriado não encontrado');
  }

  async listTimeOffs(companyId: string, professionalId: string) {
    await this.ensureProfessionalExists(companyId, professionalId);
    return this.timeOffs.find({
      where: { professionalId },
      order: { startAt: 'ASC' },
    });
  }
  async createTimeOff(
    companyId: string,
    userId: string,
    professionalId: string,
    dto: CreateTimeOffDto,
  ) {
    await this.ensureProfessionalAccess(companyId, userId, professionalId);
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (startAt >= endAt)
      throw new BadRequestException(
        'O início da folga deve ser anterior ao fim',
      );
    return this.timeOffs.save({
      professionalId,
      startAt,
      endAt,
      reason: dto.reason ?? null,
    });
  }
  async removeTimeOff(
    id: string,
    companyId: string,
    userId: string,
    professionalId: string,
  ) {
    await this.ensureProfessionalAccess(companyId, userId, professionalId);
    const result = await this.timeOffs.softDelete({ id, professionalId });
    if (!result.affected) throw new NotFoundException('Folga não encontrada');
  }
  private async ensureProfessionalExists(
    companyId: string,
    professionalId: string,
  ) {
    const exists = await this.companyUsers.existsBy({
      id: professionalId,
      companyId,
      isProfessional: true,
    });
    if (!exists) throw new NotFoundException('Profissional não encontrado');
  }
}
