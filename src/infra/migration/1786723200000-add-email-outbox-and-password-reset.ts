import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailOutboxAndPasswordReset1786723200000 implements MigrationInterface {
  name = 'AddEmailOutboxAndPasswordReset1786723200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "auth_version" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email_normalized" ON "users" (LOWER("email")) WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "email_outbox" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "to" character varying(255) NOT NULL, "subject" character varying(255) NOT NULL, "template" character varying(50) NOT NULL, "context" jsonb NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT 0, "next_attempt_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sent_at" TIMESTAMP WITH TIME ZONE, "last_error" text, CONSTRAINT "PK_email_outbox_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_outbox_delivery" ON "email_outbox" ("status", "next_attempt_at")`,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "token_hash" character varying(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_password_reset_token_hash" UNIQUE ("token_hash"), CONSTRAINT "PK_password_reset_tokens_id" PRIMARY KEY ("id"), CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(`DROP INDEX "IDX_email_outbox_delivery"`);
    await queryRunner.query(`DROP TABLE "email_outbox"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email_normalized"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "auth_version"`);
  }
}
