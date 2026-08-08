import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSlugColumnOnCompany1786155556630 implements MigrationInterface {
    name = 'AddSlugColumnOnCompany1786155556630'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ADD "slug" character varying(14) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "UQ_b28b07d25e4324eee577de5496d" UNIQUE ("slug")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "UQ_b28b07d25e4324eee577de5496d"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "slug"`);
    }

}
