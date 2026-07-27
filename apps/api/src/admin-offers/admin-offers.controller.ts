import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { ActionBookingDto } from "../bookings/dto/action-booking.dto";
import { AdminOffersService } from "./admin-offers.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminOffersController {
  constructor(private readonly adminOffersService: AdminOffersService) {}

  @Get("missions")
  getMissions() {
    return this.adminOffersService.getMissions();
  }

  @Get("missions/:missionId")
  getMissionById(@Param("missionId") missionId: string) {
    return this.adminOffersService.getMissionById(missionId);
  }

  @Post("missions/:missionId/reassign")
  reassignMission(
    @Param("missionId") missionId: string,
    @Body() dto: ActionBookingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminOffersService.reassignMission(missionId, dto.bookingId, user.id);
  }

  @Post("missions/:missionId/delete")
  deleteMission(
    @Param("missionId") missionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminOffersService.deleteMission(missionId, user.id);
  }

  @Get("services")
  getServices() {
    return this.adminOffersService.getServices();
  }

  @Get("services/:serviceId")
  getServiceById(@Param("serviceId") serviceId: string) {
    return this.adminOffersService.getServiceById(serviceId);
  }

  @Post("services/:serviceId/feature")
  featureService(
    @Param("serviceId") serviceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminOffersService.featureService(serviceId, user.id);
  }

  @Post("services/:serviceId/hide")
  hideService(
    @Param("serviceId") serviceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminOffersService.hideService(serviceId, user.id);
  }
}
