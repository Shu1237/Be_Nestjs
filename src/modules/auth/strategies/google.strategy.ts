import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { GoogleUserType } from 'src/common/utils/type';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const googleClientId = configService.get<string>('google.clientId');
    const googleClientSecret = configService.get<string>('google.clientSecret');
    const googleCallbackUrl = configService.get<string>('google.callbackUrl');

    if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
      throw new InternalServerErrorException(
        'Google OAuth environment variables are not defined',
      );
    }
    super({
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackUrl,
      scope: ['email', 'profile'],
    });

    if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
      throw new InternalServerErrorException(
        'Google OAuth environment variables are not defined',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    // const user = await this.authService.validateGoogleUser({
    //   email: profile.emails[0].value,
    //   avatarUrl: profile.photos[0].value,
    //   password: '',
    // });
    // // done(null, user);
    // return user;
  }
}
