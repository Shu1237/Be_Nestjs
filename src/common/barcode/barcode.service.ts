import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import * as bwipjs from 'bwip-js';
import { User } from 'src/database/entities/user/user';

@Injectable()
export class BarcodeService {
  private readonly logger = new Logger(BarcodeService.name);

  private readonly barcodeOptions = {
    bcid: 'code128',
    scale: 3,
    height: 8,
    includetext: false,
    backgroundcolor: 'ffffff',
  } as const;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async generateBarcode(text: string): Promise<string> {
    try {
      const buffer: Buffer = await new Promise((resolve, reject) => {
        bwipjs.toBuffer(
          { ...this.barcodeOptions, text },
          (err: unknown, png: Buffer) => {
            if (err) {
              reject(
                new Error(
                  `Failed to generate barcode: ${err instanceof Error ? err.message : 'Unknown error'}`,
                ),
              );
            } else {
              resolve(png);
            }
          },
        );
      });

      return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (error) {
      this.logger.error(`Failed to generate barcode for text: ${text}`, error);
      throw new Error('Failed to generate barcode');
    }
  }

  async getUserBarcode(
    userId: string,
  ): Promise<{ code: string; barcode: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_deleted: false },
      select: ['email'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const barcodeImage = await this.generateBarcode(user.email);
    return { code: user.email, barcode: barcodeImage };
  }

  async getUserByBarcode(
    code: string,
  ): Promise<Pick<User, 'id' | 'username' | 'email'> | null> {
    return this.userRepository.findOne({
      where: { email: code, is_deleted: false },
      select: ['id', 'username', 'email'],
    });
  }
}
