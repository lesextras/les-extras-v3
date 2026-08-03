import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ContratsModule } from '../contrats/contrats.module';
import { FormationsModule } from '../formations/formations.module';

@Module({
  // On importe les services métier plutôt que de réécrire leurs règles :
  // le contrôle d'accès aux pièces de formation vit dans FormationsService,
  // et il n'a pas à exister en deux exemplaires.
  imports: [ContratsModule, FormationsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
