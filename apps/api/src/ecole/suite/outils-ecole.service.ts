import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import { randomBytes } from 'node:crypto';
import { StatutCours, StatutInscriptionCours } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EcoleService } from '../ecole.service';
import { EmailsEcoleService } from './emails-ecole.service';
import { dateFr } from './modeles-email';
import { empreinte } from './session-apprenant';
import { CGU_PAR_DEFAUT, CONFIDENTIALITE_PAR_DEFAUT } from './textes-legaux';
import type {
  CleApiDto,
  EvenementDto,
  InscriptionApiDto,
  ModifierEvenementDto,
  ReglageCoursDto,
  ReglagesEcoleDto,
} from './suite.dto';

/** L'adresse du serveur qui sert les écoles : un domaine personnalisé doit y pointer. */
const IP_SERVEUR = process.env.PILOTE_IP ?? '168.231.86.146';
const HOTE_PILOTE = 'pilote.toulali.fr';

/**
 * Les domaines qui ne peuvent jamais devenir le domaine d'une école : ceux des
 * sites de l'association. Un sous-domaine de toulali.fr (formations.toulali.fr)
 * reste possible, c'est même le cas d'usage de l'académie de Toulali.
 */
const RESERVES_EXACTS = ['toulali.fr', 'www.toulali.fr', 'pilote.toulali.fr', 'www.pilote.toulali.fr', 'association.toulali.fr', 'adepa77.fr', 'www.adepa77.fr', 'a2pa.fr', 'www.a2pa.fr'];
const RESERVES_ARBRES = ['les-extras.fr', 'les-extras.com'];

function domaineReserve(d: string): boolean {
  return RESERVES_EXACTS.includes(d) || RESERVES_ARBRES.some((x) => d === x || d.endsWith(`.${x}`));
}

/**
 * LES RÉGLAGES ET LES OUTILS DE L'ÉCOLE, À PARITÉ AVEC TEACHIZY.
 *
 * Le calendrier, les réglages de l'école (domaine personnalisé, référencement,
 * liens légaux, calendrier et communauté visibles), la durée d'accès d'une
 * formation, les clés d'API pour développeurs, la liste de démarrage en cinq
 * étapes, et ce que les pages publiques lisent (domaine → école, textes
 * légaux).
 */
@Injectable()
export class OutilsEcoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ecole: EcoleService,
    private readonly emails: EmailsEcoleService,
  ) {}

  /* ═══════════════════════════════════════════════════════ réglages ══ */

  async reglages(accountId: string) {
    const r = await this.prisma.reglagesEcole.findUnique({ where: { accountId } });
    return {
      domaine: r?.domaine ?? null,
      domaineVerifieLe: r?.domaineVerifieLe ?? null,
      seoTitre: r?.seoTitre ?? null,
      seoDescription: r?.seoDescription ?? null,
      indexable: r ? r.indexable : true,
      cgu: r?.cgu ?? null,
      confidentialite: r?.confidentialite ?? null,
      calendrierVisible: r ? r.calendrierVisible : true,
      communauteActive: Boolean(r?.communauteActive),
      communauteDescription: r?.communauteDescription ?? null,
      parDefaut: { cgu: CGU_PAR_DEFAUT, confidentialite: CONFIDENTIALITE_PAR_DEFAUT },
      ipServeur: IP_SERVEUR,
      hotePilote: HOTE_PILOTE,
    };
  }

  async modifierReglages(accountId: string, dto: ReglagesEcoleDto) {
    const data: Record<string, unknown> = {};
    if (dto.domaine !== undefined) {
      const d = normaliserDomaine(dto.domaine);
      if (d) {
        if (domaineReserve(d)) {
          throw new BadRequestException('Ce domaine ne peut pas être utilisé pour une école.');
        }
        const pris = await this.prisma.reglagesEcole.findUnique({ where: { domaine: d } });
        if (pris && pris.accountId !== accountId) throw new BadRequestException('Ce domaine est déjà utilisé par une autre école.');
      }
      data.domaine = d;
      data.domaineVerifieLe = null;
    }
    if (dto.seoTitre !== undefined) data.seoTitre = dto.seoTitre.trim() || null;
    if (dto.seoDescription !== undefined) data.seoDescription = dto.seoDescription.trim() || null;
    if (dto.indexable !== undefined) data.indexable = dto.indexable;
    if (dto.cgu !== undefined) data.cgu = dto.cgu.trim() || null;
    if (dto.confidentialite !== undefined) data.confidentialite = dto.confidentialite.trim() || null;
    if (dto.calendrierVisible !== undefined) data.calendrierVisible = dto.calendrierVisible;
    if (dto.communauteActive !== undefined) data.communauteActive = dto.communauteActive;
    if (dto.communauteDescription !== undefined) data.communauteDescription = dto.communauteDescription.trim() || null;
    await this.prisma.reglagesEcole.upsert({ where: { accountId }, create: { accountId, ...data }, update: data });
    return this.reglages(accountId);
  }

  /**
   * VÉRIFIER LE DOMAINE : il doit pointer sur notre serveur (enregistrement A)
   * ou sur pilote.toulali.fr (CNAME). On le dit précisément quand ce n'est pas
   * le cas : c'est presque toujours une valeur mal recopiée chez l'hébergeur.
   */
  async verifierDomaine(accountId: string) {
    const r = await this.prisma.reglagesEcole.findUnique({ where: { accountId } });
    if (!r?.domaine) throw new BadRequestException("Enregistrez d'abord votre domaine.");
    const [a, cname] = await Promise.all([
      dns.resolve4(r.domaine).catch(() => [] as string[]),
      dns.resolveCname(r.domaine).catch(() => [] as string[]),
    ]);
    const ok = a.includes(IP_SERVEUR) || cname.some((c) => c.replace(/\.$/, '') === HOTE_PILOTE);
    await this.prisma.reglagesEcole.update({ where: { accountId }, data: { domaineVerifieLe: ok ? new Date() : null } });
    return {
      verifie: ok,
      trouve: { a, cname },
      attendu: { a: IP_SERVEUR, cname: HOTE_PILOTE },
      message: ok
        ? 'Le domaine pointe bien vers votre école. Le certificat de sécurité se pose dans les minutes qui suivent l’activation par Piloter.'
        : a.length || cname.length
          ? `Le domaine pointe ailleurs (${[...a, ...cname].join(', ')}). Il doit pointer vers ${IP_SERVEUR} (enregistrement A) ou ${HOTE_PILOTE} (CNAME).`
          : "Aucun enregistrement trouvé pour l'instant. Une modification DNS peut mettre jusqu'à quelques heures à se propager.",
    };
  }

  /* ════════════════════════════════════════════ réglage d'une formation ══ */

  async reglageCours(accountId: string, coursId: string) {
    await this.monCours(accountId, coursId);
    const r = await this.prisma.reglageCours.findUnique({ where: { coursId } });
    return { dureeAccesJours: r?.dureeAccesJours ?? null };
  }

  async modifierReglageCours(accountId: string, coursId: string, dto: ReglageCoursDto) {
    const cours = await this.monCours(accountId, coursId);
    const avant = await this.prisma.reglageCours.findUnique({ where: { coursId } });
    const valeur = dto.dureeAccesJours ?? null;
    await this.prisma.reglageCours.upsert({
      where: { coursId },
      create: { coursId, dureeAccesJours: valeur },
      update: { dureeAccesJours: valeur },
    });
    // La durée change : les apprenants en cours le savent.
    if ((avant?.dureeAccesJours ?? null) !== valeur) {
      const inscrits = await this.prisma.inscriptionCours.findMany({
        where: { coursId, statut: { not: StatutInscriptionCours.SUSPENDUE } },
        select: { id: true, email: true, prenom: true, jeton: true, createdAt: true },
        take: 1000,
      });
      const racine = await this.emails.racine(accountId);
      for (const i of inscrits) {
        const fin = valeur ? new Date(i.createdAt.getTime() + valeur * 86_400_000) : null;
        await this.emails.programmer({
          accountId,
          type: 'MODIFICATION_ACCES',
          email: i.email,
          cle: `MODIFICATION_ACCES:${i.id}:duree:${valeur ?? 'illimite'}`,
          donnees: {
            prenom: i.prenom,
            formation: cours.titre,
            lien: `${racine}/apprendre/${i.jeton}`,
            date: fin ? `Il reste ouvert jusqu’au ${dateFr(fin)}.` : 'Il est désormais sans limite de durée.',
          },
        });
      }
    }
    return { dureeAccesJours: valeur };
  }

  /* ═════════════════════════════════════════════════════ calendrier ══ */

  listerEvenements(accountId: string) {
    return this.prisma.evenementEcole.findMany({ where: { accountId }, orderBy: { debut: 'asc' }, take: 500 });
  }

  async creerEvenement(accountId: string, dto: EvenementDto) {
    await this.coursDeLAcademie(accountId, dto.coursIds);
    return this.prisma.evenementEcole.create({
      data: {
        accountId,
        titre: dto.titre.trim(),
        description: dto.description?.trim() || null,
        debut: new Date(dto.debut),
        fin: dto.fin ? new Date(dto.fin) : null,
        lieu: dto.lieu?.trim() || null,
        lien: nettoyerLien(dto.lien),
        coursIds: dto.coursIds ?? [],
      },
    });
  }

  async modifierEvenement(accountId: string, id: string, dto: ModifierEvenementDto) {
    const e = await this.prisma.evenementEcole.findFirst({ where: { id, accountId } });
    if (!e) throw new NotFoundException("Cet événement n'existe pas.");
    if (dto.coursIds) await this.coursDeLAcademie(accountId, dto.coursIds);
    return this.prisma.evenementEcole.update({
      where: { id },
      data: {
        ...(dto.titre !== undefined ? { titre: dto.titre.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.debut !== undefined ? { debut: new Date(dto.debut) } : {}),
        ...(dto.fin !== undefined ? { fin: dto.fin ? new Date(dto.fin) : null } : {}),
        ...(dto.lieu !== undefined ? { lieu: dto.lieu.trim() || null } : {}),
        ...(dto.lien !== undefined ? { lien: nettoyerLien(dto.lien) } : {}),
        ...(dto.coursIds !== undefined ? { coursIds: dto.coursIds } : {}),
      },
    });
  }

  async supprimerEvenement(accountId: string, id: string) {
    const e = await this.prisma.evenementEcole.findFirst({ where: { id, accountId } });
    if (!e) throw new NotFoundException("Cet événement n'existe pas.");
    await this.prisma.evenementEcole.delete({ where: { id } });
    return { supprime: true };
  }

  /* ═══════════════════════════════════════════════════════ démarrage ══ */

  /**
   * LES CINQ ÉTAPES DE DÉMARRAGE, dans l'ordre de Teachizy : l'adresse de
   * l'espace, la personnalisation, la première formation, les informations
   * d'entreprise, le paiement. Chaque étape se constate dans la base : on ne
   * coche rien à la main.
   */
  async demarrage(accountId: string) {
    const [ecole, cours, academie, compte] = await Promise.all([
      this.prisma.ecoleEnLigne.findUnique({ where: { accountId } }),
      this.prisma.cours.count({ where: { accountId } }),
      this.prisma.academie.findUnique({ where: { accountId }, select: { siret: true, siren: true, nda: true } }),
      this.prisma.account.findUnique({ where: { id: accountId }, select: { stripeCompteId: true, stripeComptePret: true, siret: true } }),
    ]);
    const etapes = [
      {
        cle: 'url',
        titre: "Définissez l'URL de votre espace",
        fait: Boolean(ecole?.publiee),
        lien: '/academie/ma-page',
        aide: ecole ? `Votre adresse : pilote.toulali.fr/ecole/${ecole.slug}. Publiez la page pour l'ouvrir.` : 'Choisissez l’adresse de votre école et publiez sa page.',
      },
      {
        cle: 'personnalisation',
        titre: 'Personnalisez votre espace',
        fait: Boolean(ecole && (ecole.logoUrl || ecole.banniereUrl || (ecole.couleur && ecole.couleur !== '#0F5F3E'))),
        lien: '/academie/personnalisation',
        aide: 'Logo, bannière et couleurs : votre école à votre image.',
      },
      {
        cle: 'formation',
        titre: 'Créez votre première formation',
        fait: cours > 0,
        lien: '/academie/formations',
        aide: cours > 0 ? `${cours} formation${cours > 1 ? 's' : ''} créée${cours > 1 ? 's' : ''}.` : 'Un titre et une description courte suffisent pour commencer.',
      },
      {
        cle: 'entreprise',
        titre: "Ajoutez vos informations d'entreprise",
        fait: Boolean(academie?.siret || academie?.siren || compte?.siret),
        lien: '/academie/mon-academie',
        aide: 'SIRET, adresse, numéro de déclaration d’activité : ce qu’une facture et un financeur demandent.',
      },
      {
        cle: 'paiement',
        titre: 'Configurez votre système de paiement',
        fait: Boolean(compte?.stripeCompteId && compte.stripeComptePret),
        lien: '/academie/comptabilite#encaissement',
        aide: compte?.stripeCompteId && !compte.stripeComptePret
          ? 'Votre dossier d’encaissement est commencé : terminez-le chez Stripe.'
          : 'Reliez votre compte d’encaissement : l’argent des ventes arrive directement chez vous.',
      },
    ];
    return { faites: etapes.filter((e) => e.fait).length, total: etapes.length, etapes };
  }

  /* ════════════════════════════════════════════════════ clés d'API ══ */

  async listerCles(accountId: string) {
    const cles = await this.prisma.cleApiEcole.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' } });
    return cles.map((c) => ({
      id: c.id,
      nom: c.nom,
      prefixe: c.prefixe,
      creeLe: c.createdAt,
      derniereUtilisation: c.derniereUtilisation,
      revoqueeLe: c.revoqueeLe,
    }));
  }

  /** La clé complète n'est montrée qu'une fois : seule son empreinte est gardée. */
  async creerCle(accountId: string, dto: CleApiDto) {
    const actives = await this.prisma.cleApiEcole.count({ where: { accountId, revoqueeLe: null } });
    if (actives >= 10) throw new BadRequestException('Dix clés actives au plus : révoquez-en une avant d’en créer une autre.');
    const cle = `pk_${randomBytes(24).toString('hex')}`;
    const c = await this.prisma.cleApiEcole.create({
      data: { accountId, nom: dto.nom.trim(), prefixe: cle.slice(0, 10), empreinte: empreinte(cle) },
    });
    return { id: c.id, nom: c.nom, prefixe: c.prefixe, cle, creeLe: c.createdAt };
  }

  async revoquerCle(accountId: string, id: string) {
    const c = await this.prisma.cleApiEcole.findFirst({ where: { id, accountId } });
    if (!c) throw new NotFoundException("Cette clé n'existe pas.");
    await this.prisma.cleApiEcole.update({ where: { id }, data: { revoqueeLe: new Date() } });
    return { revoquee: true };
  }

  /** L'académie derrière une clé, ou une 401. */
  async academieDeCle(entete: string | undefined): Promise<string> {
    const brut = (entete ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!brut.startsWith('pk_')) throw new UnauthorizedException('Clé d’API absente ou mal formée (en-tête Authorization: Bearer pk_…).');
    const c = await this.prisma.cleApiEcole.findUnique({ where: { empreinte: empreinte(brut) } });
    if (!c || c.revoqueeLe) throw new UnauthorizedException('Clé d’API inconnue ou révoquée.');
    await this.prisma.cleApiEcole.update({ where: { id: c.id }, data: { derniereUtilisation: new Date() } });
    return c.accountId;
  }

  /* ═════════════════════════════════════ l'API pour développeurs (v1) ══ */

  async apiFormations(accountId: string) {
    const cours = await this.prisma.cours.findMany({
      where: { accountId },
      select: { id: true, titre: true, slug: true, sousTitre: true, statut: true, prixCents: true, gratuit: true, modalite: true, publieLe: true, createdAt: true, _count: { select: { inscriptions: true } } },
      orderBy: { ordre: 'asc' },
    });
    return cours.map((c) => ({ ...c, inscrits: c._count.inscriptions, _count: undefined }));
  }

  async apiApprenants(accountId: string, coursId?: string) {
    return this.ecole.apprenants(accountId, coursId);
  }

  async apiInscrire(accountId: string, dto: InscriptionApiDto) {
    return this.ecole.inscrireApprenant(accountId, dto.coursId, { email: dto.email, prenom: dto.prenom, nom: dto.nom });
  }

  async apiVentes(accountId: string) {
    return this.ecole.listerVentes(accountId);
  }

  /* ═════════════════════════════════════════════════ côté public ══ */

  /** Le domaine personnalisé d'une école → son adresse Piloter. */
  async ecoleDuDomaine(hote: string) {
    let d: string | null = null;
    try {
      d = normaliserDomaine(hote);
    } catch {
      d = null;
    }
    if (!d) throw new NotFoundException();
    const r = await this.prisma.reglagesEcole.findUnique({ where: { domaine: d } });
    if (!r?.domaineVerifieLe) throw new NotFoundException();
    const e = await this.prisma.ecoleEnLigne.findUnique({ where: { accountId: r.accountId }, select: { slug: true } });
    if (!e) throw new NotFoundException();
    return { slug: e.slug };
  }

  /** Les textes légaux montrés aux apprenants, et le référencement de l'école. */
  async publicEcole(slug: string) {
    const e = await this.prisma.ecoleEnLigne.findUnique({
      where: { slug },
      select: { accountId: true, nom: true, cgv: true, mentions: true, contactEmail: true, couleur: true, logoUrl: true },
    });
    if (!e) throw new NotFoundException("Cette école n'existe pas.");
    const r = await this.prisma.reglagesEcole.findUnique({ where: { accountId: e.accountId } });
    const academie = await this.prisma.academie.findUnique({
      where: { accountId: e.accountId },
      select: { nom: true, siret: true, nda: true, adresse: true, codePostal: true, commune: true, courriel: true },
    });
    return {
      nom: e.nom,
      couleur: e.couleur,
      logoUrl: e.logoUrl,
      contactEmail: e.contactEmail ?? academie?.courriel ?? null,
      organisme: academie,
      seo: {
        titre: r?.seoTitre ?? null,
        description: r?.seoDescription ?? null,
        indexable: r ? r.indexable : true,
      },
      cgv: e.cgv,
      mentions: e.mentions,
      cgu: r?.cgu || CGU_PAR_DEFAUT,
      confidentialite: r?.confidentialite || CONFIDENTIALITE_PAR_DEFAUT,
      cguParDefaut: !r?.cgu,
      confidentialiteParDefaut: !r?.confidentialite,
      communauteActive: Boolean(r?.communauteActive),
      calendrierVisible: r ? r.calendrierVisible : true,
      domaine: r?.domaineVerifieLe ? r.domaine : null,
    };
  }

  /** Une carte à intégrer sur un autre site : le strict nécessaire, rien de privé. */
  async carteCours(slug: string) {
    const c = await this.prisma.cours.findUnique({
      where: { slug },
      select: { titre: true, slug: true, sousTitre: true, imageUrl: true, prixCents: true, prixBarreCents: true, gratuit: true, statut: true, accountId: true, dureeMinutes: true },
    });
    if (!c || c.statut !== StatutCours.PUBLIE) throw new NotFoundException("Cette formation n'est pas publiée.");
    const e = await this.prisma.ecoleEnLigne.findUnique({ where: { accountId: c.accountId }, select: { nom: true, couleur: true, couleurBoutons: true, couleurTexteBoutons: true } });
    return { ...c, accountId: undefined, statut: undefined, ecole: e };
  }

  async cartePack(slug: string) {
    const p = await this.prisma.packCours.findUnique({ where: { slug } });
    if (!p || p.statut !== StatutCours.PUBLIE) throw new NotFoundException("Ce pack n'est pas publié.");
    const e = await this.prisma.ecoleEnLigne.findUnique({ where: { accountId: p.accountId }, select: { nom: true, slug: true, couleur: true, couleurBoutons: true, couleurTexteBoutons: true } });
    return { titre: p.titre, slug: p.slug, description: p.description, imageUrl: p.imageUrl, prixCents: p.prixCents, ecole: e };
  }

  /* ═════════════════════════════════════════════════════ les outils ══ */

  private async monCours(accountId: string, coursId: string) {
    const c = await this.prisma.cours.findFirst({ where: { id: coursId, accountId }, select: { id: true, titre: true } });
    if (!c) throw new NotFoundException("Cette formation n'existe pas.");
    return c;
  }

  private async coursDeLAcademie(accountId: string, ids?: string[]) {
    if (!ids?.length) return;
    const n = await this.prisma.cours.count({ where: { accountId, id: { in: ids } } });
    if (n !== new Set(ids).size) throw new BadRequestException('Une des formations choisies n’appartient pas à votre académie.');
  }
}

export function normaliserDomaine(brut: string | null | undefined): string | null {
  const d = (brut ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
  if (!d) return null;
  if (!/^(?=.{4,200}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(d)) {
    throw new BadRequestException('Ce domaine n’est pas valide. Exemple : formations.monsite.fr');
  }
  return d;
}

function nettoyerLien(lien: string | undefined | null): string | null {
  const l = (lien ?? '').trim();
  if (!l) return null;
  try {
    const u = new URL(l);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error();
    return u.toString();
  } catch {
    throw new BadRequestException('Le lien doit commencer par https://');
  }
}
