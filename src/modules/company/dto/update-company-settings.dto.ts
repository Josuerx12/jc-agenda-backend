import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { DEFAULT_COMPANY_BRAND_COLORS } from 'src/infra/config/company-branding.constants';
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

  @ApiPropertyOptional({ example: DEFAULT_COMPANY_BRAND_COLORS.primaryColor })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'primaryColor deve ser uma cor hexadecimal',
  })
  primaryColor?: string;

  @ApiPropertyOptional({ example: DEFAULT_COMPANY_BRAND_COLORS.secondaryColor })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'secondaryColor deve ser uma cor hexadecimal',
  })
  secondaryColor?: string;

  @ApiPropertyOptional({ example: DEFAULT_COMPANY_BRAND_COLORS.accentColor })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'accentColor deve ser uma cor hexadecimal',
  })
  accentColor?: string;

  @ApiPropertyOptional({ example: DEFAULT_COMPANY_BRAND_COLORS.darkColor })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'darkColor deve ser uma cor hexadecimal',
  })
  darkColor?: string;

  @ApiPropertyOptional({ example: DEFAULT_COMPANY_BRAND_COLORS.positiveColor })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'positiveColor deve ser uma cor hexadecimal',
  })
  positiveColor?: string;

  @ApiPropertyOptional({ example: DEFAULT_COMPANY_BRAND_COLORS.negativeColor })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'negativeColor deve ser uma cor hexadecimal',
  })
  negativeColor?: string;

  @ApiPropertyOptional({ example: DEFAULT_COMPANY_BRAND_COLORS.infoColor })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'infoColor deve ser uma cor hexadecimal',
  })
  infoColor?: string;

  @ApiPropertyOptional({ example: DEFAULT_COMPANY_BRAND_COLORS.warningColor })
  @IsOptional()
  @Transform(normalizeColor)
  @Matches(/^#[0-9A-F]{6}$/, {
    message: 'warningColor deve ser uma cor hexadecimal',
  })
  warningColor?: string;

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

  @ApiPropertyOptional({ example: DEFAULT_COMPANY_BRAND_COLORS.darkColor })
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
