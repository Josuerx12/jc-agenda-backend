import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  companyId: string;

  @ApiProperty({ description: 'Nome do produto' })
  @IsNotEmpty({ message: 'O nome do produto é obrigatório' })
  @IsString({ message: 'O nome do produto deve ser um texto' })
  name: string;

  @ApiProperty({ description: 'Preço do produto' })
  @IsNotEmpty({ message: 'O preço do produto é obrigatório' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    {
      message:
        'O preço do produto deve ser um valor numérico com até 2 casas decimais',
    },
  )
  price: number;

  @ApiProperty({ description: 'Descrição do produto' })
  @IsNotEmpty({ message: 'A descrição do produto é obrigatória' })
  @IsString({ message: 'A descrição do produto deve ser um texto' })
  description: string;
}
