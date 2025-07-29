import { Module } from '@nestjs/common';
import { SeatModule } from 'src/modules/seat/seat.module';
import { MyGateWay } from './seat.gateway';

@Module({
  imports: [SeatModule],
  providers: [MyGateWay],
  exports: [MyGateWay],
})
export class MyGateWayModule {}
