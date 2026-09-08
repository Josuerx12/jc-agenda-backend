/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AppointmentProduct } from '../../infra/entities/appointment-product.entity';
import { AppointmentService } from '../../infra/entities/appointment-service.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../../infra/entities/appointment.entity';
import { CompanyUserService } from '../../infra/entities/company-user-service.entity';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { Product } from '../../infra/entities/product.entity';
import { AppointmentAttendanceService } from './appointment-attendance.service';

describe('AppointmentAttendanceService', () => {
  function setup(authorized = true) {
    const appointment = {
      id: 'appointment-id',
      companyId: 'company-id',
      professionalId: 'professional-id',
      clientId: 'client-id',
      startAt: new Date(),
      endAt: new Date(),
      startedAt: null,
      completedAt: null,
      status: AppointmentStatus.CONFIRMED,
      totalDurationMinutes: 60,
      totalPrice: 100,
      client: { id: 'client-id', name: 'Maria', phone: '11999999999' },
      professional: {
        id: 'professional-id',
        user: { firstName: 'Ana', lastName: 'Silva' },
      },
      services: [
        {
          serviceId: 'service-1',
          price: 100,
          durationMinutes: 60,
        },
      ],
      products: [],
    } as unknown as Appointment;
    const appointmentRepository = {
      findOne: jest.fn().mockImplementation(() => appointment),
      findOneOrFail: jest.fn().mockImplementation(() => appointment),
      save: jest.fn().mockImplementation((value) => value),
    };
    const serviceRepository = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation((value) => value),
    };
    const productRepository = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 'product-id',
        companyId: 'company-id',
        name: 'Shampoo',
        price: 10,
      }),
    };
    const appointmentProductRepository = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation((value) => value),
      remove: jest.fn(),
    };
    const repositories = new Map<unknown, unknown>([
      [Appointment, appointmentRepository],
      [
        CompanyUser,
        {
          findOneBy: jest.fn().mockResolvedValue({
            id: authorized ? 'professional-id' : 'other-id',
            isProfessional: true,
          }),
        },
      ],
      [
        CompanyUserService,
        {
          find: jest.fn().mockResolvedValue([
            {
              serviceId: 'service-2',
              service: {
                companyId: 'company-id',
                name: 'Hidratação',
                price: 50,
                durationInMinutes: 30,
              },
            },
          ]),
        },
      ],
      [AppointmentService, serviceRepository],
      [Product, productRepository],
      [AppointmentProduct, appointmentProductRepository],
    ]);
    const manager = {
      getRepository: jest
        .fn()
        .mockImplementation((entity) => repositories.get(entity)),
    } as unknown as EntityManager;
    const dataSource = {
      manager,
      transaction: jest
        .fn()
        .mockImplementation((callback) => callback(manager)),
    } as unknown as DataSource;
    return {
      service: new AppointmentAttendanceService(dataSource),
      appointment,
    };
  }

  it('inicia, adiciona itens, recalcula e finaliza o atendimento', async () => {
    const { service, appointment } = setup();

    await service.start('appointment-id', 'company-id', 'user-id');
    expect(appointment.status).toBe(AppointmentStatus.IN_PROGRESS);
    expect(appointment.startedAt).toBeInstanceOf(Date);

    const withService = await service.addServices(
      'appointment-id',
      'company-id',
      'user-id',
      ['service-2'],
    );
    expect(withService.totalDurationMinutes).toBe(90);
    expect(withService.totalPrice).toBe(150);

    const withProduct = await service.setProduct(
      'appointment-id',
      'product-id',
      2,
      'company-id',
      'user-id',
    );
    expect(withProduct.productTotal).toBe(20);
    expect(withProduct.totalPrice).toBe(170);

    const completed = await service.complete(
      'appointment-id',
      'company-id',
      'user-id',
    );
    expect(completed.status).toBe(AppointmentStatus.COMPLETED);
    expect(completed.completedAt).toBeInstanceOf(Date);
  });

  it('impede outro profissional de operar o atendimento', async () => {
    const { service } = setup(false);
    await expect(
      service.start('appointment-id', 'company-id', 'user-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
