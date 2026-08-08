import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCompanyUserRelations1786230000000 implements MigrationInterface {
  name = 'FixCompanyUserRelations1786230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_34e6ff378f992f78209b9a96e41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "FK_a02967531e8a03d7205fbbb6c20"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "companiesId"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "usersId"`);
    await queryRunner.query(
      `ALTER TABLE "company_users" ADD CONSTRAINT "FK_company_users_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_users" ADD CONSTRAINT "FK_company_users_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_users" DROP CONSTRAINT "FK_company_users_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_users" DROP CONSTRAINT "FK_company_users_user"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" ADD "usersId" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD "companiesId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "FK_a02967531e8a03d7205fbbb6c20" FOREIGN KEY ("usersId") REFERENCES "company_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_34e6ff378f992f78209b9a96e41" FOREIGN KEY ("companiesId") REFERENCES "company_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
