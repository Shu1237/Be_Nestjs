import { Body, Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { LogoutDto } from './dtos/Logout.dto';
import { RefreshTokenDto } from './dtos/RefreshToken.dto';
import { RefreshGuard } from 'src/common/guards/refresh-token.guard';
import { LoginAzureDto } from './dtos/loginazure.dto';
import { CheckEmail } from './dtos/CheckMail.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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

  @Post('checkEmail')
  @ApiOperation({ summary: 'Check if email exists' })
  @ApiBody({ type: CheckEmail })
  checkEmail(@Body() body: CheckEmail) {
    return this.authService.checkEmail(body);
  }
}
