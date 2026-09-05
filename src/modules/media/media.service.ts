import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, type ReadStream } from 'node:fs';
import { chmod, mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { MediaFile } from 'src/infra/entities/media-file.entity';
import { Repository } from 'typeorm';
import { StoredMediaDto } from './dto/media-reference.dto';
import {
  companyMediaQuotaBytes,
  maxImageSizeBytes,
} from './image-upload.decorator';
import { buildMediaReference } from './media-reference';
import type { SupportedImageType, UploadedImageFile } from './media.types';

export interface OpenedMedia {
  metadata: MediaFile;
  stream: ReadStream;
}

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly storageRoot: string;

  constructor(
    @InjectRepository(MediaFile)
    private readonly mediaRepository: Repository<MediaFile>,
  ) {
    const configuredPath = process.env.MEDIA_STORAGE_PATH?.trim();
    if (
      process.env.MODE?.toUpperCase() !== 'DEV' &&
      (!configuredPath || !isAbsolute(configuredPath))
    ) {
      throw new Error(
        'MEDIA_STORAGE_PATH deve ser um caminho absoluto em produção',
      );
    }

    this.storageRoot = resolve(
      configuredPath || join(process.cwd(), 'storage', 'media'),
    );
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.storageRoot, { recursive: true, mode: 0o700 });
    await chmod(this.storageRoot, 0o700);
  }

  async storeImage(
    file: UploadedImageFile | undefined,
    companyId: string,
    createdByUserId: string,
    replacingMediaId?: string | null,
  ): Promise<StoredMediaDto> {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'A imagem deve ser informada no campo file',
      );
    }
    if (
      file.size > maxImageSizeBytes() ||
      file.buffer.length > maxImageSizeBytes()
    ) {
      throw new BadRequestException(
        'A imagem excede o tamanho máximo permitido',
      );
    }

    const detectedType = this.detectImageType(file.buffer);
    if (!detectedType || !this.mimeTypesMatch(file.mimetype, detectedType)) {
      throw new BadRequestException(
        'O arquivo deve ser uma imagem JPEG, PNG ou WebP válida',
      );
    }

    const bytesInUse = await this.mediaRepository.sum('sizeBytes', {
      companyId,
    });
    const replacedMedia = replacingMediaId
      ? await this.mediaRepository.findOneBy({
          id: replacingMediaId,
          companyId,
        })
      : null;
    const bytesAfterReplacement =
      (bytesInUse ?? 0) - (replacedMedia?.sizeBytes ?? 0) + file.buffer.length;
    if (bytesAfterReplacement > companyMediaQuotaBytes()) {
      throw new PayloadTooLargeException(
        'A empresa atingiu o limite de armazenamento de imagens',
      );
    }

    const id = randomUUID();
    const storageKey = join(id.slice(0, 2), `${id}.${detectedType.extension}`);
    const absolutePath = this.resolveStoragePath(storageKey);
    const metadata = this.mediaRepository.create({
      id,
      companyId,
      storageKey,
      originalName: this.safeOriginalName(file.originalname),
      mimeType: detectedType.mimeType,
      sizeBytes: file.buffer.length,
      checksumSha256: createHash('sha256').update(file.buffer).digest('hex'),
      createdByUserId,
    });

    const storageDirectory = dirname(absolutePath);
    await mkdir(storageDirectory, { recursive: true, mode: 0o700 });
    await chmod(storageDirectory, 0o700);
    await writeFile(absolutePath, file.buffer, { flag: 'wx', mode: 0o600 });

    try {
      const stored = await this.mediaRepository.save(metadata);
      return this.toStoredMedia(stored);
    } catch (error) {
      await unlink(absolutePath).catch(() => undefined);
      throw error;
    }
  }

  async open(mediaId: string): Promise<OpenedMedia> {
    const metadata = await this.mediaRepository.findOneBy({ id: mediaId });
    if (!metadata) throw new NotFoundException('Imagem não encontrada');

    const absolutePath = this.resolveStoragePath(metadata.storageKey);
    try {
      const fileStats = await stat(absolutePath);
      if (!fileStats.isFile()) throw new Error('Not a regular file');
    } catch {
      throw new NotFoundException('Imagem não encontrada');
    }

    return {
      metadata,
      stream: createReadStream(absolutePath),
    };
  }

  async remove(mediaId: string | null | undefined): Promise<void> {
    if (!mediaId) return;

    const metadata = await this.mediaRepository.findOneBy({ id: mediaId });
    if (!metadata) return;

    await this.mediaRepository.delete({ id: mediaId });
    const absolutePath = this.resolveStoragePath(metadata.storageKey);
    await unlink(absolutePath).catch(() => undefined);
  }

  private toStoredMedia(media: MediaFile): StoredMediaDto {
    return {
      ...buildMediaReference(media.id)!,
      originalName: media.originalName,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
    };
  }

  private resolveStoragePath(storageKey: string): string {
    const absolutePath = resolve(this.storageRoot, storageKey);
    const pathFromRoot = relative(this.storageRoot, absolutePath);

    if (
      !pathFromRoot ||
      pathFromRoot.startsWith(`..${sep}`) ||
      pathFromRoot === '..' ||
      isAbsolute(pathFromRoot)
    ) {
      throw new NotFoundException('Imagem não encontrada');
    }

    return absolutePath;
  }

  private safeOriginalName(originalName: string): string {
    const sanitized = originalName
      .normalize('NFKC')
      .replace(/[\p{Cc}/\\]/gu, '_')
      .slice(0, 255);
    return sanitized || 'imagem';
  }

  private mimeTypesMatch(
    informedMimeType: string,
    detectedType: SupportedImageType,
  ): boolean {
    const normalized = informedMimeType.toLowerCase();
    return (
      normalized === detectedType.mimeType ||
      (normalized === 'image/jpg' && detectedType.mimeType === 'image/jpeg')
    );
  }

  private detectImageType(buffer: Buffer): SupportedImageType | null {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return { extension: 'jpg', mimeType: 'image/jpeg' };
    }

    const pngSignature = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(pngSignature)) {
      return { extension: 'png', mimeType: 'image/png' };
    }

    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return { extension: 'webp', mimeType: 'image/webp' };
    }

    return null;
  }
}
