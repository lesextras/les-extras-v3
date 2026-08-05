import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * ENVOI DES E-MAILS TRANSACTIONNELS.
 *
 * ── Pourquoi on est passé de Brevo au SMTP du domaine ────────────────────
 *
 * Les e-mails partaient par l'API Brevo, avec `contact@adepa77.fr` en
 * expéditeur. Brevo les acceptait (le crédit était bien décompté) et une
 * partie n'arrivait jamais — ni boîte de réception, ni indésirables. Ce
 * n'était pas un caprice de Gmail : l'enregistrement SPF des deux domaines
 * n'autorise QUE Hostinger.
 *
 *   les-extras.fr  TXT  v=spf1 include:_spf.mail.hostinger.com ~all
 *   adepa77.fr     TXT  v=spf1 include:_spf.mail.hostinger.com ~all
 *
 * Un message émis depuis les serveurs de Brevo au nom de ces domaines échoue
 * donc l'authentification SPF, et n'est signé par aucune clé DKIM du domaine.
 * Avec un DMARC à `p=none` il n'est pas rejeté franchement — il est pénalisé,
 * silencieusement, au cas par cas. D'où des envois qui passent et d'autres
 * qui disparaissent sans laisser de trace.
 *
 * En passant par `smtp.hostinger.com`, authentifié comme la boîte du domaine,
 * SPF est aligné et Hostinger signe en DKIM (sélecteur `mail`). C'est la
 * correction de fond, pas un contournement.
 *
 * ── Ordre de préférence ──────────────────────────────────────────────────
 *
 *  1. SMTP, dès que SMTP_HOST / SMTP_USER / SMTP_PASSWORD sont renseignés ;
 *  2. l'API Brevo, si une clé subsiste — filet pour ne pas perdre les envois
 *     le temps d'une bascule, et rien de plus ;
 *  3. un log, en développement, pour ne jamais bloquer un parcours faute de
 *     serveur d'envoi.
 *
 * Aucun mot de passe n'est écrit dans ce dépôt : tout vient des variables
 * d'environnement.
 */
@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  /** Créé à la première utilisation, puis réutilisé (pool de connexions). */
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleDestroy() {
    this.transporter?.close();
  }

  /** Le SMTP est-il configuré ? Les trois valeurs sont nécessaires. */
  private get smtp() {
    const host = (this.config.get<string>('SMTP_HOST') ?? '').trim();
    const user = (this.config.get<string>('SMTP_USER') ?? '').trim();
    const pass = this.config.get<string>('SMTP_PASSWORD') ?? '';
    if (!host || !user || !pass) return null;

    // 465 = TLS implicite (le canal est chiffré dès la connexion), 587 =
    // STARTTLS. On prend 465 par défaut : moins de surprises derrière un
    // pare-feu, et pas de fenêtre en clair même brève.
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 465);
    return { host, port, secure: port === 465, user, pass };
  }

  private get transport(): Transporter | null {
    if (this.transporter) return this.transporter;
    const smtp = this.smtp;
    if (!smtp) return null;

    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
      // Une inscription ne doit pas rester suspendue parce qu'un serveur de
      // messagerie met deux minutes à répondre.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      // La boîte est plafonnée (50 envois par heure sur l'offre de base
      // Hostinger) : on garde une seule connexion et on sérialise, plutôt que
      // d'ouvrir dix canaux et de se faire fermer la porte.
      pool: true,
      maxConnections: 1,
      maxMessages: 50,
    });
    this.logger.log(`[MAIL] transport SMTP ${smtp.host}:${smtp.port} (${smtp.user})`);
    return this.transporter;
  }

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
      // L'ADRESSE D'EXPÉDITION DOIT APPARTENIR AU DOMAINE QUI SIGNE.
      // On s'authentifie sur le SMTP de les-extras.fr : envoyer au nom d'un
      // autre domaine casserait l'alignement DKIM/DMARC et nous remettrait
      // exactement dans la situation qu'on vient de corriger.
      email: this.config.get<string>('MAIL_FROM_EMAIL') ?? 'contact@les-extras.fr',
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

  /**
   * Envoi effectif. Ne lève jamais : un e-mail qui ne part pas ne doit pas
   * faire échouer l'inscription, la candidature ou la facture qui l'a
   * déclenché. En revanche il LAISSE UNE TRACE dans les journaux — c'est ce
   * qui manquait pour comprendre pourquoi certains messages disparaissaient.
   */
  private async send(to: string, subject: string, html: string): Promise<void> {
    const transport = this.transport;
    if (transport) {
      try {
        const info = await transport.sendMail({
          from: { name: this.sender.name, address: this.sender.email },
          to,
          subject,
          html,
          // Une version texte accompagne toujours le HTML : un message qui
          // n'en a pas est un signal négatif pour les filtres anti-spam, et
          // il reste illisible dans les clients en mode texte.
          text: versionTexte(html),
          // Les réponses arrivent à l'association, pas dans une boîte muette.
          replyTo: this.config.get<string>('MAIL_REPLY_TO') || undefined,
        });
        this.logger.log(`[MAIL:smtp] envoyé to=${to} id=${info.messageId} subject="${subject}"`);
        return;
      } catch (e) {
        // On tombe sur Brevo si une clé existe encore : mieux vaut un message
        // moins bien authentifié qu'aucun message.
        this.logger.error(`[MAIL:smtp] échec to=${to}: ${(e as Error).message}`);
      }
    }

    const apiKey = this.config.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      this.logger.log(
        `[MAIL:log] to=${to} subject="${subject}" (ni SMTP ni BREVO_API_KEY configurés)`,
      );
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
        this.logger.warn(
          `[MAIL:brevo] envoyé to=${to} subject="${subject}" — repli sur Brevo : ` +
            `SPF n'autorise pas Brevo pour ce domaine, la délivrabilité est incertaine.`,
        );
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
   * Mot de passe oublié.
   *
   * Le message dit trois choses, et rien d'autre : le lien, sa durée de vie,
   * et quoi faire si la demande ne vient pas de vous. Ce dernier point n'est
   * pas une formule de politesse — c'est la seule information qui permette à
   * quelqu'un de comprendre qu'on essaie peut-être d'entrer chez lui.
   */
  async sendPasswordReset(to: string, token: string, prenom?: string | null): Promise<void> {
    const url = `${this.webUrl}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Réinitialiser votre mot de passe — LES EXTRAS',
      this.layout(
        `Nouveau mot de passe${prenom ? `, ${prenom}` : ''}`,
        `Vous avez demandé à changer votre mot de passe. Le bouton ci-dessous vous mène à
         l'écran pour en choisir un nouveau.
         <br><br><strong>Ce lien est valable une heure et ne fonctionne qu'une fois.</strong>
         <br><br>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot
         de passe actuel reste valable et personne n'a accédé à votre compte. Si cela se
         reproduit, écrivez-nous.`,
        { label: 'Choisir un nouveau mot de passe', url },
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
    data: {
      code: string;
      document: string;
      minutes: number;
      nomSignataire?: string | null;
      /** Où saisir le code. Sans ce lien, le courriel donnait six chiffres et
       *  aucune destination — le signataire ne savait pas où aller. */
      url?: string | null;
    },
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
        data.url ? { label: 'Saisir mon code et signer', url: data.url } : undefined,
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

  /**
   * SOS Renfort — sollicitation d'un intervenant.
   *
   * `retenus` et `vague` personnalisent le message. C'est le levier le moins
   * coûteux et le plus efficace du dispositif : un e-nvoi de masse à cent
   * personnes fait supposer à chacune qu'une autre prendra la mission, et
   * personne ne répond. Dire « vous êtes l'un des 8 profils retenus » rétablit
   * le sentiment d'être personnellement attendu, ce qui remonte le taux
   * d'acceptation — et donc la couverture, à effectif de vivier constant.
   */
  async sendMissionMatch(
    to: string,
    data: {
      title: string;
      city?: string | null;
      date?: string | Date | null;
      job?: string | null;
      rate?: string | number | null;
      emergency?: boolean;
      missionId: string;
      /** Nombre d'intervenants sollicités dans cette vague. */
      retenus?: number;
      /** 1 = profils les plus proches, 2 = élargissement, 3 = tout le réseau. */
      vague?: number;
    },
  ): Promise<void> {
    const when = this.frDate(data.date);
    const url = `${this.webUrl}/marketplace/missions/${data.missionId}`;
    const tag = data.emergency ? '🚨 <b>Mission urgente</b> — ' : '';

    // Le contexte de sélection, dit simplement et honnêtement.
    let selection = '';
    if (data.vague === 1 && data.retenus) {
      selection = `<br><br>Vous faites partie des <b>${data.retenus} intervenants</b> dont le profil correspond le mieux à ce besoin — métier, secteur géographique et disponibilité. Nous ne l'avons proposée qu'à vous pour l'instant.`;
    } else if (data.vague === 2) {
      selection = `<br><br>Cette mission n'a pas encore trouvé preneur auprès des premiers profils sollicités : nous élargissons la recherche, et votre profil correspond.`;
    } else if (data.vague === 3) {
      selection = `<br><br>Cette mission reste ouverte et nous la proposons maintenant à l'ensemble du réseau.`;
    }

    await this.send(
      to,
      `${data.emergency ? '🚨 ' : ''}${data.vague === 1 ? 'Vous êtes retenu·e pour une mission' : 'Une mission de renfort pour vous'} : ${data.title}`,
      this.layout(
        data.vague === 1 ? 'Une mission pour vous, en priorité' : 'Une mission qui vous correspond',
        `${tag}Un établissement recherche un renfort <b>« ${data.title} »</b>${data.job ? ` (${data.job})` : ''}${
          data.city ? ` à <b>${data.city}</b>` : ''
        }${when ? ` le <b>${when}</b>` : ''}${data.rate ? `, rémunéré ${data.rate} €/h` : ''}.${selection}
        <br><br><b>Premier arrivé, premier servi</b> : la mission est attribuée au premier intervenant qui l'accepte.`,
        { label: 'Voir et accepter la mission', url },
      ),
    );
  }

  /**
   * SOS Renfort — « mission garantie » : le dispositif a épuisé ses vagues
   * sans trouver preneur. L'établissement est prévenu qu'un humain reprend
   * la main, et l'association reçoit l'alerte pour appeler le vivier.
   */
  async sendMissionNonPourvue(
    to: string,
    data: { title: string; city?: string | null; date?: string | Date | null; missionId: string; sollicites: number; pourAdmin?: boolean },
  ): Promise<void> {
    const when = this.frDate(data.date);
    const url = `${this.webUrl}${data.pourAdmin ? '/admin/missions/' : '/dashboard/renforts?mission='}${data.missionId}`;
    if (data.pourAdmin) {
      await this.send(
        to,
        `⚠️ Mission non pourvue à relancer : ${data.title}`,
        this.layout(
          'Une mission demande une relance manuelle',
          `La mission <b>« ${data.title} »</b>${data.city ? ` à ${data.city}` : ''}${when ? ` du <b>${when}</b>` : ''}
          n'a pas trouvé preneur après ${data.sollicites} sollicitation(s).
          <br><br>C'est l'engagement « mission garantie » : il faut maintenant appeler le vivier à la main.`,
          { label: 'Ouvrir la mission', url },
        ),
      );
      return;
    }
    await this.send(
      to,
      `Votre mission « ${data.title} » — nous reprenons la main`,
      this.layout(
        'Nous nous en occupons personnellement',
        `Votre mission <b>« ${data.title} »</b>${when ? ` du <b>${when}</b>` : ''} n'a pas encore trouvé preneur
        après avoir été proposée à ${data.sollicites} intervenant(s).
        <br><br>Comme promis, nous ne vous laissons pas avec une annonce sans réponse : notre équipe contacte
        maintenant le réseau directement et revient vers vous.`,
        { label: 'Suivre ma mission', url },
      ),
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // FILE D'ENGAGEMENT — l'établissement valide chaque profil
  //
  // Toute la valeur de ce mode tient dans la qualité de ces quatre messages.
  // Un intervenant qui s'engage et n'entend plus parler de rien ne s'engagera
  // pas une seconde fois ; un établissement qui reçoit un profil sans savoir
  // qu'on l'attend laisse la file bloquée. On dit donc à chacun, à chaque
  // étape, exactement où il en est.
  // ───────────────────────────────────────────────────────────────────────

  /** L'intervenant s'est engagé : accusé de réception, avec sa place réelle. */
  async sendEngagementEnregistre(
    to: string,
    data: { title: string; missionId: string; rang: number; presente: boolean; date?: string | Date | null },
  ): Promise<void> {
    const when = this.frDate(data.date);
    const url = `${this.webUrl}/marketplace/missions/${data.missionId}`;
    const situation = data.presente
      ? `Votre profil vient d'être <b>transmis à l'établissement</b>, qui doit maintenant le valider. Vous recevrez sa réponse ici même — et le contrat d'engagement dès qu'elle sera positive.`
      : `Vous êtes <b>${data.rang}<sup>e</sup> dans la file</b>. Une personne s'est engagée avant vous : son profil est en cours de validation. Si l'établissement ne la retient pas, c'est le vôtre qui sera présenté.`;
    await this.send(
      to,
      `Engagement enregistré : ${data.title}`,
      this.layout(
        data.presente ? 'Votre profil part à l’établissement' : 'Vous êtes dans la file',
        `Vous vous êtes engagé·e sur la mission <b>« ${data.title} »</b>${when ? ` du <b>${when}</b>` : ''}.
        <br><br>${situation}
        <br><br>Tant que la réponse n'est pas arrivée, <b>rien ne vous engage juridiquement</b> : vous pouvez vous retirer à tout moment depuis la fiche de la mission.`,
        { label: 'Suivre ma mission', url },
      ),
    );
  }

  /** Un profil est présenté à l'établissement : c'est à lui de trancher. */
  async sendProfilAValider(
    to: string,
    data: {
      title: string;
      freelanceName: string;
      freelanceJob?: string | null;
      city?: string | null;
      date?: string | Date | null;
      missionId: string;
      enAttente: number;
      message?: string | null;
      relance?: boolean;
    },
  ): Promise<void> {
    const when = this.frDate(data.date);
    const url = `${this.webUrl}/dashboard/renforts#${data.missionId}`;
    const suite =
      data.enAttente > 0
        ? `<br><br>Si vous ne retenez pas ce profil, <b>${data.enAttente} autre(s) intervenant(s)</b> se sont déjà engagés : le suivant vous sera présenté immédiatement.`
        : `<br><br>C'est pour l'instant la seule personne engagée. Un refus remet la mission en diffusion.`;
    await this.send(
      to,
      data.relance
        ? `⏳ Un profil attend toujours votre réponse : ${data.title}`
        : `Un intervenant a pris votre mission : ${data.title}`,
      this.layout(
        data.relance ? 'Un intervenant vous attend' : 'Un profil à valider',
        `<b>${data.freelanceName}</b>${data.freelanceJob ? ` — ${data.freelanceJob}` : ''} s'est engagé·e sur votre mission
        <b>« ${data.title} »</b>${data.city ? ` à ${data.city}` : ''}${when ? ` du <b>${when}</b>` : ''}.
        ${data.message ? `<br><br><i>« ${data.message} »</i>` : ''}
        <br><br>Rien n'est confirmé tant que vous n'avez pas répondu : <b>vous acceptez ou vous refusez</b>, et le contrat n'est
        émis qu'après votre acceptation.${suite}
        ${data.relance ? `<br><br>La personne attend depuis un moment — une réponse, même négative, lui permet de se positionner ailleurs.` : ''}`,
        { label: 'Voir le profil et répondre', url },
      ),
    );
  }

  /** Profil écarté : on le dit clairement, et on dit la suite. */
  async sendEngagementEcarte(
    to: string,
    data: { title: string; motif?: string | null; caduc?: boolean; date?: string | Date | null },
  ): Promise<void> {
    const when = this.frDate(data.date);
    const url = `${this.webUrl}/marketplace`;
    await this.send(
      to,
      `Mission non retenue : ${data.title}`,
      this.layout(
        data.caduc ? 'La mission a été attribuée' : 'L’établissement a retenu un autre profil',
        data.caduc
          ? `La mission <b>« ${data.title} »</b>${when ? ` du ${when}` : ''} a été attribuée à un autre intervenant engagé avant vous.
             <br><br>Votre engagement est donc levé : vous êtes libre sur ce créneau. Merci d'avoir répondu — c'est exactement
             ce qui fait tenir le réseau.`
          : `L'établissement n'a pas retenu votre profil pour <b>« ${data.title} »</b>${when ? ` du ${when}` : ''}.
             ${data.motif ? `<br><br><b>Motif indiqué :</b> ${data.motif}` : ''}
             <br><br>Ce n'est pas un jugement sur votre travail : les établissements arbitrent souvent sur une contrainte
             précise (une qualification attendue, une connaissance du groupe). Votre engagement est levé, vous êtes libre
             sur ce créneau.`,
        { label: 'Voir les missions ouvertes', url },
      ),
    );
  }

  /** Plus personne dans la file : l'établissement doit le savoir. */
  async sendFileEpuisee(
    to: string,
    data: { title: string; missionId: string; date?: string | Date | null; refuses: number },
  ): Promise<void> {
    const when = this.frDate(data.date);
    const url = `${this.webUrl}/dashboard/renforts#${data.missionId}`;
    await this.send(
      to,
      `Plus personne en file sur « ${data.title} »`,
      this.layout(
        'La mission repart en diffusion',
        `Vous avez écarté ${data.refuses} profil(s) sur <b>« ${data.title} »</b>${when ? ` du ${when}` : ''} et la file est
        maintenant vide.
        <br><br>La mission <b>reste publiée</b> et continue d'être proposée. Si les profils reçus ne correspondent pas,
        il vaut souvent mieux préciser l'annonce (qualification attendue, contraintes du poste) que d'attendre :
        c'est le meilleur filtre.`,
        { label: 'Ouvrir la mission', url },
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

/**
 * Une version texte lisible, dérivée du HTML.
 *
 * Ce n'est pas de la mise en forme : c'est ce que lisent les filtres
 * anti-spam (un message HTML seul est suspect) et ce que voient les clients
 * en mode texte. On garde les URL, qui sont l'essentiel de nos messages —
 * sans elles la version texte ne servirait à rien.
 */
export function versionTexte(html: string): string {
  return html
    // Le lien du bouton disparaîtrait avec les balises : on le fait ressortir.
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, url, texte) => {
      const libelle = String(texte).replace(/<[^>]+>/g, '').trim();
      return libelle ? `${libelle} : ${url}` : String(url);
    })
    .replace(/<\/(p|div|h1|h2|h3|tr|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim();
}
