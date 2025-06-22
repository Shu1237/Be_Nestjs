import { Controller } from "@nestjs/common";




@Controller('/qrcode')
export class QrCodeController {
  // @Get()
  // async getQrCode(@Query('url') url: string, @Res() res: Response) {
  //   const qrCode = await this.qrCodeService.generateQrCode(url);
  //   res.type('image/png').send(qrCode);
  // }
}