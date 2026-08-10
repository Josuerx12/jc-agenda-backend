import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateHolidayDto {
  @ApiProperty({ example: '2026-12-25' })
  @IsDateString()
  date: string;
  @ApiProperty({ example: 'Natal' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
