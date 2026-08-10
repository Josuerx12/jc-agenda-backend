import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Client } from '../../infra/entities/client.entity';
import { normalizePhone } from './phone.util';
import { CreateClientDto } from './dto/create-client.dto';
@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private readonly clients: Repository<Client>,
  ) {}

  async create(companyId: string, dto: CreateClientDto) {
    const phone = normalizePhone(dto.phone);
    if (await this.clients.existsBy({ companyId, phone })) {
      throw new ConflictException('Cliente já cadastrado com este telefone');
    }
    try {
      return await this.clients.save({ companyId, name: dto.name, phone });
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Cliente já cadastrado com este telefone');
      }
      throw error;
    }
  }
  findByPhone(companyId: string, phone: string) {
    return this.clients.findOne({
      where: { companyId, phone: normalizePhone(phone) },
      select: { id: true, name: true, phone: true },
    });
  }
}
