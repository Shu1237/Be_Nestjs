import {
  Body, Controller, Delete, Get, Param, Post,
  UseGuards, Request, ParseIntPipe
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateAccountDto } from './dtos/CreateAccount.dto';
import { LoginDto } from './dtos/Login.dto';
import { JwtAuthGuard } from 'src/guards/auth.guard';

import { ForgotPasswordDto } from './dtos/ForgotPassword.dto';
import { VerifyOtpDto } from './dtos/VerifyOTP.dto';
import { ChangePasswordOtpDto } from './dtos/ChangePasswordOPT.dto';
import { ChangePasswordDto } from './dtos/ChangePassword';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new account' })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  createAccount(@Body() data: CreateAccountDto) {
    return this.authService.createAccount(data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with credentials' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Post('refreshToken')
  @ApiOperation({ summary: 'Refresh JWT using refresh token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string' },
      },
      required: ['refreshToken'],
    },
  })
  refreshToken(@Body() data: { refreshToken: string }) {
    return this.authService.refreshToken(data.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('refreshToken')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all refresh tokens (admin only)' })
  getAllRefreshTokens(@Request() req) {
    return this.authService.getAllRefreshTokens(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('refreshToken/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a refresh token by ID' })
  deleteRefreshToken(
    @Param('id', ParseIntPipe) refreshTokenId: number,
    @Request() req,
  ) {
    return this.authService.deleteRefreshToken(refreshTokenId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  logout(@Body() body: { refreshToken: string }, @Request() req) {
    return this.authService.logout(body.refreshToken, req.user);
  }

  @Post('forgotPassword')
  @ApiOperation({ summary: 'Send OTP to email for password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  checkEmail(@Body() body: ForgotPasswordDto) {
    return this.authService.checkEmail(body.email);
  }

  @Post('verifyOtp')
  @ApiOperation({ summary: 'Verify OTP and get temp token' })
  @ApiBody({ type: VerifyOtpDto })
  verifyOtp(
    @Body('otp', ParseIntPipe) otp: number,
    @Body('email') email: string
  ) {
    return this.authService.verifyOtp(otp, email);
  }

  @Post('changePassword')
  @ApiOperation({ summary: 'Change password using temp token (after OTP)' })
  @ApiBody({ type: ChangePasswordOtpDto })
  changePassword(@Body() body: ChangePasswordOtpDto) {
    return this.authService.changePassword(body.newPassword, body.tmptoken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('changePasswordWasLogin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password when user is logged in' })
  @ApiBody({ type: ChangePasswordDto })
  changePasswordWasLogin(@Body() body: ChangePasswordDto, @Request() req) {
    return this.authService.changePasswordWasLogin(body.newPassword, req.user);
  }
}
