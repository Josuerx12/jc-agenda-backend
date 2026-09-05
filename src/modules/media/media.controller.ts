import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { IsPublic } from 'src/infra/decorators/auth.decorator';
import { MediaService } from './media.service';

@ApiTags('Mídias')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':id')
  @IsPublic()
  @ApiOperation({
    summary: 'Exibir ou baixar uma imagem',
    description:
      'A URL contém somente um UUID opaco. Caminhos e nomes físicos do servidor nunca são expostos.',
  })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  @ApiQuery({ name: 'download', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Conteúdo binário da imagem' })
  @ApiNotFoundResponse({ description: 'Imagem inexistente ou removida' })
  async open(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { metadata, stream } = await this.mediaService.open(id);
    const disposition = download === 'true' ? 'attachment' : 'inline';
    const fallbackFileName = metadata.originalName
      .normalize('NFKD')
      .replace(/[^A-Za-z0-9._ -]/g, '_')
      .slice(0, 150);
    const encodedFileName = encodeURIComponent(metadata.originalName).replace(
      /['()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );

    response.set({
      'Content-Type': metadata.mimeType,
      'Content-Length': String(metadata.sizeBytes),
      'Content-Disposition': `${disposition}; filename="${fallbackFileName || 'imagem'}"; filename*=UTF-8''${encodedFileName}`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: `"sha256-${metadata.checksumSha256}"`,
      'Content-Security-Policy': "default-src 'none'; sandbox",
    });

    return new StreamableFile(stream);
  }
}
