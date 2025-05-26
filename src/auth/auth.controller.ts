import { Body, Controller, Post } from '@nestjs/common';
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
}
