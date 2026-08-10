import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateServiceDto {
  companyId: string;

  @ApiProperty({ description: 'Nome do serviço' })
  @IsNotEmpty({ message: 'O nome do serviço é obrigatório' })
  @IsString({ message: 'O nome do serviço deve ser um texto' })
  name: string;

  @ApiProperty({ description: 'Preço do serviço' })
  @IsNotEmpty({ message: 'O preço do serviço é obrigatório' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    {
      message:
        'O preço do serviço deve ser um valor numérico com até 2 casas decimais',
    },
  )
  price: number;

  @ApiProperty({ description: 'Descrição do serviço' })
  @IsNotEmpty({ message: 'A descrição do serviço é obrigatória' })
  @IsString({ message: 'A descrição do serviço deve ser um texto' })
  description: string;

  @ApiProperty({ description: 'Duração do serviço em minutos' })
  @IsNotEmpty({ message: 'A duração do serviço é obrigatória' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    {
      message:
        'A duração do serviço deve ser um valor numérico inteiro em minutos',
    },
  )
  durationInMinutes: number;
}
