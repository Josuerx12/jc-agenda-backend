import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceAndCompanyUserServiceTable1786372708537 implements MigrationInterface {
  name = 'AddServiceAndCompanyUserServiceTable1786372708537';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "company_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "price" numeric(10,2) NOT NULL, "description" text, "duration" integer NOT NULL, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "company_user_services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "company_user_id" uuid NOT NULL, "service_id" uuid NOT NULL, CONSTRAINT "PK_7dcca71d3fc1e3a20c35bd59513" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_users" ADD "company_admin" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_users" ADD "company_professional" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_8e753d53a2de803b47ed9acec4c" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user_services" ADD CONSTRAINT "FK_f3bf272ae3b90e2c9a1544f89b1" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user_services" ADD CONSTRAINT "FK_7e7b0eb1a50505998a3fab0c40c" FOREIGN KEY ("company_user_id") REFERENCES "company_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_user_services" DROP CONSTRAINT "FK_7e7b0eb1a50505998a3fab0c40c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user_services" DROP CONSTRAINT "FK_f3bf272ae3b90e2c9a1544f89b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_8e753d53a2de803b47ed9acec4c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_users" DROP COLUMN "company_professional"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_users" DROP COLUMN "company_admin"`,
    );
    await queryRunner.query(`DROP TABLE "company_user_services"`);
    await queryRunner.query(`DROP TABLE "services"`);
  }
}
