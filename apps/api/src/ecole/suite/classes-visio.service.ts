import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { StatutInscriptionCours } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { configMedia, signerJetonSalle, tirerIdentifiant } from '../../visio/livekit';
import { etatFenetre, fenetre, secondesDeValidite } from '../../visio/fenetre';
import { ApprenantService } from './apprenant.service';

/**
 * LA SALLE DE VISIO INTÉGRÉE D'UNE CLASSE VIRTUELLE.
 *
 * Comme les classes virtuelles de Teachizy : la séance se tient DANS l'école,
 * sans lien vers un autre service. On réutilise le serveur média de la
 * visioconsultation (LiveKit) : l'API ne fait que signer des droits d'entrée,
 * le son et l'image vont du navigateur au serveur média, sans passer par nous.
 *
 * ⚠ RIEN N'EST ENREGISTRÉ. Le jeton ne porte jamais `roomRecord` : c'est la
 * même promesse que la visioconsultation, tenue au même endroit.
 *
 * Deux façons d'entrer :
 *  - l'animateur : depuis l'espace de l'académie, ou par le lien animateur
 *    (un formateur invité qui n'a pas de compte) ;
 *  - l'apprenant : connecté à son espace apprenant, ou par le lien personnel
 *    de sa formation. Il doit être inscrit à la formation de la classe (ou à
 *    une formation de l'école quand la classe n'est rattachée à aucune).
 */
@Injectable()
export class ClassesVisioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apprenants: ApprenantService,
  ) {}

  /** Disponible si le serveur média est configuré. L'écran le dit plutôt que d'échouer. */
  disponible() {
    return { disponible: Boolean(configMedia()) };
  }

  /* ═══════════════════════════════════════════════════ côté académie ══ */

  /** Ouvre (ou retrouve) la salle d'une classe, et rend le lien animateur. */
  async ouvrirSalle(accountId: string, classeId: string) {
    const classe = await this.maClasse(accountId, classeId);
    const salle = classe.salle
      ?? (await this.prisma.salleClasse.create({
        data: { classeId, salle: tirerIdentifiant('classe-'), jetonAnimateur: tirerIdentifiant() },
      }));
    return {
      salleActive: true,
      lienAnimateur: `/classe/${classeId}?animateur=${salle.jetonAnimateur}`,
      lienApprenants: `/classe/${classeId}`,
    };
  }

  async fermerSalle(accountId: string, classeId: string) {
    const classe = await this.maClasse(accountId, classeId);
    if (classe.salle) await this.prisma.salleClasse.delete({ where: { id: classe.salle.id } });
    return { salleActive: false };
  }

  /** L'animateur entre, depuis l'espace de l'académie. */
  async entrerAcademie(accountId: string, classeId: string, nom: string) {
    const classe = await this.maClasse(accountId, classeId);
    if (!classe.salle) throw new BadRequestException("Ouvrez d'abord la salle de cette classe.");
    return this.acces(classe, classe.salle.salle, nom || 'Formateur', true);
  }

  /* ═══════════════════════════════════════════════════ côté public ══ */

  /** Ce que la page de la classe affiche avant d'entrer. */
  async lire(classeId: string) {
    const c = await this.prisma.classeVirtuelle.findUnique({
      where: { id: classeId },
      include: { salle: { select: { id: true } }, cours: { select: { titre: true } } },
    });
    if (!c) throw new NotFoundException("Cette classe n'existe pas.");
    const ecole = await this.prisma.ecoleEnLigne.findUnique({
      where: { accountId: c.accountId },
      select: { nom: true, couleur: true, logoUrl: true, slug: true },
    });
    const duree = this.dureeMinutes(c.debut, c.fin);
    const f = fenetre(c.debut, duree);
    return {
      id: c.id,
      titre: c.titre,
      description: c.description,
      formation: c.cours?.titre ?? null,
      debut: c.debut,
      fin: c.fin,
      ouvertureLe: f.ouvertureLe,
      fermetureLe: f.fermetureLe,
      etat: etatFenetre(c.debut, duree),
      salleIntegree: Boolean(c.salle),
      lienExterne: c.salle ? null : c.lien,
      disponible: Boolean(configMedia()),
      ecole: ecole ?? { nom: '', couleur: '#0F5F3E', logoUrl: null, slug: null },
    };
  }

  /**
   * Entrer dans la salle. Trois clés possibles : le lien animateur, le lien
   * personnel d'une formation, ou la session de l'espace apprenant.
   */
  async rejoindre(
    classeId: string,
    cles: { animateur?: string; jetonInscription?: string; sessionApprenant?: string; prenom?: string },
  ) {
    const classe = await this.prisma.classeVirtuelle.findUnique({ where: { id: classeId }, include: { salle: true } });
    if (!classe) throw new NotFoundException("Cette classe n'existe pas.");
    if (!classe.salle) throw new BadRequestException("Cette classe ne se tient pas dans l'école : suivez le lien donné par l'organisme.");

    if (cles.animateur) {
      if (cles.animateur !== classe.salle.jetonAnimateur) throw new ForbiddenException("Ce lien d'animateur n'est pas valide.");
      return this.acces(classe, classe.salle.salle, (cles.prenom || 'Formateur').slice(0, 60), true);
    }

    let prenom: string | null = null;
    let autorise = false;
    if (cles.jetonInscription) {
      const i = await this.prisma.inscriptionCours.findUnique({ where: { jeton: cles.jetonInscription }, include: { cours: { select: { accountId: true } } } });
      if (i && i.statut !== StatutInscriptionCours.SUSPENDUE && i.cours.accountId === classe.accountId && (!classe.coursId || classe.coursId === i.coursId)) {
        autorise = true;
        prenom = i.prenom;
      }
    }
    if (!autorise && cles.sessionApprenant) {
      const compte = await this.apprenants.compteSiSession(cles.sessionApprenant);
      if (compte && compte.accountId === classe.accountId) {
        const inscrit = await this.prisma.inscriptionCours.findFirst({
          where: {
            email: compte.email,
            cours: { accountId: classe.accountId },
            statut: { not: StatutInscriptionCours.SUSPENDUE },
            ...(classe.coursId ? { coursId: classe.coursId } : {}),
          },
        });
        if (inscrit) {
          autorise = true;
          prenom = compte.prenom;
        }
      }
    }
    if (!autorise) {
      throw new ForbiddenException(
        classe.coursId
          ? 'Cette classe est réservée aux apprenants de la formation. Ouvrez-la depuis votre formation ou votre espace apprenant.'
          : "Cette classe est réservée aux apprenants de l'école. Connectez-vous à votre espace apprenant.",
      );
    }
    return this.acces(classe, classe.salle.salle, (cles.prenom || prenom || 'Participant').slice(0, 60), false);
  }

  /* ═════════════════════════════════════════════════════ les outils ══ */

  private acces(classe: { debut: Date; fin: Date | null }, salle: string, identite: string, animateur: boolean) {
    const config = configMedia();
    if (!config) throw new ServiceUnavailableException("La salle de visio n'est pas encore activée sur ce serveur.");
    const duree = this.dureeMinutes(classe.debut, classe.fin);
    const etat = etatFenetre(classe.debut, duree);
    // L'animateur peut entrer avant l'heure pour préparer ; pas les apprenants.
    if (!animateur && etat === 'TROP_TOT') {
      throw new ForbiddenException('La salle ouvre un quart d’heure avant le début de la classe.');
    }
    if (etat === 'TERMINEE') throw new ForbiddenException('Cette classe est terminée.');
    // Un suffixe court : deux « Camille » ne se prennent pas la même identité.
    const unique = `${identite} · ${tirerIdentifiant().slice(0, 4)}`;
    return {
      url: config.url,
      jeton: signerJetonSalle(config, { salle, identite: unique, secondes: secondesDeValidite(classe.debut, duree) + (animateur ? 3600 : 0), animateur }),
      salle,
      identite,
      animateur,
    };
  }

  /** Sans heure de fin, une classe dure une heure et demie. */
  private dureeMinutes(debut: Date, fin: Date | null) {
    if (!fin) return 90;
    return Math.max(15, Math.round((fin.getTime() - debut.getTime()) / 60_000));
  }

  private async maClasse(accountId: string, id: string) {
    const c = await this.prisma.classeVirtuelle.findFirst({ where: { id, accountId }, include: { salle: true } });
    if (!c) throw new NotFoundException("Cette classe n'existe pas.");
    return c;
  }
}
