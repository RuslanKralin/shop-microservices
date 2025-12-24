import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockToProduct1766580221958 implements MigrationInterface {
    name = 'AddStockToProduct1766580221958'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "stock" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "stock"`);
    }

}
