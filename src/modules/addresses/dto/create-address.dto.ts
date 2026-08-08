import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ description: 'CEP', example: '12345-678' })
  @IsString({
    message: 'O CEP deve ser válido',
  })
  @IsNotEmpty({
    message: 'O CEP deve ser informado',
  })
  zipCode: string;

  @ApiProperty({ description: 'Cidade', example: 'São Paulo' })
  @IsString({
    message: 'A cidade deve ser válida',
  })
  @IsNotEmpty({
    message: 'A cidade deve ser informada',
  })
  city: string;

  @ApiProperty({ description: 'Estado', example: 'SP' })
  @IsString({
    message: 'O estado deve ser válido',
  })
  @IsNotEmpty({
    message: 'O estado deve ser informado',
  })
  state: string;

  @ApiProperty({ description: 'Endereço/Rua', example: 'Rua Exemplo' })
  @IsString({
    message: 'O endereço deve ser válido',
  })
  @IsNotEmpty({
    message: 'O endereço deve ser informado',
  })
  address: string;

  @ApiProperty({ description: 'Número', example: '123' })
  @IsString({
    message: 'O número deve ser válido',
  })
  @IsNotEmpty({
    message: 'O número deve ser informado',
  })
  number: string;

  @ApiPropertyOptional({ description: 'Complemento', example: 'Apto 101' })
  @IsString({
    message: 'O complemento deve ser válido',
  })
  @IsOptional()
  complement?: string;

  @ApiProperty({ description: 'Bairro', example: 'Centro' })
  @IsString({
    message: 'O bairro deve ser válido',
  })
  @IsNotEmpty({
    message: 'O bairro deve ser informado',
  })
  neighborhood: string;
}
