import { Injectable, NotFoundException } from '@nestjs/common';
import { CategorieRendezVous, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreerRendezVousDto, ModifierRendezVousDto } from './dto/agenda.dto';
import { Champ } from '../formulaires/champs';

/**
 * L'AGENDA DE PILOTE.
 *
 * CE QU'IL EST. Un agenda d'équipe : une seule vue, portée par le COMPTE, où
 * l'on retrouve tout ce qui a une date — la session de formation qu'on anime,
 * la classe virtuelle de jeudi, le formulaire qui ferme dimanche, la date que
 * les gens ont choisie DANS ce formulaire, l'échéance du dossier de
 * subvention, la pièce qui périme, l'action prévue, et le rendez-vous qu'on a
 * simplement noté.
 *
 * CE QU'IL N'EST PAS. Une table où l'on recopie ces dates. C'est le point
 * important de ce fichier : un agenda qui duplique diverge. On change la date
 * d'une session, l'agenda continue d'afficher l'ancienne, et plus personne ne
 * sait laquelle croire. Ici l'agenda LIT les tables qui portent déjà ces
 * dates, à chaque affichage. Une seule table lui appartient — `RendezVous` —
 * et c'est celle des dates que rien d'autre ne connaît.
 *
 * LES FORMULAIRES. Une association qui fait une permanence, une académie qui
 * propose des créneaux d'entretien : les deux le font avec un formulaire dont
 * une question est de type DATE. La réponse à cette question EST un
 * rendez-vous — c'était jusqu'ici une ligne dans un tableau de réponses que
 * personne ne relisait. On la projette dans l'agenda, avec le nom ou l'adresse
 * de la personne quand elle l'a laissé.
 */
@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------------------------------------------ */
  /* Lecture                                                             */
  /* ------------------------------------------------------------------ */

  async evenements(accountId: string, du?: string, au?: string): Promise<EvenementAgenda[]> {
    const debut = bornerDate(du) ?? debutDuMois(new Date());
    const fin = bornerDate(au) ?? finDuMois(debut);

    const [propres, sessions, classes, formulaires, association] = await Promise.all([
      this.rendezVous(accountId, debut, fin),
      this.sessionsFormation(accountId, debut, fin),
      this.classesVirtuelles(accountId, debut, fin),
      this.formulaires(accountId, debut, fin),
      this.echeancesAssociation(accountId, debut, fin),
    ]);

    return [...propres, ...sessions, ...classes, ...formulaires, ...association].sort(
      (a, b) => a.debut.getTime() - b.debut.getTime(),
    );
  }

  /** Les rendez-vous saisis à la main : la seule source qu'on écrit. */
  private async rendezVous(accountId: string, du: Date, au: Date): Promise<EvenementAgenda[]> {
    const lignes = await this.prisma.rendezVous.findMany({
      where: { accountId, debut: { gte: du, lte: au } },
      orderBy: { debut: 'asc' },
      take: 500,
      include: { creePar: { select: { firstName: true, lastName: true } } },
    });
    return lignes.map((r) => ({
      id: `rdv:${r.id}`,
      source: 'RENDEZ_VOUS' as const,
      rendezVousId: r.id,
      titre: r.titre,
      detail: r.description ?? null,
      lieu: r.lieu ?? null,
      lien: r.lien ?? null,
      debut: r.debut,
      fin: r.fin ?? null,
      journeeEntiere: r.journeeEntiere,
      categorie: r.categorie,
      participants: r.participants ?? [],
      modifiable: true,
      href: null,
      par: nomComplet(r.creePar),
    }));
  }

  /**
   * Les sessions de formation, vues des deux côtés : celles qu'on accueille
   * (`hostAccountId`) et celles de nos propres formations. Un organisme qui
   * fait animer sa session par un autre doit la voir, et celui qui l'anime
   * aussi.
   */
  private async sessionsFormation(accountId: string, du: Date, au: Date): Promise<EvenementAgenda[]> {
    const lignes = await this.prisma.formationSession.findMany({
      where: {
        startDate: { gte: du, lte: au },
        OR: [{ hostAccountId: accountId }, { formation: { ownerAccountId: accountId } }],
      },
      orderBy: { startDate: 'asc' },
      take: 500,
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        location: true,
        formation: { select: { id: true, title: true } },
        trainer: { select: { firstName: true, lastName: true } },
      },
    });
    return lignes.map((s) => ({
      id: `session:${s.id}`,
      source: 'SESSION' as const,
      rendezVousId: null,
      titre: s.title?.trim() || s.formation?.title || 'Session de formation',
      detail: s.formation?.title && s.title ? s.formation.title : null,
      lieu: s.location ?? null,
      lien: null,
      debut: s.startDate,
      fin: s.endDate ?? null,
      journeeEntiere: false,
      categorie: null,
      participants: [],
      modifiable: false,
      href: `/academie/formations?onglet=sessions`,
      par: nomComplet(s.trainer),
    }));
  }

  private async classesVirtuelles(accountId: string, du: Date, au: Date): Promise<EvenementAgenda[]> {
    const lignes = await this.prisma.classeVirtuelle.findMany({
      where: { accountId, debut: { gte: du, lte: au } },
      orderBy: { debut: 'asc' },
      take: 500,
      select: {
        id: true,
        titre: true,
        description: true,
        debut: true,
        fin: true,
        lien: true,
        cours: { select: { titre: true } },
      },
    });
    return lignes.map((c) => ({
      id: `classe:${c.id}`,
      source: 'CLASSE_VIRTUELLE' as const,
      rendezVousId: null,
      titre: c.titre,
      detail: c.cours?.titre ?? c.description ?? null,
      lieu: null,
      lien: c.lien ?? null,
      debut: c.debut,
      fin: c.fin ?? null,
      journeeEntiere: false,
      categorie: null,
      participants: [],
      modifiable: false,
      href: '/academie/classes-virtuelles',
      par: null,
    }));
  }

  /**
   * LES FORMULAIRES, DEUX FOIS.
   *
   * D'abord la date de clôture : « ce formulaire ferme dimanche » est une
   * échéance comme une autre, et c'est la veille du dimanche qu'on aimerait le
   * savoir.
   *
   * Ensuite les DATES CHOISIES PAR LES RÉPONDANTS. Un formulaire dont une
   * question est de type DATE sert presque toujours à prendre rendez-vous. On
   * lit les questions du formulaire, on retient celles de type DATE, et pour
   * chaque réponse on projette la date saisie. Le titre porte le nom du
   * formulaire, l'intitulé de la question, et l'identité du répondant quand on
   * l'a — c'est-à-dire le contenu d'une question dont le libellé parle de nom,
   * ou l'adresse de courriel.
   */
  private async formulaires(accountId: string, du: Date, au: Date): Promise<EvenementAgenda[]> {
    const formulaires = await this.prisma.formulaire.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: { id: true, titre: true, slug: true, champs: true, fermeLe: true, statut: true },
    });
    if (!formulaires.length) return [];

    const evenements: EvenementAgenda[] = [];

    for (const f of formulaires) {
      if (f.fermeLe && f.fermeLe >= du && f.fermeLe <= au) {
        evenements.push({
          id: `formulaire:${f.id}`,
          source: 'FORMULAIRE' as const,
          rendezVousId: null,
          titre: `Clôture du formulaire « ${f.titre} »`,
          detail: 'Après cette date, le formulaire n’accepte plus de réponse.',
          lieu: null,
          lien: null,
          debut: f.fermeLe,
          fin: null,
          journeeEntiere: true,
          categorie: null,
          participants: [],
          modifiable: false,
          href: null,
          par: null,
        });
      }
    }

    const avecDate = formulaires
      .map((f) => ({ f, champs: champsDate(f.champs) }))
      .filter((x) => x.champs.dates.length > 0);
    if (!avecDate.length) return evenements;

    const reponses = await this.prisma.reponseFormulaire.findMany({
      where: { formulaireId: { in: avecDate.map((x) => x.f.id) } },
      orderBy: { createdAt: 'desc' },
      take: 800,
      select: { id: true, formulaireId: true, email: true, valeurs: true, createdAt: true },
    });

    for (const r of reponses) {
      const entree = avecDate.find((x) => x.f.id === r.formulaireId);
      if (!entree) continue;
      const valeurs = (r.valeurs ?? {}) as Record<string, unknown>;
      for (const champ of entree.champs.dates) {
        const quand = lireDate(valeurs[champ.id]);
        if (!quand || quand < du || quand > au) continue;
        const qui = identite(valeurs, entree.champs.identite, r.email);
        evenements.push({
          id: `reponse:${r.id}:${champ.id}`,
          source: 'REPONSE_FORMULAIRE' as const,
          rendezVousId: null,
          titre: qui ? `${qui} — ${entree.f.titre}` : entree.f.titre,
          detail: champ.libelle,
          lieu: null,
          lien: null,
          debut: quand,
          fin: null,
          journeeEntiere: true,
          categorie: null,
          participants: qui ? [qui] : [],
          modifiable: false,
          href: null,
          par: null,
        });
      }
    }

    return evenements;
  }

  /**
   * Le calendrier d'une association, tel qu'il existe déjà ailleurs dans
   * Pilote : les dates de ses dossiers de financement, la péremption de ses
   * pièces, et ses actions. Rien à saisir : ces dates sont déjà renseignées
   * dans les écrans correspondants, elles n'étaient simplement visibles nulle
   * part ensemble.
   */
  private async echeancesAssociation(accountId: string, du: Date, au: Date): Promise<EvenementAgenda[]> {
    const orga = await this.prisma.organisation.findUnique({
      where: { accountId },
      select: { id: true },
    });
    if (!orga) return [];

    const [dossiers, pieces, actions] = await Promise.all([
      this.prisma.dossierFinancement.findMany({
        where: {
          organisationId: orga.id,
          OR: [
            { dateLimiteDepot: { gte: du, lte: au } },
            { dateDepot: { gte: du, lte: au } },
            { dateDecision: { gte: du, lte: au } },
            { dateCompteRendu: { gte: du, lte: au } },
          ],
        },
        take: 300,
        select: {
          id: true,
          intitule: true,
          financeur: true,
          dateLimiteDepot: true,
          dateDepot: true,
          dateDecision: true,
          dateCompteRendu: true,
        },
      }),
      this.prisma.pieceAssociation.findMany({
        where: { organisationId: orga.id, dateExpiration: { gte: du, lte: au } },
        take: 200,
        select: { id: true, typeCode: true, dateExpiration: true },
      }),
      this.prisma.actionAssociation.findMany({
        where: { organisationId: orga.id, dateDebut: { gte: du, lte: au } },
        take: 300,
        select: { id: true, intitule: true, resume: true, lieu: true, dateDebut: true, dateFin: true },
      }),
    ]);

    const evenements: EvenementAgenda[] = [];

    const jalons: Array<[keyof (typeof dossiers)[number], string]> = [
      ['dateLimiteDepot', 'Dépôt au plus tard'],
      ['dateDepot', 'Dossier déposé'],
      ['dateDecision', 'Réponse attendue'],
      ['dateCompteRendu', 'Compte rendu à rendre'],
    ];
    for (const d of dossiers) {
      for (const [champ, libelle] of jalons) {
        const quand = d[champ] as Date | null;
        if (!quand || quand < du || quand > au) continue;
        evenements.push({
          id: `dossier:${d.id}:${String(champ)}`,
          source: 'DOSSIER' as const,
          rendezVousId: null,
          titre: `${libelle} — ${d.intitule}`,
          detail: d.financeur,
          lieu: null,
          lien: null,
          debut: quand,
          fin: null,
          journeeEntiere: true,
          categorie: null,
          participants: [],
          modifiable: false,
          href: `/espace/dossiers`,
          par: null,
        });
      }
    }

    for (const p of pieces) {
      if (!p.dateExpiration) continue;
      evenements.push({
        id: `piece:${p.id}`,
        source: 'PIECE' as const,
        rendezVousId: null,
        titre: `Pièce à renouveler — ${p.typeCode}`,
        detail: 'Ce document ne sera plus valable après cette date.',
        lieu: null,
        lien: null,
        debut: p.dateExpiration,
        fin: null,
        journeeEntiere: true,
        categorie: null,
        participants: [],
        modifiable: false,
        href: '/espace/classeur',
        par: null,
      });
    }

    for (const a of actions) {
      if (!a.dateDebut) continue;
      evenements.push({
        id: `action:${a.id}`,
        source: 'ACTION' as const,
        rendezVousId: null,
        titre: a.intitule,
        detail: a.resume ?? null,
        lieu: a.lieu ?? null,
        lien: null,
        debut: a.dateDebut,
        fin: a.dateFin ?? null,
        journeeEntiere: true,
        categorie: null,
        participants: [],
        modifiable: false,
        href: '/espace/projets',
        par: null,
      });
    }

    return evenements;
  }

  /**
   * QUI ON PEUT CONVIER.
   *
   * Deux gisements, et pas un de plus : les membres du compte — l'équipe qui
   * partage déjà cet agenda — et, quand le compte est une association, son
   * répertoire de contacts. On ne va pas chercher les apprenants ni les
   * acheteurs : convier quelqu'un à une réunion et l'avoir dans sa base ne
   * sont pas la même chose, et confondre les deux fait des listes de trois
   * cents noms où l'on ne trouve plus le trésorier.
   *
   * On renvoie des NOMS, pas des identifiants : le rendez-vous garde ses
   * participants en texte, ce qui laisse écrire « la mairie » ou « les parents
   * de Léa » — des personnes conviées qui n'auront jamais de compte.
   */
  async personnes(accountId: string): Promise<PersonneAgenda[]> {
    const [membres, orga] = await Promise.all([
      this.prisma.membership.findMany({
        where: { accountId, status: 'ACTIVE' },
        take: 200,
        select: { role: true, user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.organisation.findUnique({ where: { accountId }, select: { id: true } }),
    ]);

    const liste: PersonneAgenda[] = [];
    const vus = new Set<string>();
    const ajouter = (nom: string | null, detail: string | null, groupe: 'EQUIPE' | 'CONTACT') => {
      const propre = (nom ?? '').trim();
      if (!propre || vus.has(propre.toLowerCase())) return;
      vus.add(propre.toLowerCase());
      liste.push({ nom: propre, detail, groupe });
    };

    for (const m of membres) {
      ajouter(nomComplet(m.user) ?? m.user?.email ?? null, LIBELLE_ROLE[m.role] ?? null, 'EQUIPE');
    }

    if (orga) {
      const contacts = await this.prisma.contactAssociation.findMany({
        where: { organisationId: orga.id },
        orderBy: { nom: 'asc' },
        take: 300,
        select: { prenom: true, nom: true, poste: true, structure: true },
      });
      for (const c of contacts) {
        ajouter(`${c.prenom} ${c.nom}`.trim(), c.poste ?? c.structure ?? null, 'CONTACT');
      }
    }

    return liste;
  }

  /* ------------------------------------------------------------------ */
  /* Écriture — uniquement les rendez-vous                               */
  /* ------------------------------------------------------------------ */

  async creer(accountId: string, userId: string, dto: CreerRendezVousDto) {
    const debut = new Date(dto.debut);
    const fin = dto.fin ? new Date(dto.fin) : null;
    return this.prisma.rendezVous.create({
      data: {
        accountId,
        creeParId: userId,
        titre: dto.titre.trim(),
        description: dto.description?.trim() || null,
        lieu: dto.lieu?.trim() || null,
        lien: dto.lien?.trim() || null,
        debut,
        // Une fin antérieure au début n'est pas une fin : on l'ignore plutôt
        // que d'enregistrer un créneau qui se termine avant de commencer.
        fin: fin && fin > debut ? fin : null,
        journeeEntiere: Boolean(dto.journeeEntiere),
        categorie: dto.categorie ?? CategorieRendezVous.RENDEZ_VOUS,
        participants: nettoyerParticipants(dto.participants),
        rappelMinutes: dto.rappelMinutes ?? null,
      },
    });
  }

  async modifier(accountId: string, id: string, dto: ModifierRendezVousDto) {
    await this.sien(accountId, id);
    const data: Prisma.RendezVousUpdateInput = {};
    if (dto.titre !== undefined) data.titre = dto.titre.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.lieu !== undefined) data.lieu = dto.lieu?.trim() || null;
    if (dto.lien !== undefined) data.lien = dto.lien?.trim() || null;
    if (dto.debut !== undefined) data.debut = new Date(dto.debut);
    if (dto.fin !== undefined) data.fin = dto.fin ? new Date(dto.fin) : null;
    if (dto.journeeEntiere !== undefined) data.journeeEntiere = dto.journeeEntiere;
    if (dto.categorie !== undefined) data.categorie = dto.categorie;
    if (dto.participants !== undefined) data.participants = nettoyerParticipants(dto.participants);
    if (dto.rappelMinutes !== undefined) data.rappelMinutes = dto.rappelMinutes ?? null;
    return this.prisma.rendezVous.update({ where: { id }, data });
  }

  async supprimer(accountId: string, id: string) {
    await this.sien(accountId, id);
    await this.prisma.rendezVous.delete({ where: { id } });
    return { supprime: true };
  }

  /** On ne touche qu'aux rendez-vous de son propre compte. */
  private async sien(accountId: string, id: string) {
    const r = await this.prisma.rendezVous.findUnique({ where: { id }, select: { accountId: true } });
    if (!r || r.accountId !== accountId) throw new NotFoundException("Ce rendez-vous n'existe pas.");
    return r;
  }
}

/* -------------------------------------------------------------------- */
/* Ce qu'un événement d'agenda est, quelle que soit sa provenance         */
/* -------------------------------------------------------------------- */

export type SourceEvenement =
  | 'RENDEZ_VOUS'
  | 'SESSION'
  | 'CLASSE_VIRTUELLE'
  | 'FORMULAIRE'
  | 'REPONSE_FORMULAIRE'
  | 'DOSSIER'
  | 'PIECE'
  | 'ACTION';

export interface PersonneAgenda {
  nom: string;
  detail: string | null;
  groupe: 'EQUIPE' | 'CONTACT';
}

export interface EvenementAgenda {
  id: string;
  source: SourceEvenement;
  /** Renseigné pour les seuls événements qu'on peut modifier. */
  rendezVousId: string | null;
  titre: string;
  detail: string | null;
  lieu: string | null;
  lien: string | null;
  debut: Date;
  fin: Date | null;
  journeeEntiere: boolean;
  categorie: CategorieRendezVous | null;
  participants: string[];
  modifiable: boolean;
  /** Où aller pour agir dessus, quand l'événement vit ailleurs. */
  href: string | null;
  par: string | null;
}

/* -------------------------------------------------------------------- */
/* Outils                                                                */
/* -------------------------------------------------------------------- */

/** Le rôle, dit comme on le dit à l'oral. */
const LIBELLE_ROLE: Record<string, string> = {
  OWNER: 'Responsable',
  ADMIN: 'Administration',
  MANAGER: 'Encadrement',
  MEMBER: 'Équipe',
};

function bornerDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function debutDuMois(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}

function finDuMois(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));
}

function nomComplet(p?: { firstName?: string | null; lastName?: string | null } | null): string | null {
  if (!p) return null;
  const nom = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  return nom || null;
}

function nettoyerParticipants(liste?: string[]): string[] {
  if (!Array.isArray(liste)) return [];
  return liste
    .map((p) => (typeof p === 'string' ? p.trim().slice(0, 120) : ''))
    .filter((p, i, tout) => p && tout.indexOf(p) === i)
    .slice(0, 30);
}

/**
 * Les questions d'un formulaire qui portent une date, et celles qui disent qui
 * répond. On cherche le nom par le libellé : c'est imparfait, mais c'est la
 * seule information disponible — les questions sont libres, personne ne
 * déclare « ceci est le nom ».
 */
function champsDate(brut: Prisma.JsonValue): { dates: Champ[]; identite: string[] } {
  if (!Array.isArray(brut)) return { dates: [], identite: [] };
  const dates: Champ[] = [];
  const identite: string[] = [];
  for (const e of brut) {
    if (!e || typeof e !== 'object') continue;
    const champ = e as unknown as Champ;
    if (typeof champ.id !== 'string' || typeof champ.libelle !== 'string') continue;
    if (champ.type === 'DATE') dates.push(champ);
    else if (/\bnom\b|prénom|prenom|identité|identite|qui êtes|qui etes/i.test(champ.libelle))
      identite.push(champ.id);
  }
  return { dates, identite };
}

/** Une réponse de type DATE est rangée en texte : « 2026-10-14 ». */
function lireDate(v: unknown): Date | null {
  if (typeof v !== 'string' || !v.trim()) return null;
  const d = new Date(v.length <= 10 ? `${v}T12:00:00Z` : v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function identite(
  valeurs: Record<string, unknown>,
  champs: string[],
  email: string | null,
): string | null {
  for (const id of champs) {
    const v = valeurs[id];
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 80);
  }
  return email ? email.slice(0, 80) : null;
}
