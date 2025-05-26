import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/typeorm/entities/Account';
import type { AccountType, LoginType } from 'src/utils/type';
import { Repository } from 'typeorm';
import { Role } from 'src/typeorm/entities/Roles';
import { comparePassword, hashPassword } from 'src/utils/helper';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(Account)
        private authRepository: Repository<Account>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
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
            throw new Error('Invalid password');
        }
        const payload = {
            ACCOUNT_ID: account.ACCOUNT_ID,
            USERNAME: account.USERNAME,
            ROLE_ID: account.role.ROLE_ID,
        };
        return {
            msg: 'Login successful',
            token :{
                access_token: this.jwtService.sign(payload)
            }

        }


    }

}
