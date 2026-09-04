/**
 * LE CADRE DÉONTOLOGIQUE DE LEX N'ÉTAIT PAS TESTÉ.
 *
 * Le fichier `trames.ts` annonce pourtant, en commentaire, un cadre « codé en
 * dur, non négociable, testé en CI ». Il ne l'était pas : aucun spec ne portait
 * sur TRAMES ni sur le socle commun. Une consigne supprimée par mégarde, et
 * LEX se met à poser des diagnostics ou à décider d'une orientation sans que
 * rien ne s'allume. Ce fichier ferme ce trou.
 */
import { TRAMES, trouverTrame } from './trames';

const socle = TRAMES[0].system;

describe('Le socle déontologique, celui qui ne se négocie pas', () => {
  it('interdit le diagnostic et la décision, dans chaque trame', () => {
    for (const t of TRAMES) {
      expect(t.system).toMatch(/AUCUNE décision/);
      expect(t.system).toMatch(/JAMAIS de diagnostic/);
      expect(t.system).toMatch(/équipe pluridisciplinaire/);
    }
  });

  it('impose de séparer les faits des hypothèses', () => {
    expect(socle).toMatch(/FAITS observés/);
    expect(socle).toMatch(/HYPOTHÈSES/);
  });

  it('protège les jetons de pseudonymisation', () => {
    // Si cette consigne saute, le modèle remplace [PERSONNE-A] par un prénom
    // inventé et la restauration recolle le mauvais nom sur la mauvaise
    // personne. C'est la pire panne possible sur ce produit.
    expect(socle).toMatch(/\[PERSONNE-A\]/);
    expect(socle).toMatch(/EXACTEMENT tels quels/);
  });

  it('interdit de fabriquer des trous à remplir', () => {
    expect(socle).toMatch(/À COMPLÉTER AVANT TRANSMISSION/);
  });
});

describe('La forme : ce document part en Word, pas dans une page web', () => {
  it('interdit tout balisage Markdown', () => {
    expect(socle).toMatch(/AUCUN caractère de balisage/);
  });

  it('interdit le tiret cadratin, qui signe l’écriture automatique', () => {
    // Demande de Siham, 4/09/2026. La consigne demandait EXACTEMENT l'inverse
    // jusqu'à cette date : « une énumération commence par un tiret cadratin ».
    expect(socle).toMatch(/N'utilise JAMAIS le tiret cadratin/);
  });

  it('ne contient elle-même ni tiret cadratin ni gras Markdown', () => {
    // Une consigne qui emploie ce qu'elle interdit apprend au modèle à le
    // faire. Les specs de structure des trames utilisaient « - **Contexte** »
    // alors que la règle 8 interdit l'astérisque.
    for (const t of TRAMES) {
      expect(t.system).not.toMatch(/\*\*/);
      expect(t.system.replace(/tiret cadratin \(—\)|demi-cadratin \(–\)/g, '')).not.toMatch(/[—–]/);
    }
  });
});

describe('Le catalogue des trames', () => {
  it('porte des identifiants uniques et se retrouve par son id', () => {
    const ids = TRAMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TRAMES) expect(trouverTrame(t.id)?.id).toBe(t.id);
  });

  it('donne à chaque trame de quoi guider la saisie', () => {
    // Sans conseils ni exemple, l'éducateur pose trois lignes de notes et
    // reçoit un document creux : c'est la matière qui fait la qualité, pas le
    // modèle.
    for (const t of TRAMES) {
      expect(t.titre.length).toBeGreaterThan(3);
      expect(t.description.length).toBeGreaterThan(30);
      expect(t.conseils.length).toBeGreaterThanOrEqual(2);
      expect(t.exemple.length).toBeGreaterThan(60);
    }
  });
});
