import { Controller, Get, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AdminFinanceService } from "./admin-finance.service";

@Controller("admin/finance")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminFinanceController {
  constructor(private readonly adminFinanceService: AdminFinanceService) {}

  @Get("summary")
  getSummary() {
    return this.adminFinanceService.getSummary();
  }

  @Get("invoices")
  getInvoices() {
    return this.adminFinanceService.getInvoices();
  }

  @Get("quotes")
  getQuotes() {
    return this.adminFinanceService.getQuotes();
  }

  @Get("bookings-awaiting-payment")
  getBookingsAwaitingPayment() {
    return this.adminFinanceService.getBookingsAwaitingPayment();
  }
}
