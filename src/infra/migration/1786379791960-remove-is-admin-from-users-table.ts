import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveIsAdminFromUsersTable1786379791960 implements MigrationInterface {
    name = 'RemoveIsAdminFromUsersTable1786379791960'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_admin"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_admin" boolean NOT NULL DEFAULT false`);
    }

}
