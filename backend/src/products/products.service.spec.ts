import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockPrismaService: any;

  const mockProduct = {
    id: 'prod-uuid-1',
    name: 'Sample Product',
    description: 'Sample description',
    price: 99.99,
    stock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      product: {
        create: vi.fn(),
        all: vi.fn(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const dto = {
        name: 'Sample Product',
        description: 'Sample description',
        price: 99.99,
        stock: 10,
      };

      const result = await service.create(dto);
      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        name: 'Sample Product',
        description: 'Sample description',
        price: 99.99,
        stock: 10,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      mockPrismaService.product.all.mockResolvedValue([mockProduct]);

      const result = await service.findAll();
      expect(result).toEqual([mockProduct]);
      expect(mockPrismaService.product.all).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product when found', async () => {
      mockPrismaService.product.first.mockResolvedValue(mockProduct);

      const result = await service.findOne('prod-uuid-1');
      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.where).toHaveBeenCalledWith({ id: 'prod-uuid-1' });
    });

    it('should throw NotFoundException when product is not found', async () => {
      mockPrismaService.product.first.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the updated product', async () => {
      const updated = { ...mockProduct, price: 149.99 };
      mockPrismaService.product.first.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue(updated);

      const result = await service.update('prod-uuid-1', { price: 149.99 });
      expect(result).toEqual(updated);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({ price: 149.99 });
    });
  });

  describe('remove', () => {
    it('should delete and return success message with product', async () => {
      mockPrismaService.product.first.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('prod-uuid-1');
      expect(result.product).toEqual(mockProduct);
      expect(mockPrismaService.product.delete).toHaveBeenCalled();
    });
  });
});
