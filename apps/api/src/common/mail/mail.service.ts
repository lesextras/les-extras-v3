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
      ? `<a href="${cta.url}" style="display:inline-block;background:#183767;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">${cta.label}</a>`
      : '';
    return `<!doctype html><html><body style="margin:0;background:#FAF7F2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1A1A1A">
      <div style="max-width:520px;margin:0 auto;padding:32px 20px">
        <div style="background:#fff;border:1px solid #ece7df;border-radius:16px;padding:32px">
          <div style="font-weight:800;font-size:18px;color:#183767;letter-spacing:.5px">LES EXTRAS</div>
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

  async sendEmailVerification(to: string, token: string, prenom?: string | null): Promise<void> {
    const url = `${this.webUrl}/verify-email?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Confirmez votre adresse — LES EXTRAS',
      this.layout(
        `Plus qu'une étape${prenom ? `, ${prenom}` : ''}`,
        `Votre compte est créé. Confirmez cette adresse pour l'activer complètement : c'est ce qui
         nous permet de vous joindre quand une mission vous correspond ou qu'un devis arrive.
         <br><br>Ce lien est valable 24 heures.`,
        { label: 'Confirmer mon adresse', url },
      ),
    );
  }

  /**
   * Bienvenue — envoyé UNE FOIS, à la confirmation de l'adresse.
   *
   * Ce n'est pas un accusé de réception : c'est le moment où l'on dit à
   * quelqu'un dans quoi il vient d'entrer, et ce qu'il peut faire dès
   * maintenant. Le contenu change selon qu'on est un établissement ou un
   * intervenant — les deux ne cherchent pas la même chose.
   */
  async sendBienvenue(
    to: string,
    data: { prenom?: string | null; type: 'ESTABLISHMENT' | 'FREELANCE' },
  ): Promise<void> {
    const etab = data.type === 'ESTABLISHMENT';

    const premiersPas = etab
      ? [
          'Parcourez le catalogue d’ateliers et de formations, et demandez un devis en deux clics.',
          'Publiez un SOS Renfort quand une absence tombe : il part d’abord à votre équipe interne.',
          'Invitez vos salariés : la gestion interne (planning, pointage, conformité) est gratuite.',
        ]
      : [
          'Publiez votre premier atelier : c’est gratuit, et vous gardez 100 % de votre tarif.',
          'Consultez les missions de renfort qui correspondent à votre métier et à votre secteur.',
          'Ouvrez le GAP : déposez une situation, ou répondez à un collègue qui attend un retour.',
        ];

    await this.send(
      to,
      'Bienvenue dans la communauté LES EXTRAS',
      this.layout(
        `Bienvenue${data.prenom ? `, ${data.prenom}` : ''} 🎉`,
        `Votre adresse est confirmée : vous faites maintenant partie de la communauté
         <b>LES EXTRAS</b>, le dispositif de l'association <b>ADéPA</b>.
         <br><br>
         ADéPA est une association loi 1901 engagée depuis 2012 dans l'insertion sociale par
         l'éducation, la prévention et l'animation. LES EXTRAS en est le prolongement numérique :
         relier les établissements médico-sociaux et les professionnels qui les font tenir.
         <br><br>
         <b>Ce que vous pouvez faire dès maintenant :</b>
         <ul style="margin:10px 0 0;padding-left:18px">
           ${premiersPas.map((p) => `<li style="margin:6px 0">${p}</li>`).join('')}
         </ul>
         <br>
         Une question ? Répondez simplement à cet e-mail, une vraie personne le lit.`,
        { label: 'Ouvrir mon espace', url: `${this.webUrl}/dashboard` },
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

  /**
   * LE CODE DE SIGNATURE.
   *
   * Le code voyage par un canal distinct de celui où l'on signe : c'est ce
   * second facteur qui donne sa valeur au faisceau de preuves. Envoyer le
   * code sur l'écran où l'on clique ne prouverait rien.
   *
   * Le courriel dit le document, le code, et sa durée de validité — et rien
   * d'autre : ni lien de connexion, ni contenu du contrat. Un courriel qui
   * traîne dans une boîte partagée ne doit pas suffire à signer.
   */
  async sendCodeSignature(
    to: string,
    data: { code: string; document: string; minutes: number; nomSignataire?: string | null },
  ): Promise<void> {
    const bonjour = data.nomSignataire ? `Bonjour ${data.nomSignataire},<br/><br/>` : '';
    await this.send(
      to,
      `Votre code de signature : ${data.code}`,
      this.layout(
        'Code de signature',
        `${bonjour}Voici votre code pour signer <b>${data.document}</b> :
         <div style="margin:22px 0;text-align:center">
           <span style="display:inline-block;font-size:32px;letter-spacing:10px;font-weight:800;color:#183767;background:#FAF7F2;border:1px solid #ece7df;border-radius:12px;padding:14px 22px">${data.code}</span>
         </div>
         Il est valable <b>${data.minutes} minutes</b> et ne sert qu'une fois.
         <br/><br/>
         <span style="color:#5b6470;font-size:13px">Vous n'avez rien demandé ? Ignorez ce message : sans ce code, personne ne peut signer à votre place. Ne le transmettez à personne, pas même à un collègue.</span>`,
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
    const url = `${this.webUrl}/dashboard/reservations`;
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
  /**
   * Le rendez-vous du lundi — un e-mail par semaine, groupé, jamais plus.
   *
   * Ce n'est pas une newsletter : chaque ligne est une action possible pour
   * CETTE personne. S'il n'y a rien à dire, l'e-mail n'est pas envoyé (voir le
   * planificateur) — mieux vaut une semaine de silence qu'un message vide.
   */
  async sendRendezVousHebdo(
    to: string,
    data: {
      prenom?: string | null;
      missions: { titre: string; ville?: string | null; id: string }[];
      questions: { titre: string; metier: string; id: string }[];
      nouveautes: { titre: string; lien: string }[];
      points?: number;
    },
  ): Promise<void> {
    const bloc = (
      titre: string,
      lignes: string[],
      lien?: { label: string; url: string },
    ) =>
      lignes.length === 0
        ? ''
        : `<div style="margin:22px 0 0">
             <div style="font-weight:700;font-size:14px;color:#183767;text-transform:uppercase;letter-spacing:.4px">${titre}</div>
             <ul style="margin:8px 0 0;padding-left:18px">${lignes.map((l) => `<li style="margin:6px 0">${l}</li>`).join('')}</ul>
             ${lien ? `<a href="${lien.url}" style="font-size:13px;color:#183767;font-weight:600">${lien.label} →</a>` : ''}
           </div>`;

    const corps = [
      bloc(
        'Des missions près de chez vous',
        data.missions.map(
          (m) =>
            `<a href="${this.webUrl}/marketplace/missions/${m.id}" style="color:#1A1A1A">${m.titre}</a>${m.ville ? ` — ${m.ville}` : ''}`,
        ),
        data.missions.length ? { label: 'Voir toutes les missions', url: `${this.webUrl}/dashboard/opportunites` } : undefined,
      ),
      bloc(
        'Des collègues attendent un retour dans le GAP',
        data.questions.map(
          (q) =>
            `<a href="${this.webUrl}/dashboard/gap/${q.id}" style="color:#1A1A1A">${q.titre}</a> <span style="color:#9ca3af">— ${q.metier}</span>`,
        ),
        data.questions.length ? { label: 'Ouvrir le GAP', url: `${this.webUrl}/dashboard/gap` } : undefined,
      ),
      bloc(
        'Nouveau cette semaine',
        data.nouveautes.map((n) => `<a href="${n.lien}" style="color:#1A1A1A">${n.titre}</a>`),
      ),
    ]
      .filter(Boolean)
      .join('');

    const solde =
      data.points && data.points > 0
        ? `<div style="margin-top:22px;font-size:13px;color:#6b7280">Vous avez <b>${data.points} points</b>, soit ${Math.floor(data.points / 10)} € de réduction disponibles.</div>`
        : '';

    await this.send(
      to,
      'Votre semaine sur Les Extras',
      this.layout(
        `Bonjour${data.prenom ? ` ${data.prenom}` : ''},`,
        `Ce qui vous concerne cette semaine, en une minute.${corps}${solde}
         <div style="margin-top:24px;font-size:12px;color:#9ca3af">Vous recevez ce message une fois par semaine, le lundi. Vous pouvez le désactiver depuis votre compte.</div>`,
        { label: 'Ouvrir mon espace', url: `${this.webUrl}/dashboard` },
      ),
    );
  }

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

  /** Notifie l'équipe ADéPA d'une nouvelle demande de contact (formulaire public). */
  /**
   * Première publication d'un compte sur le fil public. Les articles paraissent
   * sans validation préalable — ce signal permet à l'équipe de relire a
   * posteriori le tout premier texte d'un nouveau compte.
   */
  async sendFirstArticleAlert(data: {
    accountName: string;
    accountType: string;
    title: string;
    slug: string;
    authorName?: string | null;
  }): Promise<void> {
    const to = this.config.get<string>('CONTACT_INBOX_EMAIL') ?? 'contact@adepa77.fr';
    const site = (
      this.config.get<string>('WEB_PUBLIC_URL') ?? 'https://app.les-extras.fr'
    ).replace(/\/$/, '');
    const url = `${site}/actualites/${data.slug}`;
    await this.send(
      to,
      `Première actualité publiée — ${data.accountName}`,
      this.layout(
        'Une nouvelle structure publie',
        `<b>${data.accountName}</b> (${data.accountType}) vient de publier sa première
        actualité sur le fil public.
        ${data.authorName ? `<br><b>Auteur :</b> ${data.authorName}` : ''}
        <br><br><b>Titre :</b> ${data.title.replace(/</g, '&lt;')}
        <br><a href="${url}">Lire l'article</a>
        <br><br>La publication est immédiate : si le contenu ne convient pas,
        archivez-le depuis le back-office.`,
      ),
    );
  }

  async sendContactNotification(data: {
    name: string;
    email: string;
    phone?: string | null;
    type?: string | null;
    content: string;
  }): Promise<void> {
    const to = this.config.get<string>('CONTACT_INBOX_EMAIL') ?? 'contact@adepa77.fr';
    await this.send(
      to,
      `Nouvelle demande de contact — ${data.name}`,
      this.layout(
        'Nouvelle demande de contact',
        `<b>${data.name}</b> vous a écrit via le site.
        <br><br><b>Email :</b> ${data.email}
        ${data.phone ? `<br><b>Téléphone :</b> ${data.phone}` : ''}
        ${data.type ? `<br><b>Sujet :</b> ${data.type}` : ''}
        <br><br><b>Message :</b><br>${data.content.replace(/</g, '&lt;').replace(/\n/g, '<br>')}`,
      ),
    );
  }
}
