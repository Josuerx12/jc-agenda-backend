import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MediaFile } from 'src/infra/entities/media-file.entity';
import { Repository } from 'typeorm';
import { MediaService } from './media.service';

describe('MediaService', () => {
  const originalMode = process.env.MODE;
  const originalStoragePath = process.env.MEDIA_STORAGE_PATH;
  const originalCompanyQuota = process.env.MEDIA_COMPANY_QUOTA_BYTES;
  let storagePath: string;
  let storedMetadata: MediaFile | null;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    delete: jest.Mock;
    sum: jest.Mock;
  };
  let service: MediaService;

  beforeEach(async () => {
    storagePath = await mkdtemp(join(tmpdir(), 'jcagenda-media-'));
    process.env.MODE = 'DEV';
    process.env.MEDIA_STORAGE_PATH = storagePath;
    delete process.env.MEDIA_COMPANY_QUOTA_BYTES;
    storedMetadata = null;
    repository = {
      create: jest.fn((metadata: MediaFile) => metadata),
      save: jest.fn((metadata: MediaFile) => {
        storedMetadata = metadata;
        return Promise.resolve(metadata);
      }),
      findOneBy: jest.fn(() => Promise.resolve(storedMetadata)),
      sum: jest.fn(() => Promise.resolve(0)),
      delete: jest.fn(() => {
        storedMetadata = null;
        return Promise.resolve({ affected: 1 });
      }),
    };
    service = new MediaService(repository as unknown as Repository<MediaFile>);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await rm(storagePath, { recursive: true, force: true });
  });

  afterAll(() => {
    if (originalMode === undefined) delete process.env.MODE;
    else process.env.MODE = originalMode;
    if (originalStoragePath === undefined)
      delete process.env.MEDIA_STORAGE_PATH;
    else process.env.MEDIA_STORAGE_PATH = originalStoragePath;
    if (originalCompanyQuota === undefined)
      delete process.env.MEDIA_COMPANY_QUOTA_BYTES;
    else process.env.MEDIA_COMPANY_QUOTA_BYTES = originalCompanyQuota;
  });

  it('armazena e abre uma imagem por UUID sem expor o caminho físico', async () => {
    const bytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);

    const result = await service.storeImage(
      {
        buffer: bytes,
        mimetype: 'image/png',
        originalname: '../logo.png',
        size: bytes.length,
      },
      'company-id',
      'user-id',
    );

    expect(result.url).toBe(`/media/${result.id}`);
    expect(result.downloadUrl).toBe(`/media/${result.id}?download=true`);
    expect(result.url).not.toContain(storagePath);
    expect(storedMetadata?.originalName).toBe('.._logo.png');

    const opened = await service.open(result.id);
    const chunks: Buffer[] = [];
    for await (const chunk of opened.stream) {
      const typedChunk = chunk as string | Buffer;
      chunks.push(
        typeof typedChunk === 'string' ? Buffer.from(typedChunk) : typedChunk,
      );
    }
    expect(Buffer.concat(chunks)).toEqual(bytes);
  });

  it('rejeita arquivo cujo conteúdo não corresponde a uma imagem permitida', async () => {
    await expect(
      service.storeImage(
        {
          buffer: Buffer.from('<script>alert(1)</script>'),
          mimetype: 'image/png',
          originalname: 'ataque.png',
          size: 25,
        },
        'company-id',
        'user-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('impede que uma empresa ultrapasse sua cota de armazenamento', async () => {
    process.env.MEDIA_COMPANY_QUOTA_BYTES = '10';
    repository.sum.mockResolvedValue(8);
    const bytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);

    await expect(
      service.storeImage(
        {
          buffer: bytes,
          mimetype: 'image/png',
          originalname: 'logo.png',
          size: bytes.length,
        },
        'company-id',
        'user-id',
      ),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });

  it('bloqueia uma storage key que tente sair do diretório privado', async () => {
    storedMetadata = {
      id: 'media-id',
      storageKey: '../../etc/passwd',
    } as MediaFile;

    await expect(service.open('media-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
