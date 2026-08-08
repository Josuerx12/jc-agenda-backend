import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../../infra/entities/address.entity';
import type { AddressResponse } from './dto/address-response.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async findByZipCode(zipCode?: string): Promise<AddressResponse | null> {
    const normalizedZipCode = zipCode?.replace(/\D/g, '');

    if (normalizedZipCode?.length !== 8) {
      return null;
    }

    const address = await this.addressRepository.findOne({
      where: { zipCode: normalizedZipCode },
      relations: { city: true, state: true },
    });

    if (!address) {
      return null;
    }

    return {
      zipCode: address.zipCode,
      street: address.street,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: {
        id: address.city.id,
        name: address.city.name,
      },
      state: {
        id: address.state.id,
        name: address.state.name,
        code: address.state.code.trim(),
      },
    };
  }
}
