import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CompanyUser } from '../../infra/entities/company-user.entity';
import { CompanyHoliday } from '../../infra/entities/company-holiday.entity';
import { ProfessionalTimeOff } from '../../infra/entities/professional-time-off.entity';
import { ProfessionalWorkSchedule } from '../../infra/entities/professional-work-schedule.entity';
import { SchedulesService } from './schedules.service';

describe('SchedulesService validation', () => {
  const companyUsers = {
    findOneBy: jest.fn(),
  } as unknown as Repository<CompanyUser>;
  const service = new SchedulesService(
    companyUsers,
    {} as Repository<ProfessionalWorkSchedule>,
    {} as Repository<CompanyHoliday>,
    {} as Repository<ProfessionalTimeOff>,
  );

  beforeEach(() => jest.clearAllMocks());

  function allowSelf() {
    jest
      .spyOn(companyUsers, 'findOneBy')
      .mockResolvedValueOnce({
        id: 'professional-id',
        isProfessional: true,
      } as CompanyUser)
      .mockResolvedValueOnce({
        id: 'professional-id',
        isProfessional: true,
      } as CompanyUser);
  }

  it('rejeita jornada cujo início não seja anterior ao fim', async () => {
    allowSelf();
    await expect(
      service.replaceWorkSchedule('company-id', 'user-id', 'professional-id', {
        days: [{ dayOfWeek: 1, startTime: '18:00', endTime: '08:00' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita almoço fora da jornada', async () => {
    allowSelf();
    await expect(
      service.replaceWorkSchedule('company-id', 'user-id', 'professional-id', {
        days: [
          {
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '18:00',
            lunchStartTime: '07:00',
            lunchEndTime: '08:00',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('impede outro profissional sem papel administrativo', async () => {
    jest
      .spyOn(companyUsers, 'findOneBy')
      .mockResolvedValueOnce({
        id: 'requester-id',
        isAdmin: false,
        isOwner: false,
      } as CompanyUser)
      .mockResolvedValueOnce({
        id: 'professional-id',
        isProfessional: true,
      } as CompanyUser);
    await expect(
      service.replaceWorkSchedule('company-id', 'user-id', 'professional-id', {
        days: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
