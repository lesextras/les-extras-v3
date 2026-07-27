import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { ListAdminUsersQueryDto } from "./dto/list-admin-users-query.dto";
import { ReviewUserDocumentDto } from "./dto/review-user-document.dto";
import { AdminUsersService } from "./admin-users.service";
import type { Response } from "express";
import { resolve } from "path";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  listUsers(@Query() query: ListAdminUsersQueryDto) {
    return this.adminUsersService.listUsers(query);
  }

  @Get("kyc/documents")
  listPendingKycDocuments() {
    return this.adminUsersService.listPendingKycDocuments();
  }

  @Patch("documents/:documentId/review")
  reviewUserDocument(
    @Param("documentId") documentId: string,
    @Body() dto: ReviewUserDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminUsersService.reviewUserDocument(documentId, user.id, dto);
  }

  @Get("documents/:documentId/file")
  async downloadUserDocument(
    @Param("documentId") documentId: string,
    @Res() response: Response,
  ) {
    const document = await this.adminUsersService.getAdminDocumentFile(documentId);
    response.setHeader("Content-Type", document.mimeType ?? "application/octet-stream");
    response.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(document.filename)}"`,
    );
    return response.sendFile(resolve(document.storagePath));
  }

  @Get(":userId")
  getUserById(@Param("userId") userId: string) {
    return this.adminUsersService.getUserById(userId);
  }

  @Post(":userId/verify")
  verifyUser(@Param("userId") userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.adminUsersService.verifyUser(userId, user.id);
  }

  @Post(":userId/ban")
  banUser(@Param("userId") userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.adminUsersService.banUser(userId, user.id);
  }
}
