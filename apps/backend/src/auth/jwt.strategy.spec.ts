import { Role } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => new JwtStrategy()).toThrow('JWT_SECRET is not configured');
  });

  it('validates payload shape', () => {
    process.env.JWT_SECRET = 'test-secret';
    const strategy = new JwtStrategy();

    const result = strategy.validate({
      userId: 'user-1',
      role: Role.ADMIN,
    });

    expect(result).toEqual({
      userId: 'user-1',
      role: Role.ADMIN,
    });
  });
});
