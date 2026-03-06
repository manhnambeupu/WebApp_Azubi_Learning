import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: {
    getAllAndOverride: jest.Mock;
  };

  const createContext = (role?: string): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role } : undefined,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows access when no role is required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(createContext('STUDENT'));

    expect(result).toBe(true);
  });

  it('allows access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const result = guard.canActivate(createContext('ADMIN'));

    expect(result).toBe(true);
  });

  it('throws ForbiddenException when role does not match', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(createContext('STUDENT'))).toThrow(
      ForbiddenException,
    );
  });
});
