import { Column, Entity, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from './base.entity';
import { City } from './city.entity';

@Entity({ name: 'states' })
export class State extends BaseEntity {
  @Column({ name: 'source_id', type: 'integer', unique: true })
  sourceId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'char', length: 2, unique: true })
  code: string;

  @OneToMany(() => City, (city) => city.state)
  cities: Relation<City[]>;
}
