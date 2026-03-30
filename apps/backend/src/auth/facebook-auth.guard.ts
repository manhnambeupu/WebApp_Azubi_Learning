import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthException } from '../common/exceptions/oauth.exception';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      throw new OAuthException(`${frontendUrl}/login?error=oauth_failed`);
    }

    return user;
  }
}
