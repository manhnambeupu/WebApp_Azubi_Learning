import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { TokenExpiredError } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  type UserUpdateArgs = {
    where: { id: string };
    data: {
      failedLoginCount?: number;
      lockedUntil?: Date | null;
      refreshTokenHash?: string | null;
    };
  };

  let authService: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let prismaService: {
    user: {
      update: jest.Mock<Promise<unknown>, [UserUpdateArgs]>;
    };
  };

  const baseUser = {
    id: 'user-1',
    email: 'student@azubi.de',
    password: '',
    fullName: 'Azubi Student',
    role: Role.STUDENT,
    refreshTokenHash: null as string | null,
    failedLoginCount: 0,
    lockedUntil: null as Date | null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRATION = '15m';
    process.env.JWT_REFRESH_EXPIRATION = '7d';

    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    prismaService = {
      user: {
        update: jest
          .fn<Promise<unknown>, [UserUpdateArgs]>()
          .mockResolvedValue(baseUser),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('login đúng email/password trả tokens và lưu hash refresh token', async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      password: hashedPassword,
      failedLoginCount: 3,
      lockedUntil: new Date(Date.now() - 60_000),
    });
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await authService.login('student@azubi.de', 'Password123!');

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user).toEqual({
      id: baseUser.id,
      email: baseUser.email,
      fullName: baseUser.fullName,
      role: baseUser.role,
    });
    expect(prismaService.user.update).toHaveBeenCalledTimes(1);
    const firstUpdateArgs = prismaService.user.update.mock.calls[0][0];
    expect(firstUpdateArgs.where).toEqual({ id: baseUser.id });
    expect(firstUpdateArgs.data.failedLoginCount).toBe(0);
    expect(firstUpdateArgs.data.lockedUntil).toBeNull();
    expect(typeof firstUpdateArgs.data.refreshTokenHash).toBe('string');
    const refreshTokenHash = firstUpdateArgs.data.refreshTokenHash;
    if (!refreshTokenHash) {
      throw new Error('Expected refresh token hash to be generated');
    }
    await expect(
      bcrypt.compare('refresh-token', refreshTokenHash),
    ).resolves.toBe(true);
  });

  it('login sai password tăng failedLoginCount', async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      password: hashedPassword,
      failedLoginCount: 2,
    });

    await expect(
      authService.login('student@azubi.de', 'WrongPassword!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: baseUser.id },
      data: {
        failedLoginCount: 3,
        lockedUntil: null,
      },
    });
  });

  it('login khóa tài khoản khi sai password lần thứ 5', async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      password: hashedPassword,
      failedLoginCount: 4,
    });

    await expect(
      authService.login('student@azubi.de', 'WrongPassword!'),
    ).rejects.toThrow('Tài khoản bị khóa. Thử lại sau 15 phút.');

    expect(prismaService.user.update).toHaveBeenCalledTimes(1);
    const firstUpdateArgs = prismaService.user.update.mock.calls[0][0];
    expect(firstUpdateArgs.where).toEqual({ id: baseUser.id });
    expect(firstUpdateArgs.data.failedLoginCount).toBe(5);
    expect(firstUpdateArgs.data.lockedUntil).toBeInstanceOf(Date);
  });

  it('login từ chối khi tài khoản đang bị khóa', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      password: 'hashed-password',
      failedLoginCount: 5,
      lockedUntil: new Date(Date.now() + 5 * 60_000),
    });

    await expect(
      authService.login('student@azubi.de', 'Password123!'),
    ).rejects.toThrow('Tài khoản bị khóa. Thử lại sau');
  });

  it('login email không tồn tại throw UnauthorizedException', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login('missing@azubi.de', 'Password123!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh token hợp lệ trả accessToken mới và rotate refresh token', async () => {
    const currentRefreshTokenHash = await bcrypt.hash(
      'valid-refresh-token',
      12,
    );
    jwtService.verifyAsync.mockResolvedValue({ userId: baseUser.id });
    usersService.findById.mockResolvedValue({
      ...baseUser,
      password: 'hashed-password',
      refreshTokenHash: currentRefreshTokenHash,
    });
    jwtService.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const result = await authService.refreshToken('valid-refresh-token');

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    expect(prismaService.user.update).toHaveBeenCalledTimes(1);
    const firstUpdateArgs = prismaService.user.update.mock.calls[0][0];
    expect(firstUpdateArgs.where).toEqual({ id: baseUser.id });
    expect(typeof firstUpdateArgs.data.refreshTokenHash).toBe('string');
    const rotatedHash = firstUpdateArgs.data.refreshTokenHash;
    if (!rotatedHash) {
      throw new Error('Expected rotated refresh token hash to be generated');
    }
    await expect(
      bcrypt.compare('new-refresh-token', rotatedHash),
    ).resolves.toBe(true);
  });

  it('refresh token không có hash trong DB thì bị từ chối', async () => {
    jwtService.verifyAsync.mockResolvedValue({ userId: baseUser.id });
    usersService.findById.mockResolvedValue({
      ...baseUser,
      password: 'hashed-password',
      refreshTokenHash: null,
    });

    await expect(
      authService.refreshToken('valid-refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh token hết hạn throw UnauthorizedException', async () => {
    jwtService.verifyAsync.mockRejectedValue(
      new TokenExpiredError('jwt expired', new Date()),
    );

    await expect(
      authService.refreshToken('expired-refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logout hợp lệ sẽ revoke refresh token hash', async () => {
    const currentRefreshTokenHash = await bcrypt.hash(
      'valid-refresh-token',
      12,
    );
    jwtService.verifyAsync.mockResolvedValue({ userId: baseUser.id });
    usersService.findById.mockResolvedValue({
      ...baseUser,
      refreshTokenHash: currentRefreshTokenHash,
    });

    await authService.logout('valid-refresh-token');

    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: baseUser.id },
      data: { refreshTokenHash: null },
    });
  });
});
