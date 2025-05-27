// auth.controller.ts
import { Body, Controller, Delete, Get, Param, Post, UseGuards,Request } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAccountDto } from './dtos/CreateAccount.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/Login.dto';
import { JwtAuthGuard } from 'src/guards/auth.guard';

@ApiTags('Auth') // Nhóm swagger
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

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
        refreshToken: { type: 'string' }
      },
      required: ['refreshToken']
    }
  })
  refreshToken(@Body() data: { refreshToken: string }) {
    return this.authService.refreshToken(data.refreshToken);
  }
  @Get('refreshToken')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all refresh tokens (admin only)' })
  getAllRefreshTokens(@Request() req) {
    return this.authService.getAllRefreshTokens(req.user);
  }

  @Delete('refreshToken/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a refresh token by ID' })
  deleteRefreshToken(@Param('id') refreshTokenId: number, @Request() req) {
    return this.authService.deleteRefreshToken(refreshTokenId, req.user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  logout(@Body() body: { refreshToken: string }, @Request() req) {
    return this.authService.logout(body.refreshToken, req.user);
  }

}
