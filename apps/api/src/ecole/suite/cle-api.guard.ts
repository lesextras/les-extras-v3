import { CanActivate, ExecutionContext, Injectable, createParamDecorator } from '@nestjs/common';
import { OutilsEcoleService } from './outils-ecole.service';

/**
 * LE GARDE DE L'API POUR DÉVELOPPEURS.
 *
 * Lit la clé dans `Authorization: Bearer pk_…`, retrouve l'académie par
 * l'empreinte de la clé, et la pose sur la requête. Aucune session Piloter
 * n'entre ici : une intégration n'est pas une personne.
 */
@Injectable()
export class CleApiGuard implements CanActivate {
  constructor(private readonly outils: OutilsEcoleService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; academieApi?: string }>();
    req.academieApi = await this.outils.academieDeCle(req.headers['authorization']);
    return true;
  }
}

/** L'académie authentifiée par la clé d'API. */
export const CleApiAcademie = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest<{ academieApi: string }>().academieApi;
});
