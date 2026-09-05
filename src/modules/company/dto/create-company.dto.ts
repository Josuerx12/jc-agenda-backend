import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Validate,
  ValidateNested,
} from 'class-validator';
import {
  CnpjValidatorConstraint,
  normalizeCnpj,
} from 'src/infra/validators/cnpj.validator';
import { CreateAddressDto } from 'src/modules/addresses/dto/create-address.dto';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'CNPJ numérico ou alfanumérico da empresa',
    example: '12.ABC.345/01DE-35',
  })
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? normalizeCnpj(value) : value,
    { toClassOnly: true },
  )
  @Validate(CnpjValidatorConstraint, {
    message: 'O CNPJ deve ser válido',
  })
  @IsNotEmpty({
    message: 'O CNPJ deve ser informado',
  })
  cnpj: string;

  @ApiProperty({ description: 'Nome fantasia', example: 'Empresa Exemplo' })
  @IsString({
    message: 'O nome fantasia deve ser válido',
  })
  @IsNotEmpty({
    message: 'O nome fantasia deve ser informado',
  })
  @Length(1, 100, {
    message: 'O nome fantasia deve ter no máximo 100 caracteres',
  })
  trandingName: string;

  @ApiProperty({ description: 'Razão social', example: 'Empresa Exemplo LTDA' })
  @IsString({
    message: 'A razão social deve ser válida',
  })
  @IsNotEmpty({
    message: 'A razão social deve ser informada',
  })
  @Length(1, 100, {
    message: 'A razão social deve ter no máximo 100 caracteres',
  })
  corporateName: string;

  @ApiProperty({
    description: 'Slug da empresa',
    example: 'empresa-exemplo',
  })
  @IsString({
    message: 'O slug deve ser válido',
  })
  @IsNotEmpty({
    message: 'O slug deve ser informado',
  })
  @Length(1, 14, {
    message: 'O slug deve ter no máximo 14 caracteres',
  })
  slug: string;

  @ApiProperty({
    description: 'E-mail da empresa',
    example: 'contato@empresa.com',
  })
  @IsEmail(
    {},
    {
      message: 'O e-mail deve ser válido',
    },
  )
  @IsNotEmpty({
    message: 'O e-mail deve ser informado',
  })
  email: string;

  @ApiProperty({ description: 'Telefone da empresa', example: '11999999999' })
  @IsPhoneNumber('BR', {
    message: 'O telefone deve ser válido',
  })
  @IsNotEmpty({
    message: 'O telefone deve ser informado',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Telefone adicional da empresa',
    example: '11988888888',
  })
  @IsPhoneNumber('BR', {
    message: 'O telefone deve ser válido',
  })
  @IsOptional()
  additionalPhone?: string;

  @ApiPropertyOptional({
    description: 'Endereço da empresa',
  })
  @IsOptional()
  @ValidateNested({
    message: 'O endereço deve ser válido',
  })
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}
