import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { OnboardingStepDto } from './dto/onboarding.dto';
import { CreateQualificationDto, CreateExperienceDto } from './dto/cv.dto';
import { AccountDeletionRequestDto } from './dto/privacy.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/request-context';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return this.users.getMe(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Patch('me/onboarding')
  setOnboarding(@CurrentUser() user: RequestUser, @Body() dto: OnboardingStepDto) {
    return this.users.setOnboardingStep(user.id, dto.step);
  }

  // ── CV : diplômes & expériences ────────────────────────────────────────────
  @Get('me/cv')
  listCv(@CurrentUser() user: RequestUser) {
    return this.users.listCv(user.id);
  }

  @Post('me/qualifications')
  addQualification(@CurrentUser() user: RequestUser, @Body() dto: CreateQualificationDto) {
    return this.users.addQualification(user.id, dto);
  }

  @Delete('me/qualifications/:id')
  removeQualification(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.removeQualification(user.id, id);
  }

  @Post('me/experiences')
  addExperience(@CurrentUser() user: RequestUser, @Body() dto: CreateExperienceDto) {
    return this.users.addExperience(user.id, dto);
  }

  @Delete('me/experiences/:id')
  removeExperience(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.removeExperience(user.id, id);
  }

  // ── RGPD : accès, portabilité, effacement ──────────────────────────────────

  /**
   * Export des données personnelles (RGPD art. 15 & 20).
   * Renvoie un fichier JSON téléchargeable, daté, sans mot de passe ni jeton.
   * Bridé : l'export est une requête lourde, cinq par minute suffisent.
   */
  @Get('me/export')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async exportMyData(
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const { fileName, body } = await this.users.exportPersonalData(user.id);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    // Un export de données personnelles ne doit jamais finir dans un cache.
    res.setHeader('Cache-Control', 'no-store, private');
    return body;
  }

  /**
   * Demande de suppression du compte (RGPD art. 17).
   * Concrètement : anonymisation irréversible + désactivation du compte, les
   * pièces comptables obligatoires restant conservées (cf. UsersService).
   * Exige le mot de passe ET la phrase de confirmation.
   * Bridé fortement : la route vérifie un mot de passe (surface de force brute).
   */
  @Post('me/deletion-request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  requestDeletion(
    @CurrentUser() user: RequestUser,
    @Body() dto: AccountDeletionRequestDto,
    @Req() req: Request,
  ) {
    return this.users.requestAccountDeletion(user.id, dto, req.ip ?? null);
  }
}
