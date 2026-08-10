import { Controller, Body, Get, Post } from '@nestjs/common';
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

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
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
    console.log('Company ID:', companyId);

    return await this.authService.singIn(data, companyId);
  }

  @Get('me')
  async me(@UserId() userId: string): Promise<MeResponseDto> {
    return await this.authService.me(userId);
  }
}
