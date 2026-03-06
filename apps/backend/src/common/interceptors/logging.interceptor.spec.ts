import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('skips logging for non-http contexts', async () => {
    process.env.NODE_ENV = 'development';
    const interceptor = new LoggingInterceptor();
    const context = {
      getType: jest.fn().mockReturnValue('rpc'),
    } as unknown as ExecutionContext;
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(of('ok')),
    };
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('ok');
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('skips logging in production', async () => {
    process.env.NODE_ENV = 'production';
    const interceptor = new LoggingInterceptor();
    const context = {
      getType: jest.fn().mockReturnValue('http'),
    } as unknown as ExecutionContext;
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(of('ok')),
    };
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('ok');
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('logs method, url, status and response time in development', async () => {
    process.env.NODE_ENV = 'development';
    const interceptor = new LoggingInterceptor();
    const context = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          originalUrl: '/api/auth/login',
        }),
        getResponse: () => ({
          statusCode: 200,
        }),
      }),
    } as unknown as ExecutionContext;
    const next: CallHandler = {
      handle: jest.fn().mockReturnValue(of('ok')),
    };
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(1045);
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await lastValueFrom(interceptor.intercept(context, next));

    expect(logSpy).toHaveBeenCalledWith('POST /api/auth/login 200 45ms');
  });
});
