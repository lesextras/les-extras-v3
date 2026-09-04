import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
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
/**
 * Une piece jointe : un fichier deja fabrique, pret a partir.
 *
 * Le contenu est un Buffer et non un chemin : rien n'est ecrit sur le disque
 * du serveur au passage. Un ecrit professionnel qui transiterait par un
 * fichier temporaire y resterait le jour ou l'envoi echoue.
 */
export interface PieceJointe {
  nom: string;
  contenu: Buffer;
  type: string;
}

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  /** Créé à la première utilisation, puis réutilisé (pool de connexions). */
  private transporter: Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    /**
     * ⚠ INJECTÉ EN OPTIONNEL, ET C'EST VOLONTAIRE. `MailModule` est global et
     * chargé très tôt ; exiger Prisma ici ferait dépendre l'envoi d'un courriel
     * de la disponibilité de la base. Un mail qui ne part pas parce que la base
     * hoquette serait un très mauvais échange.
     */
    @Optional() private readonly prisma?: PrismaService,
  ) {}

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

  /**
   * L'adresse du site dans TOUS les liens envoyés par e-mail.
   *
   * Le dernier repli était `app.les-extras.fr` — le nom qui, depuis
   * l'inversion des domaines du 10/08/2026, sert WordPress et non le SaaS. Si
   * `APP_WEB_URL` venait à disparaître des variables d'environnement, chaque
   * lien de vérification, de contrat et de facture serait parti vers un 404,
   * sans que rien ne le signale. Un repli doit être une valeur sûre, pas une
   * valeur historique.
   */
  private get webUrl(): string {
    return (
      this.config.get<string>('APP_WEB_URL') ??
      this.config.get<string>('WEB_ORIGIN') ??
      'https://les-extras.fr'
    );
  }

  /**
   * L'EXPÉDITEUR EST IMPOSÉ PAR LA BOÎTE QUI ENVOIE, PAS PAR UNE VARIABLE.
   *
   * C'est toute la leçon de la panne : on envoyait au nom de
   * `contact@adepa77.fr` depuis une infrastructure que ce domaine n'autorise
   * pas, et les messages disparaissaient. Le même piège se reproduirait au
   * premier oubli de configuration — une variable d'environnement laissée sur
   * l'ancienne valeur suffit.
   *
   * Alors on ne s'en remet plus à la configuration : dès que le SMTP est
   * actif, l'expéditeur doit être du MÊME DOMAINE que la boîte authentifiée.
   * Si ce n'est pas le cas, on utilise l'adresse de la boîte elle-même et on
   * le signale dans les journaux. Une adresse d'affichage flatteuse ne vaut
   * pas un e-mail qui n'arrive jamais.
   *
   * `MAIL_FROM_EMAIL` reste utile : elle permet d'expédier depuis une autre
   * adresse du même domaine (par exemple `ne-pas-repondre@les-extras.fr`).
   */
  private get sender() {
    const name = this.config.get<string>('MAIL_FROM_NAME') ?? 'LES EXTRAS';
    const smtp = this.smtp;
    const demandee = (this.config.get<string>('MAIL_FROM_EMAIL') ?? '').trim();

    if (!smtp) {
      return { name, email: demandee || 'contact@les-extras.fr' };
    }

    const domaineBoite = smtp.user.split('@')[1]?.toLowerCase();
    const domaineDemande = demandee.split('@')[1]?.toLowerCase();

    if (demandee && domaineDemande === domaineBoite) {
      return { name, email: demandee };
    }

    if (demandee && !this.alerteExpediteur) {
      this.alerteExpediteur = true;
      this.logger.warn(
        `[MAIL] MAIL_FROM_EMAIL (${demandee}) n'est pas du domaine de la boîte d'envoi ` +
          `(${smtp.user}) : SPF et DKIM ne seraient pas alignés et les messages risqueraient ` +
          `d'être écartés silencieusement. On expédie depuis ${smtp.user}.`,
      );
    }
    return { name, email: smtp.user };
  }

  /** N'avertir qu'une fois, pas à chaque e-mail. */
  private alerteExpediteur = false;

  /**
   * JOURNAL DES ENVOIS — pour que l'administration voie ce qui part.
   *
   * `send()` ne lève jamais : c'est ce qui protège l'inscription, la
   * candidature ou la facture qui l'a déclenché. Mais l'effet de bord est
   * qu'un e-mail qui n'arrive pas **ne se voit nulle part** : il ne restait
   * qu'une ligne dans les journaux du conteneur, c'est-à-dire rien pour
   * quelqu'un qui pilote la plateforme depuis le navigateur.
   *
   * ⚠ CE JOURNAL VIT EN MÉMOIRE, ET IL EST REMIS À ZÉRO À CHAQUE
   * REDÉMARRAGE. C'est un choix, pas un oubli : la question à laquelle il
   * répond est « est-ce que ça part en ce moment ? », et elle se pose sur
   * les dernières heures. Une table en base pour la même réponse coûterait
   * une écriture par e-mail, une migration et une purge à écrire — et elle
   * porterait des adresses, donc une durée de conservation à justifier. Le
   * jour où il faut l'historique complet, c'est un vrai sujet, pas une
   * variante de celui-ci.
   *
   * Cent lignes au maximum : au-delà, les plus anciennes tombent.
   */
  private static readonly JOURNAL_MAX = 100;
  private journal: {
    date: string;
    destinataire: string;
    sujet: string;
    voie: 'smtp' | 'brevo' | 'aucune';
    ok: boolean;
    erreur?: string;
  }[] = [];
  private compteurs = { envoyes: 0, echecs: 0, sansTransport: 0 };
  /** Date de démarrage : sans elle, les compteurs ne veulent rien dire. */
  private readonly depuis = new Date().toISOString();

  private noter(
    destinataire: string,
    sujet: string,
    voie: 'smtp' | 'brevo' | 'aucune',
    ok: boolean,
    erreur?: string,
  ) {
    if (ok) this.compteurs.envoyes += 1;
    else if (voie === 'aucune') this.compteurs.sansTransport += 1;
    else this.compteurs.echecs += 1;

    // LE JOURNAL DURABLE, en plus du journal en mémoire.
    //
    // Celui en mémoire repart à zéro à chaque redéploiement : il ne répond
    // jamais à « est-ce que mes mails sont partis cette semaine ? ». Celui-ci
    // survit. L'écriture ne bloque pas l'envoi et n'échoue jamais bruyamment :
    // perdre une ligne de journal ne doit pas perdre un courriel.
    void this.prisma?.emailEnvoye
      .create({
        data: { destinataire, sujet: sujet.slice(0, 300), voie, ok, erreur: erreur?.slice(0, 300) },
      })
      .catch(() => undefined);

    this.journal.unshift({
      date: new Date().toISOString(),
      destinataire,
      sujet,
      voie,
      ok,
      // Un message d'erreur SMTP peut contenir la réponse entière du serveur :
      // on garde de quoi diagnostiquer, pas de quoi noyer l'écran.
      erreur: erreur?.slice(0, 300),
    });
    if (this.journal.length > MailService.JOURNAL_MAX) {
      this.journal.length = MailService.JOURNAL_MAX;
    }
  }

  /** Ce que l'administration affiche. Lecture seule. */
  etatEnvois() {
    const smtp = this.smtp;
    return {
      depuis: this.depuis,
      transport: smtp
        ? { voie: 'smtp' as const, hote: smtp.host, port: smtp.port, boite: smtp.user }
        : this.config.get<string>('BREVO_API_KEY')
          ? { voie: 'brevo' as const }
          : { voie: 'aucune' as const },
      expediteur: this.sender,
      ...this.compteurs,
      derniers: this.journal.slice(0, 40),
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
  private async send(
    to: string,
    subject: string,
    html: string,
    pieces?: PieceJointe[],
  ): Promise<void> {
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
          attachments: pieces?.map((p) => ({
            filename: p.nom,
            content: p.contenu,
            contentType: p.type,
          })),
        });
        this.logger.log(`[MAIL:smtp] envoyé to=${to} id=${info.messageId} subject="${subject}"`);
        this.noter(to, subject, 'smtp', true);
        return;
      } catch (e) {
        // On tombe sur Brevo si une clé existe encore : mieux vaut un message
        // moins bien authentifié qu'aucun message.
        this.logger.error(`[MAIL:smtp] échec to=${to}: ${(e as Error).message}`);
        this.noter(to, subject, 'smtp', false, (e as Error).message);
      }
    }

    const apiKey = this.config.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      this.logger.log(
        `[MAIL:log] to=${to} subject="${subject}" (ni SMTP ni BREVO_API_KEY configurés)`,
      );
      this.noter(to, subject, 'aucune', false, 'aucun transport configuré');
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
          // Brevo veut la piece en base64 ; nodemailer la veut en Buffer.
          attachment: pieces?.map((p) => ({
            name: p.nom,
            content: p.contenu.toString('base64'),
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`[MAIL:brevo] échec ${res.status} to=${to}: ${body.slice(0, 200)}`);
        this.noter(to, subject, 'brevo', false, `${res.status} ${body.slice(0, 200)}`);
      } else {
        this.logger.warn(
          `[MAIL:brevo] envoyé to=${to} subject="${subject}", repli sur Brevo : ` +
            `SPF n'autorise pas Brevo pour ce domaine, la délivrabilité est incertaine.`,
        );
        this.noter(to, subject, 'brevo', true);
      }
    } catch (e) {
      this.logger.error(`[MAIL:brevo] exception to=${to}: ${(e as Error).message}`);
      this.noter(to, subject, 'brevo', false, (e as Error).message);
    }
  }

  /**
   * Confirmation d'adresse.
   *
   * Le message annonçait « 24 heures » alors que le jeton est signé avec
   * `expiresIn: '2d'` dans auth.service.ts : il vaut 48 heures. L'écart n'est
   * pas anodin — quelqu'un qui ouvre son mail le lendemain soir renonçait à
   * cliquer et redemandait un lien, en croyant le sien périmé. C'est le texte
   * qui est corrigé, pas la durée du jeton.
   */
  async sendEmailVerification(to: string, token: string, prenom?: string | null): Promise<void> {
    const url = `${this.webUrl}/verify-email?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Confirmez votre adresse, LES EXTRAS',
      this.layout(
        `Plus qu'une étape${prenom ? `, ${prenom}` : ''}`,
        `Votre compte est créé. Confirmez cette adresse pour l'activer complètement : c'est ce qui
         nous permet de vous joindre quand une mission vous correspond ou qu'un devis arrive.
         <br><br>Ce lien est valable 48 heures.`,
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
      'Réinitialiser votre mot de passe, LES EXTRAS',
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
    data: {
      prenom?: string | null;
      type: 'ESTABLISHMENT' | 'FREELANCE';
      /**
       * L'adresse est-elle déjà confirmée au moment de l'envoi ?
       *
       * Ce message part désormais à l'INSCRIPTION, plus à la confirmation :
       * il était le seul e-mail qui explique quoi faire, et il ne partait
       * qu'après un clic. Quelqu'un dont le premier message tombait en
       * indésirables ne recevait donc jamais rien d'autre — ni accompagnement,
       * ni relance — tout en restant incapable de publier.
       */
      confirme?: boolean;
    },
  ): Promise<void> {
    const etab = data.type === 'ESTABLISHMENT';
    const confirme = data.confirme ?? true;

    const premiersPas = etab
      ? [
          'Parcourez le catalogue d’ateliers et de formations, et demandez un devis en deux clics.',
          'Publiez un RenforTeam quand une absence tombe : il part d’abord à votre équipe interne.',
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
        `${
          confirme
            ? `Votre adresse est confirmée : vous faites maintenant partie de la communauté`
            : `Votre compte est créé : vous faites partie de la communauté`
        }
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
         ${
           confirme
             ? ''
             : `<br><b>Une seule chose à faire d'abord :</b> confirmer votre adresse, avec le lien
                du message intitulé « Confirmez votre adresse ». Sans cette confirmation, tout
                reste accessible : mais rien de ce que vous publiez ne devient visible du public.
                Si vous ne le trouvez pas, regardez dans vos indésirables : c'est là qu'il finit
                une fois sur trois.<br>`
         }
         <br>
         Une question ? Répondez simplement à cet e-mail, une vraie personne le lit.`,
        { label: 'Ouvrir mon espace', url: `${this.webUrl}/welcome` },
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

  /** RenforTeam : e-mail envoyé à chaque freelance dont le profil correspond. */
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
            `<a href="${this.webUrl}/marketplace/missions/${m.id}" style="color:#1A1A1A">${m.titre}</a>${m.ville ? `, ${m.ville}` : ''}`,
        ),
        data.missions.length ? { label: 'Voir toutes les missions', url: `${this.webUrl}/dashboard/opportunites` } : undefined,
      ),
      bloc(
        'Des collègues attendent un retour dans le GAP',
        data.questions.map(
          (q) =>
            `<a href="${this.webUrl}/dashboard/gap/${q.id}" style="color:#1A1A1A">${q.titre}</a> <span style="color:#9ca3af">, ${q.metier}</span>`,
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
   * L'e-mail d'activation du lendemain — UN SEUL, jamais répété.
   *
   * Le rendez-vous du lundi retient ceux qui sont entrés dans l'habitude ;
   * rien n'activait ceux qui viennent de s'inscrire. Ce message arrive à J+1,
   * quand l'inscription est encore fraîche mais que l'élan du premier jour est
   * retombé, et il ne demande qu'UNE chose — celle qui débloque tout le reste
   * pour ce type de compte. Trois variantes, un geste chacune. S'il est déjà
   * fait, le planificateur n'envoie rien du tout (voir ActivationScheduler).
   */
  async sendActivationJ1(
    to: string,
    data: {
      prenom?: string | null;
      variante: 'etablissement' | 'independant' | 'salarie';
    },
  ): Promise<void> {
    const variantes = {
      etablissement: {
        sujet: 'Votre premier renfort est à trois champs d’ici',
        corps:
          `Votre espace est prêt. La prochaine étape, la seule qui compte, est de
           <b>publier votre premier besoin</b> : un poste, des dates, un mot de contexte.
           La diffusion fait le reste, par cercles : vos salariés d'abord, puis vos
           habitués, puis le réseau. Vous ne payez aucune commission, le tarif de
           l'intervenant est son tarif.`,
        cta: { label: 'Publier mon premier besoin', chemin: '/dashboard/renforts' },
      },
      independant: {
        sujet: 'Votre dossier vous fait passer devant',
        corps:
          `Votre compte est ouvert. Ce qui décide maintenant de la suite, c'est votre
           <b>dossier</b> : métier, ville, diplôme. À la publication d'un renfort, les
           établissements voient d'abord les dossiers complets, un dossier vide est
           invisible, un dossier complet est sollicité. Dix minutes, une seule fois.`,
        cta: { label: 'Compléter mon dossier', chemin: '/dashboard/mon-dossier' },
      },
      salarie: {
        sujet: 'Une demande de rattachement, et tout s’ouvre',
        corps:
          `Votre compte est ouvert, et LEX, l'assistant d'écrits professionnels, est
           <b>déjà utilisable</b>, avec votre dotation offerte. Pour le reste, une seule
           étape : <b>demander votre rattachement</b> à votre établissement. Une fois
           accepté, ses renforts vous arrivent avant tout le monde.`,
        cta: { label: 'Ouvrir mon espace', chemin: '/dashboard' },
      },
    } as const;
    const v = variantes[data.variante];
    await this.send(
      to,
      v.sujet,
      this.layout(
        `Bonjour${data.prenom ? ` ${data.prenom}` : ''},`,
        `${v.corps}
         <div style="margin-top:24px;font-size:12px;color:#9ca3af">Vous ne recevrez ce message qu'une seule fois.</div>`,
        { label: v.cta.label, url: `${this.webUrl}${v.cta.chemin}` },
      ),
    );
  }

  /**
   * RenforTeam — sollicitation d'un intervenant.
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
    const tag = data.emergency ? '🚨 <b>Mission urgente</b>, ' : '';

    // Le contexte de sélection, dit simplement et honnêtement.
    let selection = '';
    if (data.vague === 1 && data.retenus) {
      selection = `<br><br>Vous faites partie des <b>${data.retenus} intervenants</b> dont le profil correspond le mieux à ce besoin : métier, secteur géographique et disponibilité. Nous ne l'avons proposée qu'à vous pour l'instant.`;
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
   * RenforTeam — « mission garantie » : le dispositif a épuisé ses vagues
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
      `Votre mission « ${data.title} », nous reprenons la main`,
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
      ? `Votre profil vient d'être <b>transmis à l'établissement</b>, qui doit maintenant le valider. Vous recevrez sa réponse ici même : et le contrat d'engagement dès qu'elle sera positive.`
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
        `<b>${data.freelanceName}</b>${data.freelanceJob ? `, ${data.freelanceJob}` : ''} s'est engagé·e sur votre mission
        <b>« ${data.title} »</b>${data.city ? ` à ${data.city}` : ''}${when ? ` du <b>${when}</b>` : ''}.
        ${data.message ? `<br><br><i>« ${data.message} »</i>` : ''}
        <br><br>Rien n'est confirmé tant que vous n'avez pas répondu : <b>vous acceptez ou vous refusez</b>, et le contrat n'est
        émis qu'après votre acceptation.${suite}
        ${data.relance ? `<br><br>La personne attend depuis un moment, une réponse, même négative, lui permet de se positionner ailleurs.` : ''}`,
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
             <br><br>Votre engagement est donc levé : vous êtes libre sur ce créneau. Merci d'avoir répondu, c'est exactement
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

  /** RenforTeam : e-mail à l'établissement quand la mission est pourvue. */
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
        <b>${data.freelanceName}</b>${data.freelanceJob ? `, ${data.freelanceJob}` : ''}.
        <br><br>Le contrat de mission est prêt à être signé. Vous y retrouverez le détail du profil de l'intervenant.`,
        { label: 'Voir le contrat & le profil', url },
      ),
    );
  }

  /** RenforTeam : e-mail au freelance qui a accepté (contrat + infos). */
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
      this.config.get<string>('WEB_PUBLIC_URL') ?? 'https://les-extras.fr'
    ).replace(/\/$/, '');
    const url = `${site}/actualites/${data.slug}`;
    await this.send(
      to,
      `Première actualité publiée, ${data.accountName}`,
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

  /**
   * UN ECRIT LEX ENVOYE PAR COURRIEL (25/08/2026).
   *
   * Le document part en piece jointe, dans le format que l'auteur a choisi.
   * Le corps du message ne le recopie pas : un ecrit professionnel se lit
   * dans son fichier, pas dans un courriel qui traversera peut-etre trois
   * boites. C'est l'auteur qui decide de l'adresse, apres relecture.
   */
  async sendDocumentLex(data: {
    to: string;
    titre: string;
    message?: string;
    piece: PieceJointe;
  }): Promise<void> {
    const echappe = (s: string) => s.replace(/</g, "&lt;");
    const mot = data.message
      ? `<br><br>${echappe(data.message).replace(/\n/g, "<br>")}`
      : "";
    await this.send(
      data.to,
      data.titre,
      this.layout(
        data.titre,
        `Vous trouverez en pièce jointe le document <b>${echappe(data.titre)}</b>, rédigé et relu sur Les Extras.${mot}`,
      ),
      [data.piece],
    );
  }

  /**
   * ALERTE À CHAQUE INSCRIPTION (03/09/2026, demande Siham).
   *
   * « Il y a un problème quand il y a des inscrits, je veux en être
   * informée. » Aucun message ne partait à l'association quand un compte se
   * créait : les inscriptions se découvraient en ouvrant l'administration,
   * donc quand on y pensait. Un directeur qui s'inscrit un vendredi soir et
   * que personne ne rappelle est un directeur perdu.
   *
   * ⚠ L'adresse par défaut est CELLE DE SIHAM, pas `contact@adepa77.fr`
   * comme les autres alertes : c'est elle qui a demandé à être prévenue, et
   * la boîte `contact@` n'est pas relevée tous les jours. `ALERTES_EMAIL` la
   * remplace si un jour l'association veut router ces messages ailleurs.
   *
   * Le message ne porte AUCUNE donnée sensible : nom, adresse, type de
   * compte et origine. C'est ce qu'il faut pour rappeler quelqu'un, et rien
   * de plus n'a à voyager par courriel.
   */
  async sendAlerteInscription(data: {
    prenom?: string | null;
    nom?: string | null;
    email: string;
    telephone?: string | null;
    typeCompte: string;
    nomCompte: string;
    origine?: string | null;
  }): Promise<void> {
    const to =
      this.config.get<string>('ALERTES_EMAIL') ??
      this.config.get<string>('CONTACT_INBOX_EMAIL') ??
      'assoc.adepa@gmail.com';
    const e = (s: string) => s.replace(/</g, '&lt;');
    const qui = [data.prenom, data.nom].filter(Boolean).join(' ') || data.email;
    const genre =
      data.typeCompte === 'ESTABLISHMENT' ? 'Établissement' : 'Professionnel';
    await this.send(
      to,
      `Nouvelle inscription, ${qui} (${genre})`,
      this.layout(
        'Un compte vient d’être créé',
        `<b>${e(qui)}</b> vient de s’inscrire sur Les Extras.
        <br><br><b>Type :</b> ${genre}
        <br><b>Structure :</b> ${e(data.nomCompte)}
        <br><b>E-mail :</b> ${e(data.email)}
        ${data.telephone ? `<br><b>Téléphone :</b> ${e(data.telephone)}` : ''}
        ${data.origine ? `<br><b>Origine :</b> ${e(data.origine)}` : ''}
        <br><br>L’adresse n’est pas encore confirmée à cette minute : le message de
        confirmation vient de partir. La séquence d’accueil prendra le relais les
        jours suivants.`,
        { label: 'Voir les comptes', url: `${this.webUrl}/admin/etablissements` },
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LES QUATRE ÉVÉNEMENTS QUI N'ENVOYAIENT RIEN (3 septembre 2026)
  // ─────────────────────────────────────────────────────────────────────────
  //
  // ⚠ CE BLOC RÉPARE UN SILENCE, PAS UN MANQUE DE FONCTIONNALITÉ.
  //
  // Réserver un atelier, demander un devis, demander un rattachement et
  // transmettre un contrat n'écrivaient qu'une ligne en base — au mieux une
  // notification dans l'application, au pire rien du tout. Or personne ne
  // consulte une plateforme qu'il n'utilise pas encore tous les jours : c'est
  // le courriel qui ramène.
  //
  // Mesuré en production le 3/09/2026 : quinze réservations, une seule menée à
  // son terme ; deux demandes de rattachement en attente dont personne
  // n'avait été prévenu. Et quatre comptes intervenants portant quatorze
  // fiches ont une adresse sur un domaine SANS MX — d'où la règle : ces envois
  // sont toujours protégés par un `.catch()` chez l'appelant, un courriel qui
  // ne part pas ne doit jamais faire échouer le geste de quelqu'un d'autre.

  /** Une réservation d'atelier vient d'arriver, côté intervenant. */
  async sendReservationRecue(
    to: string,
    data: {
      atelier: string;
      etablissement?: string | null;
      quand?: Date | null;
      participants?: number | null;
      note?: string | null;
      depassement?: number | null;
    },
  ): Promise<void> {
    const e = (t: string) => t.replace(/</g, '&lt;');
    const quand = data.quand
      ? new Date(data.quand).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'date à convenir';
    await this.send(
      to,
      `Réservation reçue, ${data.atelier}`,
      this.layout(
        'Un établissement vous a réservé',
        `<b>${e(data.etablissement ?? 'Un établissement')}</b> vient de réserver
        votre atelier <b>${e(data.atelier)}</b>.
        <br><br><b>Quand :</b> ${e(quand)}
        ${data.participants ? `<br><b>Participants :</b> ${data.participants}` : ''}
        ${
          data.depassement
            ? `<br><b>⚠ Au-delà des ${data.depassement} annoncés sur votre fiche.</b>
               C'est un refus ou une renégociation : mieux vaut le dire maintenant
               que le jour même.`
            : ''
        }
        ${
          data.note
            ? `<br><br><b>Sa précision :</b><br><i>${e(data.note).slice(0, 800)}</i>`
            : ''
        }
        <br><br>Acceptez ou déclinez depuis votre espace. Tant que vous n'avez pas
        répondu, l'établissement attend.`,
        { label: 'Voir la réservation', url: `${this.webUrl}/dashboard/ateliers` },
      ),
    );
  }

  /** Un établissement demande un devis sur une fiche. */
  async sendDevisDemande(
    to: string,
    data: { atelier?: string | null; etablissement?: string | null; message?: string | null },
  ): Promise<void> {
    const e = (t: string) => t.replace(/</g, '&lt;');
    await this.send(
      to,
      `Demande de devis, ${data.atelier ?? 'votre intervention'}`,
      this.layout(
        'Une demande de devis vous attend',
        `<b>${e(data.etablissement ?? 'Un établissement')}</b> vous demande un devis
        ${data.atelier ? `pour <b>${e(data.atelier)}</b>` : ''}.
        ${data.message ? `<br><br><i>${e(data.message).slice(0, 800)}</i>` : ''}
        <br><br>Le site annonce une réponse sous 48 heures : c'est la promesse qui
        décide un directeur à essayer la plateforme plutôt qu'à appeler ailleurs.`,
        { label: 'Répondre au devis', url: `${this.webUrl}/dashboard/facturation?vue=devis` },
      ),
    );
  }

  /** Le devis chiffré est parti — côté établissement. */
  async sendDevisRecu(
    to: string,
    data: { atelier?: string | null; intervenant?: string | null; montant?: string | null },
  ): Promise<void> {
    const e = (t: string) => t.replace(/</g, '&lt;');
    await this.send(
      to,
      `Votre devis est arrivé${data.atelier ? `, ${data.atelier}` : ''}`,
      this.layout(
        'Votre devis est arrivé',
        `<b>${e(data.intervenant ?? 'Votre intervenant')}</b> vous a adressé un devis
        ${data.atelier ? `pour <b>${e(data.atelier)}</b>` : ''}
        ${data.montant ? `, <b>${e(data.montant)}</b>` : ''}.
        <br><br>Vous pouvez l'accepter ou le refuser depuis votre espace. L'accepter
        crée la réservation et bloque la date.`,
        { label: 'Voir le devis', url: `${this.webUrl}/dashboard/facturation?vue=devis` },
      ),
    );
  }

  /**
   * RATTACHEMENT — les trois moments, dans un seul point d'entrée.
   *
   * ⚠ Le module n'envoyait RIEN, dans aucun des deux sens, alors que quatre
   * écrans affirmaient le contraire (« Vous serez prévenu ici et par e-mail »).
   * Une personne pouvait attendre indéfiniment une réponse que personne ne
   * savait qu'elle attendait.
   */
  async sendRattachement(
    to: string,
    data: {
      moment: 'demande' | 'acceptee' | 'refusee';
      salarie?: string | null;
      etablissement?: string | null;
      motif?: string | null;
    },
  ): Promise<void> {
    const e = (t: string) => t.replace(/</g, '&lt;');
    const qui = e(data.salarie ?? 'Une personne');
    const ou = e(data.etablissement ?? 'votre établissement');

    if (data.moment === 'demande') {
      await this.send(
        to,
        `Demande de rattachement, ${data.salarie ?? 'un salarié'}`,
        this.layout(
          'Quelqu’un demande à rejoindre votre équipe',
          `<b>${qui}</b> demande à être rattaché·e à <b>${ou}</b> sur Les Extras.
          <br><br>Tant que vous n'avez pas répondu, cette personne <b>ne peut ni
          publier, ni répondre à un renfort</b> : son espace est en attente. Un
          clic suffit, dans les deux sens.`,
          { label: 'Voir la demande', url: `${this.webUrl}/dashboard/equipe` },
        ),
      );
      return;
    }

    if (data.moment === 'acceptee') {
      await this.send(
        to,
        `C’est accepté : vous êtes rattaché·e à ${data.etablissement ?? 'votre établissement'}`,
        this.layout(
          'Votre rattachement est accepté',
          `<b>${ou}</b> vient d'accepter votre rattachement. Votre espace est
          ouvert : vous pouvez publier vos ateliers et répondre aux renforts de la
          maison.
          <br><br><b>Une seule chose à savoir :</b> déconnectez-vous puis
          reconnectez-vous une fois. Le sélecteur de compte ne montrera votre
          établissement qu'après : c'est votre jeton de connexion qui porte la
          liste, et il date d'avant l'acceptation.`,
          { label: 'Ouvrir mon espace', url: `${this.webUrl}/dashboard` },
        ),
      );
      return;
    }

    await this.send(
      to,
      'Votre demande de rattachement n’a pas été retenue',
      this.layout(
        'Réponse à votre demande',
        `<b>${ou}</b> n'a pas retenu votre demande de rattachement.
        ${data.motif ? `<br><br><i>${e(data.motif).slice(0, 500)}</i>` : ''}
        <br><br>Si c'est une erreur d'aiguillage : mauvais établissement, mauvais
        profil au moment de l'inscription, écrivez-nous : cela se corrige.
        <br><br>Vous pouvez aussi demander un rattachement à un autre
        établissement depuis votre espace.`,
        { label: 'Nous écrire', url: `${this.webUrl}/contact` },
      ),
    );
  }

  /** Le contrat vient d'être transmis à son signataire. */
  async sendContratTransmis(
    to: string,
    data: { etablissement?: string | null; intitule?: string | null },
  ): Promise<void> {
    const e = (t: string) => t.replace(/</g, '&lt;');
    await this.send(
      to,
      'Votre contrat vous a été transmis',
      this.layout(
        'Votre contrat vous attend',
        `<b>${e(data.etablissement ?? 'L’établissement')}</b> vient de vous transmettre
        ${data.intitule ? `<b>${e(data.intitule)}</b>` : 'votre contrat'}.
        <br><br>Relisez-le dans votre espace. Il n'engage personne tant qu'il n'est
        pas signé : et la signature se fait en ligne, avec un code envoyé au moment
        où vous la demandez.`,
        { label: 'Lire mon contrat', url: `${this.webUrl}/dashboard/reservations` },
      ),
    );
  }

  /**
   * ENQUÊTE DE SATISFACTION — une semaine après la première fiche mise en ligne.
   *
   * Demandée par Siham le 3/09/2026 : « on a besoin de feedback pour améliorer
   * l'expérience client et avoir des retours sur problème rapidement ».
   *
   * ── Ce qui tient ce message, et qu'il ne faut pas défaire ─────────────────
   *
   * 1. **Il part UNE fois, et il le dit.** Une enquête qui revient est une
   *    enquête qu'on n'ouvre plus. `Account.enqueteAtelierAt` est le verrou.
   * 2. **Sept jours, pas le lendemain.** Au lendemain, la personne n'a pas
   *    encore vu si sa fiche vit ; à un mois, elle a oublié comment elle l'a
   *    déposée. Une semaine est le moment où elle se souvient ET peut juger.
   * 3. **On annonce la durée et on la tient : une minute, quatre questions.**
   *    Annoncer « quelques minutes » sur un formulaire de vingt champs est le
   *    plus sûr moyen de n'avoir que des réponses de gens polis.
   * 4. **On demande ce qu'on va corriger, pas une note de satisfaction.** Le
   *    site, la procédure de dépôt, et l'ennui concret s'il y en a eu. Une
   *    étoile globale ne dit jamais quoi réparer.
   * 5. **Aucun jeton dans l'URL.** Le lien mène à l'espace de la personne, qui
   *    est déjà identifiée en s'y connectant. Un identifiant de compte glissé
   *    dans une adresse se retrouve dans les journaux, les historiques et les
   *    partages d'écran.
   */
  async sendEnqueteAtelier(
    to: string,
    data: { prenom?: string | null; titreFiche?: string | null },
  ): Promise<void> {
    const e = (t: string) => t.replace(/</g, '&lt;');
    const bonjour = data.prenom ? `Bonjour ${e(data.prenom)},` : 'Bonjour,';
    const fiche = data.titreFiche
      ? `<b>${e(data.titreFiche)}</b> est en ligne depuis une semaine.`
      : 'Votre première fiche est en ligne depuis une semaine.';
    await this.send(
      to,
      'Votre première mise en ligne : une minute pour nous dire ce qui a coincé',
      this.layout(
        'Comment ça s’est passé ?',
        `${bonjour}
        <br><br>${fiche} C’est le bon moment pour nous dire ce qui vous a paru
        simple, et ce qui vous a fait perdre du temps.
        <br><br><b>Quatre questions, une minute.</b> Le site, la procédure pour
        proposer vos services, et l’ennui précis si vous en avez rencontré un.
        <br><br>Nous lisons tout, et un problème signalé se traite dans la
        journée. C’est le seul moyen que nous ayons de corriger ce que nous ne
        voyons pas depuis l’intérieur.
        <br><br>Merci du temps que vous y passerez.`,
        { label: 'Donner mon avis', url: `${this.webUrl}/dashboard/mon-avis` },
      ),
    );
  }

  /**
   * LE TUNNEL D'ACCUEIL — une séquence, pas un message isolé (03/09/2026).
   *
   * Modèle demandé par Siham : la séquence d'iPhone Photography School qu'elle
   * reçoit. Ce qui a été REPRIS de ce modèle : un message court, une seule
   * idée, une seule chose à cliquer, signé d'une personne, à heure fixe, à
   * cadence régulière — et un objet qui dit ce qu'on va apprendre, pas ce
   * qu'on veut vendre.
   *
   * ⚠ CE QUI N'A PAS ÉTÉ REPRIS, ET POURQUOI. Leur séquence intercale des
   * ventes à compte à rebours : « −86 % », « l'accès expire ce soir »,
   * « désolé, c'est terminé ». Trois raisons de ne pas les copier ici :
   *  1. l'association n'a rien à vendre à ce stade — la seule chose payante
   *     du parcours gratuit est l'attestation à 20 €, et elle ne peut PAS
   *     être vendue tant que le médiateur de la consommation, les CGV et le
   *     droit de rétractation n'existent pas ;
   *  2. une échéance annoncée qui n'en est pas une est une pratique
   *     commerciale trompeuse (art. L121-1 et s. du code de la consommation),
   *     et l'association est certifiée Qualiopi ;
   *  3. le lecteur est un professionnel au travail, pas un amateur de photo :
   *     ce qui le retient, c'est un outil utilisable lundi.
   *
   * Chaque message donne donc quelque chose d'utilisable SANS RIEN ACHETER,
   * et renvoie au parcours gratuit correspondant.
   */
  async sendTunnelAccueil(
    to: string,
    data: { prenom?: string | null; etape: number },
  ): Promise<void> {
    const message = TUNNEL_ACCUEIL[data.etape - 1];
    if (!message) return;
    await this.send(
      to,
      message.sujet,
      this.layout(
        `Bonjour${data.prenom ? ` ${data.prenom}` : ''},`,
        `${message.corps}
         <div style="margin-top:24px;font-size:12px;color:#9ca3af">
           Siham, pour l’association ADéPA.<br>
           Vous recevez ce message parce que vous avez créé un compte sur Les Extras.
           <a href="${this.webUrl}/dashboard/account?onglet=profil" style="color:#9ca3af">Ne plus recevoir ces e-mails</a>.
         </div>`,
        { label: message.bouton, url: `${this.webUrl}${message.chemin}` },
      ),
    );
  }


  /**
   * L'ALERTE DE RECHERCHE : « voilà ce qui vient d'arriver et qui correspond ».
   *
   * ⚠ CE MESSAGE N'ARRIVE QUE S'IL Y A DU NEUF. Le planificateur ne l'appelle
   * jamais à vide : une alerte qui écrit pour dire qu'il n'y a rien est une
   * alerte qu'on désactive. Chaque fiche est nommée et cliquable — un courriel
   * qui renvoie vers « votre recherche » oblige à la refaire.
   */
  async sendAlerteRecherche(
    to: string,
    data: {
      prenom?: string | null;
      fiches: { titre: string; chemin: string; lieu?: string | null; prix?: number | null }[];
    },
  ): Promise<void> {
    if (!data.fiches.length) return;
    const e = (t: string) => t.replace(/</g, '&lt;');
    const liste = data.fiches
      .map((f) => {
        const details = [f.lieu, f.prix != null ? `${f.prix} €` : null].filter(Boolean).join(' · ');
        return `<li style="margin-bottom:10px">
          <a href="${this.webUrl}${f.chemin}" style="color:#183767;font-weight:600">${e(f.titre)}</a>
          ${details ? `<br><span style="color:#6b7280;font-size:13px">${e(details)}</span>` : ''}
        </li>`;
      })
      .join('');
    const combien = data.fiches.length;
    await this.send(
      to,
      combien === 1
        ? 'Une nouvelle fiche correspond à votre alerte'
        : `${combien} nouvelles fiches correspondent à votre alerte`,
      this.layout(
        `Bonjour${data.prenom ? ` ${e(data.prenom)}` : ''},`,
        `Vous aviez demandé à être prévenu. Voici ce qui vient d'être mis en ligne :
         <ul style="padding-left:18px;margin:16px 0">${liste}</ul>
         <div style="margin-top:20px;font-size:12px;color:#9ca3af">
           Vous recevez ce message parce que vous avez créé une alerte de recherche.
           <a href="${this.webUrl}/dashboard/alertes" style="color:#9ca3af">Gérer mes alertes</a>.
         </div>`,
        { label: 'Voir le catalogue', url: `${this.webUrl}/ateliers` },
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
      `Nouvelle demande de contact, ${data.name}`,
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

/**
 * LA SÉQUENCE D'ACCUEIL — six messages, un tous les trois jours.
 *
 * ⚠ RÈGLE DE CE TABLEAU : chaque message donne UNE chose utilisable tout de
 * suite, et renvoie à un parcours GRATUIT qui existe déjà en ligne. Rien n'y
 * est promis qui ne soit publié : les dix mini-formations, leurs fiches A4 et
 * la dotation LEX sont tous vérifiables le jour où le message part.
 *
 * L'ordre n'est pas décoratif. Il suit ce qu'un professionnel rencontre dans
 * l'ordre où il le rencontre : d'abord lire un comportement, puis tenir une
 * crise, puis les refus, puis remplacer plutôt qu'éteindre, puis le démarrage.
 * Le sixième message ne vend rien non plus : il donne les fiches A4 et le
 * catalogue entier, et c'est le seul qui parle de LEX.
 *
 * Cadence : TROIS jours, pas deux comme le modèle. Le modèle s'adresse à des
 * amateurs de photographie le soir ; ici on écrit à des éducateurs pendant
 * leur journée de travail, et un message tous les deux jours se paie en
 * désabonnements. La constante est dans le planificateur : elle se change en
 * une ligne si l'ouverture le justifie.
 */
export const TUNNEL_ACCUEIL: {
  sujet: string;
  corps: string;
  bouton: string;
  chemin: string;
}[] = [
  {
    sujet: 'Un comportement qui se répète, se répète parce qu’il marche',
    corps: `C’est la phrase qui change le plus de choses dans une équipe, et elle
      tient en une ligne : <b>un comportement qui dure obtient quelque chose</b>.
      Tant qu’on ignore quoi, on travaille sur la forme et on se trompe de cible.
      <br><br>Quatre fonctions possibles, une grille en quatre colonnes pour
      trancher, et l’erreur qui coûte le plus cher. C’est notre premier parcours
      gratuit : 45 minutes de lecture, et un relevé d’une minute par jour pendant
      une semaine.`,
    bouton: 'Ouvrir le parcours',
    chemin: '/formations/les-quatre-fonctions-d-un-comportement',
  },
  {
    sujet: 'Ce que l’adulte ajoute pendant une crise',
    corps: `Une crise ne s’arrête pas sur commande, et nous ne le promettons nulle
      part. Ce qui se travaille vraiment, c’est <b>ce que l’adulte ajoute pendant</b> :
      les mots, les demandes, le public, la proximité, les menaces, le volume.
      <br><br>Six choses, et la conduite décidée à froid. Aucun geste
      d’intervention physique n’est enseigné dans ce parcours, ces gestes
      s’apprennent en présentiel, avec mise en situation, jamais dans un texte.`,
    bouton: 'Lire le parcours',
    chemin: '/formations/les-premieres-minutes-d-une-crise',
  },
  {
    sujet: '« Il dit non à tout » n’est pas une donnée',
    corps: `C’est une impression, et elle est presque toujours fausse dans les
      proportions qu’elle annonce. L’autre moitié de la scène est à portée :
      <b>la consigne de l’adulte</b> : sa forme, son nombre, son moment.
      <br><br>Une compétence qui s’exerce sans rien savoir de la personne d’en
      face, et qui donne des résultats en quelques jours parce qu’elle ne demande
      de changer que soi. Le parcours fait d’abord écrire ce qui n’a PAS à être
      exigé : ce n’est pas une méthode pour faire obéir.`,
    bouton: 'Voir le parcours',
    chemin: '/formations/l-enfant-qui-dit-non-a-tout',
  },
  {
    sujet: 'Retirer un comportement sans en donner un autre',
    corps: `…c’est retirer un outil à quelqu’un qui n’en a pas d’autre. La suite
      logique de la grille des fonctions : une fois qu’on sait ce que le
      comportement obtient, on <b>enseigne un moyen d’obtenir la même chose</b>.
      <br><br>Il doit être plus facile, plus rapide et aussi fiable que celui
      qu’on veut voir disparaître : sinon personne ne l’adopte, et c’est
      exactement là que la plupart des plans échouent.`,
    bouton: 'Ouvrir le parcours',
    chemin: '/formations/apprendre-a-demander-plutot-qu-a-crier',
  },
  {
    sujet: 'Ce n’est presque jamais la tâche qui bloque',
    corps: `Regardez une séance de près, chronomètre en main : <b>c’est l’entrée
      dans la tâche</b>. Une fois la première action faite, la suite s’enchaîne
      souvent seule.
      <br><br>La conséquence est considérable : expliquer mieux, motiver,
      encourager n’a presque aucun effet. Ce qui en a un, c’est de réduire le coût
      des trente premières secondes : et il y a six leviers pour ça.`,
    bouton: 'Lire le parcours',
    chemin: '/formations/aider-a-demarrer-une-tache',
  },
  {
    sujet: 'Les dix fiches A4, à imprimer et à afficher',
    corps: `Chaque parcours a sa <b>fiche récap A4</b> : la notion clé, les quatre
      modules, le schéma central, l’arbre de décision et la grille de relevé
      vierge. Elles sont en libre accès, sans compte, et faites pour être
      imprimées et posées en salle d’équipe.
      <br><br>Le catalogue complet est ouvert : dix parcours gratuits, du premier
      au dernier module, sans carte bancaire. Et votre espace comprend
      <b>15 générations LEX offertes chaque mois</b> pour vos écrits
      professionnels : elles sont là, elles n’attendent que vous.`,
    bouton: 'Voir tous les parcours',
    chemin: '/formations',
  },
];
