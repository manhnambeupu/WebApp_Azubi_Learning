export declare const ROLES_KEY = "roles";
export type RoleValue = 'ADMIN' | 'STUDENT';
export declare const Roles: (...roles: RoleValue[]) => import("@nestjs/common").CustomDecorator<string>;
