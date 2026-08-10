import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentsSystem1786550400000 implements MigrationInterface {
  name = 'AddAppointmentsSystem1786550400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "timezone" character varying(100) NOT NULL DEFAULT 'America/Sao_Paulo'`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "slot_interval_minutes" integer NOT NULL DEFAULT 60`,
    );
    await queryRunner.query(
      `CREATE TABLE "professional_work_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "deleted_at" TIMESTAMPTZ, "professional_id" uuid NOT NULL, "day_of_week" smallint NOT NULL, "start_time" time NOT NULL, "end_time" time NOT NULL, "lunch_start_time" time, "lunch_end_time" time, CONSTRAINT "UQ_professional_work_schedule_day" UNIQUE ("professional_id", "day_of_week"), CONSTRAINT "PK_professional_work_schedules" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "company_holidays" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "deleted_at" TIMESTAMPTZ, "company_id" uuid NOT NULL, "date" date NOT NULL, "name" character varying(150) NOT NULL, CONSTRAINT "UQ_company_holiday_date" UNIQUE ("company_id", "date"), CONSTRAINT "PK_company_holidays" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "professional_time_offs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "deleted_at" TIMESTAMPTZ, "professional_id" uuid NOT NULL, "start_at" TIMESTAMPTZ NOT NULL, "end_at" TIMESTAMPTZ NOT NULL, "reason" character varying(255), CONSTRAINT "PK_professional_time_offs" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "deleted_at" TIMESTAMPTZ, "company_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "phone" character varying(20) NOT NULL, CONSTRAINT "UQ_client_company_phone" UNIQUE ("company_id", "phone"), CONSTRAINT "PK_clients" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "appointments_status_enum" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELED', 'NO_SHOW')`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "deleted_at" TIMESTAMPTZ, "company_id" uuid NOT NULL, "professional_id" uuid NOT NULL, "client_id" uuid NOT NULL, "start_at" TIMESTAMPTZ NOT NULL, "end_at" TIMESTAMPTZ NOT NULL, "total_duration_minutes" integer NOT NULL, "total_price" numeric(10,2) NOT NULL, "status" "appointments_status_enum" NOT NULL DEFAULT 'SCHEDULED', CONSTRAINT "PK_appointments" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_professional_period" ON "appointments" ("professional_id", "start_at", "end_at")`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointment_services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "deleted_at" TIMESTAMPTZ, "appointment_id" uuid NOT NULL, "service_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "price" numeric(10,2) NOT NULL, "duration_minutes" integer NOT NULL, CONSTRAINT "PK_appointment_services" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_work_schedules" ADD CONSTRAINT "FK_work_schedule_professional" FOREIGN KEY ("professional_id") REFERENCES "company_users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_holidays" ADD CONSTRAINT "FK_holiday_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_time_offs" ADD CONSTRAINT "FK_time_off_professional" FOREIGN KEY ("professional_id") REFERENCES "company_users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_client_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointment_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointment_professional" FOREIGN KEY ("professional_id") REFERENCES "company_users"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointment_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_services" ADD CONSTRAINT "FK_appointment_service_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_services" ADD CONSTRAINT "FK_appointment_service_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "appointment_services"`);
    await queryRunner.query(
      `DROP INDEX "IDX_appointments_professional_period"`,
    );
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TYPE "appointments_status_enum"`);
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP TABLE "professional_time_offs"`);
    await queryRunner.query(`DROP TABLE "company_holidays"`);
    await queryRunner.query(`DROP TABLE "professional_work_schedules"`);
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "slot_interval_minutes"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "timezone"`);
  }
}
