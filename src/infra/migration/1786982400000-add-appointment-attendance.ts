import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentAttendance1786982400000 implements MigrationInterface {
  name = 'AddAppointmentAttendance1786982400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "appointments_status_enum" ADD VALUE IF NOT EXISTS 'IN_PROGRESS'`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "started_at" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "completed_at" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "total_price" TYPE numeric(14,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_services" ADD CONSTRAINT "UQ_appointment_service" UNIQUE ("appointment_id", "service_id")`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointment_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "deleted_at" TIMESTAMPTZ, "appointment_id" uuid NOT NULL, "product_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "quantity" integer NOT NULL, "total_price" numeric(14,2) NOT NULL, CONSTRAINT "CHK_appointment_product_quantity" CHECK ("quantity" > 0), CONSTRAINT "UQ_appointment_product" UNIQUE ("appointment_id", "product_id"), CONSTRAINT "PK_appointment_products" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_products" ADD CONSTRAINT "FK_appointment_product_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_products" ADD CONSTRAINT "FK_appointment_product_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "appointment_products"`);
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "total_price" TYPE numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_services" DROP CONSTRAINT "UQ_appointment_service"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "completed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "started_at"`,
    );
    await queryRunner.query(
      `UPDATE "appointments" SET "status" = 'CONFIRMED' WHERE "status" = 'IN_PROGRESS'`,
    );
    await queryRunner.query(
      `CREATE TYPE "appointments_status_enum_old" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELED', 'NO_SHOW')`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "appointments_status_enum_old" USING "status"::text::"appointments_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "appointments_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "appointments_status_enum_old" RENAME TO "appointments_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'`,
    );
  }
}
