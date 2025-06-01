// strategies/refresh.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'refresh-token') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: Request) {
    const refreshToken = req.body.refresh_token || req.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const user = await this.authService.validateRefreshToken(refreshToken);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return user; 
  }
}
