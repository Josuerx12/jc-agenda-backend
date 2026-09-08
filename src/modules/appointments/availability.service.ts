import { buildMediaReference } from '../media/media-reference';
import { ProfessionalServicesQueryDto } from './dto/professional-services-query.dto';
import { Service } from '../../infra/entities/services.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Company } from '../../infra/entities/company.entity';
import { CompanySetting } from '../../infra/entities/company-setting.entity';
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
    @InjectRepository(CompanySetting)
    private readonly settings: Repository<CompanySetting>,
    @InjectRepository(CompanyUser)
    private readonly professionals: Repository<CompanyUser>,
    @InjectRepository(CompanyUserService)
    private readonly professionalServices: Repository<CompanyUserService>,
    @InjectRepository(Service)
    private readonly catalogServices: Repository<Service>,
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
      relations: { user: true },
    });
    return professionals.map((professional) => ({
      id: professional.id,
      firstName: professional.user.firstName,
      lastName: professional.user.lastName,
      avatar: buildMediaReference(professional.avatarImageId),
    }));
  }

  async listProfessionalCategories(
    companyId: string,
    professionalId: string,
    search?: string,
  ) {
    const query = this.professionalServices
      .createQueryBuilder('link')
      .innerJoin('link.service', 'service')
      .innerJoin('service.category', 'category')
      .innerJoin('link.companyUser', 'professional')
      .innerJoin('professional.user', 'user')
      .where('professional.id = :professionalId', { professionalId })
      .andWhere('professional.companyId = :companyId', { companyId })
      .andWhere('professional.isProfessional = true')
      .andWhere('user.isActive = true AND user.isBlocked = false')
      .select('category.id', 'id')
      .addSelect('category.name', 'name')
      .addSelect('category.description', 'description')
      .addSelect('COUNT(DISTINCT service.id)', 'serviceCount')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.description')
      .orderBy('category.name', 'ASC')
      .limit(50);
    if (search)
      query.andWhere('category.name ILIKE :search', { search: `%${search}%` });
    const rows = await query.getRawMany<{
      id: string;
      name: string;
      description: string | null;
      serviceCount: string;
    }>();
    return rows.map((row) => ({
      ...row,
      serviceCount: Number(row.serviceCount),
    }));
  }

  async listBookingCategories(companyId: string, search?: string) {
    const query = this.catalogServices
      .createQueryBuilder('service')
      .innerJoin('service.category', 'category')
      .innerJoin('service.users', 'link')
      .innerJoin('link.companyUser', 'professional')
      .innerJoin('professional.user', 'user')
      .where('service.companyId = :companyId', { companyId })
      .andWhere('professional.companyId = :companyId', { companyId })
      .andWhere('professional.isProfessional = true')
      .andWhere('user.isActive = true AND user.isBlocked = false')
      .select('category.id', 'id')
      .addSelect('category.name', 'name')
      .addSelect('category.description', 'description')
      .addSelect('COUNT(DISTINCT service.id)', 'serviceCount')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.description')
      .orderBy('category.name', 'ASC')
      .limit(50);
    if (search)
      query.andWhere('category.name ILIKE :search', {
        search: `%${search}%`,
      });
    const rows = await query.getRawMany<{
      id: string;
      name: string;
      description: string | null;
      serviceCount: string;
    }>();
    return rows.map((row) => ({
      ...row,
      serviceCount: Number(row.serviceCount),
    }));
  }

  async listBookingServices(
    companyId: string,
    query: ProfessionalServicesQueryDto,
  ) {
    const builder = this.catalogServices
      .createQueryBuilder('service')
      .innerJoinAndSelect('service.category', 'category')
      .innerJoin('service.users', 'link')
      .innerJoin('link.companyUser', 'professional')
      .innerJoin('professional.user', 'user')
      .where('service.companyId = :companyId', { companyId })
      .andWhere('professional.companyId = :companyId', { companyId })
      .andWhere('professional.isProfessional = true')
      .andWhere('user.isActive = true AND user.isBlocked = false')
      .distinct(true);
    if (query.categoryId)
      builder.andWhere('category.id = :categoryId', {
        categoryId: query.categoryId,
      });
    if (query.search)
      builder.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    const [services, totalItems] = await builder
      .orderBy('service.name', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return this.toServicesPage(services, totalItems, query);
  }

  async listProfessionalsForServices(companyId: string, serviceIds: string[]) {
    const uniqueIds = [...new Set(serviceIds)];
    const professionals = await this.professionals
      .createQueryBuilder('professional')
      .innerJoinAndSelect('professional.user', 'user')
      .innerJoin('professional.services', 'link')
      .innerJoin('link.service', 'service')
      .where('professional.companyId = :companyId', { companyId })
      .andWhere('professional.isProfessional = true')
      .andWhere('user.isActive = true AND user.isBlocked = false')
      .andWhere('service.companyId = :companyId', { companyId })
      .andWhere('service.id IN (:...serviceIds)', { serviceIds: uniqueIds })
      .groupBy('professional.id')
      .addGroupBy('user.id')
      .having('COUNT(DISTINCT service.id) = :serviceCount', {
        serviceCount: uniqueIds.length,
      })
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();
    return professionals.map((professional) => ({
      id: professional.id,
      firstName: professional.user.firstName,
      lastName: professional.user.lastName,
      avatar: buildMediaReference(professional.avatarImageId),
    }));
  }

  async listProfessionalServices(
    companyId: string,
    professionalId: string,
    query: ProfessionalServicesQueryDto,
  ) {
    const builder = this.professionalServices
      .createQueryBuilder('link')
      .innerJoinAndSelect('link.service', 'service')
      .innerJoinAndSelect('service.category', 'category')
      .innerJoin('link.companyUser', 'professional')
      .innerJoin('professional.user', 'user')
      .where('professional.id = :professionalId', { professionalId })
      .andWhere('professional.companyId = :companyId', { companyId })
      .andWhere('professional.isProfessional = true')
      .andWhere('user.isActive = true AND user.isBlocked = false');
    if (query.categoryId)
      builder.andWhere('category.id = :categoryId', {
        categoryId: query.categoryId,
      });
    if (query.search)
      builder.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    const [links, totalItems] = await builder
      .orderBy('service.name', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      data: links.map(({ service }) => ({
        id: service.id,
        categoryId: service.categoryId,
        category: { id: service.category.id, name: service.category.name },
        name: service.name,
        description: service.description,
        price: Number(service.price),
        durationInMinutes: service.durationInMinutes,
        image: buildMediaReference(service.imageId),
      })),
      meta: {
        currentPage: query.page,
        itemsPerPage: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }

  private toServicesPage(
    services: Service[],
    totalItems: number,
    query: ProfessionalServicesQueryDto,
  ) {
    return {
      data: services.map((service) => ({
        id: service.id,
        categoryId: service.categoryId,
        category: { id: service.category.id, name: service.category.name },
        name: service.name,
        description: service.description,
        price: Number(service.price),
        durationInMinutes: service.durationInMinutes,
        image: buildMediaReference(service.imageId),
      })),
      meta: {
        currentPage: query.page,
        itemsPerPage: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
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
    const [company, settings, professional] = await Promise.all([
      this.companies.findOneBy({ id: companyId }),
      this.settings.findOneBy({ companyId }),
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
    const timezone = settings?.timezone ?? 'America/Sao_Paulo';
    const slotIntervalMinutes = settings?.slotIntervalMinutes ?? 60;
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
    const base = {
      professional: {
        id: professional.id,
        firstName: professional.user.firstName,
        lastName: professional.user.lastName,
      },
      selectedServices: selectedServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price),
        durationInMinutes: service.durationInMinutes,
      })),
      totalDurationMinutes,
      totalPrice,
      timezone,
    };
    if (!schedule || (await this.holidays.existsBy({ companyId, date })))
      return { ...base, availableSlots: [] };

    const nextDate = new Date(`${date}T12:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const nextDateString = nextDate.toISOString().slice(0, 10);
    const dayStart = localDateTimeToUtc(date, '00:00', timezone);
    const dayEnd = localDateTimeToUtc(nextDateString, '00:00', timezone);
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
      timezone,
    );
    const workEnd = localDateTimeToUtc(
      date,
      schedule.endTime.slice(0, 5),
      timezone,
    );
    const lunchStart = schedule.lunchStartTime
      ? localDateTimeToUtc(date, schedule.lunchStartTime.slice(0, 5), timezone)
      : null;
    const lunchEnd = schedule.lunchEndTime
      ? localDateTimeToUtc(date, schedule.lunchEndTime.slice(0, 5), timezone)
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
      start = addMinutes(start, slotIntervalMinutes)
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
        localStart: utcToLocal(start, timezone),
        localEnd: utcToLocal(end, timezone),
      });
    }
    return { ...base, availableSlots };
  }
}
