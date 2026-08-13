import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CompanyUser } from 'src/infra/entities/company-user.entity';
import { AuthGuard } from './auth.guard';
import { Request } from 'express';

describe('AuthGuard', () => {
  const request = {
    headers: { authorization: 'Bearer valid-token' },
  } as unknown as Request;
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  } as unknown as Reflector;
  const jwt = {
    verifyAsync: jest.fn().mockResolvedValue({
      userId: 'user-id',
      companyId: 'company-id',
      authVersion: 2,
    }),
  } as unknown as JwtService;

  it('aceita somente uma sessão vinculada a usuário ativo na empresa', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'membership-id',
        user: { id: 'user-id', authVersion: 2 },
      }),
    } as unknown as Repository<CompanyUser>;
    const guard = new AuthGuard(jwt, reflector, repository);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.userId).toBe('user-id');
    expect(request.companyId).toBe('company-id');
  });

  it('rejeita JWT emitido antes de uma troca de senha', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'membership-id',
        user: { id: 'user-id', authVersion: 3 },
      }),
    } as unknown as Repository<CompanyUser>;
    const guard = new AuthGuard(jwt, reflector, repository);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejeita sessão sem vínculo ativo com a empresa', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as Repository<CompanyUser>;
    const guard = new AuthGuard(jwt, reflector, repository);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
