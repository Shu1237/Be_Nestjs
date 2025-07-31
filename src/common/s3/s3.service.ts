import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.region')!,
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKey')!,
        secretAccessKey: this.configService.get<string>('aws.secretKey')!,
      },
    });
  }

  async uploadFile(
    file: Buffer,
    fileName: string,
    folder: string,
  ): Promise<string> {
    const bucketName = this.configService.get<string>('aws.bucketName')!;
    const region = this.configService.get<string>('aws.region')!;

    // Tạo đường dẫn Key đúng thư mục
    const key = `${folder}/${fileName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
      }),
    );

    // Trả về đường dẫn đúng folder
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }
}
