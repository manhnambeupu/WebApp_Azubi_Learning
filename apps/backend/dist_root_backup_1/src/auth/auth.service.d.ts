import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
export type JwtAccessPayload = {
    userId: string;
    role: Role;
};
export type AuthUserResponse = {
    id: string;
    email: string;
    fullName: string;
    role: Role;
};
export type LoginResult = {
    accessToken: string;
    refreshToken: string;
    user: AuthUserResponse;
};
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly prisma;
    constructor(usersService: UsersService, jwtService: JwtService, prisma: PrismaService);
    login(email: string, password: string): Promise<LoginResult>;
    generateTokens(user: Pick<User, 'id' | 'role'>): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(token: string): Promise<void>;
    validateUser(payload: JwtAccessPayload): Promise<User | null>;
    toSafeUser(user: Pick<User, 'id' | 'email' | 'fullName' | 'role'>): AuthUserResponse;
    private verifyRefreshToken;
    private get jwtSecret();
    private get refreshJwtSecret();
    private get accessTokenExpiration();
    private get refreshTokenExpiration();
}
