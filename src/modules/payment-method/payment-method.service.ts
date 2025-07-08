import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethod } from 'src/database/entities/order/payment-method';
import { Repository } from 'typeorm';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto) {
    const exists = await this.paymentMethodRepository.findOne({
      where: { name: createPaymentMethodDto.name },
    });
    if (exists) {
      throw new BadRequestException(
        `Payment method with name "${createPaymentMethodDto.name}" already exists.`,
      );
    }
    const paymentMethod = this.paymentMethodRepository.create(createPaymentMethodDto);
    await this.paymentMethodRepository.save(paymentMethod);
    return { msg: 'Payment method created successfully' };
  }

  async findAll() {
    return this.paymentMethodRepository.find();
  }

  async findOne(id: number) {
    const paymentMethod = await this.paymentMethodRepository.findOne({ where: { id } });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    return paymentMethod;
  }

  async update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    const paymentMethod = await this.paymentMethodRepository.findOne({ where: { id } });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    Object.assign(paymentMethod, updatePaymentMethodDto);
    await this.paymentMethodRepository.save(paymentMethod);
    return { msg: 'Payment method updated successfully' };
  }

  async remove(id: number) {
    const result = await this.paymentMethodRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    return { msg: 'Payment method deleted successfully' };
  }
}