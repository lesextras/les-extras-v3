import { createHmac } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { TablePseudo } from './pseudonymiseur.service';

/**
 * LE REGISTRE DES PSEUDONYMES — UN NOM, UN PSEUDONYME, POUR TOUJOURS.
 *
 * Le masque posé par `PseudonymiseurService` est excellent mais il est
 * jetable : « Marie Dupont » devient [PERSONNE-A] ce matin et [PERSONNE-B]
 * cet après-midi, parce que la lettre suit l'ordre d'apparition dans le texte.
 * Rien ne peut donc se chaîner d'un écrit à l'autre — un rapport de situation
 * repart de zéro là où il devrait écrire une évolution.
 *
 * Ce registre donne à chaque personne un pseudonyme FIXE dans son compte :
 * ses initiales et un chiffre, « M.D-1 ». Deux propriétés en découlent.
 *
 *  1. Un écrit reste lisible par l'équipe : « M.D-1 » se relit, [PERSONNE-C]
 *     non. C'est d'ailleurs la convention déjà employée dans le secteur.
 *  2. Aucun nom réel ne quitte la maison ni ne s'écrit en base : ce qui est
 *     stocké, c'est une empreinte — un HMAC salé par le compte. On reconnaît
 *     un nom déjà vu ; on ne peut pas le reconstituer depuis la table.
 *
 * Ce que ça ne fait pas, et il faut le dire : des initiales restent un indice.
 * Dans une petite unité, « M.D-1 » se devine. C'est un choix assumé — la
 * lisibilité du document contre une part d'opacité — et il a sa place dans le
 * registre des traitements.
 */
@Injectable()
export class RegistrePseudoService {
  private readonly logger = new Logger(RegistrePseudoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Le sel des empreintes.
   *
   * On réemploie le secret de signature de l'application plutôt que d'exiger
   * une variable de plus : une variable qu'on oublie de poser en production,
   * c'est un secret vide, et un secret vide ne protège rien.
   */
  private get sel(): string {
    return (
      this.config.get<string>('JWT_SECRET') ??
      this.config.get<string>('SESSION_SECRET') ??
      'les-extras-registre-lex'
    );
  }

  /** Empreinte d'un nom dans un compte donné. Irréversible. */
  private empreinte(accountId: string, nom: string): string {
    const normalise = nom
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    return createHmac('sha256', this.sel).update(`${accountId}|${normalise}`).digest('hex');
  }

  /**
   * Les initiales d'un nom : « Marie Dupont » → « M.D ».
   *
   * Un prénom seul donne une seule lettre, et c'est très bien : on n'invente
   * pas un patronyme qui n'a pas été écrit.
   */
  private initiales(nom: string): string {
    const lettres = nom
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[\s'-]+/)
      .map((mot) => mot.trim())
      .filter((mot) => /^[A-Za-zÀ-ÿ]/.test(mot))
      .slice(0, 2)
      .map((mot) => mot[0].toUpperCase());
    return lettres.length ? lettres.join('.') : 'X';
  }

  /**
   * Le pseudonyme stable d'un nom dans un compte. Créé à la première
   * rencontre, rendu tel quel ensuite.
   *
   * Le chiffre distingue deux personnes qui partagent les mêmes initiales :
   * « M.D-1 » et « M.D-2 » ne sont pas la même personne, et c'est le registre
   * qui garantit qu'elles ne le deviendront jamais.
   */
  async pseudoStable(accountId: string, nomReel: string): Promise<string> {
    const cle = this.empreinte(accountId, nomReel);
    const connu = await this.prisma.lexPseudonyme.findUnique({
      where: { accountId_empreinte: { accountId, empreinte: cle } },
      select: { pseudo: true },
    });
    if (connu) return connu.pseudo;

    const base = this.initiales(nomReel);
    // On cherche le premier chiffre libre pour ces initiales, dans ce compte.
    const voisins = await this.prisma.lexPseudonyme.findMany({
      where: { accountId, pseudo: { startsWith: `${base}-` } },
      select: { pseudo: true },
    });
    const pris = new Set(voisins.map((v) => Number(v.pseudo.split('-').pop())).filter(Boolean));
    let n = 1;
    while (pris.has(n)) n += 1;
    const pseudo = `${base}-${n}`;

    try {
      await this.prisma.lexPseudonyme.create({ data: { accountId, empreinte: cle, pseudo } });
      return pseudo;
    } catch {
      // Course entre deux générations simultanées : celui qui a perdu relit.
      const relu = await this.prisma.lexPseudonyme.findUnique({
        where: { accountId_empreinte: { accountId, empreinte: cle } },
        select: { pseudo: true },
      });
      return relu?.pseudo ?? pseudo;
    }
  }

  /**
   * Remplace les jetons jetables d'une table par des pseudonymes stables.
   *
   * Rend la correspondance ancien → nouveau, pour que l'appelant réécrive le
   * texte masqué. La table est mise à jour au passage : c'est elle qui sert à
   * restaurer les vrais noms après la génération.
   *
   * Seules les PERSONNES sont stabilisées. Une date ou un numéro de téléphone
   * n'a pas d'identité à suivre d'un écrit à l'autre, et leur donner un
   * pseudonyme durable reviendrait à constituer un fichier sans utilité.
   */
  async stabiliser(accountId: string, table: TablePseudo): Promise<Map<string, string>> {
    const remplacements = new Map<string, string>();
    for (const [jeton, valeur] of table.vers) {
      if (!jeton.startsWith('[PERSONNE-')) continue;
      try {
        const pseudo = await this.pseudoStable(accountId, valeur);
        remplacements.set(jeton, `[${pseudo}]`);
      } catch (e) {
        // Un registre indisponible ne doit pas empêcher d'écrire : on garde
        // le jeton jetable, on perd la continuité, on ne perd pas le service.
        this.logger.error(`[LEX:registre] ${(e as Error).message}`);
      }
    }
    for (const [ancien, nouveau] of remplacements) {
      const valeur = table.vers.get(ancien);
      if (valeur === undefined) continue;
      table.vers.delete(ancien);
      table.vers.set(nouveau, valeur);
      table.depuis.set(valeur.toLowerCase(), nouveau);
    }
    return remplacements;
  }

  /** Applique les remplacements à un texte déjà masqué. */
  static reecrire(texte: string, remplacements: Map<string, string>): string {
    let sortie = texte;
    for (const [ancien, nouveau] of remplacements) sortie = sortie.split(ancien).join(nouveau);
    return sortie;
  }
}
