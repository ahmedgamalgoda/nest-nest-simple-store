import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Global PrismaModule.
 * By decorating with @Global(), PrismaService is registered globally
 * across the entire application and can be injected anywhere
 * without re-importing PrismaModule in other feature modules.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
