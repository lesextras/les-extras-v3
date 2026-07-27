import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { PrismaModule } from "../prisma/prisma.module";
import { DeskController } from "./desk.controller";
import { DeskService } from "./desk.service";

@Module({
  imports: [AuthModule, PrismaModule, MailModule],
  controllers: [DeskController],
  providers: [DeskService],
})
export class DeskModule {}
