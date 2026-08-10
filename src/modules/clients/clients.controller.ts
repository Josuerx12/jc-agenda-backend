import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IsPublic } from '../../infra/decorators/auth.decorator';
import {
  ApiCompanyIdHeader,
  CompanyId,
} from '../../infra/decorators/company.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
@ApiTags('Clientes')
@Controller('clients')
@ApiCompanyIdHeader()
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Post()
  @IsPublic()
  @ApiOperation({ summary: 'Cadastrar um cliente na empresa' })
  @ApiCreatedResponse({ description: 'Cliente cadastrado com sucesso' })
  @ApiConflictResponse({ description: 'Telefone já cadastrado na empresa' })
  @ApiBadRequestResponse({ description: 'Dados do cliente inválidos' })
  create(@CompanyId() companyId: string, @Body() dto: CreateClientDto) {
    return this.service.create(companyId, dto);
  }

  @Get('by-phone')
  @IsPublic()
  @ApiOperation({ summary: 'Buscar um cliente pelo telefone na empresa' })
  @ApiQuery({ name: 'phone', example: '(11) 99999-9999' })
  @ApiOkResponse({
    description: 'Retorna o cliente ou null quando não estiver cadastrado',
  })
  @ApiBadRequestResponse({ description: 'Telefone inválido' })
  findByPhone(@CompanyId() companyId: string, @Query('phone') phone: string) {
    return this.service.findByPhone(companyId, phone);
  }
}
