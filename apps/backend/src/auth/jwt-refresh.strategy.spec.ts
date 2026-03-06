import { JwtRefreshStrategy } from './jwt-refresh.strategy';

describe('JwtRefreshStrategy', () => {
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;

  afterEach(() => {
    process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
  });

  it('throws when JWT_REFRESH_SECRET is missing', () => {
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => new JwtRefreshStrategy()).toThrow(
      'JWT_REFRESH_SECRET is not configured',
    );
  });

  it('validates refresh payload', () => {
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    const strategy = new JwtRefreshStrategy();

    const result = strategy.validate({ userId: 'student-1' });

    expect(result).toEqual({ userId: 'student-1' });
  });
});
