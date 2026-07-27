import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminFinanceController } from "./admin-finance.controller";
import { AdminFinanceService } from "./admin-finance.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminFinanceController],
  providers: [AdminFinanceService],
})
export class AdminFinanceModule {}
