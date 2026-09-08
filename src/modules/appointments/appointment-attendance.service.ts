import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In } from 'typeorm';
import { AppointmentProduct } from '../../infra/entities/appointment-product.entity';
import { AppointmentService } from '../../infra/entities/appointment-service.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../../infra/entities/appointment.entity';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { Product } from '../../infra/entities/product.entity';
import { CompanyUserService } from '../../infra/entities/company-user-service.entity';

@Injectable()
export class AppointmentAttendanceService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async detail(id: string, companyId: string, userId: string) {
    const appointment = await this.loadAuthorized(
      this.dataSource.manager,
      id,
      companyId,
      userId,
      false,
    );
    return this.toResponse(appointment);
  }

  async start(id: string, companyId: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await this.loadAuthorized(
        manager,
        id,
        companyId,
        userId,
        true,
      );
      if (appointment.status === AppointmentStatus.IN_PROGRESS)
        return this.toResponse(appointment);
      if (
        ![AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED].includes(
          appointment.status,
        )
      ) {
        throw new BadRequestException(
          'Somente agendamentos pendentes podem iniciar um atendimento',
        );
      }
      appointment.status = AppointmentStatus.IN_PROGRESS;
      appointment.startedAt = new Date();
      await manager.getRepository(Appointment).save(appointment);
      return this.toResponse(appointment);
    });
  }

  async addServices(
    id: string,
    companyId: string,
    userId: string,
    serviceIds: string[],
  ) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await this.loadAuthorized(
        manager,
        id,
        companyId,
        userId,
        true,
      );
      this.ensureInProgress(appointment);
      const existing = new Set(
        appointment.services.map((item) => item.serviceId),
      );
      const missingIds = serviceIds.filter(
        (serviceId) => !existing.has(serviceId),
      );
      if (missingIds.length) {
        const links = await manager.getRepository(CompanyUserService).find({
          where: {
            companyUserId: appointment.professionalId,
            serviceId: In(missingIds),
          },
          relations: { service: true },
        });
        if (
          links.length !== missingIds.length ||
          links.some((link) => link.service.companyId !== companyId)
        ) {
          throw new BadRequestException(
            'Um ou mais serviços não são realizados pelo profissional',
          );
        }
        const repository = manager.getRepository(AppointmentService);
        const additions = links.map((link) =>
          repository.create({
            appointmentId: appointment.id,
            serviceId: link.serviceId,
            name: link.service.name,
            price: link.service.price,
            durationMinutes: link.service.durationInMinutes,
          }),
        );
        await repository.save(additions);
        appointment.services.push(...additions);
        await this.recalculate(manager, appointment);
      }
      return this.toResponse(appointment);
    });
  }

  async setProduct(
    id: string,
    productId: string,
    quantity: number,
    companyId: string,
    userId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await this.loadAuthorized(
        manager,
        id,
        companyId,
        userId,
        true,
      );
      this.ensureInProgress(appointment);
      const repository = manager.getRepository(AppointmentProduct);
      let item = appointment.products.find(
        (line) => line.productId === productId,
      );
      if (!item) {
        const product = await manager.getRepository(Product).findOneBy({
          id: productId,
          companyId,
        });
        if (!product) throw new NotFoundException('Produto não encontrado');
        item = repository.create({
          appointmentId: id,
          productId,
          name: product.name,
          unitPrice: product.price,
        });
        appointment.products.push(item);
      }
      item.quantity = quantity;
      item.totalPrice = fromCents(toCents(item.unitPrice) * quantity);
      await repository.save(item);
      await this.recalculate(manager, appointment);
      return this.toResponse(appointment);
    });
  }

  async removeProduct(
    id: string,
    productId: string,
    companyId: string,
    userId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await this.loadAuthorized(
        manager,
        id,
        companyId,
        userId,
        true,
      );
      this.ensureInProgress(appointment);
      const item = appointment.products.find(
        (line) => line.productId === productId,
      );
      if (item) {
        await manager.getRepository(AppointmentProduct).remove(item);
        appointment.products = appointment.products.filter(
          (line) => line.productId !== productId,
        );
        await this.recalculate(manager, appointment);
      }
      return this.toResponse(appointment);
    });
  }

  async complete(id: string, companyId: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await this.loadAuthorized(
        manager,
        id,
        companyId,
        userId,
        true,
      );
      if (appointment.status === AppointmentStatus.COMPLETED)
        return this.toResponse(appointment);
      this.ensureInProgress(appointment);
      await this.recalculate(manager, appointment);
      appointment.status = AppointmentStatus.COMPLETED;
      appointment.completedAt = new Date();
      await manager.getRepository(Appointment).save(appointment);
      return this.toResponse(appointment);
    });
  }

  private async loadAuthorized(
    manager: EntityManager,
    id: string,
    companyId: string,
    userId: string,
    write: boolean,
  ) {
    const repository = manager.getRepository(Appointment);
    const appointment = await repository.findOne({
      where: { id, companyId },
      ...(write ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    const requester = await manager.getRepository(CompanyUser).findOneBy({
      companyId,
      userId,
    });
    if (
      !requester?.isProfessional ||
      requester.id !== appointment.professionalId
    ) {
      throw new ForbiddenException(
        'Somente o profissional responsável pode operar este atendimento',
      );
    }
    return repository.findOneOrFail({
      where: { id, companyId },
      relations: {
        client: true,
        professional: { user: true },
        services: true,
        products: true,
      },
    });
  }

  private ensureInProgress(appointment: Appointment) {
    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException('O atendimento precisa estar em andamento');
    }
  }

  private async recalculate(manager: EntityManager, appointment: Appointment) {
    appointment.totalDurationMinutes = appointment.services.reduce(
      (total, item) => total + item.durationMinutes,
      0,
    );
    const serviceCents = appointment.services.reduce(
      (total, item) => total + toCents(item.price),
      0,
    );
    const productCents = appointment.products.reduce(
      (total, item) => total + toCents(item.totalPrice),
      0,
    );
    appointment.totalPrice = fromCents(serviceCents + productCents);
    await manager.getRepository(Appointment).save(appointment);
  }

  private toResponse(appointment: Appointment) {
    const serviceTotal = fromCents(
      appointment.services.reduce(
        (total, item) => total + toCents(item.price),
        0,
      ),
    );
    const productTotal = fromCents(
      appointment.products.reduce(
        (total, item) => total + toCents(item.totalPrice),
        0,
      ),
    );
    return {
      id: appointment.id,
      companyId: appointment.companyId,
      professionalId: appointment.professionalId,
      clientId: appointment.clientId,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      startedAt: appointment.startedAt,
      completedAt: appointment.completedAt,
      status: appointment.status,
      totalDurationMinutes: appointment.totalDurationMinutes,
      serviceTotal,
      productTotal,
      totalPrice: fromCents(toCents(appointment.totalPrice)),
      client: appointment.client
        ? {
            id: appointment.client.id,
            name: appointment.client.name,
            phone: appointment.client.phone,
          }
        : null,
      professional: appointment.professional
        ? {
            id: appointment.professional.id,
            firstName: appointment.professional.user.firstName,
            lastName: appointment.professional.user.lastName,
          }
        : null,
      services: appointment.services,
      products: appointment.products,
    };
  }
}

function toCents(value: number | string) {
  return Math.round(Number(value) * 100);
}

function fromCents(value: number) {
  return value / 100;
}
