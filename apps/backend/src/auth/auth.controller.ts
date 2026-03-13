import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AuthService,
  AuthUserResponse,
  JwtAccessPayload,
} from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công.' })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu.' })
  @ApiResponse({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: AuthUserResponse }> {
    const { accessToken, refreshToken, user } = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    res.cookie('refreshToken', refreshToken, this.refreshTokenCookieOptions);

    return {
      accessToken,
      user,
    };
  }

  @Post('logout')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công.' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = (
      req.cookies as Record<string, string | undefined> | undefined
    )?.refreshToken;

    try {
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
    } finally {
      res.clearCookie('refreshToken', this.refreshTokenCookieOptions);
    }
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 200, description: 'Làm mới token thành công.' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ.' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = (
      req.cookies as Record<string, string | undefined> | undefined
    )?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const { accessToken, refreshToken: nextRefreshToken } =
      await this.authService.refreshToken(refreshToken);

    res.cookie(
      'refreshToken',
      nextRefreshToken,
      this.refreshTokenCookieOptions,
    );

    return { accessToken };
  }

  @Get('me')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công.' })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token hết hạn.',
  })
  async me(
    @CurrentUser() payload: JwtAccessPayload | undefined,
  ): Promise<AuthUserResponse> {
    if (!payload) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.authService.toSafeUser(user);
  }

  private get refreshTokenCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth',
    };
  }
}
