import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  domain?: string;
}
@Injectable()
export class R2ConfigService {
  constructor(private readonly configService: ConfigService) {}

  getR2Config(): R2Config {
    const endpoint = this.configService.get<string>('CLOUDFLARE_R2_ENDPOINT');
    const accessKeyId = this.configService.get<string>(
      'CLOUDFLARE_R2_ACCESS_KEY',
    );
    const secretAccessKey = this.configService.get<string>(
      'CLOUDFLARE_R2_SECRET_KEY',
    );

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing required Cloudflare R2 environment variables: CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY, CLOUDFLARE_R2_SECRET_KEY',
      );
    }

    return {
      endpoint,
      accessKeyId,
      secretAccessKey,
      bucketName: this.configService.get<string>(
        'CLOUDFLARE_R2_BUCKET_NAME',
        'barcode-profile',
      ),
      domain: this.configService.get<string>('CLOUDFLARE_R2_DOMAIN'),
    };
  }
}
