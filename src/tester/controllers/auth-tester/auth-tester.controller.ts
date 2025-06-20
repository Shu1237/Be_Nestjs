import { Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import Redis from 'ioredis';
import { OrderService } from 'src/order/order.service';
import { QrCodeService } from 'src/qrcode/qrcode.service';


@ApiTags('Tester')
@ApiBearerAuth()

@Controller('test')
export class AuthTesterController {

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        private readonly orderService: OrderService,
        private readonly qrCodeService: QrCodeService,
    ) { }
    @UseGuards(JwtAuthGuard)
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
    // @UseGuards(JwtAuthGuard)
    @Get('check')
    @ApiOperation({ summary: 'Check current time in seconds' })
    @ApiResponse({
        status: 200,
        description: 'Returns current time breakdown',
        schema: {
            example: {
                message: 'This is a public route, no JWT required',
                exp: {
                    seconds: 1748325163,
                    minutes: 29138752.71666667,
                    hours: 485645.87861111113,
                    days: 20235.245775462964,
                }
            }
        }
    })
    getCheck() {
        return {
            message: 'This is a public route, no JWT required',
            // exp: ChangeDate() // <-- phải gọi hàm tại đây
        };
    }


    @Get('test/cache')
    @ApiOperation({ summary: 'Test cache functionality' })
    async getCacheTest() {
        // test redis

        await this.redisClient.set('testKey', 'testValue', 'EX', 60);
        return {
            message: 'Cache test successful',

        }
    }

    @Get('test/cache/get')
    @ApiOperation({ summary: 'Get cached value' })
    async getCachedValue() {
        const value = await this.redisClient.get('testKey');
        return {
            message: 'Retrieved cached value',
            value: value,
        };
    }
    @Get('test/cache/clear')
    @ApiOperation({ summary: 'Clear cached value' })
    async clearCachedValue() {
        await this.redisClient.del('testKey');
        return {
            message: 'Cache cleared successfully',
        };
    }

    @Post('products')
    testProduct (){
        return this.orderService.getOrderExtraByIds([1,2,3,4,5]);
    }
    

    @Post('s3')
    testS3(){
        const data = 'Hello, QR Code!';
        return this.qrCodeService.generateQrCode(data);
    }
  
}


