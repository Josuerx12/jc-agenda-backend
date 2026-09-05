import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCompanyDto } from './create-company.dto';

describe('CreateCompanyDto', () => {
  it('normaliza e valida um CNPJ alfanumérico com máscara', async () => {
    const dto = plainToInstance(CreateCompanyDto, {
      cnpj: '12.abc.345/01de-35',
    });

    const errors = await validate(dto, { skipMissingProperties: true });

    expect(dto.cnpj).toBe('12ABC34501DE35');
    expect(errors).toHaveLength(0);
  });

  it('rejeita um CNPJ com dígitos verificadores inválidos', async () => {
    const dto = plainToInstance(CreateCompanyDto, {
      cnpj: '12.ABC.345/01DE-34',
    });

    const errors = await validate(dto, { skipMissingProperties: true });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'cnpj',
          constraints: expect.objectContaining({
            isCnpj: 'O CNPJ deve ser válido',
          }),
        }),
      ]),
    );
  });
});
