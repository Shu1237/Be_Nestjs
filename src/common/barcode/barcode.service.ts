import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bwipjs from 'bwip-js';

import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { User } from 'src/database/entities/user/user';

interface ScanResult {
  success: boolean;
  user?: User;
  code?: string;
  message: string;
  timestamp: Date;
}

@Injectable()
export class BarcodeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserBarcode(
    userId: string,
  ): Promise<{ code: string; barcode: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_deleted: false },
      select: ['id', 'email'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const shortCode = this.generateShortCode(user.id);
    const barcode = await this.generateBarcodeImage(shortCode);

    return { code: shortCode, barcode };
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        code: scannedCode,
        message: `Scan failed: ${errorMessage}`,
        timestamp,
      };
    }
  }

  private generateShortCode(userId: string): string {
    const cleaned = userId.replace(/-/g, '');
    return cleaned.substring(0, 10).toUpperCase();
  }

  private async generateBarcodeImage(text: string): Promise<string> {
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
        (err, png) => {
          if (err) {
            reject(new Error('Failed to generate barcode'));
          } else {
            resolve(`data:image/png;base64,${png.toString('base64')}`);
          }
        },
      );
    });
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
