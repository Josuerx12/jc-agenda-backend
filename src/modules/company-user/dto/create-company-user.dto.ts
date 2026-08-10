import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';

export class CreateCompanyUserDto {
  companyId: string;

  @ApiProperty({ description: 'Nome do usuário', example: 'João' })
  @IsString({
    message: 'O nome deve ser válido',
  })
  @IsNotEmpty({
    message: 'O nome deve ser informado',
  })
  @Length(1, 50, {
    message: 'O nome deve ter no máximo 50 caracteres',
  })
  firstName: string;

  @ApiProperty({ description: 'Sobrenome do usuário', example: 'Silva' })
  @IsString({
    message: 'O sobrenome deve ser válido',
  })
  @IsNotEmpty({
    message: 'O sobrenome deve ser informado',
  })
  @Length(1, 100, {
    message: 'O sobrenome deve ter no máximo 100 caracteres',
  })
  lastName: string;

  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'joao.silva@example.com',
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

  @ApiProperty({
    description: 'Telefone do usuário',
    example: '(11) 99999-9999',
  })
  @IsPhoneNumber('BR', {
    message: 'O telefone deve ser válido',
  })
  @IsNotEmpty({
    message: 'O telefone deve ser informado',
  })
  phone: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123',
  })
  @IsString({
    message: 'A senha deve ser válida',
  })
  @IsNotEmpty({
    message: 'A senha deve ser informada',
  })
  @Length(6, 255, {
    message: 'A senha deve ter no mínimo 6 caracteres',
  })
  password: string;

  @ApiProperty({
    description: 'Id dos serviços que o usuário terá acesso',
    example: ['1234-5678-9012-3456', '9876-5432-1098-7654'],
  })
  @IsNotEmpty({
    message: 'Os serviços devem ser informados',
  })
  @IsUUID('all', {
    each: true,
    message: 'Cada serviço deve ser um UUID válido',
  })
  @ValidateIf((o: CreateCompanyUserDto) => o.isProfessional === true)
  services: string[];

  @ApiProperty({
    description: 'Indica se o usuário é administrador',
    example: true,
  })
  @IsNotEmpty({
    message: 'O campo isAdmin deve ser informado',
  })
  isAdmin: boolean;

  @ApiProperty({
    description: 'Indica se o usuário é profissional',
    example: true,
  })
  @IsNotEmpty({
    message: 'O campo isProfessional deve ser informado',
  })
  isProfessional: boolean;
}
