import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { LogoutDto } from './dtos/Logout.dto';
import { RefreshTokenDto } from './dtos/RefreshToken.dto';
import { RefreshGuard } from 'src/common/guards/refresh-token.guard';
import { LoginAzureDto } from './dtos/loginazure.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  // POST - Login
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({ type: LoginAzureDto })
  @Post('login')
  loginAzure(@Body() body: LoginAzureDto) {   
    return this.authService.loginAzureAndGoogle(body);
  }

  // POST - Refresh token
  @UseGuards(RefreshGuard)
  @Post('refreshToken')
  @ApiOperation({ summary: 'Refresh JWT using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  // POST - Logout
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
