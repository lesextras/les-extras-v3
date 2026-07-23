import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Stub d'envoi de mail : log uniquement (aucun SMTP réel branché ici).
 * DevOps-Data / un futur agent pourra remplacer l'implémentation par
 * Nodemailer/Resend sans changer les appelants (auth, invitations).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  private get from(): string {
    return this.config.get<string>('MAIL_FROM') ?? 'LES EXTRAS <no-reply@les-extras.fr>';
  }

  async sendEmailVerification(to: string, token: string): Promise<void> {
    const url = `${this.config.get<string>('APP_WEB_URL')}/verify-email?token=${token}`;
    this.logger.log(`[MAIL:verify] from=${this.from} to=${to} url=${url}`);
  }

  async sendInvitation(to: string, token: string, accountName: string): Promise<void> {
    const url = `${this.config.get<string>('APP_WEB_URL')}/invitations/accept?token=${token}`;
    this.logger.log(
      `[MAIL:invitation] from=${this.from} to=${to} account="${accountName}" url=${url}`,
    );
  }
}
