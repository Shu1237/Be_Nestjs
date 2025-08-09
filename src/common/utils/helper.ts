import * as bcrypt from 'bcrypt';
import { Stripe } from 'stripe';
import { OrderBillType, ProductType } from './type';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { TicketType } from 'src/database/entities/order/ticket-type';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { Product } from 'src/database/entities/item/product';
import { ProductTypeEnum } from 'src/common/enums/product.enum';
import { Combo } from 'src/database/entities/item/combo';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const changeVnToUSD = (total: string) => {
  const vndAmount = parseFloat(total.replace(/[,\s]/g, ''));
  if (isNaN(vndAmount)) {
    throw new InternalServerErrorException('Invalid VND amount provided');
  }
  const exchangeRate = 24000;
  const usdAmount = vndAmount / exchangeRate;

  return usdAmount.toFixed(2);
};

export const changeUSDToVN = (total: string): string => {
  const usdAmount = parseFloat(total.replace(/[,\s]/g, ''));

  if (isNaN(usdAmount)) {
    throw new InternalServerErrorException('Invalid VND amount provided');
  }

  const exchangeRate = 24000;

  const vndAmount = usdAmount * exchangeRate;

  return vndAmount.toFixed(0);
};

export const changeVNtoUSDToCent = (total: string): number => {
  const vndAmount = parseFloat(total.replace(/[,\s]/g, ''));
  if (isNaN(vndAmount)) {
    throw new InternalServerErrorException('Invalid VND amount provided');
  }
  const exchangeRate = 24000;
  const usdAmount = vndAmount / exchangeRate;
  return Math.round(usdAmount * 100);
};


export const applyPromotion = (
  price: number,
  discount: number,
  isPercent: boolean,
): number => {
  if (isPercent) {
    return Math.round(price * (1 - discount / 100));
  } else {
    return Math.round(price - discount);
  }
};

export const applyAudienceDiscount = (
  price: number,
  discount: number,
): number => {
  return Math.round(price * (1 - discount / 100));
};

export const roundUpToNearest = (
  value: number,
  step: number = 1000,
): number => {
  return Math.ceil(value / step) * step;
};

export const calculateProductTotal = (
  orderExtras: Product[], 
  orderBill: OrderBillType,
) => {
  let totalProduct = 0;

  for (const product of orderExtras) {
    const found = (orderBill.products ?? []).find(
      (p) => p.product_id === product.id,
    );

    if (!found || found.quantity <= 0) {
      throw new BadRequestException(
        `Invalid quantity for product ${product.id}`,
      );
    }

    const productPrice = parseFloat(product.price);
    let finalPrice = productPrice;

 
    if (product.category === ProductTypeEnum.COMBO) {
      const comboProduct = product as Combo;

      if (comboProduct.discount != null && !isNaN(comboProduct.discount)) {
        finalPrice = productPrice * (1 - comboProduct.discount / 100);
      }
    }

    totalProduct += finalPrice * found.quantity;
  }

  return totalProduct;
};



export function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}
