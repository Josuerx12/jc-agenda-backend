import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({ description: 'Email do usuário', example: 'user@example.com' })
  @IsEmail({}, { message: 'O e-mail deve ser válido' })
  @IsNotEmpty({ message: 'O e-mail deve ser informado' })
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'password123' })
  @IsString({
    message: 'A senha deve ser válida',
  })
  @IsNotEmpty({
    message: 'A senha deve ser informada',
  })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres' })
  password: string;
}

export class SignInResponseDto {
  @ApiProperty({ description: 'Token JWT de autenticação' })
  accessToken: string;
}
