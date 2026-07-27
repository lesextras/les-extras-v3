import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { BookServiceDto } from "./dto/book-service.dto";
import { ServicesService } from "./services.service";

@Controller("services")
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  // C3: "Mes ateliers" — FREELANCE sees their own services with bookings
  @Get("my")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCE)
  findMyServices(@CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findMyServices(user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTABLISHMENT, UserRole.FREELANCE)
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTABLISHMENT, UserRole.FREELANCE)
  findOne(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.findOne(id, user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCE)
  createService(
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.createService(dto, user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCE)
  updateService(
    @Param("id") id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.updateService(id, dto, user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCE)
  deleteService(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.deleteService(id, user.id);
  }

  @Post(":id/duplicate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCE)
  duplicateService(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.duplicateService(id, user.id);
  }

  @Post(":serviceId/book")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ESTABLISHMENT, UserRole.FREELANCE)
  bookService(
    @Param("serviceId") serviceId: string,
    @Body() dto: BookServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.bookService(
      serviceId,
      user.id,
      new Date(dto.date),
      dto.message,
      dto.nbParticipants,
    );
  }
}
