import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { JsonWebTokenError } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

type JwtRefreshPayload = {
  userId: string;
};

export type JwtAccessPayload = {
  userId: string;
  role: Role;
};

export type AuthUserResponse = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
      const minutesRemaining = Math.max(
        1,
        Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (60 * 1000)),
      );
      throw new UnauthorizedException(
        `Tài khoản bị khóa. Thử lại sau ${minutesRemaining} phút.`,
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      const nextFailedLoginCount = user.failedLoginCount + 1;
      const shouldLockAccount = nextFailedLoginCount >= 5;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: nextFailedLoginCount,
          lockedUntil: shouldLockAccount
            ? new Date(now.getTime() + 15 * 60 * 1000)
            : null,
        },
      });

      if (shouldLockAccount) {
        throw new UnauthorizedException(
          'Tài khoản bị khóa. Thử lại sau 15 phút.',
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        refreshTokenHash,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toSafeUser(user),
    };
  }

  async generateTokens(
    user: Pick<User, 'id' | 'role'>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload: JwtAccessPayload = {
      userId: user.id,
      role: user.role,
    };

    const refreshPayload: JwtRefreshPayload = {
      userId: user.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.jwtSecret,
        expiresIn: this.accessTokenExpiration,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshJwtSecret,
        expiresIn: this.refreshTokenExpiration,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = await this.verifyRefreshToken(token);
    const user = await this.usersService.findById(payload.userId);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenMatches = await bcrypt.compare(
      token,
      user.refreshTokenHash,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
      },
    });

    return { accessToken, refreshToken };
  }

  async logout(token: string): Promise<void> {
    const payload = await this.verifyRefreshToken(token);
    const user = await this.usersService.findById(payload.userId);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenMatches = await bcrypt.compare(
      token,
      user.refreshTokenHash,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: null,
      },
    });
  }

  validateUser(payload: JwtAccessPayload): Promise<User | null> {
    return this.usersService.findById(payload.userId);
  }

  toSafeUser(
    user: Pick<User, 'id' | 'email' | 'fullName' | 'role'>,
  ): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  private async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtRefreshPayload>(token, {
        secret: this.refreshJwtSecret,
      });
    } catch (error: unknown) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw error;
    }
  }

  private get jwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }
    return secret;
  }

  private get refreshJwtSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new InternalServerErrorException(
        'JWT_REFRESH_SECRET is not configured',
      );
    }
    return secret;
  }

  private get accessTokenExpiration(): SignOptions['expiresIn'] {
    return (process.env.JWT_ACCESS_EXPIRATION ??
      '15m') as SignOptions['expiresIn'];
  }

  private get refreshTokenExpiration(): SignOptions['expiresIn'] {
    return (process.env.JWT_REFRESH_EXPIRATION ??
      '7d') as SignOptions['expiresIn'];
  }
}
