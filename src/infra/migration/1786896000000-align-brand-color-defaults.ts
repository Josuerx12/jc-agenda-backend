import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignBrandColorDefaults1786896000000 implements MigrationInterface {
  name = 'AlignBrandColorDefaults1786896000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "primary_color" SET DEFAULT '#5B2A6E'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "secondary_color" SET DEFAULT '#B56576'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "accent_color" SET DEFAULT '#D6B36A'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "text_color" SET DEFAULT '#221827'`,
    );
    await queryRunner.query(
      `UPDATE "company_settings" SET "primary_color" = '#5B2A6E' WHERE "primary_color" = '#2563EB'`,
    );
    await queryRunner.query(
      `UPDATE "company_settings" SET "secondary_color" = '#B56576' WHERE "secondary_color" = '#0F172A'`,
    );
    await queryRunner.query(
      `UPDATE "company_settings" SET "accent_color" = '#D6B36A' WHERE "accent_color" = '#F59E0B'`,
    );
    await queryRunner.query(
      `UPDATE "company_settings" SET "text_color" = '#221827' WHERE "text_color" = '#0F172A'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "dark_color" character(7) NOT NULL DEFAULT '#221827'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "positive_color" character(7) NOT NULL DEFAULT '#2E8B6D'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "negative_color" character(7) NOT NULL DEFAULT '#C14953'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "info_color" character(7) NOT NULL DEFAULT '#4A7EA8'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "warning_color" character(7) NOT NULL DEFAULT '#E3A745'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "warning_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "info_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "negative_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "positive_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "dark_color"`,
    );
    await queryRunner.query(
      `UPDATE "company_settings" SET "primary_color" = '#2563EB' WHERE "primary_color" = '#5B2A6E'`,
    );
    await queryRunner.query(
      `UPDATE "company_settings" SET "secondary_color" = '#0F172A' WHERE "secondary_color" = '#B56576'`,
    );
    await queryRunner.query(
      `UPDATE "company_settings" SET "accent_color" = '#F59E0B' WHERE "accent_color" = '#D6B36A'`,
    );
    await queryRunner.query(
      `UPDATE "company_settings" SET "text_color" = '#0F172A' WHERE "text_color" = '#221827'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "text_color" SET DEFAULT '#0F172A'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "accent_color" SET DEFAULT '#F59E0B'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "secondary_color" SET DEFAULT '#0F172A'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ALTER COLUMN "primary_color" SET DEFAULT '#2563EB'`,
    );
  }
}
