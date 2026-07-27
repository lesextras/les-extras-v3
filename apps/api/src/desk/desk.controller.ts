import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { DeskService } from "./desk.service";
import { AssignDeskRequestDto } from "./dto/assign-desk-request.dto";
import { CreateDeskRequestDto } from "./dto/create-desk-request.dto";
import { CreateFinanceIncidentDto } from "./dto/create-finance-incident.dto";
import { SendAdminOutreachDto } from "./dto/send-admin-outreach.dto";
import { UpdateDeskRequestStatusDto } from "./dto/update-desk-request-status.dto";
import { RespondDeskRequestDto } from "./dto/respond-desk-request.dto";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeskController {
  constructor(private readonly deskService: DeskService) {}

  @Get("admin/desk-requests")
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.deskService.findAll();
  }

  @Post("admin/desk-requests/finance")
  @Roles(UserRole.ADMIN)
  createFinanceIncident(
    @Body() dto: CreateFinanceIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deskService.createFinanceIncident(user.id, dto);
  }

  @Get("admin/contact-bypass-events")
  @Roles(UserRole.ADMIN)
  findContactBypassEvents() {
    return this.deskService.findContactBypassEvents();
  }

  @Post("admin/outreach/:userId")
  @Roles(UserRole.ADMIN)
  sendAdminOutreach(
    @Param("userId") userId: string,
    @Body() dto: SendAdminOutreachDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deskService.sendAdminOutreach(userId, user.id, dto);
  }

  @Post("admin/contact-bypass-events/:id/monitor")
  @Roles(UserRole.ADMIN)
  monitorContactBypassEvent(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deskService.monitorContactBypassEvent(id, user.id);
  }

  @Patch("admin/desk-requests/:id/status")
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateDeskRequestStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deskService.updateStatus(id, user.id, dto);
  }

  @Patch("admin/desk-requests/:id/assign")
  @Roles(UserRole.ADMIN)
  assign(
    @Param("id") id: string,
    @Body() dto: AssignDeskRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deskService.assign(id, user.id, dto);
  }

  @Patch("admin/desk-requests/:id/respond")
  @Roles(UserRole.ADMIN)
  respond(
    @Param("id") id: string,
    @Body() dto: RespondDeskRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deskService.respond(id, user.id, dto);
  }

  @Post("desk-requests")
  @Roles(UserRole.FREELANCE, UserRole.ESTABLISHMENT)
  createUserRequest(
    @Body() dto: CreateDeskRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deskService.createUserRequest(user.id, dto);
  }

  @Get("desk-requests/mine")
  @Roles(UserRole.FREELANCE, UserRole.ESTABLISHMENT)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.deskService.findMine(user.id);
  }
}
