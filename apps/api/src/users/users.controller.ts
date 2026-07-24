import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { OnboardingStepDto } from './dto/onboarding.dto';
import { CreateQualificationDto, CreateExperienceDto } from './dto/cv.dto';
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
}
