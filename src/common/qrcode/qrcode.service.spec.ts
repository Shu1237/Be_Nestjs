
import { S3Service } from 'src/common/s3/s3.service';
import * as qrcode from 'qrcode';
import { QrCodeService } from './qrcode.service';

jest.mock('qrcode', () => ({
  toBuffer: jest.fn(),
}));

describe('QrCodeService', () => {
  let service: QrCodeService;
  let mockS3Service: S3Service;

  beforeEach(() => {
    mockS3Service = {
      uploadFile: jest.fn(),
    } as unknown as S3Service;

    service = new QrCodeService(mockS3Service);
    jest.clearAllMocks();
  });

  describe('1.generateQrCode', () => {
    it('✅ 1.1 should generate QR code buffer and upload to S3', async () => {
      const data = 'test-data';
      const folder = 'qr-folder';
      const bufferMock = Buffer.from('qr-code');
      const urlMock = 'https://s3.amazonaws.com/qr-folder/qrcode-123456789.png';

      // Mock qrcode.toBuffer
      (qrcode.toBuffer as jest.Mock).mockResolvedValue(bufferMock);
      // Mock s3Service.uploadFile
      (mockS3Service.uploadFile as jest.Mock).mockResolvedValue(urlMock);

      const result = await service.generateQrCode(data, folder);

      expect(qrcode.toBuffer).toHaveBeenCalledWith(data, { type: 'png' });
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        bufferMock,
        expect.stringMatching(/^qrcode-\d+\.png$/),
        folder,
      );
      expect(result).toBe(urlMock);
    });

    it('❌ 1.2 should throw error if qrcode.toBuffer fails', async () => {
      (qrcode.toBuffer as jest.Mock).mockRejectedValue(new Error('QR Fail'));
      await expect(service.generateQrCode('abc', 'folder')).rejects.toThrow('QR Fail');
    });

    it('❌ 1.3 should throw error if s3Service.uploadFile fails', async () => {
      (qrcode.toBuffer as jest.Mock).mockResolvedValue(Buffer.from('qr'));
      (mockS3Service.uploadFile as jest.Mock).mockRejectedValue(new Error('S3 Fail'));
      await expect(service.generateQrCode('abc', 'folder')).rejects.toThrow('S3 Fail');
    });
  });
});