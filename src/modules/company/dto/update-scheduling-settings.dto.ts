import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString } from 'class-validator';

export class UpdateSchedulingSettingsDto {
  @ApiProperty({ example: 'America/Sao_Paulo' })
  @IsString()
  timezone: string;

  @ApiProperty({ enum: [15, 30, 60], example: 60 })
  @IsInt()
  @IsIn([15, 30, 60])
  slotIntervalMinutes: number;
}
