/**
 * LA MÉMOIRE DES SITUATIONS, ET SES LIMITES.
 *
 * Ces tests portent moins sur ce que la mémoire fait que sur ce qu'elle
 * REFUSE de faire : ne pas s'appliquer à une note d'observation, ne pas
 * recopier le passé, ne jamais laisser passer un nom réel. Chacune de ces
 * limites protège quelque chose de précis, et chacune se perdrait en silence.
 */
import { AssistantTrame } from '@prisma/client';
import {
  TRAMES_AVEC_MEMOIRE,
  NOMBRE_ANTERIEURS,
  blocAnteriorite,
  extraitUtile,
  sujetsDuTexte,
  trameAvecMemoire,
} from './anteriorite';

describe('Quels écrits ont une mémoire, et lesquels n’en ont pas', () => {
  it('donne la mémoire aux écrits qui couvrent une période', () => {
    expect(trameAvecMemoire(AssistantTrame.RAPPORT_SITUATION)).toBe(true);
    expect(trameAvecMemoire(AssistantTrame.BILAN_FIN_ACCOMPAGNEMENT)).toBe(true);
    expect(trameAvecMemoire(AssistantTrame.SYNTHESE_REUNION)).toBe(true);
  });

  it('la refuse à la note d’observation, et c’est le point important', () => {
    // Une note d'observation consigne ce qui s'est passé AUJOURD'HUI. Lui
    // donner les écrits précédents, c'est l'inviter à relire le passé au lieu
    // de regarder la journée : un biais de confirmation dans un document que
    // lira peut-être un juge.
    expect(trameAvecMemoire(AssistantTrame.NOTE_OBSERVATION)).toBe(false);
    expect(trameAvecMemoire(AssistantTrame.TRANSMISSION)).toBe(false);
    expect(trameAvecMemoire(AssistantTrame.COMPTE_RENDU_ATELIER)).toBe(false);
  });

  it('la refuse aux courriers : on n’écrit pas à une famille en récapitulant un dossier', () => {
    expect(trameAvecMemoire(AssistantTrame.COURRIER_AUTORITE_PARENTALE)).toBe(false);
    expect(trameAvecMemoire(AssistantTrame.COURRIER_PARTENAIRE)).toBe(false);
  });

  it('ne relit que deux écrits, pas dix', () => {
    // Au-delà, le modèle passe plus de temps à résumer le passé qu'à traiter
    // les notes du jour, pour un résultat plus plat et une facture plus lourde.
    expect(NOMBRE_ANTERIEURS).toBe(2);
    expect(TRAMES_AVEC_MEMOIRE).toHaveLength(3);
  });
});

describe('Les pseudonymes lus dans un texte', () => {
  it('reconnaît un pseudonyme stable et le rend sans crochets', () => {
    expect(sujetsDuTexte('Ce matin [M.D-1] a refusé de se lever.')).toEqual(['M.D-1']);
  });

  it('distingue deux personnes aux mêmes initiales', () => {
    expect(sujetsDuTexte('[M.D-1] et [M.D-2] se sont parlé.')).toEqual(['M.D-1', 'M.D-2']);
  });

  it('ne confond pas un pseudonyme avec un jeton jetable ou une date', () => {
    // [PERSONNE-A] est le masque jetable : il ne désigne personne d'un écrit à
    // l'autre, et le retenir comme sujet ferait remonter les écrits de
    // n'importe qui.
    expect(sujetsDuTexte('[PERSONNE-A] le [DATE-1] au [TEL-2]')).toEqual([]);
  });

  it('accepte un prénom seul, qui ne donne qu’une initiale', () => {
    expect(sujetsDuTexte('[K-3] est arrivé.')).toEqual(['K-3']);
  });

  it('rend une liste sans doublon et stable', () => {
    expect(sujetsDuTexte('[M.D-1] puis [M.D-1] encore [A.B-2]')).toEqual(['A.B-2', 'M.D-1']);
  });
});

describe('L’extrait retenu d’un écrit antérieur', () => {
  it('garde le texte entier quand il est court', () => {
    expect(extraitUtile('Court.', 100)).toBe('Court.');
  });

  it('garde la FIN, pas le début', () => {
    // La synthèse et les perspectives d'un rapport sont dans ses derniers
    // paragraphes : c'est cela qu'il faut confronter à la période nouvelle.
    const texte = `${'Début sans intérêt. '.repeat(40)}PERSPECTIVES retenues.`;
    const extrait = extraitUtile(texte, 120);
    expect(extrait).toContain('PERSPECTIVES retenues.');
    expect(extrait.length).toBeLessThanOrEqual(120);
  });

  it('repart d’un début de phrase plutôt qu’au milieu d’un mot', () => {
    const texte = `${'a'.repeat(300)}. Une phrase entière et lisible pour finir.`;
    expect(extraitUtile(texte, 60)).toBe('Une phrase entière et lisible pour finir.');
  });
});

describe('Le bloc envoyé au modèle', () => {
  const ecrits = [
    { titre: 'Rapport de situation', quand: '12 mars 2026', extrait: 'Scolarité fragile.' },
  ];

  it('ne dit rien quand il n’y a rien à dire', () => {
    expect(blocAnteriorite([])).toBe('');
  });

  it('interdit explicitement de recopier le passé', () => {
    // Sans cette consigne, un modèle à qui l'on donne un ancien rapport le
    // reprend en changeant trois mots : pire que pas de mémoire du tout.
    const bloc = blocAnteriorite(ecrits);
    expect(bloc).toMatch(/ce qui a CHANGÉ/);
    expect(bloc).toMatch(/jamais un fait ancien comme s'il venait de se produire/);
  });

  it('dit quoi faire quand les notes contredisent l’écrit précédent', () => {
    expect(blocAnteriorite(ecrits)).toMatch(/tu retiens les notes du jour/);
  });

  it('autorise le modèle à ignorer une antériorité hors sujet', () => {
    expect(blocAnteriorite(ecrits)).toMatch(/tu les ignores entièrement/);
  });

  it('sépare clairement l’ancien du nouveau', () => {
    const bloc = blocAnteriorite(ecrits);
    expect(bloc).toMatch(/FIN DES ÉCRITS PRÉCÉDENTS/);
    expect(bloc.indexOf('Scolarité fragile.')).toBeLessThan(bloc.indexOf('FIN DES ÉCRITS'));
  });

  it('porte le titre et la date de chaque écrit relu', () => {
    const bloc = blocAnteriorite(ecrits);
    expect(bloc).toContain('Rapport de situation');
    expect(bloc).toContain('12 mars 2026');
  });
});
