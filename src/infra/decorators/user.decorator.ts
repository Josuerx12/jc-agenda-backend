import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export const UserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.userId;

    if (!userId) {
      throw new UnauthorizedException(
        'Não foi possível identificar o usuário autenticado',
      );
    }

    return userId;
  },
);
