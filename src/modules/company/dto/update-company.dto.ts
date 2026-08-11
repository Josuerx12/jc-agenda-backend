import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';

export class UpdateCompanyDto {
  @IsEmpty({ message: 'O CNPJ não pode ser alterado' })
  cnpj?: unknown;

  @IsEmpty({ message: 'O slug não pode ser alterado' })
  slug?: unknown;

  @ApiPropertyOptional({
    description: 'Nome fantasia',
    example: 'Empresa Exemplo',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  trandingName?: string;

  @ApiPropertyOptional({
    description: 'Razão social',
    example: 'Empresa Exemplo LTDA',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  corporateName?: string;

  @ApiPropertyOptional({ example: 'contato@empresa.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsPhoneNumber('BR')
  phone?: string;

  @ApiPropertyOptional({ example: '11988888888' })
  @IsOptional()
  @IsPhoneNumber('BR')
  additionalPhone?: string;
}
