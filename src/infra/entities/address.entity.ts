import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from './base.entity';
import { City } from './city.entity';
import { State } from './state.entity';

@Entity({ name: 'addresses' })
export class Address extends BaseEntity {
  @Column({ name: 'zip_code', type: 'char', length: 8, unique: true })
  zipCode: string;

  @Column({ type: 'varchar', length: 255 })
  street: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complement: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  neighborhood: string | null;

  @Column({ name: 'city_id', type: 'uuid' })
  cityId: string;

  @Column({ name: 'state_id', type: 'uuid' })
  stateId: string;

  @ManyToOne(() => City, (city) => city.addresses, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'city_id',
    foreignKeyConstraintName: 'FK_addresses_city',
  })
  city: Relation<City>;

  @ManyToOne(() => State, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'state_id',
    foreignKeyConstraintName: 'FK_addresses_state',
  })
  state: Relation<State>;
}
