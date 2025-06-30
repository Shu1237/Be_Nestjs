import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bwipjs from 'bwip-js';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { User } from 'src/database/entities/user/user';
import { R2ConfigService } from '../config/r2.config';

export interface ScanResult {
  success: boolean;
  user?: User;
  code?: string;
  message: string;
  timestamp: Date;
}

@Injectable()
export class BarcodeService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly r2Domain?: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly r2ConfigService: R2ConfigService,
  ) {
    const config = this.r2ConfigService.getR2Config();

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.bucketName = config.bucketName;
    this.r2Domain = config.domain;
  }

  async getUserBarcode(
    userId: string,
  ): Promise<{ code: string; barcodeUrl: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_deleted: false },
      select: ['id', 'email'],
    });

    if (!user) throw new NotFoundException('User not found');

    const shortCode = this.generateShortCode(user.id);
    const fileName = `barcodes/${shortCode}.png`;

    let barcodeUrl = await this.checkBarcodeExists(fileName);

    if (!barcodeUrl) {
      const barcodeBuffer = await this.generateBarcodeBuffer(shortCode);
      barcodeUrl = await this.uploadBarcodeToR2(fileName, barcodeBuffer);
    }

    return { code: shortCode, barcodeUrl };
  }

  async scanBarcode(scannedCode: string): Promise<ScanResult> {
    const timestamp = new Date();

    try {
      if (!scannedCode?.trim()) {
        return {
          success: false,
          message: 'Barcode code is empty or invalid',
          timestamp,
        };
      }

      const cleanCode = scannedCode.trim().toUpperCase();

      if (!/^[A-Z0-9]{10}$/.test(cleanCode)) {
        return {
          success: false,
          code: cleanCode,
          message:
            'Invalid barcode format. Expected 10 alphanumeric characters',
          timestamp,
        };
      }

      const user = await this.getUserByBarcode(cleanCode);

      if (!user) {
        return {
          success: false,
          code: cleanCode,
          message: 'No user found for this barcode',
          timestamp,
        };
      }

      return {
        success: true,
        user,
        code: cleanCode,
        message: `Barcode scan successful for user: ${user.username || user.email}`,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        code: scannedCode,
        message: `Scan failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp,
      };
    }
  }

  private generateShortCode(userId: string): string {
    return userId.replace(/-/g, '').substring(0, 10).toUpperCase();
  }

  private async generateBarcodeBuffer(text: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(
        {
          bcid: 'code128',
          text,
          scale: 3,
          height: 8,
          includetext: true,
          backgroundcolor: 'ffffff',
        },
        (err, png) =>
          err ? reject(new Error('Failed to generate barcode')) : resolve(png),
      );
    });
  }

  private async uploadBarcodeToR2(
    fileName: string,
    buffer: Buffer,
  ): Promise<string> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: 'image/png',
          CacheControl: 'public, max-age=31536000',
          Metadata: {
            'uploaded-at': new Date().toISOString(),
            'file-type': 'barcode',
          },
        }),
      );

      return this.r2Domain
        ? `${this.r2Domain}/${fileName}`
        : await this.getSignedUrl(fileName);
    } catch (error) {
      throw new Error(`Failed to upload barcode to R2: ${error}`);
    }
  }

  private async checkBarcodeExists(fileName: string): Promise<string | null> {
    try {
      await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
        }),
      );

      return this.r2Domain
        ? `${this.r2Domain}/${fileName}`
        : await this.getSignedUrl(fileName);
    } catch {
      return null;
    }
  }

  private async getSignedUrl(fileName: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  private async getUserByBarcode(code: string): Promise<User | null> {
    const users = await this.userRepository.find({
      where: { is_deleted: false },
      select: ['id', 'username', 'email', 'score'],
    });

    return (
      users.find((user) => this.generateShortCode(user.id) === code) || null
    );
  }
}
