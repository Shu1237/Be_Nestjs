import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateAccountDto } from './dtos/CreateAccount.dto';
import { LoginDto } from './dtos/Login.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { ForgotPasswordDto } from './dtos/ForgotPassword.dto';
import { VerifyOtpDto } from './dtos/VerifyOTP.dto';
import { ChangePasswordOtpDto } from './dtos/ChangePasswordOPT.dto';
import { ChangePasswordDto } from './dtos/ChangePassword';
import { LogoutDto } from './dtos/Logout.dto';
import { RefreshTokenDto } from './dtos/RefreshToken.dto';
import { LocalGuard } from 'src/guards/local.guard';
import { RefreshGuard } from 'src/guards/refresh-token.guard';
import { GoogleAuthGuard } from 'src/guards/google.guard';

import { LoginAzureDto } from './dtos/loginazure.dto';

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

  //Login google
  // @UseGuards(GoogleAuthGuard)
  // @Get('google/login')
  // googleLogin() { }

  // @UseGuards(GoogleAuthGuard)
  // @Get('google/callback')
  // async googleCallback(@Req() req) {
  //   return this.authService.login(req.user);
  // }

  // @UseGuards(LocalGuard)
  // @Post('login')
  // @ApiOperation({ summary: 'Login with credentials' })
  // @ApiBody({ type: LoginDto })
  // @ApiResponse({ status: 200, description: 'Login successful' })
  // login(@Request() req) {
  //   // console.log(req.user);
  //   return this.authService.login(req.user);
  // }

  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({ type: LoginAzureDto })
  @Post('login/azure')
  loginAzure(@Body() body: LoginAzureDto) {   
    return this.authService.loginAzure(body);
  }

  // @UseGuards(JwtAuthGuard)
  // @Get('refreshToken')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get all refresh tokens (admin only)' })
  // getAllRefreshTokens() {
  //   return this.authService.getAllRefreshTokens();
  // }

  @UseGuards(RefreshGuard)
  @Post('refreshToken')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @Delete('refreshToken/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a refresh token by ID' })
  deleteRefreshToken(@Param('id', ParseIntPipe) refreshTokenId: number) {
    return this.authService.deleteRefreshToken(refreshTokenId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiBody({ type: LogoutDto })
  @ApiOperation({ summary: 'Logout current session' })
  logout(@Body() data: LogoutDto, @Request() req) {
    return this.authService.logout(data, req.user);
  }

  // @Post('forgotPassword')
  // @ApiOperation({ summary: 'Send OTP to email for password reset' })
  // @ApiBody({ type: ForgotPasswordDto })
  // checkEmail(@Body() body: ForgotPasswordDto) {
  //   return this.authService.checkEmail(body.email);
  // }

  // @Post('verifyOtp')
  // @ApiOperation({ summary: 'Verify OTP and get temp token' })
  // @ApiBody({ type: VerifyOtpDto })
  // verifyOtp(@Body() body: VerifyOtpDto) {
  //   return this.authService.verifyOtp(body.otp, body.email);
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
