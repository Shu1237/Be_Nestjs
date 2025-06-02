// guards/refresh.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(private authService: AuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const jwtSecret = process.env.JWT_SECRET_KEY;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET_KEY is not defined in environment variables');
    }

    // get access token từ header
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    // check login
    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      // not expired
      jwt.verify(accessToken, jwtSecret);
      // 👉 Nếu access token còn hạn → không cần refresh
      throw new ForbiddenException('Access token is still valid, refresh not allowed');
    } catch (err: any) {
      //  !  het han token
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
