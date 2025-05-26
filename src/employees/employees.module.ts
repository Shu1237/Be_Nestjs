import { Module } from '@nestjs/common';
import { EmployeesController } from './controllers/employees/employees.controller';
import { EmployeesService } from './services/employees/employees.service';



@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService]
})
export class EmployeesModule {}
