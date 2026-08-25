import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/types/request-context';

/**
 * UN JETON DE SESSION SE DECLARE COMME TEL (25/08/2026).
 *
 * L'application signe quatre sortes de jetons avec la meme cle : la session,
 * la verification d'e-mail (48 h), la reinitialisation de mot de passe (1 h)
 * et l'etat OAuth LinkedIn (10 min). Les trois derniers portent tous un `sub`
 * — et `validate()` ne lisait que `sub`. Un lien de verification lu dans une
 * boite partagee valait donc deux jours de session complete.
 *
 * `typ` ferme les trois vecteurs d'un coup : seul un jeton frappe `access`
 * ouvre une session. Les anciens jetons, qui ne portent pas ce champ, sont
 * refuses — leurs porteurs se reconnectent, ce qui est exactement ce que
 * doit produire une correction de cette nature.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  typ?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  /**
   * Ce que retourne validate() devient req.user.
   * On revérifie l'existence + le statut en base à chaque requête
   * (un utilisateur banni ne doit plus pouvoir agir avec un ancien token).
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    // Avant toute chose : ce jeton est-il un jeton de session ?
    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Jeton invalide.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Compte suspendu.');
    }
    if (user.status === UserStatus.ANONYMIZED) {
      throw new UnauthorizedException('Ce compte a été supprimé à la demande de son titulaire.');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
