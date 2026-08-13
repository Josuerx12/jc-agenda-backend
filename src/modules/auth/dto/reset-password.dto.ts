import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recebido por e-mail' })
  @IsString()
  @IsNotEmpty({ message: 'O token deve ser informado' })
  token: string;

  @ApiProperty({ minLength: 8, example: 'NovaSenha@123' })
  @IsString()
  @Length(8, 72, { message: 'A senha deve ter entre 8 e 72 caracteres' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres' })
  password: string;
}
