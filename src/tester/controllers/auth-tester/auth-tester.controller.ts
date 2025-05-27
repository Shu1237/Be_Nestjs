import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth Tester') // Nhóm hiển thị trên Swagger UI
@ApiBearerAuth()         // Bật gửi Authorization header trong Swagger
@UseGuards(JwtAuthGuard)
@Controller('test')
export class AuthTesterController {
  
   constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}
  
      @Get()
      @ApiOperation({ summary: 'Access protected route with JWT' })
      @ApiResponse({
          status: 200,
          description: 'Successfully accessed protected route',
          schema: {
              example: {
                  message: 'Accessed protected resource',
                  userID: 1,
                  username: 'john_doe',
                  role: 3,
              }
          }
      })
      someProtectedRoute(@Req() req) {
          const user = req.user;
          return {
              message: 'Accessed protected resource',
              userID: user?.ACCOUNT_ID,
              username: user?.USERNAME,
              role: user?.ROLE_ID,
          };
      }
}
