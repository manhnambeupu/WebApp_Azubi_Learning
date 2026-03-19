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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto, res) {
        const { accessToken, refreshToken, user } = await this.authService.login(loginDto.email, loginDto.password);
        res.cookie('refreshToken', refreshToken, this.refreshTokenCookieOptions);
        return {
            accessToken,
            user,
        };
    }
    async logout(req, res) {
        const refreshToken = req.cookies?.refreshToken;
        try {
            if (refreshToken) {
                await this.authService.logout(refreshToken);
            }
        }
        finally {
            res.clearCookie('refreshToken', this.refreshTokenCookieOptions);
        }
        return { message: 'Logged out successfully' };
    }
    async refreshToken(req, res) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token is missing');
        }
        const { accessToken, refreshToken: nextRefreshToken } = await this.authService.refreshToken(refreshToken);
        res.cookie('refreshToken', nextRefreshToken, this.refreshTokenCookieOptions);
        return { accessToken };
    }
    async me(payload) {
        if (!payload) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        const user = await this.authService.validateUser(payload);
        if (!user) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        return this.authService.toSafeUser(user);
    }
    get refreshTokenCookieOptions() {
        return {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            path: '/api/auth',
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng nhập' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Đăng nhập thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Sai email hoặc mật khẩu.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng xuất' }),
    (0, swagger_1.ApiCookieAuth)('refreshToken'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Đăng xuất thành công.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Làm mới access token' }),
    (0, swagger_1.ApiCookieAuth)('refreshToken'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Làm mới token thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Refresh token không hợp lệ.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin người dùng hiện tại' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy thông tin thành công.' }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Chưa đăng nhập hoặc token hết hạn.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map