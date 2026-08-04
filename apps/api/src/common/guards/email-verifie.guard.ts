import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * EmailVerifieGuard — exige une adresse e-mail confirmée.
 *
 * Le lien de confirmation partait bien à l'inscription, mais n'était exigé
 * nulle part : une adresse inexistante donnait accès à toute la plateforme,
 * y compris à la publication de fiches visibles publiquement sous le nom
 * d'ADéPA. C'est la porte d'entrée classique du spam de catalogue.
 *
 * CE GARDE N'EST PAS POSÉ PARTOUT, ET C'EST VOLONTAIRE.
 *
 * Le bloquer à l'échelle de la plateforme rendrait l'inscription dépendante
 * de la bonne réception d'un e-mail : le jour d'une campagne, si le quota
 * d'envoi est atteint ou si le message tombe en indésirable, plus personne ne
 * peut rien faire — et l'utilisateur n'a aucun moyen de s'en sortir seul.
 * Le coût d'un faux blocage est ici bien supérieur au risque couvert.
 *
 * On l'applique donc uniquement là où un compte non confirmé peut nuire à
 * QUELQU'UN D'AUTRE : la mise en ligne publique. Consulter, s'inscrire,
 * candidater, échanger, préparer un brouillon restent ouverts — on ne bloque
 * jamais quelqu'un qui ne fait de mal qu'à lui-même.
 *
 * À utiliser APRÈS JwtAuthGuard.
 */
@Injectable()
export class EmailVerifieGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) throw new UnauthorizedException('Authentification requise.');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      // Le message dit quoi faire, pas ce qui a échoué.
      throw new ForbiddenException(
        'Confirmez votre adresse e-mail avant de publier : le lien vous a été envoyé à l’inscription. ' +
          'Vous pouvez en demander un nouveau depuis votre profil. En attendant, tout le reste vous est ouvert.',
      );
    }
    return true;
  }
}

/**
 * Même règle, pour les routes où la publication n'est pas une route dédiée
 * mais un champ du corps de requête.
 *
 * Une fiche atelier se crée en brouillon puis se publie par
 * `PATCH /services/:id` avec `status: PUBLISHED` : poser le garde sur toute
 * la route interdirait aussi de corriger une faute de frappe dans un
 * brouillon. On ne vérifie donc que lorsque la requête demande réellement la
 * mise en ligne — modifier, dépublier ou archiver restent toujours possibles.
 */
@Injectable()
export class EmailVerifieSiPublicationGuard extends EmailVerifieGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.body?.status !== 'PUBLISHED') return true;
    return super.canActivate(context);
  }
}
