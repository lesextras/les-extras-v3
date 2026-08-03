import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ANNUALISATION_SUPPLETIVE,
  bilanAnnualisation,
  bilanPeriodePartielle,
  controlerParametres,
  ParametresAnnualisation,
  SemaineTravaillee,
  volumeAnnuel,
} from './annualisation';
import { chiffrerVacation, MAJORATIONS_NEUTRES, ParametresMajorations } from './majorations';
import { feriesDeLAnnee } from './feries';
import { MajorerDto, MajParametresTempsDto, VolumeAnnuelDto } from './dto/parametres-temps.dto';

/**
 * LES RÈGLES DE TEMPS DE TRAVAIL DE L'ÉTABLISSEMENT.
 *
 * Ce service est le point de passage unique entre ce que la structure a lu
 * dans sa convention et les moteurs de calcul. Il ne décide de rien : il
 * charge, il contrôle, il transmet.
 *
 * Le contrôle est la partie qui compte. Un logiciel qui laisse saisir un
 * seuil annuel de mille huit cents heures ou une majoration d'heures
 * supplémentaires à cinq pour cent ne rend pas service — il fabrique une
 * infraction sous couvert de souplesse. Les deux garde-fous d'ordre public
 * sont vérifiés ici avant l'écriture, et redoublés par une contrainte en base.
 */
@Injectable()
export class ParametresTempsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Les paramètres du compte, ou les valeurs par défaut.
   *
   * Le défaut n'est pas neutre au hasard : majorations à zéro, valeurs
   * supplétives du code du travail pour le reste. Un établissement qui n'a
   * rien renseigné voit donc des chiffrages sans majoration — accompagnés de
   * l'explication qu'aucune n'est légale et que la sienne se trouve dans sa
   * convention.
   */
  async lire(accountId: string) {
    const p = await this.prisma.parametresTemps.findUnique({ where: { accountId } });
    if (!p) {
      return {
        renseigne: false,
        convention: null,
        accordEntreprise: false,
        ...MAJORATIONS_NEUTRES,
        ...ANNUALISATION_SUPPLETIVE,
        delaiPrevenanceJours: 7,
        congesTrimestrielsEducatif: 0,
        congesTrimestrielsAutres: 0,
        droitLocal: false,
        vendrediSaint: false,
      };
    }
    const nb = (v: unknown) => Number(v ?? 0);
    return {
      renseigne: true,
      convention: p.convention,
      accordEntreprise: p.accordEntreprise,
      nuitDebutHeure: p.nuitDebutHeure,
      nuitFinHeure: p.nuitFinHeure,
      nuitPct: nb(p.nuitPct),
      dimanchePct: nb(p.dimanchePct),
      feriePct: nb(p.feriePct),
      cumulDimancheEtFerie: p.cumulDimancheEtFerie,
      droitLocal: p.droitLocal,
      vendrediSaint: p.vendrediSaint,
      majorationHS1Pct: nb(p.majorationHS1Pct),
      majorationHS2Pct: nb(p.majorationHS2Pct),
      seuilBasculeHS: p.seuilBasculeHS,
      contingentAnnuel: p.contingentAnnuel,
      seuilDeclenchementHS: p.seuilDeclenchementHS,
      limiteHebdoHaute: p.limiteHebdoHaute,
      limiteHebdoBasse: p.limiteHebdoBasse,
      delaiPrevenanceJours: p.delaiPrevenanceJours,
      congesTrimestrielsEducatif: p.congesTrimestrielsEducatif,
      congesTrimestrielsAutres: p.congesTrimestrielsAutres,
    };
  }

  private majorations(p: Awaited<ReturnType<ParametresTempsService['lire']>>): ParametresMajorations {
    return {
      nuitDebutHeure: p.nuitDebutHeure,
      nuitFinHeure: p.nuitFinHeure,
      nuitPct: p.nuitPct,
      dimanchePct: p.dimanchePct,
      feriePct: p.feriePct,
      cumulDimancheEtFerie: p.cumulDimancheEtFerie,
      droitLocal: p.droitLocal,
      vendrediSaint: p.vendrediSaint,
    };
  }

  private annualisation(
    p: Awaited<ReturnType<ParametresTempsService['lire']>>,
  ): ParametresAnnualisation {
    return {
      seuilDeclenchementHS: p.seuilDeclenchementHS,
      limiteHebdoHaute: p.limiteHebdoHaute,
      limiteHebdoBasse: p.limiteHebdoBasse,
      majorationHS1Pct: p.majorationHS1Pct,
      majorationHS2Pct: p.majorationHS2Pct,
      seuilBasculeHS: p.seuilBasculeHS,
      contingentAnnuel: p.contingentAnnuel,
    };
  }

  /** Enregistre, après contrôle de l'ordre public. */
  async enregistrer(accountId: string, dto: MajParametresTempsDto) {
    const actuel = await this.lire(accountId);
    const fusion = { ...actuel, ...dto };

    const controle = controlerParametres(this.annualisation(fusion as never));
    if (!controle.valide) {
      throw new BadRequestException(controle.erreurs.join(' '));
    }

    // La plage de nuit doit rester dans l'amplitude 21 h – 7 h et couvrir au
    // moins l'intervalle minuit – 5 h : c'est l'article L. 3122-2, et il est
    // d'ordre public.
    const debut = fusion.nuitDebutHeure;
    const fin = fusion.nuitFinHeure;
    if (debut < 21 || fin > 7 || fin < 5) {
      throw new BadRequestException(
        "La plage de nuit doit commencer au plus tôt à 21 h, s'achever au plus tard à 7 h et couvrir l'intervalle de minuit à 5 h (article L. 3122-2).",
      );
    }

    const donnees = {
      convention: fusion.convention ?? null,
      accordEntreprise: fusion.accordEntreprise,
      nuitDebutHeure: fusion.nuitDebutHeure,
      nuitFinHeure: fusion.nuitFinHeure,
      nuitPct: fusion.nuitPct,
      dimanchePct: fusion.dimanchePct,
      feriePct: fusion.feriePct,
      cumulDimancheEtFerie: fusion.cumulDimancheEtFerie,
      droitLocal: fusion.droitLocal,
      vendrediSaint: fusion.vendrediSaint,
      majorationHS1Pct: fusion.majorationHS1Pct,
      majorationHS2Pct: fusion.majorationHS2Pct,
      seuilBasculeHS: fusion.seuilBasculeHS,
      contingentAnnuel: fusion.contingentAnnuel,
      seuilDeclenchementHS: fusion.seuilDeclenchementHS,
      limiteHebdoHaute: fusion.limiteHebdoHaute ?? null,
      limiteHebdoBasse: fusion.limiteHebdoBasse ?? null,
      delaiPrevenanceJours: fusion.delaiPrevenanceJours,
      congesTrimestrielsEducatif: fusion.congesTrimestrielsEducatif,
      congesTrimestrielsAutres: fusion.congesTrimestrielsAutres,
    };

    await this.prisma.parametresTemps.upsert({
      where: { accountId },
      create: { accountId, ...donnees },
      update: donnees,
    });

    return this.lire(accountId);
  }

  /** Le chiffrage d'une vacation avec les règles de l'établissement. */
  async chiffrer(accountId: string, dto: MajorerDto) {
    const p = await this.lire(accountId);
    const debut = new Date(dto.debut);
    const fin = new Date(dto.fin);
    if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime())) {
      throw new BadRequestException('Dates illisibles.');
    }
    if (fin <= debut) {
      throw new BadRequestException('La fin doit être postérieure au début.');
    }
    return chiffrerVacation({ debut, fin }, this.majorations(p), dto.tauxHoraire ?? null);
  }

  /** Les jours fériés de l'année, tels que les voit cet établissement. */
  async feries(accountId: string, annee: number) {
    const p = await this.lire(accountId);
    return feriesDeLAnnee(annee, { droitLocal: p.droitLocal, vendrediSaint: p.vendrediSaint });
  }

  /**
   * Le volume d'heures réellement planifiable dans l'année.
   *
   * À ne jamais confondre avec le seuil de déclenchement des heures
   * supplémentaires. Un éducateur avec dix-huit jours de congés trimestriels
   * tourne autour de mille quatre cent cinquante heures planifiables, alors
   * que son seuil reste à mille six cent sept sauf accord contraire. La
   * réponse expose donc les deux nombres côte à côte, avec leur écart.
   */
  async volume(accountId: string, dto: VolumeAnnuelDto) {
    const p = await this.lire(accountId);
    const ct =
      dto.categorie === 'EDUCATIF' ? p.congesTrimestrielsEducatif : p.congesTrimestrielsAutres;

    const v = volumeAnnuel({
      annee: dto.annee,
      joursReposHebdo: dto.joursReposHebdo ?? 104,
      joursCongesPayes: dto.joursCongesPayes ?? 25,
      joursCongesTrimestriels: dto.joursCongesTrimestriels ?? ct,
      heuresParJour: dto.heuresParJour ?? 7,
      quotite: dto.quotite ?? 1,
      droitLocal: p.droitLocal,
      vendrediSaint: p.vendrediSaint,
    });

    const seuil = Math.round(p.seuilDeclenchementHS * (dto.quotite ?? 1));
    return {
      ...v,
      seuilDeclenchementHS: seuil,
      ecart: Math.round((v.heuresAPlanifier - seuil) * 100) / 100,
      lecture:
        v.heuresAPlanifier < seuil
          ? `Ce salarié ne peut pas atteindre ${seuil} h : son calendrier n'en contient que ${v.heuresAPlanifier}. Ce n'est pas une anomalie — les congés trimestriels du secteur retirent des jours travaillables. Le seuil de déclenchement des heures supplémentaires, lui, reste inchangé : seul un accord d'entreprise peut l'abaisser.`
          : `Ce salarié peut atteindre le seuil de ${seuil} h dans l'année.`,
    };
  }

  /** Le bilan de fin de période, complète ou partielle. */
  async bilan(
    accountId: string,
    semaines: SemaineTravaillee[],
    options: { partielle?: boolean; volumePrevu?: number | null; partAnnee?: number } = {},
  ) {
    const p = await this.lire(accountId);
    const a = this.annualisation(p);
    return options.partielle
      ? bilanPeriodePartielle(semaines, a, 'hebdomadaire', options.partAnnee ?? 1)
      : bilanAnnualisation(semaines, a, options.volumePrevu ?? null);
  }
}
