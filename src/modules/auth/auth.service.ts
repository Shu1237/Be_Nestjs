import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  JWTUserType,
  LoginAzureType,
  LogoutType,
} from 'src/common/utils/type';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';
import { randomInt } from 'crypto';
import { User } from 'src/database/entities/user/user';
import { RefreshToken } from 'src/database/entities/user/refresh-token';
import { Role } from 'src/database/entities/user/roles';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { ForbiddenException } from 'src/common/exceptions/forbidden.exception';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { QrCodeService } from 'src/common/qrcode/qrcode.service';





@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>,

    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
    private qrcodeService: QrCodeService,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  // async validateUser(username: string, password: string) {
  //   const user = await this.userRepository.findOne({
  //     where: { username: username },
  //     relations: ['role'],
  //   });
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   const isPasswordValid = await comparePassword(password, user.password);
  //   if (!isPasswordValid) {
  //     throw new UnauthorizedException('Wrong password');
  //   }
  //   if (!user.status) {
  //     throw new UnauthorizedException('Account is disabled');
  //   }
  //   //   console.log('User found:', user);

  //   const result: JWTUserType = {
  //     account_id: user.id,
  //     username: user.username,
  //     role_id: user.role.role_id,
  //   };
  //   return result;
  // }
  async validateRefreshToken(token: string) {
    const record = await this.refreshTokenRepository.findOne({
      where: { refresh_token: token, revoked: false },
      relations: ['user', 'user.role'],
    });

    if (!record || record.expires_at.getTime() < Date.now()) {
      return null;
    }

    record.revoked = true;
    await this.refreshTokenRepository.save(record);

    const payload: JWTUserType = {
      account_id: record.user.id,
      username: record.user.username,
      role_id: record.user.role.role_id,
    };

    return payload;
  }
  // async validateGoogleUser(data: GoogleUserType) {
  //   const existingAccount = await this.userRepository.findOne({
  //     where: { email: data.email },
  //     relations: ['role'],
  //   });

  //   if (existingAccount) {
  //     if (!existingAccount.role) {
  //       throw new Error('User does not have a role assigned');
  //     }

  //     const payload: JWTUserType = {
  //       account_id: existingAccount.id,
  //       username: existingAccount.username,
  //       role_id: existingAccount.role.role_id,
  //     };
  //     return payload;
  //   } else {
  //     const role = await this.roleRepository.findOneBy({ role_id: 1 });
  //     console.log('Role:', role);
  //     if (!role) {
  //       throw new NotFoundException('Default role not found');
  //     }

  //     const newAccount = this.userRepository.create({
  //       username: data.email,
  //       email: data.email,
  //       password: '',
  //       image: data.avatarUrl,
  //       role: role,
  //     });
  //     const savedAccount = await this.userRepository.save(newAccount);

  //     const payload: JWTUserType = {
  //       account_id: savedAccount.id,
  //       username: savedAccount.username,
  //       role_id: savedAccount.role.role_id,
  //     };

  //     const newMember = this.memberRepository.create({
  //       score: 0,
  //       account: savedAccount,
  //     });
  //     await this.memberRepository.save(newMember);

  //     return payload;
  //   }
  // }

  // async createAccount(data: CreateAccountType) {
  //   const roleId = data.role_id ?? 1;
  //   if (roleId > 3 || roleId < 1) {
  //     throw new Error('ROLE_ID must be between 1 and 3');
  //   }

  //   const role = await this.roleRepository.findOneBy({ role_id: roleId });
  //   if (!role) {
  //     throw new NotFoundException(`Role with ID ${roleId} not found`);
  //   }
  //   const existingAccount = await this.userRepository.findOneBy({
  //     email: data.email,
  //   });
  //   if (existingAccount) {
  //     throw new UnauthorizedException('Email already exists');
  //   }
  //   const existingUsername = await this.userRepository.findOneBy({
  //     username: data.username,
  //   });
  //   if (existingUsername) {
  //     throw new UnauthorizedException('Username already exists');
  //   }
  //   const hashedPassword = await hashPassword(data.password);
  //   const { role_id, ...accountData } = data;
  //   // console.log('Account Data:', accountData);

  //   const newAccount = this.userRepository.create({
  //     ...accountData,
  //     password: hashedPassword,
  //     status: true,
  //     role: role,
  //   });
  //   // console.log('New Account:', newAccount);

  //   // // Save account first
  //   const savedAccount = await this.userRepository.save(newAccount);

  //   // role = 1  , create new member
  //   if (roleId === 1) {
  //     const newMember = this.memberRepository.create({
  //       score: 0,
  //       account: savedAccount,
  //     });

  //     await this.memberRepository.save(newMember);
  //   }

  //   return { msg: 'Account created successfully' };
  // }

  async loginAzureAndGoogle(body: LoginAzureType) {
    const { sub, name, email, picture } = body;
    const roleId = body.role_id ?? 1;
    if (!sub || sub.trim() === '') {
      throw new BadRequestException('Sub is required');
    }

    if (!email || email.trim() === '') {
      throw new BadRequestException('Email is required');
    }
    let user = await this.userRepository.findOne({
      where: { email: email },
      relations: ['role'],
    });

    if (!user) {
      // Tạo mới user với id uuid4 sinh mới
      const role = await this.roleRepository.findOneBy({ role_id: roleId });
      if (!role) throw new NotFoundException('Role not found');
      //qr code
      const id = uuidv4();
      const qrCode = await this.qrcodeService.generateQrCode(id);
      user = this.userRepository.create({
        id: id,
        sub: sub,
        username: name,
        email: email,
        avatar: picture,
        score: 0,
        status: true,
        is_deleted: false,
        role: role,
        qr_code: qrCode,
      });

      await this.userRepository.save(user);
    } else {
      // Cập nhật lại các thông tin có thể thay đổi
      let needUpdate = false;

      if (user.sub !== sub) {
        user.sub = sub;
        needUpdate = true;
      }
      if (user.username !== name) {
        user.username = name;
        needUpdate = true;
      }
      if (user.avatar !== picture) {
        user.avatar = picture;
        needUpdate = true;
      }

      if (needUpdate) {
        await this.userRepository.save(user);
      }

      if (!user.status) {
        throw new ForbiddenException('Account is disabled');
      }
    }

    const payload: JWTUserType = {
      account_id: user.id,
      username: user.username,
      role_id: user.role.role_id,
    };

    return {
      msg: 'Login successful',
      token: await this.generateToken(payload),
    };
  }

  async login(user: JWTUserType) {
    // console.log('User:', user);
    const payload = {
      account_id: user.account_id,
      username: user.username,
      role_id: user.role_id,
    };
    // console.log('Payload:', payload);
    return {
      msg: 'Login successful',
      token: await this.generateToken(payload),
    };
  }

  async generateToken(payload: JWTUserType) {
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
    const user = await this.userRepository.findOne({
      where: { id: payload.account_id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // console.log('Access Token:', access_token);
    const refresh_token = uuidv4();
    // console.log('Refresh Token:', refresh_token);

    await this.refreshTokenRepository.save({
      refresh_token: refresh_token,
      access_token: access_token,
      user: user,
      revoked: false,
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //3 days
    });
    return {
      access_token,
      refresh_token,
    };
  }

  async refreshToken(user: JWTUserType) {
    const payload: JWTUserType = {
      account_id: user.account_id,
      username: user.username,
      role_id: user.role_id,
    };
    return {
      msg: 'Refresh token successful',
      token: await this.generateToken(payload),
    };
  }

  async getAllRefreshTokens() {
    return this.refreshTokenRepository.find();
  }
  async deleteRefreshToken(refreshTokenId: number) {
    const token = await this.refreshTokenRepository.findOne({
      where: { id: refreshTokenId },
    });
    if (!token) {
      throw new NotFoundException('Refresh token not found');
    }
    await this.refreshTokenRepository.delete({ id: refreshTokenId });
    return { msg: 'Refresh token deleted successfully' };
  }

  async logout(data: LogoutType, user: JWTUserType) {
    // console.log('Logout Data:', data);
    // console.log('User Data:', user);
    const checkRefreshToken = await this.refreshTokenRepository.findOne({
      where: { refresh_token: data.refresh_token },
      relations: ['user'], // Đảm bảo có quan hệ với user
    });
    // console.log('Check Refresh Token:', checkRefreshToken);
    //   console.log('Check Refresh Token:', checkRefreshToken);

    if (!checkRefreshToken) {
      throw new NotFoundException('Refresh token not found');
    }

    if (checkRefreshToken.user?.id !== user.account_id) {
      throw new ForbiddenException('You are not the owner of this token');
    }

    checkRefreshToken.revoked = true;
    await this.refreshTokenRepository.save(checkRefreshToken);

    return { msg: 'Logout successful' };
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async OtpCode(email: string) {
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
    return otpCode;
  }

  async checkEmail(email: string) {
    // const otpCode = await this.OtpCode(email);
    // await this.cacheManager.set(`email-${email}`, otpCode, { ttl: 60 * 5 } as any);


    // // await this.otpRepository.save({
    // //   otp: otpCode,
    // //   is_used: false,
    // //   expires_at: new Date(Date.now() + 5 * 60 * 1000),
    // // });

    // return { msg: 'OTP sent successfully' };
  }

  async verifyOtp(otp: string, email: string) {
    // const cachedOtp = await this.cacheManager.get(`email-${email}`);
    // if (!cachedOtp) {
    //   throw new UnauthorizedException('OTP has expired or does not exist');
    // }
    // if (cachedOtp !== otp) {
    //   throw new UnauthorizedException('Invalid OTP');
    // }
    // // if (otpRecord.is_used) {
    // //   throw new UnauthorizedException('OTP has already been used');
    // // }
    // // otpRecord.is_used = true;
    // // await this.otpRepository.save(otpRecord);
    // const payload = {
    //   sub: email,
    //   purpose: 'verify_otp',
    // };
    // const tempToken = this.jwtService.sign(payload, {
    //   secret: process.env.TMP_TOKEN_SECRET,
    //   expiresIn: process.env.TMP_EXPIRES_IN,
    // });
    // // await this.otpRepository.delete(otpRecord.id);
    // return { msg: 'OTP verified successfully', token: tempToken };
  }

  // async changePassword(newPassword: string, tmptoken: string) {
  //   const decoded = this.jwtService.verify(tmptoken, {
  //     secret: process.env.TMP_TOKEN_SECRET,
  //   });
  //   if (!decoded || !decoded.sub) {
  //     throw new UnauthorizedException('Invalid token');
  //   }
  //   const email = decoded.sub;
  //   const user = await this.userRepository.findOne({ where: { email: email } });
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   const checkNewPassword = await comparePassword(newPassword, user.password);
  //   if (checkNewPassword) {
  //     throw new BadRequestException('New password cannot be the same as the old password');
  //   }
  //   user.password = await hashPassword(newPassword);
  //   await this.userRepository.save(user);
  //   return { msg: 'Password changed successfully' };
  // }

  // async changePasswordWasLogin(newPassword: string, userData: JWTUserType) {
  //   const user = await this.userRepository.findOne({
  //     where: { id: userData.account_id },
  //   });
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   const checkNewPassword = await comparePassword(newPassword, user.password);
  //   if (checkNewPassword) {
  //     throw new BadRequestException(
  //       'New password cannot be the same as the old password',
  //     );
  //   }
  //   user.password = await hashPassword(newPassword);
  //   await this.userRepository.save(user);
  //   return { msg: 'Password changed successfully' };
  // }
}
