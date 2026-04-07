import type { Request, Response } from 'express';
import { AuthService, AuthUserResponse, JwtAccessPayload } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, res: Response): Promise<{
        accessToken: string;
        user: AuthUserResponse;
    }>;
    logout(req: Request, res: Response): Promise<{
        message: string;
    }>;
    refreshToken(req: Request, res: Response): Promise<{
        accessToken: string;
    }>;
    me(payload: JwtAccessPayload | undefined): Promise<AuthUserResponse>;
    googleLogin(): void;
    googleCallback(req: Request, res: Response): Promise<void>;
    facebookLogin(): void;
    facebookCallback(req: Request, res: Response): Promise<void>;
    private get refreshTokenCookieOptions();
}
