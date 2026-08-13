import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/infra/decorators/auth.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyUser } from 'src/infra/entities/company-user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepository: Repository<CompanyUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token não encontrado');
    }
    try {
      const payload = await this.jwtService.verifyAsync<{
        userId: string;
        companyId: string;
        authVersion: number;
      }>(token);

      const membership = await this.companyUserRepository.findOne({
        where: {
          userId: payload.userId,
          companyId: payload.companyId,
          user: { isActive: true, isBlocked: false },
        },
        select: {
          id: true,
          user: { id: true, authVersion: true },
        },
        relations: { user: true },
      });
      if (!membership || membership.user.authVersion !== payload.authVersion) {
        throw new UnauthorizedException('Sessão inválida');
      }

      request['userId'] = payload.userId;
      request['companyId'] = payload.companyId;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
