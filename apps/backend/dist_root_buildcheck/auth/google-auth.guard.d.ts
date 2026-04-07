import { ExecutionContext } from '@nestjs/common';
declare const GoogleAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class GoogleAuthGuard extends GoogleAuthGuard_base {
    handleRequest<TUser = unknown>(err: unknown, user: TUser, _info: unknown, _context: ExecutionContext, _status?: unknown): TUser;
}
export {};
