import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * StructureRequisePourPublierGuard — publier, c'est proposer une prestation
 * facturée. Il faut donc une structure pour l'émettre.
 *
 * ⚠ LE NUMÉRO EST DEMANDÉ À LA PUBLICATION, JAMAIS À L'INSCRIPTION, et cette
 * distinction est toute la règle. Un intervenant qui vient regarder le
 * catalogue, répondre à un message, préparer un brouillon ou se déclarer
 * disponible pour un remplacement en CDD n'a besoin d'aucun numéro — et le
 * remplacement en CDD, justement, se fait en salarié : exiger un SIRET à
 * l'entrée fermerait la porte à ceux pour qui elle a été ouverte.
 *
 * Mais une fiche publiée est une offre de prestation : elle produit des
 * devis, des contrats et des factures, qui portent tous le SIRET de l'émetteur
 * (art. 242 nonies A, ann. II du CGI). Une fiche en ligne sans structure, ce
 * sont des documents avec « SIRET : Non renseigné » envoyés à des
 * établissements publics — et un intervenant qui découvre le problème au pire
 * moment, une fois la mission acceptée.
 *
 * ⚠ IL NE VISE QUE LES COMPTES INTERVENANTS. Un établissement publie des
 * fiches sous sa propre raison sociale et porte déjà son SIRET ; lui appliquer
 * la même règle bloquerait des comptes qui n'ont rien à voir avec le sujet.
 *
 * ⚠ LE REFUS DIT QUOI FAIRE, ET OÙ. Un message qui constate (« structure
 * manquante ») laisse la personne chercher ; celui-ci nomme l'écran et
 * rappelle que le reste lui est ouvert. Même doctrine que
 * `EmailVerifieGuard`, dont ce garde est le jumeau.
 *
 * À utiliser APRÈS JwtAuthGuard et AccountGuard.
 */
@Injectable()
export class StructureRequisePourPublierGuard implements CanActivate {
  constructor(protected readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accountId = request.account?.id;
    if (!accountId) throw new UnauthorizedException('Compte actif requis.');

    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { type: true, siret: true, structure: { select: { siret: true, siren: true } } },
    });
    if (!compte) throw new UnauthorizedException('Compte introuvable.');

    // Un établissement facture sous sa propre raison sociale : hors sujet.
    if (compte.type !== AccountType.FREELANCE) return true;

    const aDeQuoiFacturer =
      Boolean(compte.siret?.trim()) ||
      Boolean(compte.structure?.siret?.trim()) ||
      Boolean(compte.structure?.siren?.trim());
    if (aDeQuoiFacturer) return true;

    throw new ForbiddenException(
      'Renseignez votre structure avant de publier : c’est elle qui figurera sur vos devis et vos factures. ' +
        'Rendez-vous dans « Ma structure », le SIRET suffit. Tout le reste de la plateforme vous reste ouvert.',
    );
  }
}

/**
 * Même règle, pour les routes où la publication n'est pas une route dédiée
 * mais un champ du corps de requête — exactement comme
 * `EmailVerifieSiPublicationGuard`.
 *
 * Une fiche se crée en brouillon puis se publie par `PATCH /services/:id`
 * avec `status: PUBLISHED`. Poser le garde sur toute la route interdirait de
 * corriger une virgule dans un brouillon tant qu'on n'a pas son numéro, ce qui
 * est exactement le blocage qu'on cherche à éviter.
 */
@Injectable()
export class StructureRequiseSiPublicationGuard extends StructureRequisePourPublierGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.body?.status !== 'PUBLISHED') return true;
    return super.canActivate(context);
  }
}
