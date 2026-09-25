import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Role } from '../enums/role.enum.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({ role: Role.USER });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access when user has the required admin role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockContext({ role: Role.ADMIN });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access when user has user role but admin is required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockContext({ role: Role.USER });
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access when no user is present on the request', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockContext(undefined);
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access when user has no role property', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockContext({ id: 'user-1' });
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });
});
