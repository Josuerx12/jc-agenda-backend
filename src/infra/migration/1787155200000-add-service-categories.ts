import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceCategories1787155200000 implements MigrationInterface {
  name = 'AddServiceCategories1787155200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "service_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "deleted_at" TIMESTAMPTZ, "company_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), CONSTRAINT "PK_service_categories" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_categories" ADD CONSTRAINT "FK_service_category_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_service_category_company_name" ON "service_categories" ("company_id", LOWER("name")) WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "services" ADD "category_id" uuid`);
    await queryRunner.query(
      `INSERT INTO "service_categories" ("company_id", "name", "description") SELECT DISTINCT "company_id", 'Geral', 'Categoria criada automaticamente' FROM "services"`,
    );
    await queryRunner.query(
      `UPDATE "services" s SET "category_id" = c."id" FROM "service_categories" c WHERE c."company_id" = s."company_id" AND c."name" = 'Geral'`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ALTER COLUMN "category_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_service_category" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_services_company_category_name" ON "services" ("company_id", "category_id", "name") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `DELETE FROM "company_user_services" current USING "company_user_services" duplicate WHERE current."company_user_id" = duplicate."company_user_id" AND current."service_id" = duplicate."service_id" AND current."deleted_at" IS NULL AND duplicate."deleted_at" IS NULL AND current."id" > duplicate."id"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_company_user_services_professional_service" ON "company_user_services" ("company_user_id", "service_id") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_company_user_services_professional_service"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_services_company_category_name"`);
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_service_category"`,
    );
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "category_id"`);
    await queryRunner.query(`DROP TABLE "service_categories"`);
  }
}
