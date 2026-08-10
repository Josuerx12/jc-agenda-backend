import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Company } from '../../infra/entities/company.entity';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { CompanyUserService } from '../../infra/entities/company-user-service.entity';
import { ProfessionalWorkSchedule } from '../../infra/entities/professional-work-schedule.entity';
import { CompanyHoliday } from '../../infra/entities/company-holiday.entity';
import { ProfessionalTimeOff } from '../../infra/entities/professional-time-off.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../../infra/entities/appointment.entity';
import {
  addMinutes,
  localDateTimeToUtc,
  localDayOfWeek,
  overlaps,
  utcToLocal,
} from './timezone.util';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(CompanyUser)
    private readonly professionals: Repository<CompanyUser>,
    @InjectRepository(CompanyUserService)
    private readonly professionalServices: Repository<CompanyUserService>,
    @InjectRepository(ProfessionalWorkSchedule)
    private readonly schedules: Repository<ProfessionalWorkSchedule>,
    @InjectRepository(CompanyHoliday)
    private readonly holidays: Repository<CompanyHoliday>,
    @InjectRepository(ProfessionalTimeOff)
    private readonly timeOffs: Repository<ProfessionalTimeOff>,
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
  ) {}

  async listProfessionals(companyId: string) {
    const professionals = await this.professionals.find({
      where: {
        companyId,
        isProfessional: true,
        user: { isActive: true, isBlocked: false },
      },
      relations: { user: true, services: { service: true } },
    });
    return professionals.map((professional) => ({
      id: professional.id,
      firstName: professional.user.firstName,
      lastName: professional.user.lastName,
      services: professional.services.map(({ service }) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: Number(service.price),
        durationInMinutes: service.durationInMinutes,
      })),
    }));
  }

  async getAvailability(
    companyId: string,
    date: string,
    professionalId: string,
    requestedServiceIds: string[],
  ) {
    const serviceIds = [...new Set(requestedServiceIds)];
    if (!serviceIds.length)
      throw new BadRequestException('Informe ao menos um serviço');
    const [company, professional] = await Promise.all([
      this.companies.findOneBy({ id: companyId }),
      this.professionals.findOne({
        where: {
          id: professionalId,
          companyId,
          isProfessional: true,
          user: { isActive: true, isBlocked: false },
        },
        relations: { user: true },
      }),
    ]);
    if (!company) throw new NotFoundException('Empresa não encontrada');
    if (!professional)
      throw new NotFoundException('Profissional não encontrado');
    const links = await this.professionalServices.find({
      where: { companyUserId: professionalId, serviceId: In(serviceIds) },
      relations: { service: true },
    });
    if (
      links.length !== serviceIds.length ||
      links.some((link) => link.service.companyId !== companyId)
    ) {
      throw new BadRequestException(
        'Um ou mais serviços não são realizados pelo profissional',
      );
    }
    const selectedServices = serviceIds.map(
      (id) => links.find((link) => link.serviceId === id)!.service,
    );
    const totalDurationMinutes = selectedServices.reduce(
      (sum, service) => sum + service.durationInMinutes,
      0,
    );
    const totalPrice = selectedServices.reduce(
      (sum, service) => sum + Number(service.price),
      0,
    );
    const schedule = await this.schedules.findOneBy({
      professionalId,
      dayOfWeek: localDayOfWeek(date),
    });
    const allServices = await this.professionalServices.find({
      where: { companyUserId: professionalId },
      relations: { service: true },
    });
    const base = {
      professional: {
        id: professional.id,
        firstName: professional.user.firstName,
        lastName: professional.user.lastName,
      },
      services: allServices.map((link) => ({
        id: link.service.id,
        name: link.service.name,
        price: Number(link.service.price),
        durationInMinutes: link.service.durationInMinutes,
      })),
      selectedServices: selectedServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price),
        durationInMinutes: service.durationInMinutes,
      })),
      totalDurationMinutes,
      totalPrice,
      timezone: company.timezone,
    };
    if (!schedule || (await this.holidays.existsBy({ companyId, date })))
      return { ...base, availableSlots: [] };

    const nextDate = new Date(`${date}T12:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const nextDateString = nextDate.toISOString().slice(0, 10);
    const dayStart = localDateTimeToUtc(date, '00:00', company.timezone);
    const dayEnd = localDateTimeToUtc(
      nextDateString,
      '00:00',
      company.timezone,
    );
    const [timeOffs, appointments] = await Promise.all([
      this.timeOffs.find({
        where: {
          professionalId,
          startAt: LessThan(dayEnd),
          endAt: MoreThan(dayStart),
        },
      }),
      this.appointments.find({
        where: {
          professionalId,
          status: Not(AppointmentStatus.CANCELED),
          startAt: LessThan(dayEnd),
          endAt: MoreThan(dayStart),
        },
      }),
    ]);
    const workStart = localDateTimeToUtc(
      date,
      schedule.startTime.slice(0, 5),
      company.timezone,
    );
    const workEnd = localDateTimeToUtc(
      date,
      schedule.endTime.slice(0, 5),
      company.timezone,
    );
    const lunchStart = schedule.lunchStartTime
      ? localDateTimeToUtc(
          date,
          schedule.lunchStartTime.slice(0, 5),
          company.timezone,
        )
      : null;
    const lunchEnd = schedule.lunchEndTime
      ? localDateTimeToUtc(
          date,
          schedule.lunchEndTime.slice(0, 5),
          company.timezone,
        )
      : null;
    const availableSlots: Array<{
      startAt: string;
      endAt: string;
      localStart: string;
      localEnd: string;
    }> = [];
    for (
      let start = workStart;
      addMinutes(start, totalDurationMinutes) <= workEnd;
      start = addMinutes(start, company.slotIntervalMinutes)
    ) {
      const end = addMinutes(start, totalDurationMinutes);
      if (start < new Date()) continue;
      if (lunchStart && lunchEnd && overlaps(start, end, lunchStart, lunchEnd))
        continue;
      if (
        timeOffs.some((item) => overlaps(start, end, item.startAt, item.endAt))
      )
        continue;
      if (
        appointments.some((item) =>
          overlaps(start, end, item.startAt, item.endAt),
        )
      )
        continue;
      availableSlots.push({
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        localStart: utcToLocal(start, company.timezone),
        localEnd: utcToLocal(end, company.timezone),
      });
    }
    return { ...base, availableSlots };
  }
}
