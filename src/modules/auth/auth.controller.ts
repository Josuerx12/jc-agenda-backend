import { Controller, Body, Get, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MeResponseDto } from './dto/me-response.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { SignInDto, SignInResponseDto } from './dto/sign-in.dto';
import { IsPublic } from 'src/infra/decorators/auth.decorator';
import {
  ApiCompanyIdHeader,
  CompanyId,
} from 'src/infra/decorators/company.decorator';
import { UserId } from 'src/infra/decorators/user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(204)
  @IsPublic()
  @ApiOperation({
    summary: 'Endpoint para criar um novo usuário e empresa',
    description:
      'Este endpoint permite criar um novo usuário e uma nova empresa associada a ele. O usuário será criado com base nas informações fornecidas no corpo da requisição, incluindo nome, email e senha. A empresa será criada com base nas informações fornecidas, como nome da empresa e CNPJ. O usuário criado será automaticamente associado à empresa criada.',
  })
  @ApiResponse({
    status: 204,
    description: 'Usuário e empresa criados com sucesso',
  })
  async signUp(@Body() data: RegisterDto) {
    await this.authService.register(data);
  }

  @Post('sign-in')
  @IsPublic()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCompanyIdHeader()
  @ApiOperation({
    summary: 'Endpoint para autenticar um usuário',
    description:
      'Este endpoint permite autenticar um usuário existente com base nas informações fornecidas no corpo da requisição, incluindo email e senha. Se as credenciais forem válidas, o endpoint retornará um token JWT que pode ser usado para acessar recursos protegidos da API.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário autenticado com sucesso',
    type: SignInResponseDto,
  })
  async signIn(
    @CompanyId() companyId: string,
    @Body() data: SignInDto,
  ): Promise<SignInResponseDto> {
    return await this.authService.singIn(data, companyId);
  }

  @Post('forgot-password')
  @HttpCode(204)
  @IsPublic()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Solicita um link de recuperação de senha' })
  @ApiResponse({
    status: 204,
    description:
      'Solicitação processada sem revelar se o e-mail está cadastrado',
  })
  async forgotPassword(@Body() data: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(data.email);
  }

  @Post('reset-password')
  @HttpCode(204)
  @IsPublic()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Redefine a senha usando o token recebido' })
  @ApiResponse({ status: 204, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() data: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(data.token, data.password);
  }

  @Get('me')
  async me(@UserId() userId: string): Promise<MeResponseDto> {
    return await this.authService.me(userId);
  }
}
