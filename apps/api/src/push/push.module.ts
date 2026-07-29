import { Global, Module } from '@nestjs/common';
import { PushController } from './push.controller';
import { PushService } from './push.service';

/**
 * Global : le service de notifications s'en sert pour doubler chaque
 * notification interne d'un envoi vers les téléphones, sans que chaque module
 * ait à l'importer.
 */
@Global()
@Module({
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
