import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStockToProduct1766580221958 implements MigrationInterface {
  name = 'AddStockToProduct1766580221958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "products" (
      "id" SERIAL PRIMARY KEY,
      "name" varchar NOT NULL,
      "price" integer NOT NULL,
      "stock" integer NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    );
  `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "products";`);
  }
}
