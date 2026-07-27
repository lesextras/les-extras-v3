import { Controller, Get, Res } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Response } from "express";
import { PrismaService } from "./prisma/prisma.service";

@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health(@Res() res: Response) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(200).json({ status: "ok", service: "lesextras-api", db: true });
    } catch {
      return res.status(503).json({ status: "error", service: "lesextras-api", db: false });
    }
  }
}
