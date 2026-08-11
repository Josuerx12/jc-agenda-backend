import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveCompanySettings1786636800000 implements MigrationInterface {
  name = 'MoveCompanySettings1786636800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "company_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "deleted_at" TIMESTAMPTZ, "company_id" uuid NOT NULL, "timezone" character varying(100) NOT NULL DEFAULT 'America/Sao_Paulo', "slot_interval_minutes" integer NOT NULL DEFAULT 60, CONSTRAINT "UQ_company_settings_company" UNIQUE ("company_id"), CONSTRAINT "PK_company_settings" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "company_settings" ("company_id", "timezone", "slot_interval_minutes") SELECT "id", "timezone", "slot_interval_minutes" FROM "companies"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD CONSTRAINT "FK_company_settings_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "slot_interval_minutes"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "timezone"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "timezone" character varying(100) NOT NULL DEFAULT 'America/Sao_Paulo'`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "slot_interval_minutes" integer NOT NULL DEFAULT 60`,
    );
    await queryRunner.query(
      `UPDATE "companies" SET "timezone" = settings."timezone", "slot_interval_minutes" = settings."slot_interval_minutes" FROM "company_settings" settings WHERE settings."company_id" = "companies"."id"`,
    );
    await queryRunner.query(`DROP TABLE "company_settings"`);
  }
}
