
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from 'src/modules/auth/auth.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '../exceptions/internal-server-error.exception';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const jwtSecret = this.configService.get<string>('jwt.secret');

    if (!jwtSecret) {
      throw new InternalServerErrorException(
        'JWT_SECRET_KEY is not defined in environment variables',
      );
    }

    // get access token từ header
    const authHeader = req.headers['authorization'];
    const accessToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : undefined;
    // check login
    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      // not expired
      jwt.verify(accessToken, jwtSecret);
      //  Nếu access token còn hạn → không cần refresh
      throw new ForbiddenException(
        'Access token is still valid, refresh not allowed',
      );
    } catch (err: any) {
      // !  het han token
      if (err.name !== 'TokenExpiredError') {
        throw new UnauthorizedException('Access token is invalid');
      }
    }

    // get refresh token from body or cookies
    const refreshToken = req.body.refresh_token || req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    //  check refresh token in db
    const user = await this.authService.validateRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    req.user = user;
    return true;
  }
}
