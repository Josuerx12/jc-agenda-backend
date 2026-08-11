import { Repository } from 'typeorm';
import { Appointment } from '../../infra/entities/appointment.entity';
import { Company } from '../../infra/entities/company.entity';
import { CompanySetting } from '../../infra/entities/company-setting.entity';
import { CompanyHoliday } from '../../infra/entities/company-holiday.entity';
import { CompanyUserService } from '../../infra/entities/company-user-service.entity';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { ProfessionalTimeOff } from '../../infra/entities/professional-time-off.entity';
import { ProfessionalWorkSchedule } from '../../infra/entities/professional-work-schedule.entity';
import { Service } from '../../infra/entities/services.entity';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  it('remove almoço, folga e agendamento sem remover horários adjacentes', async () => {
    const serviceItem = {
      id: 'service-id',
      companyId: 'company-id',
      name: 'Corte',
      price: 50,
      durationInMinutes: 60,
    } as Service;
    const links = [
      { serviceId: serviceItem.id, service: serviceItem },
    ] as CompanyUserService[];
    const companies = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 'company-id',
      }),
    } as unknown as Repository<Company>;
    const settings = {
      findOneBy: jest.fn().mockResolvedValue({
        companyId: 'company-id',
        timezone: 'America/Sao_Paulo',
        slotIntervalMinutes: 60,
      }),
    } as unknown as Repository<CompanySetting>;
    const professionals = {
      findOne: jest.fn().mockResolvedValue({
        id: 'professional-id',
        user: { firstName: 'Ana', lastName: 'Silva' },
      }),
    } as unknown as Repository<CompanyUser>;
    const professionalServices = {
      find: jest.fn().mockResolvedValue(links),
    } as unknown as Repository<CompanyUserService>;
    const schedules = {
      findOneBy: jest.fn().mockResolvedValue({
        startTime: '08:00',
        endTime: '18:00',
        lunchStartTime: '12:00',
        lunchEndTime: '13:00',
      }),
    } as unknown as Repository<ProfessionalWorkSchedule>;
    const holidays = {
      existsBy: jest.fn().mockResolvedValue(false),
    } as unknown as Repository<CompanyHoliday>;
    const timeOffs = {
      find: jest.fn().mockResolvedValue([
        {
          startAt: new Date('2099-08-10T16:00:00Z'),
          endAt: new Date('2099-08-10T17:00:00Z'),
        },
      ]),
    } as unknown as Repository<ProfessionalTimeOff>;
    const appointments = {
      find: jest.fn().mockResolvedValue([
        {
          startAt: new Date('2099-08-10T13:00:00Z'),
          endAt: new Date('2099-08-10T14:00:00Z'),
        },
      ]),
    } as unknown as Repository<Appointment>;
    const availability = new AvailabilityService(
      companies,
      settings,
      professionals,
      professionalServices,
      schedules,
      holidays,
      timeOffs,
      appointments,
    );

    const result = await availability.getAvailability(
      'company-id',
      '2099-08-10',
      'professional-id',
      ['service-id'],
    );

    expect(
      result.availableSlots.map((slot) => slot.localStart.slice(11)),
    ).toEqual(['08:00', '09:00', '11:00', '14:00', '15:00', '16:00', '17:00']);
  });
});
