import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
} from '../../infra/entities/appointment.entity';
import { AppointmentService } from '../../infra/entities/appointment-service.entity';
import { Client } from '../../infra/entities/client.entity';
import { Company } from '../../infra/entities/company.entity';
import { CompanySetting } from '../../infra/entities/company-setting.entity';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { AvailabilityService } from './availability.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';
import { utcToLocal } from './timezone.util';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    @InjectRepository(CompanyUser)
    private readonly companyUsers: Repository<CompanyUser>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(CompanySetting)
    private readonly settings: Repository<CompanySetting>,
    private readonly availability: AvailabilityService,
  ) {}

  async create(companyId: string, dto: CreateAppointmentDto) {
    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime()) || startAt <= new Date())
      throw new BadRequestException('Horário de início inválido');
    const company = await this.companies.findOneBy({ id: companyId });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    const settings = await this.settings.findOneBy({ companyId });
    const timezone = settings?.timezone ?? 'America/Sao_Paulo';
    const localDate = utcToLocal(startAt, timezone).slice(0, 10);

    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `${professionalLockKey(dto.professionalId, localDate)}`,
      ]);
      const client = await manager.getRepository(Client).findOneBy({
        id: dto.clientId,
        companyId,
      });
      if (!client) {
        throw new NotFoundException('Cliente não encontrado nesta empresa');
      }
      const availability = await this.availability.getAvailability(
        companyId,
        localDate,
        dto.professionalId,
        dto.serviceIds,
      );
      const slot = availability.availableSlots.find(
        (item) => new Date(item.startAt).getTime() === startAt.getTime(),
      );
      if (!slot)
        throw new ConflictException(
          'O horário selecionado não está mais disponível',
        );

      const appointments = manager.getRepository(Appointment);
      const appointment = await appointments.save(
        appointments.create({
          companyId,
          professionalId: dto.professionalId,
          clientId: client.id,
          startAt,
          endAt: new Date(slot.endAt),
          totalDurationMinutes: availability.totalDurationMinutes,
          totalPrice: availability.totalPrice,
          status: AppointmentStatus.SCHEDULED,
        }),
      );
      const items = manager.getRepository(AppointmentService);
      await items.save(
        availability.selectedServices.map((service) =>
          items.create({
            appointmentId: appointment.id,
            serviceId: service.id,
            name: service.name,
            price: service.price,
            durationMinutes: service.durationInMinutes,
          }),
        ),
      );
      return appointments.findOne({
        where: { id: appointment.id },
        relations: {
          client: true,
          professional: { user: true },
          services: true,
        },
      });
    });
  }

  async findAll(
    companyId: string,
    userId: string,
    query: ListAppointmentsQueryDto,
  ) {
    const requester = await this.companyUsers.findOneBy({ companyId, userId });
    if (!requester)
      throw new ForbiddenException('Usuário não pertence à empresa');
    if (new Date(query.from) > new Date(query.to))
      throw new BadRequestException('Período inválido');
    let professionalId = query.professionalId;
    if (!requester.isAdmin && !requester.isOwner) {
      if (
        !requester.isProfessional ||
        (professionalId && professionalId !== requester.id)
      )
        throw new ForbiddenException(
          'Usuário não tem permissão para consultar esta agenda',
        );
      professionalId = requester.id;
    }
    return this.appointments.find({
      where: {
        companyId,
        ...(professionalId ? { professionalId } : {}),
        ...(query.status ? { status: query.status } : {}),
        startAt: Between(new Date(query.from), new Date(query.to)),
      },
      relations: { client: true, professional: { user: true }, services: true },
      order: { startAt: 'ASC' },
    });
  }

  async updateStatus(
    id: string,
    companyId: string,
    userId: string,
    status: AppointmentStatus,
  ) {
    const [requester, appointment] = await Promise.all([
      this.companyUsers.findOneBy({ companyId, userId }),
      this.appointments.findOneBy({ id, companyId }),
    ]);
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    if (
      !requester ||
      (!requester.isAdmin &&
        !requester.isOwner &&
        requester.id !== appointment.professionalId)
    )
      throw new ForbiddenException(
        'Usuário não tem permissão para alterar este agendamento',
      );
    if (appointment.status === status) return appointment;
    if (
      ![AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED].includes(
        appointment.status,
      )
    )
      throw new BadRequestException('O status atual do agendamento é terminal');
    if (
      appointment.status === AppointmentStatus.CONFIRMED &&
      status === AppointmentStatus.SCHEDULED
    )
      throw new BadRequestException(
        'Um agendamento confirmado não pode voltar para agendado',
      );
    if (
      [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW].includes(
        status,
      ) &&
      appointment.startAt > new Date()
    )
      throw new BadRequestException(
        'Não é possível finalizar um agendamento antes do início',
      );
    appointment.status = status;
    return this.appointments.save(appointment);
  }
}

function professionalLockKey(professionalId: string, date: string) {
  return `${professionalId}:${date}`;
}
