import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import type { AccountType, GoogleIdTokenPayload, LoginGoogleType, LoginType, LogoutType } from 'src/utils/type';
import { Repository } from 'typeorm';

import { comparePassword, hashPassword } from 'src/utils/helper';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

import { MailerService } from '@nestjs-modules/mailer';
import { randomInt, verify } from 'crypto';

import * as jwt from 'jsonwebtoken';




@Injectable()
export class AuthService {

    // constructor(
    //     @InjectRepository(Account)
    //     private authRepository: Repository<Account>,

    //     @InjectRepository(Role)
    //     private roleRepository: Repository<Role>,

    //     @InjectRepository(RefreshToken)
    //     private refreshTokenRepository: Repository<RefreshToken>,


    //     @InjectRepository(OtpCode)
    //     private otpRepository: Repository<OtpCode>,

    //     @InjectRepository(Member)
    //     private memberRepository: Repository<Member>,

    //     private mailerService: MailerService,
    //     private jwtService: JwtService,
    // ) { }
    // //google login
    // async getLoginGoogle(bodyData: LoginGoogleType) {
    //     const { googleToken, clientID, ADDRESS, DATE_OF_BIRTH, GENDER, IDENTITY_CARD, PHONE_NUMBER } = bodyData;

    //     if (!googleToken || !clientID) {
    //         throw new UnauthorizedException('Google token and client ID are required');
    //     }

    //     let decoded: GoogleIdTokenPayload;
    //     try {
    //         decoded = this.jwtService.verify<GoogleIdTokenPayload>(googleToken, {
    //             secret: process.env.GOOGLE_CLIENT_SECRET,
    //         });
    //     } catch (err) {
    //         throw new UnauthorizedException('Invalid Google token');
    //     }

    //     if (decoded.aud !== clientID) {
    //         throw new UnauthorizedException('Token audience mismatch');
    //     }

    //     if (decoded.exp < Math.floor(Date.now() / 1000)) {
    //         throw new UnauthorizedException('Google token expired');
    //     }

    //     // Check if user exists
    //     const existingUser = await this.authRepository.findOne({
    //         where: [{ EMAIL: decoded.email }],
    //         relations: ['role'],
    //     });

    //     if (existingUser) {
    //         if (existingUser.STATUS !== 'ACTIVE') {
    //             throw new UnauthorizedException('Account is disabled');
    //         }

    //         const payload = {
    //             ACCOUNT_ID: existingUser.ACCOUNT_ID,
    //             USERNAME: existingUser.USERNAME,
    //             ROLE_ID: existingUser.role.ROLE_ID,
    //         };

    //         return {
    //             msg: 'Login successful',
    //             token: await this.generateToken(payload),
    //         };
    //     }

    //     // Tạo mới tài khoản (mặc định ROLE_ID = 1)
    //     const role = await this.roleRepository.findOneBy({ ROLE_ID: 1 });
    //     if (!role) {
    //         throw new Error('Default role not found');
    //     }

    //     const newAccount = this.authRepository.create({
    //         USERNAME: decoded.email.split('@')[0],
    //         EMAIL: decoded.email,
    //         FULL_NAME: decoded.name,
    //         IMAGE: decoded.picture,
    //         STATUS: 'ACTIVE',
    //         REGISTER_DATE: new Date(),
    //         role: role,
    //     });

    //     const savedAccount = await this.authRepository.save(newAccount);

    //     // Thêm thông tin member
    //     const newMember = this.memberRepository.create({
    //         SCORE: 0,
    //         account: savedAccount,
    //     });

    //     await this.memberRepository.save(newMember);

    //     const payload = {
    //         ACCOUNT_ID: savedAccount.ACCOUNT_ID,
    //         USERNAME: savedAccount.USERNAME,
    //         ROLE_ID: role.ROLE_ID,
    //     };

    //     return {
    //         msg: 'Login successful (via Google)',
    //         token: await this.generateToken(payload),
    //     };
    // }

    // async createAccount(data: AccountType) {
    //     const roleId = data.ROLE_ID ?? 1;
    //     if (roleId > 3 || roleId < 1) {
    //         throw new Error('ROLE_ID must be between 1 and 3');
    //     }

    //     const role = await this.roleRepository.findOneBy({ ROLE_ID: roleId });
    //     if (!role) {
    //         throw new NotFoundException(`Role with ID ${roleId} not found`);
    //     }
    //     const existingAccount = await this.authRepository.findOneBy({ EMAIL: data.EMAIL });
    //     if (existingAccount) {
    //         throw new UnauthorizedException('Email already exists');
    //     }
    //     const hashedPassword = await hashPassword(data.PASSWORD);
    //     const { ROLE_ID, ...accountData } = data;

    //     const newAccount = this.authRepository.create({
    //         ...accountData,
    //         PASSWORD: hashedPassword,
    //         REGISTER_DATE: new Date(),
    //         STATUS: 'ACTIVE',
    //         role: role,
    //     });

    //     // Save account first
    //     const savedAccount = await this.authRepository.save(newAccount);

    //     // Nếu là user thông thường thì thêm member
    //     if (roleId === 1) {
    //         const newMember = this.memberRepository.create({
    //             SCORE: 0,
    //             account: savedAccount,
    //         });

    //         await this.memberRepository.save(newMember);
    //     }

    //     return { msg: 'Account created successfully' };
    // }


    // async login(data: LoginType) {
    //     const { USERNAME, PASSWORD } = data;
    //     if (!USERNAME || !PASSWORD) {
    //         throw new BadRequestException('Username and password are required');
    //     }
    //     const account = await this.authRepository.findOne({
    //         where: { USERNAME },
    //         relations: ['role'],
    //     });

    //     if (!account) {
    //         throw new NotFoundException('Account not found');
    //     }
    //     if (account.STATUS !== 'ACTIVE') {
    //         throw new UnauthorizedException('Account is disabled');
    //     }
    //     const isPasswordValid = await comparePassword(PASSWORD, account.PASSWORD);
    //     if (!isPasswordValid) {
    //         throw new UnauthorizedException('Invalid password');
    //     }

    //     const payload = {
    //         ACCOUNT_ID: account.ACCOUNT_ID,
    //         USERNAME: account.USERNAME,
    //         ROLE_ID: account.role.ROLE_ID,
    //     };

    //     return {
    //         msg: 'Login successful',
    //         token: await this.generateToken(payload),
    //     };
    // }

    // async generateToken(payload: any) {
    //     const access_token = this.jwtService.sign(payload, {
    //         secret: process.env.JWT_SECRET_KEY,
    //         expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    //     });

    //     const refresh_token = uuidv4(); // Sử dụng UUID cho refresh token
    //     await this.refreshTokenRepository.save({
    //         REFRESH_TOKEN: refresh_token,
    //         ACCOUNT_ID: payload.ACCOUNT_ID,
    //         EXPIRES_AT: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // refresh token 
    //         ACCESS_TOKEN: access_token,
    //         CREATED_AT: new Date(),
    //     })
    //     return {
    //         access_token,
    //         refresh_token,
    //     };
    // }



    // async refreshToken(access_token: string, refresh_token: string) {
    //     // 1. Check xem access_token đã hết hạn chưa
    //     try {
    //         this.jwtService.verify(access_token, {
    //             secret: process.env.JWT_SECRET_KEY,
    //             ignoreExpiration: false, // KHÔNG bỏ qua hạn
    //         });

    //         // Nếu tới đây nghĩa là token chưa hết hạn → Không cho refresh
    //         throw new UnauthorizedException('Access token is still valid. No need to refresh.');
    //     } catch (err) {
    //         // Nếu token hết hạn (TokenExpiredError) → Cho phép tiếp tục
    //         if (err.name === 'TokenExpiredError') {
    //             console.log('Access token expired. Proceeding with refresh...');
    //         } else {
    //             console.error(' Invalid token error:', err.message);
    //             throw new UnauthorizedException('Access token is invalid');
    //         }
    //     }

    //     // 2. Kiểm tra trong DB
    //     const token = await this.refreshTokenRepository.findOne({
    //         where: { REFRESH_TOKEN: refresh_token, ACCESS_TOKEN: access_token },
    //     });

    //     if (!token) {
    //         throw new UnauthorizedException('Refresh token not found');
    //     }

    //     if (token.IS_USED) {
    //         throw new UnauthorizedException('Refresh token already used');
    //     }

    //     // 3. Tìm lại user và tạo token mới
    //     const checkUser = await this.authRepository.findOne({
    //         where: { ACCOUNT_ID: String(token.ACCOUNT_ID) },
    //         relations: ['role'],
    //     });

    //     if (!checkUser) {
    //         throw new NotFoundException('User not found');
    //     }

    //     const payload = {
    //         ACCOUNT_ID: checkUser.ACCOUNT_ID,
    //         USERNAME: checkUser.USERNAME,
    //         ROLE_ID: checkUser.role.ROLE_ID,
    //     };

    //     // Mark old token as used
    //     token.IS_USED = true;
    //     await this.refreshTokenRepository.save(token);

    //     return this.generateToken(payload);
    // }


    // async getAllRefreshTokens(user: any) {
    //     // if (user.ROLE_ID !== 3) { // Chỉ admin (ROLE_ID = 3) mới được truy cập
    //     //     throw new UnauthorizedException('Only admin can view refresh tokens');
    //     // }
    //     return this.refreshTokenRepository.find();
    // }
    // async deleteRefreshToken(refreshTokenId: number, user: any) {
    //     const token = await this.refreshTokenRepository.findOne({
    //         where: { REFRESH_TOKEN_ID: refreshTokenId },
    //     });

    //     if (!token) {
    //         throw new NotFoundException('Refresh token not found');
    //     }

    //     // Admin hoặc chủ sở hữu token mới được xóa
    //     if (user.ROLE_ID !== 3 && token.ACCOUNT_ID !== user.ACCOUNT_ID) {
    //         throw new UnauthorizedException('Not authorized to delete this refresh token');
    //     }

    //     await this.refreshTokenRepository.delete({ REFRESH_TOKEN_ID: refreshTokenId });
    //     return { msg: 'Refresh token deleted successfully' };
    // }

    // async logout(body: LogoutType, user: any) {
    //     const checkRefreshToken = await this.refreshTokenRepository.findOne({
    //         where: { REFRESH_TOKEN: body.refreshToken },
    //     });


    //     if (!checkRefreshToken) {
    //         throw new NotFoundException('Refresh token not found');
    //     }


    //     if (checkRefreshToken.ACCOUNT_ID !== user.ACCOUNT_ID) {
    //         throw new UnauthorizedException('You are not the owner of this token');
    //     }

    //     checkRefreshToken.IS_USED = true;
    //     await this.refreshTokenRepository.save(checkRefreshToken);

    //     return { msg: 'Logout successful' };
    // }

    // async getUserById(accountId: string) {
    //     const user = await this.authRepository.findOne({
    //         where: { ACCOUNT_ID: accountId },
    //     });
    //     if (!user) {
    //         throw new NotFoundException('User not found');
    //     }
    //     return user;
    // }

    // async OtpCode(email: string) {
    //     const otpCode = randomInt(100000, 999999).toString();

    //     // Gửi mail
    //     await this.mailerService.sendMail({
    //         to: email,
    //         subject: 'Your OTP Code',
    //         template: 'otp',
    //         context: {
    //             code: otpCode,
    //             year: new Date().getFullYear(),
    //         },
    //     });
    //     return otpCode;
    // }



    // async checkEmail(email: string) {
    //     const user = await this.authRepository.findOne({
    //         where: { EMAIL: email },
    //     });

    //     if (!user) {
    //         throw new NotFoundException('Email not found');
    //     }

    //     const otpCode = await this.OtpCode(email);

    //     await this.otpRepository.save({
    //         otp: Number(otpCode),
    //         expiresAt: new Date(Date.now() + 5 * 60 * 1000), //5m
    //         account: user
    //     });

    //     return { msg: 'OTP sent successfully' };
    // }


    // async verifyOtp(otp: number) {
    //     const otpRecord = await this.otpRepository.findOne({
    //         where: { otp: otp },
    //         relations: ['account'],

    //     });
    //     // console.log('OTP Record:', otpRecord);

    //     if (!otpRecord) {
    //         throw new UnauthorizedException('Invalid OTP');
    //     }
    //     const currentTime = new Date();
    //     if (otpRecord.expiresAt < currentTime) {
    //         throw new UnauthorizedException('OTP has expired');
    //     }
    //     if (otpRecord.is_used) {
    //         throw new UnauthorizedException('OTP has already been used');
    //     }
    //     otpRecord.is_used = true;
    //     await this.otpRepository.save(otpRecord);
    //     const payload = {
    //         sub: otpRecord.account.ACCOUNT_ID,
    //         purpose: 'verify_otp',
    //     };
    //     const tempToken = this.jwtService.sign(payload, {
    //         secret: process.env.TMP_TOKEN_SECRET,
    //         expiresIn: process.env.TMP_EXPIRES_IN,
    //     });
    //     // await this.otpRepository.delete(otpRecord.id);
    //     return { msg: 'OTP verified successfully', token: tempToken };
    // }

    // async changePassword(newPassword: string, tmptoken: string) {
    //     const decoded = this.jwtService.verify(tmptoken, {
    //         secret: process.env.TMP_TOKEN_SECRET,
    //     });
    //     if (!decoded || !decoded.sub) {
    //         throw new UnauthorizedException('Invalid token');
    //     }
    //     const accountId = decoded.sub;
    //     const user = await this.authRepository.findOne({ where: { ACCOUNT_ID: accountId } });
    //     if (!user) {
    //         throw new NotFoundException('User not found');
    //     }
    //     const checkNewPassword = await comparePassword(newPassword, user.PASSWORD);
    //     if (checkNewPassword) {
    //         throw new BadRequestException('New password cannot be the same as the old password');
    //     }
    //     user.PASSWORD = await hashPassword(newPassword);
    //     await this.authRepository.save(user);
    //     return { msg: 'Password changed successfully' };
    // }

    // async changePasswordWasLogin(newPassword: string, userData: any) {
    //     const user = await this.authRepository.findOne({
    //         where: { ACCOUNT_ID: userData.ACCOUNT_ID },
    //     });
    //     if (!user) {
    //         throw new NotFoundException('User not found');
    //     }
    //     const checkNewPassword = await comparePassword(newPassword, user.PASSWORD);
    //     if (checkNewPassword) {
    //         throw new BadRequestException('New password cannot be the same as the old password');
    //     }
    //     user.PASSWORD = await hashPassword(newPassword);
    //     await this.authRepository.save(user);
    //     return { msg: 'Password changed successfully' };
    // }


}


