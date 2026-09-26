import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ROLES_KEY } from '../auth/decorators/roles.decorator.js';
import { Role } from '../auth/enums/role.enum.js';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProduct = {
    id: 'prod-uuid-1',
    name: 'Wireless Mouse',
    description: 'Ergonomic optical mouse',
    price: 29.99,
    stock: 50,
  };

  const mockProductsService = {
    create: vi.fn().mockResolvedValue(mockProduct),
    findAll: vi.fn().mockResolvedValue([mockProduct]),
    findOne: vi.fn().mockResolvedValue(mockProduct),
    update: vi.fn().mockResolvedValue({ ...mockProduct, price: 34.99 }),
    remove: vi.fn().mockResolvedValue({ message: 'Deleted', product: mockProduct }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a product via POST', async () => {
    const dto: CreateProductDto = {
      name: 'Wireless Mouse',
      description: 'Ergonomic optical mouse',
      price: 29.99,
      stock: 50,
    };
    const result = await controller.create(dto);
    expect(result).toEqual(mockProduct);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should return all products via GET', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockProduct]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return single product by id via GET :id', async () => {
    const result = await controller.findOne('prod-uuid-1');
    expect(result).toEqual(mockProduct);
    expect(service.findOne).toHaveBeenCalledWith('prod-uuid-1');
  });

  it('should update product via PATCH :id', async () => {
    const updateDto: UpdateProductDto = { price: 34.99 };
    const result = await controller.update('prod-uuid-1', updateDto);
    expect(result.price).toBe(34.99);
    expect(service.update).toHaveBeenCalledWith('prod-uuid-1', updateDto);
  });

  it('should delete product via DELETE :id', async () => {
    const result = await controller.remove('prod-uuid-1');
    expect(result.product).toEqual(mockProduct);
    expect(service.remove).toHaveBeenCalledWith('prod-uuid-1');
  });

  describe('Guard Protection & Role-Based Access Rules', () => {
    it('should protect create with JwtAuthGuard and RolesGuard requiring admin role', () => {
      const guards = Reflect.getMetadata('__guards__', controller.create);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);

      const roles = Reflect.getMetadata(ROLES_KEY, controller.create);
      expect(roles).toEqual([Role.ADMIN]);
    });

    it('should protect update with JwtAuthGuard and RolesGuard requiring admin role', () => {
      const guards = Reflect.getMetadata('__guards__', controller.update);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);

      const roles = Reflect.getMetadata(ROLES_KEY, controller.update);
      expect(roles).toEqual([Role.ADMIN]);
    });

    it('should protect remove with JwtAuthGuard and RolesGuard requiring admin role', () => {
      const guards = Reflect.getMetadata('__guards__', controller.remove);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);

      const roles = Reflect.getMetadata(ROLES_KEY, controller.remove);
      expect(roles).toEqual([Role.ADMIN]);
    });

    it('should leave findAll public without guards or role metadata', () => {
      const guards = Reflect.getMetadata('__guards__', controller.findAll);
      expect(guards).toBeUndefined();

      const roles = Reflect.getMetadata(ROLES_KEY, controller.findAll);
      expect(roles).toBeUndefined();
    });

    it('should leave findOne public without guards or role metadata', () => {
      const guards = Reflect.getMetadata('__guards__', controller.findOne);
      expect(guards).toBeUndefined();

      const roles = Reflect.getMetadata(ROLES_KEY, controller.findOne);
      expect(roles).toBeUndefined();
    });
  });

  describe('DTO Validation Rules', () => {
    it('should fail validation when name is empty or missing', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: '',
        price: 19.99,
        stock: 5,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail validation when price is negative or zero', async () => {
      const dtoZero = plainToInstance(CreateProductDto, {
        name: 'Keyboard',
        price: 0,
        stock: 5,
      });
      const errorsZero = await validate(dtoZero);
      expect(errorsZero.some((e) => e.property === 'price')).toBe(true);

      const dtoNegative = plainToInstance(CreateProductDto, {
        name: 'Keyboard',
        price: -10,
        stock: 5,
      });
      const errorsNegative = await validate(dtoNegative);
      expect(errorsNegative.some((e) => e.property === 'price')).toBe(true);
    });

    it('should fail validation when stock is negative', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Monitor',
        price: 199.99,
        stock: -1,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'stock')).toBe(true);
    });

    it('should pass validation when name is provided, price is positive, and stock is non-negative', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Monitor',
        description: '4K Display',
        price: 299.99,
        stock: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
