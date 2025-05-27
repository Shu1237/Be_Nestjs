import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/typeorm/entities/Account';
import type { AccountType, LoginType } from 'src/utils/type';
import { Repository } from 'typeorm';
import { Role } from 'src/typeorm/entities/Roles';
import { comparePassword, hashPassword } from 'src/utils/helper';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from 'src/typeorm/entities/RefreshToken';
import { MailerService } from '@nestjs-modules/mailer';
import { randomInt, verify } from 'crypto';
import { OtpCode } from 'src/typeorm/entities/OtpCode';
import { Member } from 'src/typeorm/entities/Member';


@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(Account)
        private authRepository: Repository<Account>,

        @InjectRepository(Role)
        private roleRepository: Repository<Role>,

        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,


        @InjectRepository(OtpCode)
        private otpRepository: Repository<OtpCode>,

        @InjectRepository(Member)
        private memberRepository: Repository<Member>, 

        private mailerService: MailerService,
        private jwtService: JwtService,
    ) { }

    async createAccount(data: AccountType) {
        const roleId = data.ROLE_ID ?? 1;
        if (roleId > 3 || roleId < 1) {
            throw new Error('ROLE_ID must be between 1 and 3');
        }

        const role = await this.roleRepository.findOneBy({ ROLE_ID: roleId });
        if (!role) {
            throw new Error(`Role with ID ${roleId} not found`);
        }

        const hashedPassword = await hashPassword(data.PASSWORD);
        const { ROLE_ID, ...accountData } = data;

        const newAccount = this.authRepository.create({
            ...accountData,
            PASSWORD: hashedPassword,
            REGISTER_DATE: new Date(),
            STATUS: 'ACTIVE',
            role: role,
        });

        // Save account first
        const savedAccount = await this.authRepository.save(newAccount);

        // Nếu là user thông thường thì thêm member
        if (roleId === 1) {
            const newMember = this.memberRepository.create({
                SCORE: 0,
                account: savedAccount,
            });

            await this.memberRepository.save(newMember);
        }

        return { msg: 'Account created successfully' };
    }


    async login(data: LoginType) {
        const { USERNAME, PASSWORD } = data;

        const account = await this.authRepository.findOne({
            where: { USERNAME },
            relations: ['role'],
        });

        if (!account) {
            throw new NotFoundException('Account not found');
        }

        const isPasswordValid = await comparePassword(PASSWORD, account.PASSWORD);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        const payload = {
            ACCOUNT_ID: account.ACCOUNT_ID,
            USERNAME: account.USERNAME,
            ROLE_ID: account.role.ROLE_ID,
        };

        return {
            msg: 'Login successful',
            token: await this.generateToken(payload),
        };
    }

    async generateToken(payload: any) {
        const access_token = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET_KEY,
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        });

        const refresh_token = uuidv4(); // Sử dụng UUID cho refresh token
        await this.refreshTokenRepository.save({
            REFRESH_TOKEN: refresh_token,
            ACCOUNT_ID: payload.ACCOUNT_ID,
            EXPIRES_AT: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // refresh token 
            ACCESS_TOKEN: access_token,
            CREATED_AT: new Date(),
        })
        return {
            access_token,
            refresh_token,
        };
    }

    async refreshToken(refreshToken: string) {
        const token = await this.refreshTokenRepository.findOne({
            where: { REFRESH_TOKEN: refreshToken },
        });

        if (!token) {
            throw new UnauthorizedException('Refresh token not found');
        }
        token.IS_USED = true; // Đánh dấu refresh token đã được sử dụng
        await this.refreshTokenRepository.save(token);

        const checkUser = await this.authRepository.findOne({
            where: { ACCOUNT_ID: String(token.ACCOUNT_ID) },
            relations: ['role'],
        })

        if (!checkUser) {
            throw new NotFoundException('User not found');
        }

        const payload = {
            ACCOUNT_ID: checkUser.ACCOUNT_ID,
            USERNAME: checkUser.USERNAME,
            ROLE_ID: checkUser.role.ROLE_ID,
        };

        return this.generateToken(payload)



    }

    async getAllRefreshTokens(user: any) {
        if (user.ROLE_ID !== 3) { // Chỉ admin (ROLE_ID = 3) mới được truy cập
            throw new UnauthorizedException('Only admin can view refresh tokens');
        }
        return this.refreshTokenRepository.find();
    }
    async deleteRefreshToken(refreshTokenId: number, user: any) {
        const token = await this.refreshTokenRepository.findOne({
            where: { REFRESH_TOKEN_ID: refreshTokenId },
        });

        if (!token) {
            throw new NotFoundException('Refresh token not found');
        }

        // Admin hoặc chủ sở hữu token mới được xóa
        if (user.ROLE_ID !== 3 && token.ACCOUNT_ID !== user.ACCOUNT_ID) {
            throw new UnauthorizedException('Not authorized to delete this refresh token');
        }

        await this.refreshTokenRepository.delete({ REFRESH_TOKEN_ID: refreshTokenId });
        return { msg: 'Refresh token deleted successfully' };
    }

    async logout(refreshToken: string, user: any) {
        const checkRefreshToken = await this.refreshTokenRepository.findOne({
            where: { REFRESH_TOKEN: refreshToken },
        });

        if (!checkRefreshToken) {
            throw new NotFoundException('Refresh token not found');
        }

        // Chỉ cho phép logout nếu token thuộc về user hiện tại
        if (checkRefreshToken.ACCOUNT_ID !== user.ACCOUNT_ID) {
            throw new UnauthorizedException('You are not the owner of this token');
        }

        checkRefreshToken.IS_USED = true;
        await this.refreshTokenRepository.save(checkRefreshToken);

        return { msg: 'Logout successful' };
    }





    async getUserById(accountId: string) {
        const user = await this.authRepository.findOne({
            where: { ACCOUNT_ID: accountId },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async checkEmail(email: string) {
        const user = await this.authRepository.findOne({
            where: { EMAIL: email },
        });

        if (!user) {
            throw new NotFoundException('Email not found');
        }

        const otpCode = randomInt(100000, 999999).toString();

        // Gửi mail
        await this.mailerService.sendMail({
            to: email,
            subject: 'Your OTP Code',
            template: 'otp',
            context: {
                code: otpCode,
                year: new Date().getFullYear(),
            },
        });
        // Lưu OTP vào DB
        await this.otpRepository.save({
            email,
            code: Number(otpCode),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 phút
        });

        return { msg: 'OTP sent successfully', email: email };
    }


    async verifyOtp(otp: number, email: string) {
        const otpRecord = await this.otpRepository.findOne({
            where: { code: otp, email: email },
        });

        if (!otpRecord) {
            throw new UnauthorizedException('Invalid OTP');
        }
        const tempToken = this.jwtService.sign(
            { email },
            { secret: process.env.TMP_TOKEN_SECRET, expiresIn: '10m' }
        );
        const currentTime = new Date();
        if (otpRecord.expiresAt < currentTime) {
            throw new UnauthorizedException('OTP has expired');
        }

        await this.otpRepository.delete(otpRecord.id);
        return { msg: 'OTP verified successfully', token: tempToken };
    }

    async changePassword(newPassword: string, tmptoken: string) {
        const decoded = this.jwtService.verify(tmptoken, {
            secret: process.env.TMP_TOKEN_SECRET,
        });
        if (!decoded || !decoded.email) {
            throw new UnauthorizedException('Invalid token');
        }
        const email = decoded.email;
        const user = await this.authRepository.findOne({ where: { EMAIL: email } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.PASSWORD = await hashPassword(newPassword);
        await this.authRepository.save(user);
        return { msg: 'Password changed successfully' };
    }

    async changePasswordWasLogin(newPassword: string, userData: any) {
        const user = await this.authRepository.findOne({
            where: { ACCOUNT_ID: userData.ACCOUNT_ID },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.PASSWORD = await hashPassword(newPassword);
        await this.authRepository.save(user);
        return { msg: 'Password changed successfully' };
    }


}


