import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { CompanyUser } from 'src/infra/entities/company-user.entity';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/infra/entities/user.entity';
import { Company } from 'src/infra/entities/company.entity';
import { SignInDto, SignInResponseDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { MeResponseDto } from './dto/me-response.dto';
import { CompanySetting } from 'src/infra/entities/company-setting.entity';
import { createHash, randomBytes } from 'node:crypto';
import { PasswordResetToken } from 'src/infra/entities/password-reset-token.entity';
import { EmailService } from '../email/email.service';
import { EmailTemplate } from 'src/infra/entities/email-outbox.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepository: Repository<CompanyUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(data: RegisterDto): Promise<CompanyUser> {
    this.ensureBcryptLength(data.user.password);
    return await this.dataSource.transaction(async (manager) => {
      const userRepo: Repository<User> = manager.getRepository('User');
      const companyRepo: Repository<Company> = manager.getRepository('Company');
      const companyUserRepo: Repository<CompanyUser> =
        manager.getRepository('CompanyUser');
      const companySettingRepo = manager.getRepository(CompanySetting);

      let user = userRepo.create({
        ...data.user,
        email: this.normalizeEmail(data.user.email),
      });

      const userAlreadyExists = await userRepo.findOne({
        where: { email: user.email },
        select: {
          id: true,
          email: true,
        },
      });

      if (userAlreadyExists) {
        throw new ConflictException(
          'O usuário com este e-mail já está cadastrado',
        );
      }

      const hashedPassword = await hash(user.password, 10);

      user = await userRepo.save({
        ...user,
        password: hashedPassword,
      });

      let company = companyRepo.create(data.company);

      const alreadyExists = await companyRepo.findOne({
        where: [{ cnpj: company.cnpj }, { slug: company.slug }],
        select: {
          id: true,
          cnpj: true,
          slug: true,
        },
      });

      if (alreadyExists) {
        throw new ConflictException('A empresa já está cadastrada');
      }

      company = await companyRepo.save(company);

      await companySettingRepo.save({
        companyId: company.id,
        timezone: 'America/Sao_Paulo',
        slotIntervalMinutes: 60,
      });

      const companyUser = companyUserRepo.create({
        userId: user.id,
        companyId: company.id,
        isOwner: true,
        isAdmin: true,
        isProfessional: false,
      });

      await companyUserRepo.save(companyUser);

      await this.emailService.enqueue(
        {
          to: user.email,
          subject: `Bem-vindo à JC Agenda, ${user.firstName}!`,
          template: EmailTemplate.COMPANY_WELCOME,
          context: {
            firstName: user.firstName,
            companyName: company.trandingName,
            platformUrl: this.emailService.platformUrl(company.slug),
          },
        },
        manager,
      );

      return companyUser;
    });
  }

  async singIn(data: SignInDto, companyId: string): Promise<SignInResponseDto> {
    if (Buffer.byteLength(data.password, 'utf8') > 72) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const companyUser = await this.companyUserRepository.findOne({
      where: {
        companyId,
        user: {
          email: this.normalizeEmail(data.email),
        },
      },
      select: {
        id: true,
        companyId: true,
        userId: true,
        user: {
          id: true,
          email: true,
          password: true,
          authVersion: true,
          isActive: true,
          isBlocked: true,
        },
        company: {
          id: true,
        },
      },
      relations: {
        user: true,
        company: true,
      },
    });

    const user = companyUser?.user;

    if (!user || !user.isActive || user.isBlocked) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValidPassword = await compare(data.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = this.jwtService.sign({
      userId: user.id,
      companyId: companyUser.companyId,
      authVersion: user.authVersion,
    });

    return {
      accessToken: token,
    };
  }

  async me(id: string): Promise<MeResponseDto> {
    const companyUser = await this.companyUserRepository.findOne({
      where: {
        userId: id,
      },
      select: {
        id: true,
        companyId: true,
        isAdmin: true,
        isOwner: true,
        isProfessional: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          isMaster: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      relations: {
        user: true,
      },
    });

    const user = companyUser?.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      isMaster: user.isMaster,
      isBlocked: user.isBlocked,
      isOwner: companyUser.isOwner,
      isProfessional: companyUser.isProfessional,
    };
  }

  async forgotPassword(companyId: string, email: string): Promise<void> {
    const startedAt = Date.now();
    const companyUser = await this.companyUserRepository.findOne({
      where: {
        companyId,
        user: { email: this.normalizeEmail(email) },
      },
      relations: { user: true, company: true },
    });
    const user = companyUser?.user;

    // A resposta é sempre a mesma para não revelar quais e-mails estão cadastrados
    // ou vinculados à empresa informada.
    if (!user) {
      await this.ensureMinimumDuration(startedAt);
      return;
    }

    const cooldownSeconds = Number(
      process.env.PASSWORD_RESET_COOLDOWN_SECONDS ?? 60,
    );
    const recentlyRequested = await this.dataSource
      .getRepository(PasswordResetToken)
      .exists({
        where: {
          userId: user.id,
          createdAt: MoreThan(new Date(Date.now() - cooldownSeconds * 1000)),
        },
      });
    if (recentlyRequested) {
      await this.ensureMinimumDuration(startedAt);
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresInMinutes = Number(
      process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? 30,
    );
    const platformUrl = this.emailService.platformUrl(companyUser.company.slug);
    const resetPattern =
      process.env.PASSWORD_RESET_URL_PATTERN ??
      `${platformUrl}/reset-password?token={token}`;
    const resetUrl = resetPattern
      .replace('{slug}', companyUser.company.slug)
      .replace('{token}', encodeURIComponent(rawToken));

    await this.dataSource.transaction(async (manager) => {
      const tokenRepository = manager.getRepository(PasswordResetToken);
      await tokenRepository.update(
        { userId: user.id, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      await tokenRepository.save({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + expiresInMinutes * 60_000),
      });
      await this.emailService.enqueue(
        {
          to: user.email,
          subject: 'Redefina sua senha da JC Agenda',
          template: EmailTemplate.PASSWORD_RESET,
          context: {
            firstName: user.firstName,
            resetUrl,
            expiresIn: `${expiresInMinutes} minutos`,
          },
        },
        manager,
      );
    });
    await this.ensureMinimumDuration(startedAt);
  }

  async resetPassword(rawToken: string, password: string): Promise<void> {
    this.ensureBcryptLength(password);
    const tokenHash = this.hashToken(rawToken);
    await this.dataSource.transaction(async (manager) => {
      const tokenRepository = manager.getRepository(PasswordResetToken);
      const token = await tokenRepository.findOne({
        where: {
          tokenHash,
          usedAt: IsNull(),
          expiresAt: MoreThan(new Date()),
        },
      });
      if (!token) {
        throw new BadRequestException('Token inválido ou expirado');
      }

      const consumed = await tokenRepository.update(
        { id: token.id, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      if (!consumed.affected) {
        throw new BadRequestException('Token inválido ou expirado');
      }
      const userRepository = manager.getRepository(User);
      const user = await userRepository.findOneByOrFail({ id: token.userId });
      await userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          password: await hash(password, 10),
          authVersion: () => 'auth_version + 1',
        })
        .where('id = :id', { id: token.userId })
        .execute();
      await this.emailService.enqueue(
        {
          to: user.email,
          subject: 'Sua senha da JC Agenda foi alterada',
          template: EmailTemplate.PASSWORD_CHANGED,
          context: { firstName: user.firstName },
        },
        manager,
      );
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private ensureBcryptLength(password: string): void {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException('A senha deve ter no máximo 72 bytes');
    }
  }

  private async ensureMinimumDuration(startedAt: number): Promise<void> {
    const remaining = 300 - (Date.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }
}
