import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { CompanyUser } from 'src/infra/entities/company-user.entity';
import { DataSource, Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/infra/entities/user.entity';
import { Company } from 'src/infra/entities/company.entity';
import { SignInDto, SignInResponseDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { MeResponseDto } from './dto/me-response.dto';

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
  ) {}

  async register(data: RegisterDto): Promise<CompanyUser> {
    return await this.dataSource.transaction(async (manager) => {
      const userRepo: Repository<User> = manager.getRepository('User');
      const companyRepo: Repository<Company> = manager.getRepository('Company');
      const companyUserRepo: Repository<CompanyUser> =
        manager.getRepository('CompanyUser');

      let user = userRepo.create(data.user);

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

      const companyUser = companyUserRepo.create({
        userId: user.id,
        companyId: company.id,
        companyOwner: true,
      });

      await companyUserRepo.save(companyUser);

      return companyUser;
    });
  }

  async singIn(data: SignInDto, companyId: string): Promise<SignInResponseDto> {
    const companyUser = await this.companyUserRepository.findOne({
      where: {
        companyId,
        user: {
          email: data.email,
        },
      },
      select: {
        id: true,
        companyId: true,
        userId: true,
        companyOwner: true,
        user: {
          id: true,
          email: true,
          password: true,
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

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValidPassword = await compare(data.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = this.jwtService.sign({
      userId: user.id,
      companyId: companyUser.companyId,
    });

    return {
      accessToken: token,
    };
  }

  async me(id: string): Promise<MeResponseDto> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        isAdmin: true,
        isMaster: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }
}
