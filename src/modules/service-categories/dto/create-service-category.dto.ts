import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateServiceCategoryDto {
  companyId: string;
  @ApiProperty({ example: 'Cabelo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
  @ApiPropertyOptional({ example: 'Serviços capilares' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;
}
