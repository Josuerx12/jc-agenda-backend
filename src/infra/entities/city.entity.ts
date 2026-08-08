import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { State } from './state.entity';
import { Address } from './address.entity';

@Entity({ name: 'cities' })
export class City extends BaseEntity {
  @Column({ name: 'source_id', type: 'integer', unique: true })
  sourceId: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'state_id', type: 'uuid' })
  stateId: string;

  @ManyToOne(() => State, (state) => state.cities, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'state_id',
    foreignKeyConstraintName: 'FK_cities_state',
  })
  state: Relation<State>;

  @OneToMany(() => Address, (address) => address.city)
  addresses: Relation<Address[]>;
}
