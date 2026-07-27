import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BookingsModule } from "../bookings/bookings.module";
import { MissionsController } from "./missions.controller";
import { MissionsService } from "./missions.service";

@Module({
  imports: [AuthModule, BookingsModule],
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}
