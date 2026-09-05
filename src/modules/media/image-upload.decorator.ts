import { applyDecorators, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiPayloadTooLargeResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoredMediaDto } from './dto/media-reference.dto';

export const IMAGE_UPLOAD_FIELD = 'file';
export const DEFAULT_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const DEFAULT_COMPANY_MEDIA_QUOTA_BYTES = 1024 * 1024 * 1024;

export function maxImageSizeBytes(): number {
  const configured = Number(process.env.MEDIA_MAX_IMAGE_SIZE_BYTES);
  return Number.isSafeInteger(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_IMAGE_SIZE_BYTES;
}

export function companyMediaQuotaBytes(): number {
  const configured = Number(process.env.MEDIA_COMPANY_QUOTA_BYTES);
  return Number.isSafeInteger(configured) && configured > 0
    ? configured
    : DEFAULT_COMPANY_MEDIA_QUOTA_BYTES;
}

export function ApiImageUpload() {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(IMAGE_UPLOAD_FIELD, {
        limits: {
          fileSize: maxImageSizeBytes(),
          files: 1,
          fields: 0,
        },
      }),
    ),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: [IMAGE_UPLOAD_FIELD],
        properties: {
          [IMAGE_UPLOAD_FIELD]: {
            type: 'string',
            format: 'binary',
            description: 'Imagem JPEG, PNG ou WebP',
          },
        },
      },
    }),
    ApiOkResponse({ description: 'Imagem armazenada', type: StoredMediaDto }),
    ApiBadRequestResponse({
      description: 'Arquivo ausente ou imagem inválida',
    }),
    ApiPayloadTooLargeResponse({
      description: 'Imagem acima do limite permitido',
    }),
  );
}
