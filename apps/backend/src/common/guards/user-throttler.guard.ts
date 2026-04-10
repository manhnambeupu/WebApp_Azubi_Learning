import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  static resolveTracker(req: Record<string, any>): string {
    const userId = req.user?.userId ?? req.user?.id;
    if (userId !== undefined && userId !== null) {
      return String(userId);
    }

    if (Array.isArray(req.ips) && req.ips.length > 0 && typeof req.ips[0] === 'string') {
      return req.ips[0];
    }

    if (typeof req.ip === 'string' && req.ip.length > 0) {
      return req.ip;
    }

    return 'anonymous';
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return UserThrottlerGuard.resolveTracker(req);
  }
}
