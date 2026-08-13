import {
  BadRequestException,
  ForbiddenException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import type { Request } from 'express';

export const COMPANY_ID_HEADER = 'x-company-id';

export const CompanyId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();
    const companyId = request.header(COMPANY_ID_HEADER);

    if (!companyId) {
      throw new BadRequestException(
        `O header ${COMPANY_ID_HEADER} deve ser informado`,
      );
    }

    if (!isUUID(companyId)) {
      throw new BadRequestException(
        `O header ${COMPANY_ID_HEADER} deve ser um UUID válido`,
      );
    }

    const authenticatedCompanyId = request['companyId'];
    if (authenticatedCompanyId && authenticatedCompanyId !== companyId) {
      throw new ForbiddenException(
        'A empresa informada não pertence à sessão autenticada',
      );
    }

    return companyId;
  },
);

export const ApiCompanyIdHeader = () =>
  ApiHeader({
    name: COMPANY_ID_HEADER,
    required: true,
    description: 'Identificador da empresa',
    schema: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
  });
