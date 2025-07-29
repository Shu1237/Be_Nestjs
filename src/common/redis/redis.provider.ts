import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InternalServerErrorException } from '../exceptions/internal-server-error.exception';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const redisUrl = configService.get<string>('redis.url');
    if (!redisUrl) {
      throw new InternalServerErrorException(
        'Redis URL is not defined in config',
      );
    }

    return new Redis(redisUrl, {
      tls: {},
    });
  },
};
