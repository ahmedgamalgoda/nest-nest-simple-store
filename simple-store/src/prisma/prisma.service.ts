import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { db } from './db.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * The underlying Prisma ORM client instance.
   */
  public readonly client = db;

  /**
   * Access User queries:
   * e.g. this.prisma.user.insert({ ... }), this.prisma.user.where({ ... }).first()
   */
  get user() {
    return this.client.orm.public.User;
  }

  /**
   * Access Product queries:
   * e.g. this.prisma.product.insert({ ... }), this.prisma.product.where({ ... }).all()
   */
  get product() {
    return this.client.orm.public.Product;
  }

  /**
   * Raw SQL queries using tagged template literals:
   * e.g. await this.prisma.sql`SELECT * FROM "User"`
   */
  get sql() {
    return this.client.sql;
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Prisma ORM connected to PostgreSQL database successfully.');
    } catch (error) {
      this.logger.warn(
        `Prisma database connection pending or unreachable (${(error as Error).message}). ` +
          'Ensure PostgreSQL is running (e.g. docker compose up -d).',
      );
    }
  }

  async onModuleDestroy() {
    await this.client.close();
    this.logger.log('Prisma ORM database connection closed.');
  }
}
