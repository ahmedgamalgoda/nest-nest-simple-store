import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Role } from './enums/role.enum.js';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockRegisteredResponse = {
    message: 'User registered successfully',
    user: {
      id: 'user-uuid-1',
      email: 'bob@example.com',
      name: 'Bob',
      role: Role.USER,
      createdAt: new Date().toISOString(),
    },
  };

  const mockLoginResponse = {
    access_token: 'mock-jwt-token-abc',
    user: {
      id: 'user-uuid-1',
      email: 'bob@example.com',
      name: 'Bob',
      role: Role.USER,
    },
  };

  const mockAuthService = {
    register: vi.fn().mockResolvedValue(mockRegisteredResponse),
    login: vi.fn().mockResolvedValue(mockLoginResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate register to authService.register', async () => {
    const dto: RegisterDto = {
      email: 'bob@example.com',
      password: 'secretPassword',
      name: 'Bob',
    };
    const result = await controller.register(dto);
    expect(result).toEqual(mockRegisteredResponse);
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('should delegate login to authService.login', async () => {
    const dto: LoginDto = {
      email: 'bob@example.com',
      password: 'secretPassword',
    };
    const result = await controller.login(dto);
    expect(result).toEqual(mockLoginResponse);
    expect(service.login).toHaveBeenCalledWith(dto);
  });

  describe('RegisterDto validation', () => {
    it('should fail when email is invalid', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'invalid-email',
        password: 'password123',
        name: 'Bob',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should fail when password is less than 6 characters', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'bob@example.com',
        password: '123',
        name: 'Bob',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should fail when name is empty', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'bob@example.com',
        password: 'password123',
        name: '',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail when role is invalid', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'bob@example.com',
        password: 'password123',
        name: 'Bob',
        role: 'invalid-role',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'role')).toBe(true);
    });

    it('should pass with valid register fields including role', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'bob@example.com',
        password: 'password123',
        name: 'Bob',
        role: Role.ADMIN,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('LoginDto validation', () => {
    it('should fail when email is invalid or missing', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'not-an-email',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should fail when password is empty', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'bob@example.com',
        password: '',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should pass with valid login fields', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'bob@example.com',
        password: 'password123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
