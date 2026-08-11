import { validate } from 'class-validator';
import { UpdateCompanyDto } from './update-company.dto';

describe('UpdateCompanyDto', () => {
  it('aceita somente dados básicos editáveis', async () => {
    const dto = Object.assign(new UpdateCompanyDto(), {
      trandingName: 'Novo nome',
      corporateName: 'Nova razão social',
      email: 'novo@empresa.com',
      phone: '11999999999',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each(['cnpj', 'slug'])(
    'rejeita alteração do campo sensível %s',
    async (field) => {
      const dto = Object.assign(new UpdateCompanyDto(), {
        [field]: 'novo-valor',
      });
      const errors = await validate(dto);
      expect(errors.some((error) => error.property === field)).toBe(true);
    },
  );
});
