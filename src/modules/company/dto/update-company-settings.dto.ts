import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const FONT_FAMILIES = ['INTER', 'ROBOTO', 'POPPINS', 'MONTSERRAT'] as const;
const BORDER_RADIUS_OPTIONS = ['NONE', 'SMALL', 'MEDIUM', 'LARGE'] as const;

const normalizeColor = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ enum: [15, 30, 60], example: 60 })
  @IsOptional()
  @IsInt()
  @IsIn([15, 30, 60])
  slotIntervalMinutes?: number;

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'primaryColor deve ser uma cor hexadecimal',
  })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#0F172A' })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'secondaryColor deve ser uma cor hexadecimal',
  })
  secondaryColor?: string;

  @ApiPropertyOptional({ example: '#F59E0B' })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'accentColor deve ser uma cor hexadecimal',
  })
  accentColor?: string;

  @ApiPropertyOptional({ example: '#F8FAFC' })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'backgroundColor deve ser uma cor hexadecimal',
  })
  backgroundColor?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'surfaceColor deve ser uma cor hexadecimal',
  })
  surfaceColor?: string;

  @ApiPropertyOptional({ example: '#0F172A' })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'textColor deve ser uma cor hexadecimal',
  })
  textColor?: string;

  @ApiPropertyOptional({ enum: FONT_FAMILIES, example: 'INTER' })
  @IsOptional()
  @IsIn(FONT_FAMILIES)
  fontFamily?: (typeof FONT_FAMILIES)[number];

  @ApiPropertyOptional({
    enum: BORDER_RADIUS_OPTIONS,
    example: 'MEDIUM',
  })
  @IsOptional()
  @IsIn(BORDER_RADIUS_OPTIONS)
  borderRadius?: (typeof BORDER_RADIUS_OPTIONS)[number];

  @ApiPropertyOptional({
    nullable: true,
    maxLength: 280,
    example: 'Agende seu horário com a nossa equipe.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  welcomeMessage?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showCompanyName?: boolean;
}
