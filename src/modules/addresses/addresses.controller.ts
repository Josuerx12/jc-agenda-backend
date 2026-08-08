import { Controller, Get, Query } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import type { AddressResponse } from './dto/address-response.dto';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IsPublic } from 'src/infra/decorators/auth.decorator';

@ApiTags('Addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Busca o endereço completo pelo CEP' })
  @ApiQuery({
    name: 'cep',
    example: '01001-000',
    description: 'CEP com ou sem pontuação',
  })
  @ApiOkResponse({
    description: 'Endereço encontrado ou null quando não existir',
    schema: {
      nullable: true,
      example: {
        zipCode: '01001000',
        street: 'Praça da Sé',
        complement: 'lado ímpar',
        neighborhood: 'Sé',
        city: { id: 'uuid-da-cidade', name: 'São Paulo' },
        state: { id: 'uuid-do-estado', name: 'São Paulo', code: 'SP' },
      },
    },
  })
  @IsPublic()
  findByZipCode(
    @Query('cep') zipCode?: string,
  ): Promise<AddressResponse | null> {
    return this.addressesService.findByZipCode(zipCode);
  }
}
