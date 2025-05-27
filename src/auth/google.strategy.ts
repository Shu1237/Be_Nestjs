import fetch from 'node-fetch';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'dotenv';
import { Injectable } from '@nestjs/common';

config();

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:3001/auth/google/callback',
            scope: [
                'email',
                'profile',
                'https://www.googleapis.com/auth/user.birthday.read',
                'https://www.googleapis.com/auth/user.gender.read',
            ],
        });
    }

    // async getExtraGoogleInfo(accessToken: string) {
    //     const res = await fetch(
    //         'https://people.googleapis.com/v1/people/me?personFields=genders,birthdays',
    //         {
    //             headers: {
    //                 Authorization: `Bearer ${accessToken}`,
    //             },
    //         },
    //     );

    //     if (!res.ok) return {};

    //     const data = await res.json();
    //     return {
    //         gender: data.genders?.[0]?.value || null,
    //         birthday: data.birthdays?.[0]?.date || null,
    //     };
    // }

    // async validate(
    //     accessToken: string,
    //     refreshToken: string,
    //     profile: any,
    //     done: VerifyCallback
    // ): Promise<any> {
    //     const { name, emails, photos } = profile;
    //     const extraInfo = await this.getExtraGoogleInfo(accessToken);

    //     // Chuyển birthday thành chuỗi yyyy-mm-dd
    //     const dob = extraInfo.birthday
    //         ? `${extraInfo.birthday.year}-${String(extraInfo.birthday.month).padStart(2, '0')}-${String(extraInfo.birthday.day).padStart(2, '0')}`
    //         : null;

    //     const user = {
    //         ADDRESS: '', // Google không cung cấp
    //         DATE_OF_BIRTH: dob, // Lấy từ People API
    //         EMAIL: emails?.[0]?.value || '',
    //         FULL_NAME: `${name?.familyName || ''} ${name?.givenName || ''}`,
    //         GENDER: extraInfo.gender === 'male' ? '1' : extraInfo.gender === 'female' ? '0' : '', // '1' = nam, '0' = nữ
    //         IDENTITY_CARD: '', // Google không cung cấp
    //         IMAGE: photos?.[0]?.value || '',
    //         PASSWORD: '', // Không có (bạn có thể sinh chuỗi ngẫu nhiên hoặc để trống)
    //         PHONE_NUMBER: '', // Google không cung cấp
    //         USERNAME: emails?.[0]?.value?.split('@')[0] || '',
    //     };

    //     done(null, user);
    // }
    async validate(
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: VerifyCallback
): Promise<any> {
  const user = {
    accessToken, // chỉ để gọi API Google
    idToken: profile.id_token,
    profile,
  };
  done(null, user);
}
}
