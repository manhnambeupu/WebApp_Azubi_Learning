import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { OAuthException } from '../exceptions/oauth.exception';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let status: jest.Mock;
  let json: jest.Mock;
  let redirect: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    status = jest.fn().mockReturnThis();
    json = jest.fn();
    redirect = jest.fn();
    host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status,
          json,
          redirect,
        }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('redirects OAuth exceptions to frontend login error URL', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const exception = new OAuthException(
      'http://localhost:3000/login?error=oauth_failed',
    );

    filter.catch(exception, host);

    expect(redirect).toHaveBeenCalledWith(
      'http://localhost:3000/login?error=oauth_failed',
    );
    expect(status).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('formats HttpException payload correctly', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const exception = new BadRequestException({
      message: 'Invalid payload',
      error: 'Bad Request',
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid payload',
        error: 'Bad Request',
        timestamp: expect.any(String),
      }),
    );
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('maps Prisma P2002 to 409 conflict', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const prismaError = new PrismaClientKnownRequestError('Unique conflict', {
      code: 'P2002',
      clientVersion: '5.22.0',
    });

    filter.catch(prismaError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'Dữ liệu đã tồn tại.',
        error: 'Conflict',
      }),
    );
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('returns 500 for unknown errors and logs server errors', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const exception = new Error('Unexpected crash');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unexpected crash',
        error: 'Internal Server Error',
      }),
    );
    expect(errorSpy).toHaveBeenCalledWith(exception);
    errorSpy.mockRestore();
  });
});
