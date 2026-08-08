import { type ArgumentMetadata } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { AppValidationPipe } from './app-validation.pipe';

class AddressDto {
  @IsNotEmpty({ message: 'O CEP deve ser informado' })
  zipCode: string;
}

class CompanyDto {
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

class RequestDto {
  @ValidateNested()
  @Type(() => CompanyDto)
  company: CompanyDto;
}

describe('AppValidationPipe', () => {
  it('groups nested validation messages by field path', async () => {
    const pipe = new AppValidationPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: RequestDto,
      data: undefined,
    };

    await expect(
      pipe.transform({ company: { address: { zipCode: '' } } }, metadata),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        error: 'Validation Error',
        message: 'Um ou mais campos são inválidos',
        errors: {
          'company.address.zipCode': ['O CEP deve ser informado'],
        },
      },
    });
  });
});
