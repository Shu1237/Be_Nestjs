import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3', () => {
  let lastS3ClientConfig: any = null;
  class MockS3Client {
    constructor(config: any) {
      lastS3ClientConfig = config;
    }
    send = jest.fn((_cmd: any) => Promise.resolve({}));
  }
  const mPutObjectCommand = jest.fn((input: PutObjectCommandInput) => input);
  return {
    S3Client: MockS3Client,
    PutObjectCommand: mPutObjectCommand,
  };
});

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;
  let mockS3Client: S3Client;
  // @ts-ignore
  let lastS3ClientConfig: any;

  beforeEach(() => {
    // Mock ConfigService
    configService = {
      get: jest.fn((key: string) => {
        const values = {
          'aws.region': 'ap-southeast-1',
          'aws.accessKey': 'mock-access-key',
          'aws.secretKey': 'mock-secret-key',
          'aws.bucketName': 'mock-bucket',
        };
        return values[key];
      }),
    } as any;

    service = new S3Service(configService);
    // get instance of S3Client from service
    mockS3Client = (service as any).s3Client;
    // @ts-ignore
    lastS3ClientConfig = (global as any).lastS3ClientConfig;
  });

  describe('1.uploadFile', () => {
    it('✅ 1.1 should upload file and return S3 URL', async () => {
      const buffer = Buffer.from('file-content');
      const fileName = 'test.png';
      const folder = 'QR';
      const url = await service.uploadFile(buffer, fileName, folder);

      // Check that send was called with PutObjectCommand and correct params
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'mock-bucket',
        Key: 'QR/test.png',
        Body: buffer,
      });
      expect(mockS3Client.send).toHaveBeenCalled();
      expect(url).toBe(
        'https://mock-bucket.s3.ap-southeast-1.amazonaws.com/QR/test.png'
      );
    });

    it('❌ 1.2 should throw if upload fails', async () => {
      (mockS3Client.send as jest.Mock).mockRejectedValue(new Error('Failed'));
      await expect(
        service.uploadFile(Buffer.from('x'), 'file.txt', 'QR')
      ).rejects.toThrow('Failed');
    });
  });
});