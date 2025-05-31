import {
  Body, Controller, Delete, Get, Param, Post,
  UseGuards, Request, ParseIntPipe,
  Req
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
import { AuthGuard } from '@nestjs/passport';
import { LoginGoogleDto } from './dtos/LoginGoogle.dto';
import { LogoutDto } from './dtos/Logout.dto';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  // @Post('register')
  // @ApiOperation({ summary: 'Register new account' })
  // @ApiBody({ type: CreateAccountDto })
  // @ApiResponse({ status: 201, description: 'Account created successfully' })
  // createAccount(@Body() data: CreateAccountDto) {
  //   return this.authService.createAccount(data);
  // }



  // // //Login google
  // // @UseGuards(AuthGuard('google'))
  // // @Get('goolge')
  // // async googleAuth(@Request() req) { }

  // // @Get('google/callback')
  // // @UseGuards(AuthGuard('google'))
  // // googleAuthRedirect(@Req() req) {
  // //   return this.authService.googleLogin(req)
  // // }

  // @Post('google')
  // getLoginGoogle(@Body() bodyData: LoginGoogleDto) {
  //   return this.authService.getLoginGoogle(bodyData);
  // }



  // @Post('login')
  // @ApiOperation({ summary: 'Login with credentials' })
  // @ApiBody({ type: LoginDto })
  // @ApiResponse({ status: 200, description: 'Login successful' })
  // login(@Body() data: LoginDto) {
  //   return this.authService.login(data);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Get('refreshToken')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get all refresh tokens (admin only)' })
  // getAllRefreshTokens(@Request() req) {
  //   return this.authService.getAllRefreshTokens(req.user);
  // }



  // @Post('refreshToken')
  // @ApiOperation({ summary: 'Refresh JWT using refresh token' })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       access_token: { type: 'string' },
  //       refresh_token: { type: 'string' }
  //     },
  //     required: ['refreshToken', 'accessToken'],

  //   },
  // })
  // refreshToken(@Body() data: { access_token: string, refresh_token: string }) {
  //   return this.authService.refreshToken(data.access_token, data.refresh_token);
  // }


  // @UseGuards(JwtAuthGuard)
  // @Delete('refreshToken/:id')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Delete a refresh token by ID' })
  // deleteRefreshToken(
  //   @Param('id', ParseIntPipe) refreshTokenId: number,
  //   @Request() req,
  // ) {
  //   return this.authService.deleteRefreshToken(refreshTokenId, req.user);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Post('logout')
  // @ApiBearerAuth()
  // @ApiBody({ type: LogoutDto })
  // @ApiOperation({ summary: 'Logout current session' })
  // logout(@Body() body: LogoutDto, @Request() req) {
  //   return this.authService.logout(body, req.user);
  // }

  // @Post('forgotPassword')
  // @ApiOperation({ summary: 'Send OTP to email for password reset' })
  // @ApiBody({ type: ForgotPasswordDto })
  // checkEmail(@Body() body: ForgotPasswordDto) {
  //   return this.authService.checkEmail(body.email);
  // }

  // @Post('verifyOtp')
  // @ApiOperation({ summary: 'Verify OTP and get temp token' })
  // @ApiBody({ type: VerifyOtpDto })
  // verifyOtp(
  //   @Body('otp', ParseIntPipe) otp: number,
  // ) {
  //   return this.authService.verifyOtp(otp);
  // }

  // @Post('changePassword')
  // @ApiOperation({ summary: 'Change password using temp token (after OTP)' })
  // @ApiBody({ type: ChangePasswordOtpDto })
  // changePassword(@Body() body: ChangePasswordOtpDto) {
  //   return this.authService.changePassword(body.newPassword, body.tmptoken);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Post('changePasswordWasLogin')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Change password when user is logged in' })
  // @ApiBody({ type: ChangePasswordDto })
  // changePasswordWasLogin(@Body() body: ChangePasswordDto, @Request() req) {
  //   return this.authService.changePasswordWasLogin(body.newPassword, req.user);
  // }
}
