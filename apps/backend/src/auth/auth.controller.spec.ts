import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService, AuthUserResponse } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    logout: jest.Mock;
    refreshToken: jest.Mock;
    validateUser: jest.Mock;
    toSafeUser: jest.Mock;
  };

  const baseUser: AuthUserResponse = {
    id: 'user-1',
    email: 'admin@azubi.de',
    fullName: 'Azubi Admin',
    role: Role.ADMIN,
  };

  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    authService = {
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      validateUser: jest.fn(),
      toSafeUser: jest.fn(),
    };
    controller = new AuthController(authService as unknown as AuthService);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('login calls auth service and sets refresh token cookie', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: baseUser,
    });
    const response = {
      cookie: jest.fn(),
    } as unknown as Parameters<AuthController['login']>[1];

    const result = await controller.login(
      {
        email: 'admin@azubi.de',
        password: 'Admin123!',
      },
      response,
    );

    expect(authService.login).toHaveBeenCalledWith(
      'admin@azubi.de',
      'Admin123!',
    );
    expect((response as { cookie: jest.Mock }).cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/api/auth',
        secure: false,
      }),
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      user: baseUser,
    });
  });

  it('login sets secure cookie in production', async () => {
    process.env.NODE_ENV = 'production';
    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: baseUser,
    });
    const response = {
      cookie: jest.fn(),
    } as unknown as Parameters<AuthController['login']>[1];

    await controller.login(
      {
        email: 'admin@azubi.de',
        password: 'Admin123!',
      },
      response,
    );

    expect((response as { cookie: jest.Mock }).cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({
        secure: true,
      }),
    );
  });

  it('logout clears refresh token cookie và revoke hash khi có cookie', async () => {
    const response = {
      clearCookie: jest.fn(),
    } as unknown as Parameters<AuthController['logout']>[1];

    const result = await controller.logout(
      { cookies: { refreshToken: 'refresh-token' } } as never,
      response,
    );

    expect(authService.logout).toHaveBeenCalledWith('refresh-token');
    expect(
      (response as { clearCookie: jest.Mock }).clearCookie,
    ).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/api/auth',
      }),
    );
    expect(result).toEqual({ message: 'Logged out successfully' });
  });

  it('logout vẫn clear cookie khi thiếu refresh token', async () => {
    const response = {
      clearCookie: jest.fn(),
    } as unknown as Parameters<AuthController['logout']>[1];

    const result = await controller.logout({ cookies: {} } as never, response);

    expect(authService.logout).not.toHaveBeenCalled();
    expect(
      (response as { clearCookie: jest.Mock }).clearCookie,
    ).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Logged out successfully' });
  });

  it('refreshToken throws when cookie is missing', async () => {
    await expect(
      controller.refreshToken(
        { cookies: {} } as never,
        { cookie: jest.fn() } as never,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshToken returns access token và rotate cookie refresh token', async () => {
    authService.refreshToken.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'rotated-refresh-token',
    });
    const response = {
      cookie: jest.fn(),
    } as unknown as Parameters<AuthController['refreshToken']>[1];

    const result = await controller.refreshToken(
      {
        cookies: { refreshToken: 'refresh-token' },
      } as never,
      response,
    );

    expect(authService.refreshToken).toHaveBeenCalledWith('refresh-token');
    expect((response as { cookie: jest.Mock }).cookie).toHaveBeenCalledWith(
      'refreshToken',
      'rotated-refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/api/auth',
      }),
    );
    expect(result).toEqual({ accessToken: 'new-access-token' });
  });

  it('me throws when payload is missing', async () => {
    await expect(controller.me(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('me throws when user no longer exists', async () => {
    authService.validateUser.mockResolvedValue(null);

    await expect(
      controller.me({
        userId: baseUser.id,
        role: baseUser.role,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('me returns safe user profile', async () => {
    authService.validateUser.mockResolvedValue({
      ...baseUser,
      password: 'hashed-password',
      createdAt: new Date(),
    });
    authService.toSafeUser.mockReturnValue(baseUser);

    const result = await controller.me({
      userId: baseUser.id,
      role: baseUser.role,
    });

    expect(authService.validateUser).toHaveBeenCalledWith({
      userId: baseUser.id,
      role: baseUser.role,
    });
    expect(authService.toSafeUser).toHaveBeenCalled();
    expect(result).toEqual(baseUser);
  });
});
