import { ExecutionContext } from '@nestjs/common';
declare const FacebookAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class FacebookAuthGuard extends FacebookAuthGuard_base {
    handleRequest<TUser = unknown>(err: unknown, user: TUser, _info: unknown, _context: ExecutionContext, _status?: unknown): TUser;
}
export {};
