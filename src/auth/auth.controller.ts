import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateAccountDto } from './dtos/CreateAccount.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/Login.dto';

@Controller('auth')
export class AuthController {


    constructor(private authService: AuthService) { }

    @Post('register')
    createAccount(@Body() data: CreateAccountDto) {

        return this.authService.createAccount(data);

    }


    @Post('login')
    login(@Body() data: LoginDto) {
        return this.authService.login(data);
    }


    @Post('refreshToken')
    refreshToken(@Body() data: { refreshToken: string }) {
        return this.authService.refreshToken(data.refreshToken);
    }

    @Get('refreshToken')
    getAllRefreshTokens() {
        return this.authService.getAllRefreshTokens();
    }

    @Delete('refreshToken/:id')
    deleteRefreshToken(@Param('id') refreshTokenId: string) {
        return this.authService.deleteRefreshToken(+refreshTokenId);
    }

    // @Post('logout')
    // logout() {
    //     return this.authService.logout();
    // }
}
