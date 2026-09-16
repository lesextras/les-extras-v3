import { Module } from '@nestjs/common';
import {
  OrganisationController,
  OrganisationAdminController,
} from './organisation.controller';
import { OrganisationService } from './organisation.service';

@Module({
  controllers: [OrganisationController, OrganisationAdminController],
  providers: [OrganisationService],
  exports: [OrganisationService],
})
export class OrganisationModule {}
