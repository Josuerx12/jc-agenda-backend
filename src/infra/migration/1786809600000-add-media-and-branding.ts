import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaAndBranding1786809600000 implements MigrationInterface {
  name = 'AddMediaAndBranding1786809600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "media_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "deleted_at" TIMESTAMPTZ, "company_id" uuid NOT NULL, "storage_key" character varying(255) NOT NULL, "original_name" character varying(255) NOT NULL, "mime_type" character varying(50) NOT NULL, "size_bytes" integer NOT NULL, "checksum_sha256" character(64) NOT NULL, "created_by_user_id" uuid, CONSTRAINT "UQ_media_files_storage_key" UNIQUE ("storage_key"), CONSTRAINT "PK_media_files" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_files_company" ON "media_files" ("company_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_files" ADD CONSTRAINT "FK_media_files_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_files" ADD CONSTRAINT "FK_media_files_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL`,
    );

    await queryRunner.query(`ALTER TABLE "products" ADD "image_id" uuid`);
    await queryRunner.query(`ALTER TABLE "services" ADD "image_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "company_users" ADD "avatar_image_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "logo_image_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "primary_color" character(7) NOT NULL DEFAULT '#2563EB'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "secondary_color" character(7) NOT NULL DEFAULT '#0F172A'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "accent_color" character(7) NOT NULL DEFAULT '#F59E0B'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "background_color" character(7) NOT NULL DEFAULT '#F8FAFC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "surface_color" character(7) NOT NULL DEFAULT '#FFFFFF'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "text_color" character(7) NOT NULL DEFAULT '#0F172A'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "font_family" character varying(20) NOT NULL DEFAULT 'INTER'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "border_radius" character varying(20) NOT NULL DEFAULT 'MEDIUM'`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "welcome_message" character varying(280)`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD "show_company_name" boolean NOT NULL DEFAULT true`,
    );

    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_image" FOREIGN KEY ("image_id") REFERENCES "media_files"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_services_image" FOREIGN KEY ("image_id") REFERENCES "media_files"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_users" ADD CONSTRAINT "FK_company_users_avatar" FOREIGN KEY ("avatar_image_id") REFERENCES "media_files"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" ADD CONSTRAINT "FK_company_settings_logo" FOREIGN KEY ("logo_image_id") REFERENCES "media_files"("id") ON DELETE SET NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP CONSTRAINT "FK_company_settings_logo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_users" DROP CONSTRAINT "FK_company_users_avatar"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_services_image"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_image"`,
    );

    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "show_company_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "welcome_message"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "border_radius"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "font_family"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "text_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "surface_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "background_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "accent_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "secondary_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "primary_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_settings" DROP COLUMN "logo_image_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_users" DROP COLUMN "avatar_image_id"`,
    );
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "image_id"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image_id"`);

    await queryRunner.query(
      `ALTER TABLE "media_files" DROP CONSTRAINT "FK_media_files_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_files" DROP CONSTRAINT "FK_media_files_company"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_media_files_company"`);
    await queryRunner.query(`DROP TABLE "media_files"`);
  }
}
