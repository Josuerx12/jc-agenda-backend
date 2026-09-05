import { Column, Entity, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';

@Entity({ name: 'company_settings' })
export class CompanySetting extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid', unique: true })
  companyId: string;

  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 100,
    default: 'America/Sao_Paulo',
  })
  timezone: string;

  @Column({ name: 'slot_interval_minutes', type: 'int', default: 60 })
  slotIntervalMinutes: number;

  @Column({ name: 'logo_image_id', type: 'uuid', nullable: true })
  logoImageId: string | null;

  @Column({
    name: 'primary_color',
    type: 'char',
    length: 7,
    default: '#2563EB',
  })
  primaryColor: string;

  @Column({
    name: 'secondary_color',
    type: 'char',
    length: 7,
    default: '#0F172A',
  })
  secondaryColor: string;

  @Column({ name: 'accent_color', type: 'char', length: 7, default: '#F59E0B' })
  accentColor: string;

  @Column({
    name: 'background_color',
    type: 'char',
    length: 7,
    default: '#F8FAFC',
  })
  backgroundColor: string;

  @Column({
    name: 'surface_color',
    type: 'char',
    length: 7,
    default: '#FFFFFF',
  })
  surfaceColor: string;

  @Column({ name: 'text_color', type: 'char', length: 7, default: '#0F172A' })
  textColor: string;

  @Column({
    name: 'font_family',
    type: 'varchar',
    length: 20,
    default: 'INTER',
  })
  fontFamily: string;

  @Column({
    name: 'border_radius',
    type: 'varchar',
    length: 20,
    default: 'MEDIUM',
  })
  borderRadius: string;

  @Column({
    name: 'welcome_message',
    type: 'varchar',
    length: 280,
    nullable: true,
  })
  welcomeMessage: string | null;

  @Column({ name: 'show_company_name', type: 'boolean', default: true })
  showCompanyName: boolean;

  @OneToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Relation<Company>;
}
