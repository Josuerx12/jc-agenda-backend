import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateCompanySettingsDto } from './update-company-settings.dto';

describe('UpdateCompanySettingsDto', () => {
  it('aceita atualização parcial e normaliza as cores', async () => {
    const dto = plainToInstance(UpdateCompanySettingsDto, {
      primaryColor: '#a1b2c3',
      positiveColor: '#2e8b6d',
      fontFamily: 'POPPINS',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.primaryColor).toBe('#A1B2C3');
    expect(dto.positiveColor).toBe('#2E8B6D');
  });

  it.each(['red', '#FFF', '#GGGGGG', 'javascript:alert(1)'])(
    'rejeita a cor inválida %s',
    async (primaryColor) => {
      const dto = plainToInstance(UpdateCompanySettingsDto, { primaryColor });
      const errors = await validate(dto);
      expect(errors.some((error) => error.property === 'primaryColor')).toBe(
        true,
      );
    },
  );
});
