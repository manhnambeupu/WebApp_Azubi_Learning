import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { TokenExpiredError } from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };

  const baseUser = {
    id: 'user-1',
    email: 'student@azubi.de',
    password: '',
    fullName: 'Azubi Student',
    role: Role.STUDENT,
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
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('login đúng email/password trả tokens', async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      password: hashedPassword,
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
  });

  it('login sai password throw UnauthorizedException', async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    usersService.findByEmail.mockResolvedValue({
      ...baseUser,
      password: hashedPassword,
    });

    await expect(
      authService.login('student@azubi.de', 'WrongPassword!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login email không tồn tại throw UnauthorizedException', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login('missing@azubi.de', 'Password123!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh token hợp lệ trả accessToken mới', async () => {
    jwtService.verifyAsync.mockResolvedValue({ userId: baseUser.id });
    usersService.findById.mockResolvedValue({
      ...baseUser,
      password: 'hashed-password',
    });
    jwtService.signAsync.mockResolvedValue('new-access-token');

    const result = await authService.refreshToken('valid-refresh-token');

    expect(result).toEqual({ accessToken: 'new-access-token' });
  });

  it('refresh token hết hạn throw UnauthorizedException', async () => {
    jwtService.verifyAsync.mockRejectedValue(
      new TokenExpiredError('jwt expired', new Date()),
    );

    await expect(
      authService.refreshToken('expired-refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
