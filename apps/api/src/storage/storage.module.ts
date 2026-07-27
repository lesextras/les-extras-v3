import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PublicFilesController } from './public-files.controller';

/**
 * Module de stockage, global : StorageService et FilesService sont injectables
 * partout (notamment par la procédure d'effacement RGPD, qui doit pouvoir
 * supprimer les objets du dépôt en même temps que les lignes en base).
 */
@Global()
@Module({
  controllers: [FilesController, PublicFilesController],
  providers: [StorageService, FilesService],
  exports: [StorageService, FilesService],
})
export class StorageModule {}
