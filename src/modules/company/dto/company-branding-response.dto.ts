import { ApiProperty } from '@nestjs/swagger';
import { MediaReferenceDto } from 'src/modules/media/dto/media-reference.dto';

export class CompanyBrandingResponseDto {
  @ApiProperty()
  companyId: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  trandingName: string;

  @ApiProperty({ type: MediaReferenceDto, nullable: true })
  logo: MediaReferenceDto | null;

  @ApiProperty({ example: '#2563EB' })
  primaryColor: string;

  @ApiProperty({ example: '#0F172A' })
  secondaryColor: string;

  @ApiProperty({ example: '#F59E0B' })
  accentColor: string;

  @ApiProperty({ example: '#F8FAFC' })
  backgroundColor: string;

  @ApiProperty({ example: '#FFFFFF' })
  surfaceColor: string;

  @ApiProperty({ example: '#0F172A' })
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
