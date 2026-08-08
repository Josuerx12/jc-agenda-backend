import { MigrationInterface, QueryRunner } from "typeorm";

export class CompanyAddresses1786149249171 implements MigrationInterface {
    name = 'CompanyAddresses1786149249171'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "company_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "company_id" uuid NOT NULL, "zip_code" character varying(10) NOT NULL, "state" character varying(100) NOT NULL, "city" character varying(100) NOT NULL, "neighborhood" character varying(100) NOT NULL, "address" character varying(255) NOT NULL, "number" character varying(20), "complement" character varying(255), CONSTRAINT "PK_cff628c622ac2c8f5a1927356d5" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "company_addresses"`);
    }

}
