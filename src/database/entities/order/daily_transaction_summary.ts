import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { PaymentMethod } from './payment-method';

@Entity('daily_transaction_summary')
export class DailyTransactionSummary {
    @PrimaryGeneratedColumn({ type: 'integer' })
    id: number;

    @Column({ type: 'date' })
    reportDate: string;

    @Column({ type: 'int', default: 0 })
    totalOrders: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
    totalAmount: number;

    @Column({ type: 'int', default: 0 })
    totalSuccess: number;

    @Column({ type: 'int', default: 0 })
    totalFailed: number;

    @ManyToOne(() => PaymentMethod, { nullable: true })
    @JoinColumn({ name: 'payment_method_id' })
    paymentMethod: PaymentMethod;
}
