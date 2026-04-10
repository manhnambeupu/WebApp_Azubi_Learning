import { UserThrottlerGuard } from './user-throttler.guard';

describe('UserThrottlerGuard', () => {
  it('uses JWT userId when available', () => {
    const tracker = UserThrottlerGuard.resolveTracker({
      user: { userId: 'student-1' },
      ip: '127.0.0.1',
    });

    expect(tracker).toBe('student-1');
  });

  it('falls back to legacy user id', () => {
    const tracker = UserThrottlerGuard.resolveTracker({
      user: { id: 'legacy-id' },
      ip: '127.0.0.1',
    });

    expect(tracker).toBe('legacy-id');
  });

  it('falls back to first forwarded ip when user is missing', () => {
    const tracker = UserThrottlerGuard.resolveTracker({
      ips: ['10.10.10.10', '10.10.10.11'],
      ip: '127.0.0.1',
    });

    expect(tracker).toBe('10.10.10.10');
  });

  it('falls back to request ip when forwarded ips are absent', () => {
    const tracker = UserThrottlerGuard.resolveTracker({
      ip: '127.0.0.1',
    });

    expect(tracker).toBe('127.0.0.1');
  });

  it('uses anonymous tracker as last resort', () => {
    const tracker = UserThrottlerGuard.resolveTracker({});

    expect(tracker).toBe('anonymous');
  });
});
