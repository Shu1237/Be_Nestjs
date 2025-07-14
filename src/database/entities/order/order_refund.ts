import { PaymentGateway } from "src/common/enums/payment_gatewat.enum";
import { RefundStatus } from "src/common/enums/refund_status.enum";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { Order } from "./order";

@Entity('order_refunds')
export class OrderRefund {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  partner_code: string;

  @Column({ type: 'varchar', length: 100 })
  request_id: string;

  @Column({ type: 'varchar', length: 100 })
  order_ref_id: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  transaction_code: string; // PayPal / Stripe / VNPAY transaction code

  @Column({ type: 'varchar', length: 100, nullable: true })
  payment_intent_id: string; // Stripe payment intent

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency_code: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  refund_amount: string;

  @Column({ type: 'bigint', nullable: true })
  timestamp: number;

  @Column({ type: 'varchar', length: 512, nullable: true })
  signature: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'enum', enum: PaymentGateway })
  payment_gateway: PaymentGateway;

  @Column({ type: 'enum', enum: RefundStatus, default: RefundStatus.PENDING })
  refund_status: RefundStatus;

  @Column({ type: 'varchar', length: 10, nullable: true })
  lang: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @OneToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // // 🟡 VNPAY-specific fields
  // @Column({ type: 'varchar', length: 20, nullable: true })
  // response_code: string;

  // @Column({ type: 'varchar', length: 255, nullable: true })
  // response_message: string;

  // @Column({ type: 'varchar', length: 20, nullable: true })
  // bank_code: string;

  // @Column({ type: 'varchar', length: 5, nullable: true })
  // transaction_type: string;

  // @Column({ type: 'varchar', length: 5, nullable: true })
  // transaction_status: string;

  // @Column({ type: 'varchar', length: 14, nullable: true })
  // pay_date: string;
}
