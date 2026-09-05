import { ApiProperty } from '@nestjs/swagger';
import { MediaReferenceDto } from 'src/modules/media/dto/media-reference.dto';

export class MeResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: '+1-555-555-5555' })
  phone: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isMaster: boolean;

  @ApiProperty({ example: false })
  isBlocked: boolean;

  @ApiProperty({ example: true })
  isOwner: boolean;

  @ApiProperty({ example: true })
  isProfessional: boolean;

  @ApiProperty({ type: MediaReferenceDto, nullable: true })
  avatar: MediaReferenceDto | null;
}
