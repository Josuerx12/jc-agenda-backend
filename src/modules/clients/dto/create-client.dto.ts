import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'Maria Silva',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    description: 'Telefone usado para identificar o cliente na empresa',
    example: '(11) 99999-9999',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
