import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';

type ExceptionResponsePayload = {
  message?: string | string[];
  error?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          statusCode = HttpStatus.CONFLICT;
          message = 'Dữ liệu đã tồn tại.';
          error = 'Conflict';
          break;
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          message = 'Không tìm thấy dữ liệu.';
          error = 'Not Found';
          break;
        case 'P2003':
          statusCode = HttpStatus.CONFLICT;
          message = 'Dữ liệu liên quan không tồn tại.';
          error = 'Conflict';
          break;
      }
    } else {
      const exceptionResponse =
        exception instanceof HttpException ? exception.getResponse() : null;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === 'object') {
        const typedResponse = exceptionResponse as ExceptionResponsePayload;

        if (typedResponse.message !== undefined) {
          message = typedResponse.message;
        }
        if (typedResponse.error !== undefined) {
          error = typedResponse.error;
        }
      } else if (exception instanceof Error) {
        const isProduction = process.env.NODE_ENV === 'production';
        message = isProduction ? 'Internal Server Error' : exception.message;
      }
    }

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(exception);
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
