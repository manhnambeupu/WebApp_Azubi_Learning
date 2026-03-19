"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = require("jsonwebtoken");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    prisma;
    constructor(usersService, jwtService, prisma) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async login(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const now = new Date();
        if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
            const minutesRemaining = Math.max(1, Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (60 * 1000)));
            throw new common_1.UnauthorizedException(`Tài khoản bị khóa. Thử lại sau ${minutesRemaining} phút.`);
        }
        const passwordMatches = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatches) {
            const nextFailedLoginCount = user.failedLoginCount + 1;
            const shouldLockAccount = nextFailedLoginCount >= 5;
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginCount: nextFailedLoginCount,
                    lockedUntil: shouldLockAccount
                        ? new Date(now.getTime() + 15 * 60 * 1000)
                        : null,
                },
            });
            if (shouldLockAccount) {
                throw new common_1.UnauthorizedException('Tài khoản bị khóa. Thử lại sau 15 phút.');
            }
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const { accessToken, refreshToken } = await this.generateTokens(user);
        const refreshTokenHash = await bcrypt_1.default.hash(refreshToken, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginCount: 0,
                lockedUntil: null,
                refreshTokenHash,
            },
        });
        return {
            accessToken,
            refreshToken,
            user: this.toSafeUser(user),
        };
    }
    async generateTokens(user) {
        const accessPayload = {
            userId: user.id,
            role: user.role,
        };
        const refreshPayload = {
            userId: user.id,
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(accessPayload, {
                secret: this.jwtSecret,
                expiresIn: this.accessTokenExpiration,
            }),
            this.jwtService.signAsync(refreshPayload, {
                secret: this.refreshJwtSecret,
                expiresIn: this.refreshTokenExpiration,
            }),
        ]);
        return {
            accessToken,
            refreshToken,
        };
    }
    async refreshToken(token) {
        const payload = await this.verifyRefreshToken(token);
        const user = await this.usersService.findById(payload.userId);
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const refreshTokenMatches = await bcrypt_1.default.compare(token, user.refreshTokenHash);
        if (!refreshTokenMatches) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const { accessToken, refreshToken } = await this.generateTokens(user);
        const refreshTokenHash = await bcrypt_1.default.hash(refreshToken, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshTokenHash,
            },
        });
        return { accessToken, refreshToken };
    }
    async logout(token) {
        const payload = await this.verifyRefreshToken(token);
        const user = await this.usersService.findById(payload.userId);
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const refreshTokenMatches = await bcrypt_1.default.compare(token, user.refreshTokenHash);
        if (!refreshTokenMatches) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshTokenHash: null,
            },
        });
    }
    validateUser(payload) {
        return this.usersService.findById(payload.userId);
    }
    toSafeUser(user) {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        };
    }
    async verifyRefreshToken(token) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: this.refreshJwtSecret,
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            throw error;
        }
    }
    get jwtSecret() {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new common_1.InternalServerErrorException('JWT_SECRET is not configured');
        }
        return secret;
    }
    get refreshJwtSecret() {
        const secret = process.env.JWT_REFRESH_SECRET;
        if (!secret) {
            throw new common_1.InternalServerErrorException('JWT_REFRESH_SECRET is not configured');
        }
        return secret;
    }
    get accessTokenExpiration() {
        return (process.env.JWT_ACCESS_EXPIRATION ??
            '15m');
    }
    get refreshTokenExpiration() {
        return (process.env.JWT_REFRESH_EXPIRATION ??
            '7d');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map