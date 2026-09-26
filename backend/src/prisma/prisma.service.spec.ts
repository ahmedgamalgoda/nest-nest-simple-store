import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module.js';
import { PrismaService } from './prisma.service.js';

@Injectable()
class ConsumerService {
  constructor(public readonly prisma: PrismaService) {}
}

// A feature module that does NOT import PrismaModule
@Module({
  providers: [ConsumerService],
})
class ConsumerFeatureModule {}

describe('PrismaModule (Global)', () => {
  let module: TestingModule;
  let consumerService: ConsumerService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule, ConsumerFeatureModule],
    }).compile();

    consumerService = module.get<ConsumerService>(ConsumerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(prismaService).toBeDefined();
  });

  it('should inject PrismaService globally into ConsumerService without ConsumerFeatureModule importing PrismaModule', () => {
    expect(consumerService).toBeDefined();
    expect(consumerService.prisma).toBe(prismaService);
    expect(consumerService.prisma.user).toBeDefined();
    expect(consumerService.prisma.product).toBeDefined();
  });
});
