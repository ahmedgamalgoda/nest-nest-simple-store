import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderItemDto } from './dto/order-item.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrderResponse = {
    id: 'order-uuid-1',
    userId: 'user-uuid-1',
    totalPrice: 60.0,
    status: 'completed',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'item-uuid-1',
        productId: 'prod-uuid-1',
        productName: 'Mouse',
        quantity: 2,
        unitPrice: 30.0,
        subtotal: 60.0,
      },
    ],
  };

  const mockOrdersService = {
    create: vi.fn().mockResolvedValue(mockOrderResponse),
    findAllForUser: vi.fn().mockResolvedValue([mockOrderResponse]),
    findOneForUser: vi.fn().mockResolvedValue(mockOrderResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be protected with JwtAuthGuard at the controller level', () => {
    const guards = Reflect.getMetadata('__guards__', OrdersController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
  });

  it('should create an order using userId from the token and payload items', async () => {
    const dto: CreateOrderDto = {
      items: [{ productId: 'prod-uuid-1', quantity: 2 }],
    };

    const result = await controller.create('user-uuid-1', dto);

    expect(result).toEqual(mockOrderResponse);
    expect(service.create).toHaveBeenCalledWith('user-uuid-1', dto);
  });

  it('should return only orders for the logged-in user', async () => {
    const result = await controller.findAll('user-uuid-1');

    expect(result).toEqual([mockOrderResponse]);
    expect(service.findAllForUser).toHaveBeenCalledWith('user-uuid-1');
  });

  it('should return a specific order for the logged-in user', async () => {
    const result = await controller.findOne('order-uuid-1', 'user-uuid-1');

    expect(result).toEqual(mockOrderResponse);
    expect(service.findOneForUser).toHaveBeenCalledWith('order-uuid-1', 'user-uuid-1');
  });

  describe('DTO Validation Rules', () => {
    it('should fail when items is empty or not an array', async () => {
      const dtoEmpty = plainToInstance(CreateOrderDto, { items: [] });
      const errorsEmpty = await validate(dtoEmpty);
      expect(errorsEmpty.length).toBeGreaterThan(0);
      expect(errorsEmpty.some((e) => e.property === 'items')).toBe(true);
    });

    it('should fail when item quantity is zero or negative', async () => {
      const itemDto = plainToInstance(OrderItemDto, {
        productId: 'prod-1',
        quantity: 0,
      });
      const errors = await validate(itemDto);
      expect(errors.some((e) => e.property === 'quantity')).toBe(true);

      const itemNegative = plainToInstance(OrderItemDto, {
        productId: 'prod-1',
        quantity: -2,
      });
      const errorsNegative = await validate(itemNegative);
      expect(errorsNegative.some((e) => e.property === 'quantity')).toBe(true);
    });

    it('should fail when item productId is empty', async () => {
      const itemDto = plainToInstance(OrderItemDto, {
        productId: '',
        quantity: 2,
      });
      const errors = await validate(itemDto);
      expect(errors.some((e) => e.property === 'productId')).toBe(true);
    });

    it('should pass validation with valid order items', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        items: [
          { productId: 'prod-1', quantity: 3 },
          { productId: 'prod-2', quantity: 1 },
        ],
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
