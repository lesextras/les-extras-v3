import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";

@Module({
  imports: [AuthModule, MailModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
