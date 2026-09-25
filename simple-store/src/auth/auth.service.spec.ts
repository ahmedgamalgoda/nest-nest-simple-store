import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrismaService: any;
  let mockJwtService: any;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'alice@example.com',
    name: 'Alice',
    password: '$2b$10$hashedpasswordstring',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        where: vi.fn().mockReturnThis(),
        first: vi.fn(),
        create: vi.fn(),
      },
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mock-jwt-token-xyz'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user with a hashed password', async () => {
      mockPrismaService.user.first.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const hashSpy = vi.spyOn(bcrypt, 'hash').mockImplementation(async () => '$2b$10$hashedpasswordstring');

      const result = await service.register({
        email: 'alice@example.com',
        password: 'password123',
        name: 'Alice',
      });

      expect(hashSpy).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        email: 'alice@example.com',
        password: '$2b$10$hashedpasswordstring',
        name: 'Alice',
      });
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
      });
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw ConflictException if user with email already exists', async () => {
      mockPrismaService.user.first.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'alice@example.com',
          password: 'password123',
          name: 'Alice',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully login and return an access token', async () => {
      mockPrismaService.user.first.mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.login({
        email: 'alice@example.com',
        password: 'password123',
      });

      expect(result.access_token).toBe('mock-jwt-token-xyz');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockPrismaService.user.first.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockPrismaService.user.first.mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.login({
          email: 'alice@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
