import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { ApplyMissionDto } from "./dto/apply-mission.dto";
import { CreateMissionDto } from "./dto/create-mission.dto";
import { FindMissionsQueryDto } from "./dto/find-missions-query.dto";
import { RequestMissionInfoDto } from "./dto/request-mission-info.dto";
import { MissionsService } from "./missions.service";

@Controller("missions")
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTABLISHMENT)
  createMission(
    @Body() dto: CreateMissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.missionsService.createMission(dto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCE)
  findAll(@Query() filter: FindMissionsQueryDto) {
    return this.missionsService.findAll(filter);
  }

  @Get("managed")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTABLISHMENT)
  getManagedMissions(@CurrentUser() user: AuthenticatedUser) {
    return this.missionsService.getManagedMissions(user.id);
  }

  @Get(":missionId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCE)
  getMission(@Param("missionId") id: string) {
    return this.missionsService.getMission(id);
  }

  @Post(":missionId/apply")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCE)
  apply(
    @Param("missionId") missionId: string,
    @Body() dto: ApplyMissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.missionsService.apply(missionId, user.id, dto);
  }

  @Post(":missionId/info-request")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCE)
  requestInfo(
    @Param("missionId") missionId: string,
    @Body() dto: RequestMissionInfoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.missionsService.requestInfo(missionId, user.id, dto.message);
  }
}
