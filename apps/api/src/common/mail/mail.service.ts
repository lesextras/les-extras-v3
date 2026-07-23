import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Envoi d'emails transactionnels via l'API Brevo (HTTP, pas de SMTP requis).
 * Si BREVO_API_KEY est absent, on retombe sur un log (mode dev).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  private get webUrl(): string {
    return (
      this.config.get<string>('APP_WEB_URL') ??
      this.config.get<string>('WEB_ORIGIN') ??
      'https://app.les-extras.fr'
    );
  }

  private get sender() {
    return {
      name: this.config.get<string>('MAIL_FROM_NAME') ?? 'LES EXTRAS',
      email: this.config.get<string>('MAIL_FROM_EMAIL') ?? 'contact@adepa77.fr',
    };
  }

  private layout(title: string, bodyHtml: string, cta?: { label: string; url: string }): string {
    const button = cta
      ? `<a href="${cta.url}" style="display:inline-block;background:#0D7377;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">${cta.label}</a>`
      : '';
    return `<!doctype html><html><body style="margin:0;background:#FAF7F2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1A1A1A">
      <div style="max-width:520px;margin:0 auto;padding:32px 20px">
        <div style="background:#fff;border:1px solid #ece7df;border-radius:16px;padding:32px">
          <div style="font-weight:800;font-size:18px;color:#0D7377;letter-spacing:.5px">LES EXTRAS</div>
          <h1 style="font-size:22px;margin:18px 0 10px">${title}</h1>
          <div style="font-size:15px;line-height:1.6;color:#374151">${bodyHtml}</div>
          <div style="margin:24px 0">${button}</div>
          <div style="font-size:12px;color:#9ca3af">Si le bouton ne fonctionne pas, copiez ce lien : ${cta ? cta.url : ''}</div>
        </div>
        <div style="text-align:center;font-size:12px;color:#9ca3af;margin-top:16px">Le renfort médico-social, sereinement.</div>
      </div></body></html>`;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      this.logger.log(`[MAIL:log] to=${to} subject="${subject}" (BREVO_API_KEY absent)`);
      return;
    }
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: this.sender,
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`[MAIL:brevo] échec ${res.status} to=${to}: ${body.slice(0, 200)}`);
      } else {
        this.logger.log(`[MAIL:brevo] envoyé to=${to} subject="${subject}"`);
      }
    } catch (e) {
      this.logger.error(`[MAIL:brevo] exception to=${to}: ${(e as Error).message}`);
    }
  }

  async sendEmailVerification(to: string, token: string): Promise<void> {
    const url = `${this.webUrl}/verify-email?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Activez votre compte LES EXTRAS',
      this.layout(
        'Bienvenue \u{1F44B}',
        `Merci de votre inscription. Confirmez votre adresse email pour activer votre compte et accéder à la plateforme.`,
        { label: 'Activer mon compte', url },
      ),
    );
  }

  async sendInvitation(to: string, token: string, accountName: string): Promise<void> {
    const url = `${this.webUrl}/invitations/accept?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      `Vous êtes invité·e à rejoindre ${accountName} sur LES EXTRAS`,
      this.layout(
        'Une invitation vous attend',
        `Vous avez été invité·e à rejoindre l'équipe <b>${accountName}</b> sur LES EXTRAS. Cliquez ci-dessous pour accepter et créer votre accès.`,
        { label: "Rejoindre l'équipe", url },
      ),
    );
  }
}
