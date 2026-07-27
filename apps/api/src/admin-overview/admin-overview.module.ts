import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminOverviewController } from "./admin-overview.controller";
import { AdminOverviewService } from "./admin-overview.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminOverviewController],
  providers: [AdminOverviewService],
})
export class AdminOverviewModule {}
