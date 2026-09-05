import { ApiProperty } from '@nestjs/swagger';

export class MediaReferenceDto {
  @ApiProperty({ example: 'a428e4d7-2194-4533-95c2-9c7ebea5bce3' })
  id: string;

  @ApiProperty({ example: '/media/a428e4d7-2194-4533-95c2-9c7ebea5bce3' })
  url: string;

  @ApiProperty({
    example: '/media/a428e4d7-2194-4533-95c2-9c7ebea5bce3?download=true',
  })
  downloadUrl: string;
}

export class StoredMediaDto extends MediaReferenceDto {
  @ApiProperty({ example: 'produto.webp' })
  originalName: string;

  @ApiProperty({ example: 'image/webp' })
  mimeType: string;

  @ApiProperty({ example: 245760 })
  sizeBytes: number;
}
