import { Injectable } from '@nestjs/common';
import { InscriptionStatus, OrigineFinancement, type Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { classeur, type Cellule, type Feuille } from '../../factures/xlsx';
import { ContexteGestion } from './contexte.service';
import { DocumentsSessionService } from './documents-session.service';
import { FacturationOrganismeService } from './facturation-organisme.service';
import { arrondi2, heuresEntre } from './outils';

/**
 * LE BILAN PÉDAGOGIQUE ET FINANCIER (cerfa 10443, art. L6352-11).
 *
 * À déposer chaque année avant le 31 mai sur « Mon activité formation ». On
 * déduit ce que l'activité enregistrée permet de déduire, et on le dit ligne
 * par ligne ; ce qu'elle ne sait pas (les charges, la part du chiffre
 * d'affaires global), l'organisme le saisit. Le document produit est une AIDE
 * au remplissage : c'est le formulaire en ligne qui fait foi.
 *
 * ⚠ La période est l'exercice comptable ; on retient l'année civile, qui est
 * l'exercice de la plupart des organismes. Les sessions sont rattachées à
 * l'année de leur DÉBUT.
 */

export const LIGNES_C: { cle: OrigineFinancement; ligne: string; libelle: string }[] = [
  { cle: 'ENTREPRISE', ligne: 'C-1', libelle: 'Entreprises pour la formation de leurs salariés' },
  { cle: 'OPCO_APPRENTISSAGE', ligne: 'C-2-a', libelle: 'OPCO : contrats d’apprentissage' },
  { cle: 'OPCO_PROFESSIONNALISATION', ligne: 'C-2-b', libelle: 'OPCO : contrats de professionnalisation' },
  { cle: 'OPCO_PRO_A', ligne: 'C-2-c', libelle: 'OPCO : promotion ou reconversion par alternance' },
  { cle: 'OPCO_TRANSITION', ligne: 'C-2-d', libelle: 'OPCO : projets de transition professionnelle' },
  { cle: 'OPCO_CPF', ligne: 'C-2-e', libelle: 'OPCO et Caisse des dépôts : compte personnel de formation' },
  { cle: 'OPCO_DEMANDEURS', ligne: 'C-2-f', libelle: 'OPCO : dispositifs pour les demandeurs d’emploi' },
  { cle: 'OPCO_NON_SALARIES', ligne: 'C-2-g', libelle: 'OPCO et fonds d’assurance formation de non-salariés' },
  { cle: 'OPCO_PLAN', ligne: 'C-2-h', libelle: 'OPCO : plan de développement des compétences' },
  { cle: 'PUBLICS_AGENTS', ligne: 'C-3', libelle: 'Pouvoirs publics pour la formation de leurs agents' },
  { cle: 'EUROPE', ligne: 'C-4', libelle: 'Instances européennes' },
  { cle: 'ETAT', ligne: 'C-5', libelle: 'État' },
  { cle: 'REGION', ligne: 'C-6', libelle: 'Conseils régionaux' },
  { cle: 'FRANCE_TRAVAIL', ligne: 'C-7', libelle: 'France Travail' },
  { cle: 'AUTRES_PUBLICS', ligne: 'C-8', libelle: 'Autres ressources publiques' },
  { cle: 'PARTICULIER', ligne: 'C-9', libelle: 'Personnes à titre individuel et à leurs frais' },
  { cle: 'AUTRE_ORGANISME', ligne: 'C-10', libelle: 'Autres organismes de formation (sous-traitance)' },
  { cle: 'AUTRES', ligne: 'C-11', libelle: 'Autres produits au titre de la formation' },
];

const TYPES_F1: Record<string, { ligne: string; libelle: string }> = {
  SALARIE_PRIVE: { ligne: 'F-1-a', libelle: 'Salariés d’employeurs privés hors apprentis' },
  APPRENTI: { ligne: 'F-1-b', libelle: 'Apprentis' },
  DEMANDEUR_EMPLOI: { ligne: 'F-1-c', libelle: 'Personnes en recherche d’emploi' },
  PARTICULIER: { ligne: 'F-1-d', libelle: 'Particuliers à leurs propres frais' },
  AUTRE: { ligne: 'F-1-e', libelle: 'Autres stagiaires' },
};

const OBJECTIFS_F3: Record<string, string> = {
  RNCP_6_8: 'Diplôme ou titre RNCP de niveau 6 à 8',
  RNCP_5: 'Diplôme ou titre RNCP de niveau 5',
  RNCP_4: 'Diplôme ou titre RNCP de niveau 4',
  RNCP_3: 'Diplôme ou titre RNCP de niveau 3',
  RNCP_2: 'Diplôme ou titre RNCP de niveau 2',
  CQP_SANS_NIVEAU: 'CQP sans niveau de qualification',
  RS: 'Certification ou habilitation du répertoire spécifique',
  CQP_NON_ENREGISTRE: 'CQP non enregistré',
  AUTRE: 'Autres formations professionnelles',
  BILAN: 'Bilans de compétences',
  VAE: 'Accompagnement à la VAE',
};

@Injectable()
export class BpfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: ContexteGestion,
    private readonly documents: DocumentsSessionService,
    private readonly facturation: FacturationOrganismeService,
  ) {}

  async calculer(accountId: string, annee: number) {
    const a = await this.ctx.academie(accountId);
    const saisie = await this.prisma.bpfExercice.findUnique({ where: { accountId_annee: { accountId, annee } } });
    const saisies = (saisie?.saisies ?? {}) as Record<string, number | string | boolean | null>;
    const produits = await this.facturation.produitsParOrigine(accountId, annee);
    const sessionsIds = await this.prisma.formationSession.findMany({
      where: { formation: { ownerAccountId: accountId }, startDate: { gte: new Date(annee, 0, 1), lt: new Date(annee + 1, 0, 1) } },
      select: { id: true },
    });

    const f1: Record<string, { stagiaires: number; heures: number }> = {};
    const f3: Record<string, { stagiaires: number; heures: number }> = {};
    const nsf: Record<string, { stagiaires: number; heures: number }> = {};
    const f2 = { stagiaires: 0, heures: 0 };
    const g = { stagiaires: 0, heures: 0 };
    const formateurs = new Map<string, { statut: 'INTERNE' | 'EXTERNE'; heures: number }>();
    let distance = { stagiaires: 0 };
    const alertes: string[] = [];
    let sansTemps = 0;

    for (const { id } of sessionsIds) {
      const s = await this.documents.charger(id);
      const heures = this.documents.heures(s);
      const actives = s.inscriptions.filter((i) => i.status !== InscriptionStatus.CANCELLED);
      let heuresSession = 0;
      for (const i of actives) {
        const h = heures.get(i.id)?.heures ?? 0;
        if (!h) sansTemps++;
        heuresSession += h;
        const t = (f1[i.typeStagiaire] ??= { stagiaires: 0, heures: 0 });
        t.stagiaires++;
        t.heures += h;
      }
      if (s.sousTraitance === 'RECUE') {
        // G : formations que l'organisme réalise pour le compte d'un autre OF.
        g.stagiaires += actives.length;
        g.heures += heuresSession;
      } else if (s.sousTraitance === 'CONFIEE') {
        f2.stagiaires += actives.length;
        f2.heures += heuresSession;
      }
      const o = (f3[s.formation.objectifBpf] ??= { stagiaires: 0, heures: 0 });
      o.stagiaires += actives.length;
      o.heures += heuresSession;
      if (s.formation.codeNsf) {
        const x = (nsf[s.formation.codeNsf] ??= { stagiaires: 0, heures: 0 });
        x.stagiaires += actives.length;
        x.heures += heuresSession;
      }
      if (s.modalite !== 'PRESENTIEL') distance = { stagiaires: distance.stagiaires + actives.length };
      // E : les heures de formation dispensées, par formateur.
      for (const c of s.creneaux) {
        const f = c.formateur ?? s.formateurOrganisme;
        if (!f) continue;
        const x = formateurs.get(f.id) ?? { statut: f.statut, heures: 0 };
        x.heures += heuresEntre(c.debut, c.fin);
        formateurs.set(f.id, x);
      }
      if (!s.creneaux.length && s.formateurOrganisme) {
        const x = formateurs.get(s.formateurOrganisme.id) ?? { statut: s.formateurOrganisme.statut, heures: 0 };
        x.heures += this.documents.sessionPdf(s).dureeHeures ?? 0;
        formateurs.set(s.formateurOrganisme.id, x);
      }
    }
    if (sansTemps) alertes.push(`${sansTemps} stagiaire${sansTemps > 1 ? 's' : ''} sans aucune présence enregistrée : leurs heures comptent zéro. Complète l'émargement.`);
    if (!a.nda) alertes.push("Le numéro de déclaration d'activité manque : il identifie le bilan.");
    const sansNsf = await this.prisma.formation.count({ where: { ownerAccountId: accountId, codeNsf: null, sessions: { some: { startDate: { gte: new Date(annee, 0, 1), lt: new Date(annee + 1, 0, 1) } } } } });
    if (sansNsf) alertes.push(`${sansNsf} formation${sansNsf > 1 ? 's' : ''} sans code NSF : le cadre F-4 ne peut pas les classer.`);

    const cadreC = LIGNES_C.map((l) => {
      const saisi = saisies[`C:${l.cle}`];
      const deduit = arrondi2(produits[l.cle] ?? 0);
      return { ...l, deduit, montant: typeof saisi === 'number' ? saisi : deduit, saisi: typeof saisi === 'number' };
    });
    const totalC = arrondi2(cadreC.reduce((t, l) => t + l.montant, 0));
    const internes = [...formateurs.values()].filter((f) => f.statut === 'INTERNE');
    const externes = [...formateurs.values()].filter((f) => f.statut === 'EXTERNE');
    const arr = (o: Record<string, { stagiaires: number; heures: number }>) =>
      Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { stagiaires: v.stagiaires, heures: arrondi2(v.heures) }]));

    return {
      annee,
      organisme: { nom: a.nom, nda: a.nda, siret: a.siret, adresse: [a.adresse, a.codePostal, a.commune].filter(Boolean).join(' ') },
      cadreC: { lignes: cadreC, total: totalC, partChiffreAffaires: saisies['C:part'] ?? null },
      cadreD: {
        totalCharges: saisies['D:total'] ?? null,
        salairesFormateurs: saisies['D:salaires'] ?? null,
        achatsPrestations: saisies['D:achats'] ?? null,
      },
      cadreE: {
        internes: { personnes: internes.length, heures: arrondi2(internes.reduce((t, f) => t + f.heures, 0)) },
        externes: { personnes: externes.length, heures: arrondi2(externes.reduce((t, f) => t + f.heures, 0)) },
      },
      cadreF1: Object.entries(TYPES_F1).map(([cle, l]) => ({ ...l, cle, ...(arr(f1)[cle] ?? { stagiaires: 0, heures: 0 }) })),
      cadreF1Distance: distance.stagiaires,
      cadreF2: { stagiaires: f2.stagiaires, heures: arrondi2(f2.heures) },
      cadreF3: Object.entries(OBJECTIFS_F3).map(([cle, libelle]) => ({ cle, libelle, ...(arr(f3)[cle] ?? { stagiaires: 0, heures: 0 }) })),
      cadreF4: Object.entries(arr(nsf))
        .sort((x, y) => y[1].heures - x[1].heures)
        .slice(0, 5)
        .map(([code, v]) => ({ code, ...v })),
      cadreG: { stagiaires: g.stagiaires, heures: arrondi2(g.heures) },
      saisies,
      deposeLe: saisie?.deposeLe ?? null,
      alertes,
    };
  }

  async enregistrer(accountId: string, annee: number, saisies: Record<string, number | string | boolean | null>) {
    await this.ctx.academie(accountId);
    const propres: Record<string, number | string | boolean | null> = {};
    for (const [k, v] of Object.entries(saisies)) {
      if (!/^(C:[A-Z_]+|C:part|D:(total|salaires|achats))$/.test(k)) continue;
      if (v !== null && typeof v !== 'number') continue;
      propres[k] = v === null ? null : arrondi2(v);
    }
    const existant = await this.prisma.bpfExercice.findUnique({ where: { accountId_annee: { accountId, annee } } });
    const fusion = { ...((existant?.saisies ?? {}) as Record<string, unknown>), ...propres };
    for (const [k, v] of Object.entries(fusion)) if (v === null) delete fusion[k];
    await this.prisma.bpfExercice.upsert({
      where: { accountId_annee: { accountId, annee } },
      create: { accountId, annee, saisies: fusion as Prisma.InputJsonValue },
      update: { saisies: fusion as Prisma.InputJsonValue },
    });
    return this.calculer(accountId, annee);
  }

  async marquerDepose(accountId: string, annee: number, depose: boolean) {
    await this.ctx.academie(accountId);
    await this.prisma.bpfExercice.upsert({
      where: { accountId_annee: { accountId, annee } },
      create: { accountId, annee, deposeLe: depose ? new Date() : null },
      update: { deposeLe: depose ? new Date() : null },
    });
    return this.calculer(accountId, annee);
  }

  async xlsx(accountId: string, annee: number): Promise<{ nom: string; fichier: Buffer }> {
    const b = await this.calculer(accountId, annee);
    const feuilles: Feuille[] = [];
    const lignes: Cellule[][] = [
      [`Bilan pédagogique et financier ${annee}`, ''],
      [b.organisme.nom, `NDA ${b.organisme.nda ?? 'à renseigner'}`],
      ['Aide au remplissage du cerfa 10443 : c’est le formulaire en ligne « Mon activité formation » qui fait foi.', ''],
      ['', ''],
      ['Cadre C : origine des produits (HT)', 'Montant'],
      ...b.cadreC.lignes.map((l) => [`${l.ligne} ${l.libelle}${l.saisi ? ' (saisi)' : ''}`, l.montant] as Cellule[]),
      ['Total des produits', { f: `SUM(B6:B${5 + b.cadreC.lignes.length})` }],
      ['', ''],
      ['Cadre D : charges', ''],
      ['Total des charges', (b.cadreD.totalCharges as number) ?? null],
      ['dont salaires des formateurs', (b.cadreD.salairesFormateurs as number) ?? null],
      ['dont achats de prestations de formation', (b.cadreD.achatsPrestations as number) ?? null],
      ['', ''],
      ['Cadre E : personnes dispensant la formation', 'Personnes / heures'],
      ['Personnes de l’organisme', `${b.cadreE.internes.personnes} / ${b.cadreE.internes.heures} h`],
      ['Personnes extérieures (sous contrat)', `${b.cadreE.externes.personnes} / ${b.cadreE.externes.heures} h`],
    ];
    feuilles.push({ nom: 'Cadres C D E', colonnes: [70, 22], lignes, gras: [0, 4, 6 + b.cadreC.lignes.length, 8 + b.cadreC.lignes.length, 13 + b.cadreC.lignes.length] });
    feuilles.push({
      nom: 'Cadre F',
      colonnes: [60, 14, 16],
      lignes: [
        ['F-1 : type de stagiaires', 'Stagiaires', 'Heures'],
        ...b.cadreF1.map((l) => [`${l.ligne} ${l.libelle}`, l.stagiaires, l.heures] as Cellule[]),
        ['dont stagiaires en formation à distance ou mixte', b.cadreF1Distance, ''],
        ['', '', ''],
        ['F-2 : activité sous-traitée à un autre organisme', b.cadreF2.stagiaires, b.cadreF2.heures],
        ['', '', ''],
        ['F-3 : objectif général des prestations', 'Stagiaires', 'Heures'],
        ...b.cadreF3.map((l) => [l.libelle, l.stagiaires, l.heures] as Cellule[]),
        ['', '', ''],
        ['F-4 : spécialités de formation (code NSF)', 'Stagiaires', 'Heures'],
        ...b.cadreF4.map((l) => [l.code, l.stagiaires, l.heures] as Cellule[]),
        ['', '', ''],
        ['G : formations confiées par un autre organisme', b.cadreG.stagiaires, b.cadreG.heures],
      ],
      gras: [0],
    });
    if (b.alertes.length) feuilles.push({ nom: 'À vérifier', colonnes: [110], lignes: [['Points à vérifier avant le dépôt'], ...b.alertes.map((x) => [x])], gras: [0] });
    return { nom: `bpf-${annee}.xlsx`, fichier: classeur(feuilles) };
  }
}
