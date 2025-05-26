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


@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(Account)
        private authRepository: Repository<Account>,

        @InjectRepository(Role)
        private roleRepository: Repository<Role>,

        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,

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

        await this.authRepository.save(newAccount);

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

    getAllRefreshTokens() {
        return this.refreshTokenRepository.find()
    }
    async deleteRefreshToken(refreshTokenId: number) {
        return this.refreshTokenRepository.delete({ REFRESH_TOKEN_ID: refreshTokenId })
            .then(result => {
                if (result.affected === 0) {
                    throw new NotFoundException('Refresh token not found');
                }
                return { msg: 'Refresh token deleted successfully' };
            });
    }
    // async logout(refreshToken: string) {
    //     const token = await this.refreshTokenRepository.findOne({
    //         where: { refresh_token: refreshToken },
    //     });

    //     if (!token) {
    //         throw new NotFoundException('Refresh token not found');
    //     }

    //     // Cách 1: Xoá hẳn token
    //     await this.refreshTokenRepository.delete({ refresh_token: refreshToken });

    //     // Hoặc cách 2: Đánh dấu token là revoked
    //     // token.isRevoked = true;
    //     // await this.refreshTokenRepository.save(token);

    //     return { msg: 'Logout successful' };
    // }
}
