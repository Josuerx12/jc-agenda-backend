import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from 'src/modules/addresses/dto/create-address.dto';

export class CreateCompanyDto {
  @ApiProperty({ description: 'CNPJ da empresa', example: '12345678000195' })
  @IsString({
    message: 'O CNPJ deve ser válido',
  })
  @IsNotEmpty({
    message: 'O CNPJ deve ser informado',
  })
  @Length(14, 14, {
    message: 'O CNPJ deve ter 14 caracteres',
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
  @IsNotEmpty({
    message: 'O telefone adicional deve ser informado',
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
