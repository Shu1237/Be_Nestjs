import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { StatusOrder } from "src/common/enums/status-order.enum";
import { Order } from "src/database/entities/order/order";
import { Repository, LessThan } from "typeorm";

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);
    
    constructor(
        @InjectRepository(Order) 
        private readonly orderRepository: Repository<Order>,
    ) {}

    @Cron('0 */8 * * *', { // Chạy mỗi 8 tiếng 
        name: 'pending-order-check-to-fail',
    })
    async handleExpiredOrders() {
        this.logger.log('Starting check for expired pending orders');
        
        try {
            // Tìm các order pending quá 48h
            const expireThreshold = new Date();
            expireThreshold.setHours(expireThreshold.getHours() - 48);
            
            const expiredOrders = await this.orderRepository.find({
                where: {
                    status: StatusOrder.PENDING,
                    order_date: LessThan(expireThreshold),
                },
                relations: ['transaction'],
            });

            if (expiredOrders.length > 0) {
                const updatedOrders: Order[] = [];
                
                for (const order of expiredOrders) {
                    // Chỉ update nếu có transaction
                    if (order.transaction) {
                        order.status = StatusOrder.FAILED;
                        order.transaction.status = StatusOrder.FAILED;
                        updatedOrders.push(order);
                        
                        this.logger.log(`Order ${order.id} marked as failed (expired after 48h)`);
                    }
                }
                
                if (updatedOrders.length > 0) {
                    await this.orderRepository.save(updatedOrders);
                    this.logger.log(`Successfully failed ${updatedOrders.length} expired orders`);
                }
            } else {
                this.logger.log('No expired pending orders found');
            }
        } catch (error) {
            this.logger.error('Error during expired orders check:', error);
        }
    }
}