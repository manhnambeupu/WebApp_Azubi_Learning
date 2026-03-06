import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JwtRefreshPayload = {
  userId: string;
};

const extractRefreshTokenFromCookie = (req: Request): string | null => {
  const refreshToken = (
    req?.cookies as Record<string, string | undefined> | undefined
  )?.refreshToken;

  return refreshToken ?? null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshTokenFromCookie]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtRefreshPayload): { userId: string } {
    return {
      userId: payload.userId,
    };
  }
}
