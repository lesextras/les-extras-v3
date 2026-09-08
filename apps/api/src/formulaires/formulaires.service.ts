import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatutFormulaire } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { attendUneReponse, nettoyerChamps, verifierReponse, type Champ } from './champs';
import type { CreerFormulaireDto, ModifierFormulaireDto, RepondreDto } from './dto/formulaire.dto';

/**
 * LES FORMULAIRES LIBRES.
 *
 * Un compte compose le formulaire qu'il veut, le publie, et partage une adresse
 * courte. Les réponses arrivent dans son espace, se lisent en tableau et
 * s'exportent en CSV. Le même service sert les deux espaces : le formulaire
 * appartient au COMPTE, pas à l'association ni à l'académie.
 *
 * Ce qu'on refuse : lire ou modifier le formulaire d'un autre compte. La
 * vérification passe systématiquement par `accountId` — jamais par le seul
 * identifiant du formulaire, qui circule dans les adresses.
 */
@Injectable()
export class FormulairesService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------------------------------------ la liste */

  async lister(accountId: string) {
    const formulaires = await this.prisma.formulaire.findMany({
      where: { accountId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { reponses: true } } },
    });

    return formulaires.map((f) => ({
      id: f.id,
      titre: f.titre,
      slug: f.slug,
      statut: f.statut,
      nbChamps: Array.isArray(f.champs) ? (f.champs as unknown[]).length : 0,
      nbReponses: f._count.reponses,
      fermeLe: f.fermeLe,
      modifieLe: f.updatedAt,
    }));
  }

  /* --------------------------------------------------------- un formulaire */

  async lire(accountId: string, id: string) {
    const f = await this.prisma.formulaire.findFirst({ where: { id, accountId } });
    if (!f) throw new NotFoundException("Ce formulaire n'existe pas.");
    return this.rendre(f);
  }

  async creer(accountId: string, dto: CreerFormulaireDto) {
    const titre = dto.titre.trim();
    const f = await this.prisma.formulaire.create({
      data: {
        accountId,
        titre,
        introduction: dto.introduction?.trim() || null,
        slug: await this.slugLibre(titre),
        champs: (dto.champs ? nettoyerChamps(dto.champs) : PREMIERES_QUESTIONS) as unknown as Prisma.InputJsonValue,
      },
    });
    return this.rendre(f);
  }

  async modifier(accountId: string, id: string, dto: ModifierFormulaireDto) {
    const existant = await this.prisma.formulaire.findFirst({ where: { id, accountId } });
    if (!existant) throw new NotFoundException("Ce formulaire n'existe pas.");

    const data: Prisma.FormulaireUpdateInput = {};
    if (dto.titre !== undefined) data.titre = dto.titre.trim();
    if (dto.introduction !== undefined) data.introduction = dto.introduction.trim() || null;
    if (dto.remerciement !== undefined) data.remerciement = dto.remerciement.trim() || null;
    if (dto.reponseUnique !== undefined) data.reponseUnique = dto.reponseUnique;
    if (dto.demanderEmail !== undefined) data.demanderEmail = dto.demanderEmail;
    if (dto.fermeLe !== undefined) data.fermeLe = dto.fermeLe ? new Date(dto.fermeLe) : null;
    if (dto.champs !== undefined) data.champs = nettoyerChamps(dto.champs) as unknown as Prisma.InputJsonValue;

    if (dto.statut !== undefined) {
      // On ne publie pas un formulaire vide : la page publique n'aurait rien à montrer.
      if (dto.statut === StatutFormulaire.PUBLIE) {
        const champs = (dto.champs !== undefined ? nettoyerChamps(dto.champs) : (existant.champs as unknown as Champ[])) ?? [];
        if (!champs.some(attendUneReponse)) {
          throw new BadRequestException('Ajoute au moins une question avant de publier.');
        }
      }
      data.statut = dto.statut;
    }

    if (dto.slug !== undefined) {
      const voulu = normaliser(dto.slug);
      if (!voulu) throw new BadRequestException("Cette adresse n'est pas utilisable.");
      if (voulu !== existant.slug) {
        const pris = await this.prisma.formulaire.findUnique({ where: { slug: voulu } });
        if (pris) throw new BadRequestException('Cette adresse est déjà prise. Essaie-en une autre.');
        data.slug = voulu;
      }
    }

    const f = await this.prisma.formulaire.update({ where: { id }, data });
    return this.rendre(f);
  }

  async supprimer(accountId: string, id: string) {
    const f = await this.prisma.formulaire.findFirst({ where: { id, accountId } });
    if (!f) throw new NotFoundException("Ce formulaire n'existe pas.");
    await this.prisma.formulaire.delete({ where: { id } });
    return { supprime: true };
  }

  /** Repartir d'un formulaire existant sans repartir de zéro. */
  async dupliquer(accountId: string, id: string) {
    const source = await this.prisma.formulaire.findFirst({ where: { id, accountId } });
    if (!source) throw new NotFoundException("Ce formulaire n'existe pas.");
    const titre = `${source.titre} (copie)`;
    const f = await this.prisma.formulaire.create({
      data: {
        accountId,
        titre,
        introduction: source.introduction,
        remerciement: source.remerciement,
        reponseUnique: source.reponseUnique,
        demanderEmail: source.demanderEmail,
        champs: source.champs as Prisma.InputJsonValue,
        slug: await this.slugLibre(titre),
      },
    });
    return this.rendre(f);
  }

  /* ------------------------------------------------------------- réponses */

  async reponses(accountId: string, id: string) {
    const f = await this.prisma.formulaire.findFirst({ where: { id, accountId } });
    if (!f) throw new NotFoundException("Ce formulaire n'existe pas.");

    const reponses = await this.prisma.reponseFormulaire.findMany({
      where: { formulaireId: id },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    return {
      titre: f.titre,
      champs: (f.champs as unknown as Champ[]) ?? [],
      total: reponses.length,
      reponses: reponses.map((r) => ({
        id: r.id,
        email: r.email,
        valeurs: r.valeurs,
        recueLe: r.createdAt,
      })),
    };
  }

  async supprimerReponse(accountId: string, id: string, reponseId: string) {
    const f = await this.prisma.formulaire.findFirst({ where: { id, accountId } });
    if (!f) throw new NotFoundException("Ce formulaire n'existe pas.");
    const r = await this.prisma.reponseFormulaire.findFirst({ where: { id: reponseId, formulaireId: id } });
    if (!r) throw new NotFoundException("Cette réponse n'existe pas.");
    await this.prisma.reponseFormulaire.delete({ where: { id: reponseId } });
    return { supprime: true };
  }

  /* --------------------------------------------------------------- public */

  /** La page publique : on ne renvoie que ce qui doit s'afficher. */
  async pagePublique(slug: string) {
    const f = await this.prisma.formulaire.findUnique({
      where: { slug },
      include: { account: { select: { name: true } } },
    });
    if (!f || f.statut === StatutFormulaire.BROUILLON) throw new NotFoundException("Ce formulaire n'existe pas.");

    const ferme = f.statut === StatutFormulaire.FERME || (f.fermeLe ? f.fermeLe.getTime() < Date.now() : false);

    return {
      titre: f.titre,
      introduction: f.introduction,
      structure: f.account?.name ?? null,
      champs: ferme ? [] : ((f.champs as unknown as Champ[]) ?? []),
      demanderEmail: f.demanderEmail,
      remerciement: f.remerciement,
      ferme,
    };
  }

  async repondre(slug: string, dto: RepondreDto, source?: string) {
    const f = await this.prisma.formulaire.findUnique({ where: { slug } });
    if (!f || f.statut !== StatutFormulaire.PUBLIE) throw new NotFoundException("Ce formulaire n'accepte pas de réponse.");
    if (f.fermeLe && f.fermeLe.getTime() < Date.now()) {
      throw new ForbiddenException('Ce formulaire est fermé.');
    }

    const champs = ((f.champs as unknown as Champ[]) ?? []).filter(attendUneReponse);
    const { valeurs, manques } = verifierReponse(champs, dto.valeurs);

    const email = dto.email?.trim().toLowerCase() || null;
    if (f.demanderEmail && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) {
      manques.push('Adresse e-mail');
    }
    if (manques.length) {
      throw new BadRequestException(
        manques.length === 1
          ? `Il manque une réponse : ${manques[0]}.`
          : `Il manque des réponses : ${manques.join(', ')}.`,
      );
    }

    if (f.reponseUnique && email) {
      const deja = await this.prisma.reponseFormulaire.findFirst({ where: { formulaireId: f.id, email } });
      if (deja) throw new ForbiddenException('Une réponse a déjà été envoyée avec cette adresse.');
    }

    await this.prisma.reponseFormulaire.create({
      data: {
        formulaireId: f.id,
        email,
        valeurs: valeurs as unknown as Prisma.InputJsonValue,
        source: source?.slice(0, 200) ?? null,
      },
    });

    return { envoye: true, remerciement: f.remerciement ?? 'Merci, ta réponse est bien arrivée.' };
  }

  /* ---------------------------------------------------------------- outils */

  private rendre(f: {
    id: string;
    titre: string;
    introduction: string | null;
    slug: string;
    statut: StatutFormulaire;
    champs: Prisma.JsonValue;
    remerciement: string | null;
    reponseUnique: boolean;
    demanderEmail: boolean;
    fermeLe: Date | null;
    updatedAt: Date;
  }) {
    return {
      id: f.id,
      titre: f.titre,
      introduction: f.introduction,
      slug: f.slug,
      statut: f.statut,
      champs: (f.champs as unknown as Champ[]) ?? [],
      remerciement: f.remerciement,
      reponseUnique: f.reponseUnique,
      demanderEmail: f.demanderEmail,
      fermeLe: f.fermeLe,
      modifieLe: f.updatedAt,
      adresse: `/f/${f.slug}`,
    };
  }

  /** Une adresse lisible, unique sur tout le site. */
  private async slugLibre(titre: string) {
    const base = normaliser(titre) || 'formulaire';
    for (let n = 0; n < 40; n += 1) {
      const essai = n === 0 ? base : `${base}-${n + 1}`;
      const pris = await this.prisma.formulaire.findUnique({ where: { slug: essai } });
      if (!pris) return essai;
    }
    return `${base}-${Date.now().toString(36)}`;
  }
}

/** Ce qu'on met dans un formulaire tout neuf : de quoi voir à quoi ça ressemble. */
const PREMIERES_QUESTIONS = [
  { id: 'nom', type: 'TEXTE', libelle: 'Ton nom', obligatoire: true },
  { id: 'email', type: 'EMAIL', libelle: 'Ton adresse e-mail', obligatoire: true },
];

/** « Fiche d'inscription 2026 » devient « fiche-d-inscription-2026 ». */
function normaliser(texte: string) {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
