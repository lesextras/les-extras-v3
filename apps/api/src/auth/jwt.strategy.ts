import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/types/request-context';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
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
