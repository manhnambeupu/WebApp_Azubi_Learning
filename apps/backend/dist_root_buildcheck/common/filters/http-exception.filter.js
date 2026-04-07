"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
const oauth_exception_1 = require("../exceptions/oauth.exception");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        if (exception instanceof oauth_exception_1.OAuthException) {
            response.redirect(exception.redirectUrl);
            return;
        }
        let statusCode = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';
        if (exception instanceof library_1.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002':
                    statusCode = common_1.HttpStatus.CONFLICT;
                    message = 'Dữ liệu đã tồn tại.';
                    error = 'Conflict';
                    break;
                case 'P2025':
                    statusCode = common_1.HttpStatus.NOT_FOUND;
                    message = 'Không tìm thấy dữ liệu.';
                    error = 'Not Found';
                    break;
                case 'P2003':
                    statusCode = common_1.HttpStatus.CONFLICT;
                    message = 'Dữ liệu liên quan không tồn tại.';
                    error = 'Conflict';
                    break;
            }
        }
        else {
            const exceptionResponse = exception instanceof common_1.HttpException ? exception.getResponse() : null;
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (exceptionResponse && typeof exceptionResponse === 'object') {
                const typedResponse = exceptionResponse;
                if (typedResponse.message !== undefined) {
                    message = typedResponse.message;
                }
                if (typedResponse.error !== undefined) {
                    error = typedResponse.error;
                }
            }
            else if (exception instanceof Error) {
                const isProduction = process.env.NODE_ENV === 'production';
                message = isProduction ? 'Internal Server Error' : exception.message;
            }
        }
        if (statusCode >= common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
            console.error(exception);
        }
        response.status(statusCode).json({
            statusCode,
            message,
            error,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map