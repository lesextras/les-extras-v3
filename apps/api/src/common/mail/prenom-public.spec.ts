import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * LE PRÉNOM PUBLIC EST « SARAH » — décision de Siham, 4 septembre 2026.
 *
 * « Enlève le prénom Siham et met le prénom Sarah à la place », partout où un
 * destinataire ou un visiteur le lit : signature des courriels, expéditeur
 * Brevo, formulaires publics, documents remis. Le titre, lui, reste vrai
 * (fondatrice de l'association) : c'est un prénom d'usage, pas une fausse
 * identité — l'association, son adresse et son SIREN restent en clair partout.
 *
 * ⚠ CE TEST EXISTE PARCE QUE LA CONSIGNE S'ÉTAIT PERDUE. Quatre signatures de
 * `mail.service.ts` et une phrase des pages d'atterrissage disaient encore
 * « Siham » douze jours après la décision — invisible en relisant un fichier de
 * deux mille lignes, et visible par tous les destinataires.
 *
 * ⚠ LES COMMENTAIRES SONT EXCLUS, ET C'EST VOULU. Ils disent qui a demandé
 * quoi, et c'est son nom ; personne d'autre qu'un développeur ne les lit. Le
 * test ne porte donc que sur ce qui sort du serveur.
 */
describe('Le prénom qui sort des courriels', () => {
  function sansCommentaires(chemin: string): string {
    return fs
      .readFileSync(chemin, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
  }

  it('n’écrit jamais « Siham » dans un message envoyé', () => {
    const source = sansCommentaires(path.join(__dirname, 'mail.service.ts'));
    expect(source.match(/Siham/gi) ?? []).toEqual([]);
  });

  /**
   * La signature doit exister : un message signé d'une personne est ce qui
   * distingue la séquence d'accueil d'un envoi automatique, et c'est le modèle
   * que Siham avait demandé de reprendre.
   */
  it('signe bien au nom de Sarah, pour l’association', () => {
    const source = fs.readFileSync(path.join(__dirname, 'mail.service.ts'), 'utf8');
    expect(source).toContain('Sarah, pour l’association ADéPA');
  });
});
