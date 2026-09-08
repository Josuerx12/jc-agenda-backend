import { ApiProperty } from '@nestjs/swagger';
import { MediaReferenceDto } from 'src/modules/media/dto/media-reference.dto';
import { DEFAULT_COMPANY_BRAND_COLORS } from 'src/infra/config/company-branding.constants';

export class CompanyBrandingResponseDto {
  @ApiProperty()
  companyId: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  trandingName: string;

  @ApiProperty({ type: MediaReferenceDto, nullable: true })
  logo: MediaReferenceDto | null;

  @ApiProperty({ example: DEFAULT_COMPANY_BRAND_COLORS.primaryColor })
  primaryColor: string;

  @ApiProperty({ example: DEFAULT_COMPANY_BRAND_COLORS.secondaryColor })
  secondaryColor: string;

  @ApiProperty({ example: DEFAULT_COMPANY_BRAND_COLORS.accentColor })
  accentColor: string;

  @ApiProperty({ example: DEFAULT_COMPANY_BRAND_COLORS.darkColor })
  darkColor: string;

  @ApiProperty({ example: DEFAULT_COMPANY_BRAND_COLORS.positiveColor })
  positiveColor: string;

  @ApiProperty({ example: DEFAULT_COMPANY_BRAND_COLORS.negativeColor })
  negativeColor: string;

  @ApiProperty({ example: DEFAULT_COMPANY_BRAND_COLORS.infoColor })
  infoColor: string;

  @ApiProperty({ example: DEFAULT_COMPANY_BRAND_COLORS.warningColor })
  warningColor: string;

  @ApiProperty({ example: '#F8FAFC' })
  backgroundColor: string;

  @ApiProperty({ example: '#FFFFFF' })
  surfaceColor: string;

  @ApiProperty({ example: DEFAULT_COMPANY_BRAND_COLORS.darkColor })
  textColor: string;

  @ApiProperty({ enum: ['INTER', 'ROBOTO', 'POPPINS', 'MONTSERRAT'] })
  fontFamily: string;

  @ApiProperty({ enum: ['NONE', 'SMALL', 'MEDIUM', 'LARGE'] })
  borderRadius: string;

  @ApiProperty({ nullable: true })
  welcomeMessage: string | null;

  @ApiProperty()
  showCompanyName: boolean;
}
