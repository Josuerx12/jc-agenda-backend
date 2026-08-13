import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
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
  @Length(8, 72, {
    message: 'A senha deve ter entre 8 e 72 caracteres',
  })
  @MaxLength(72, {
    message: 'A senha deve ter no máximo 72 caracteres',
  })
  password: string;
}
