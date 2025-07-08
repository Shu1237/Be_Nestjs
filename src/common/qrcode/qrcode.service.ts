import { Injectable } from "@nestjs/common";
import * as qrcode from 'qrcode';
import { S3Service } from "src/common/s3/s3.service";

@Injectable()
export class QrCodeService {
    constructor(private readonly s3Service: S3Service) { }

    async generateQrCode(data: string, folder: string): Promise<string> {
        const qrCodeBuffer = await qrcode.toBuffer(data, { type: 'png' });
        const fileName = `qrcode-${Date.now()}.png`;
        return this.s3Service.uploadFile(qrCodeBuffer, fileName, folder);
    }

}
