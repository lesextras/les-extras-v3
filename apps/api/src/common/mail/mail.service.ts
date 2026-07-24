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

  /** Confirmation d'une réservation (mission ou atelier) passée en CONFIRMED. */
  async sendBookingConfirmation(
    to: string,
    data: { title: string; date?: string | Date | null },
  ): Promise<void> {
    const when = data.date
      ? new Date(data.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null;
    const url = `${this.webUrl}/dashboard/bookings`;
    await this.send(
      to,
      'Votre réservation est confirmée',
      this.layout(
        'Réservation confirmée ✅',
        `Bonne nouvelle : la réservation <b>« ${data.title} »</b> est désormais <b>confirmée</b>.${
          when ? ` Elle est programmée pour le <b>${when}</b>.` : ''
        } Retrouvez tous les détails depuis votre tableau de bord.`,
        { label: 'Voir mes réservations', url },
      ),
    );
  }

  /** Notification d'émission d'une facture (DRAFT -> ISSUED). */
  async sendInvoiceIssued(
    to: string,
    data: { number: string; amount: string | number; url: string },
  ): Promise<void> {
    const amountNum =
      typeof data.amount === 'string' ? Number(data.amount) : data.amount;
    const amountLabel = Number.isNaN(amountNum)
      ? String(data.amount)
      : new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(amountNum);
    const url = data.url.startsWith('http')
      ? data.url
      : `${this.webUrl}${data.url}`;
    await this.send(
      to,
      `Votre facture ${data.number}`,
      this.layout(
        'Nouvelle facture émise',
        `La facture <b>${data.number}</b> d'un montant de <b>${amountLabel}</b> vient d'être émise. Vous pouvez la consulter et l'imprimer depuis le lien ci-dessous.`,
        { label: 'Consulter la facture', url },
      ),
    );
  }

  private frDate(d?: string | Date | null): string | null {
    if (!d) return null;
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  /** SOS Renfort : e-mail envoyé à chaque freelance dont le profil correspond. */
  async sendMissionMatch(
    to: string,
    data: { title: string; city?: string | null; date?: string | Date | null; job?: string | null; rate?: string | number | null; emergency?: boolean; missionId: string },
  ): Promise<void> {
    const when = this.frDate(data.date);
    const url = `${this.webUrl}/marketplace/missions/${data.missionId}`;
    const tag = data.emergency ? '🚨 <b>Mission urgente</b> — ' : '';
    await this.send(
      to,
      `${data.emergency ? '🚨 ' : ''}Une mission de renfort pour vous : ${data.title}`,
      this.layout(
        'Une mission qui vous correspond',
        `${tag}Un établissement recherche un renfort <b>« ${data.title} »</b>${data.job ? ` (${data.job})` : ''}${
          data.city ? ` à <b>${data.city}</b>` : ''
        }${when ? ` le <b>${when}</b>` : ''}${data.rate ? `, rémunéré ${data.rate} €/h` : ''}.
        <br><br><b>Premier arrivé, premier servi</b> : la mission est attribuée au premier intervenant qui l'accepte.`,
        { label: 'Voir et accepter la mission', url },
      ),
    );
  }

  /** SOS Renfort : e-mail à l'établissement quand la mission est pourvue. */
  async sendMissionFilledEstablishment(
    to: string,
    data: { title: string; freelanceName: string; freelanceJob?: string | null; city?: string | null; date?: string | Date | null; contractUrl: string },
  ): Promise<void> {
    const when = this.frDate(data.date);
    const url = data.contractUrl.startsWith('http') ? data.contractUrl : `${this.webUrl}${data.contractUrl}`;
    await this.send(
      to,
      `Mission pourvue : ${data.title}`,
      this.layout(
        'Votre mission est pourvue ✅',
        `Bonne nouvelle : la mission <b>« ${data.title} »</b>${when ? ` du <b>${when}</b>` : ''} a été acceptée par
        <b>${data.freelanceName}</b>${data.freelanceJob ? ` — ${data.freelanceJob}` : ''}.
        <br><br>Le contrat de mission est prêt à être signé. Vous y retrouverez le détail du profil de l'intervenant.`,
        { label: 'Voir le contrat & le profil', url },
      ),
    );
  }

  /** SOS Renfort : e-mail au freelance qui a accepté (contrat + infos). */
  async sendMissionAcceptedFreelance(
    to: string,
    data: { title: string; city?: string | null; address?: string | null; date?: string | Date | null; time?: string | null; contractUrl: string },
  ): Promise<void> {
    const when = this.frDate(data.date);
    const url = data.contractUrl.startsWith('http') ? data.contractUrl : `${this.webUrl}${data.contractUrl}`;
    await this.send(
      to,
      `Mission confirmée : ${data.title}`,
      this.layout(
        'Vous avez décroché la mission 🎉',
        `Vous avez accepté la mission <b>« ${data.title} »</b>.
        <br><br><b>Quand :</b> ${when ?? 'à confirmer'}${data.time ? ` (${data.time})` : ''}
        <br><b>Où :</b> ${[data.address, data.city].filter(Boolean).join(', ') || 'voir le contrat'}
        <br><br>Merci de <b>signer le contrat de mission</b> ci-dessous. Vous y trouverez toutes les informations pour vous y rendre.`,
        { label: 'Signer le contrat', url },
      ),
    );
  }
}
