import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockPrismaService: any;

  const mockProductA = {
    id: 'prod-uuid-a',
    name: 'Wireless Mouse',
    price: 30.0,
    stock: 10,
  };

  const mockProductB = {
    id: 'prod-uuid-b',
    name: 'Mechanical Keyboard',
    price: 100.0,
    stock: 5,
  };

  const mockCreatedOrder = {
    id: 'order-uuid-1',
    userId: 'user-uuid-1',
    totalPrice: 160.0,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      product: {
        where: vi.fn(),
        update: vi.fn(),
      },
      order: {
        where: vi.fn(),
        create: vi.fn(),
        all: vi.fn(),
        first: vi.fn(),
      },
      orderItem: {
        where: vi.fn(),
        create: vi.fn(),
        all: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully place an order for multiple products and decrement stock', async () => {
      // Mock finding products
      mockPrismaService.product.where.mockImplementation(({ id }: { id: string }) => ({
        first: vi.fn().mockImplementation(async () => {
          if (id === 'prod-uuid-a') return { ...mockProductA };
          if (id === 'prod-uuid-b') return { ...mockProductB };
          return null;
        }),
        update: mockPrismaService.product.update,
      }));

      mockPrismaService.order.create.mockResolvedValue(mockCreatedOrder);
      mockPrismaService.orderItem.create.mockImplementation(async (data: any) => ({
        id: 'item-uuid-' + Math.random(),
        ...data,
      }));

      const dto = {
        items: [
          { productId: 'prod-uuid-a', quantity: 2 },
          { productId: 'prod-uuid-b', quantity: 1 },
        ],
      };

      const result = await service.create('user-uuid-1', dto);

      // Verify total price: (2 * 30) + (1 * 100) = 160
      expect(result.totalPrice).toBe(160);
      expect(result.userId).toBe('user-uuid-1');
      expect(result.items).toHaveLength(2);

      // Verify stock was decremented for both products
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({ stock: 8 }); // 10 - 2
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({ stock: 4 }); // 5 - 1
    });

    it('should throw NotFoundException if a product in the order does not exist', async () => {
      mockPrismaService.product.where.mockImplementation(() => ({
        first: vi.fn().mockResolvedValue(null),
      }));

      const dto = {
        items: [{ productId: 'non-existent-prod', quantity: 1 }],
      };

      await expect(service.create('user-uuid-1', dto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.product.update).not.toHaveBeenCalled();
      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if requested quantity exceeds available stock', async () => {
      mockPrismaService.product.where.mockImplementation(() => ({
        first: vi.fn().mockResolvedValue({ ...mockProductA, stock: 2 }),
      }));

      const dto = {
        items: [{ productId: 'prod-uuid-a', quantity: 5 }],
      };

      await expect(service.create('user-uuid-1', dto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.product.update).not.toHaveBeenCalled();
      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if items array is empty', async () => {
      const dto = { items: [] };

      await expect(service.create('user-uuid-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllForUser', () => {
    it('should return only orders belonging to the specified user with items', async () => {
      mockPrismaService.order.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([mockCreatedOrder]),
      });

      mockPrismaService.orderItem.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([
          { id: 'item-1', orderId: 'order-uuid-1', productId: 'prod-uuid-a', quantity: 2, price: 30 },
        ]),
      });

      const result = await service.findAllForUser('user-uuid-1');

      expect(mockPrismaService.order.where).toHaveBeenCalledWith({ userId: 'user-uuid-1' });
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-uuid-1');
      expect(result[0].items).toHaveLength(1);
    });
  });

  describe('findOneForUser', () => {
    it('should return the order when it belongs to the user', async () => {
      mockPrismaService.order.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockCreatedOrder),
      });

      mockPrismaService.orderItem.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([
          { id: 'item-1', orderId: 'order-uuid-1', productId: 'prod-uuid-a', quantity: 2, price: 30 },
        ]),
      });

      const result = await service.findOneForUser('order-uuid-1', 'user-uuid-1');

      expect(result.id).toBe('order-uuid-1');
      expect(result.userId).toBe('user-uuid-1');
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockPrismaService.order.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findOneForUser('missing-order', 'user-uuid-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when order belongs to a different user', async () => {
      mockPrismaService.order.where.mockReturnValue({
        first: vi.fn().mockResolvedValue({ ...mockCreatedOrder, userId: 'other-user' }),
      });

      await expect(service.findOneForUser('order-uuid-1', 'user-uuid-1')).rejects.toThrow(NotFoundException);
    });
  });
});
