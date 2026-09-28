import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { paiementEnLigneActif } from '../paiement-en-ligne';

/**
 * LE PAIEMENT EN LIGNE D'UNE FICHE, ET CE QUE LA FICHE PUBLIQUE EN FAIT.
 *
 * Audit du 28/09/2026, point 3 : « Réserver » ouvrait un choix de paiement à
 * une seule option, puis la connexion, alors que le paiement en ligne n'était
 * actif sur aucune fiche. Et « Poser une question » menait aussi à /login.
 * Ce qui est testé ici : la règle (une seule, dans `lib/paiement-en-ligne.ts`)
 * et le fait que les pages publiques s'en servent au lieu de la recopier.
 */

const ATELIER_PAYABLE = { paiementEnLigne: true, price: '300', category: 'ATELIER' };

describe('paiementEnLigneActif', () => {
  it('est vrai quand l’intervenant a ouvert le paiement sur un atelier à tarif affiché', () => {
    expect(paiementEnLigneActif(ATELIER_PAYABLE)).toBe(true);
    expect(paiementEnLigneActif({ ...ATELIER_PAYABLE, price: 45.5 })).toBe(true);
  });

  it('est faux tant que l’interrupteur n’est pas allumé (le cas de toutes les fiches au 28/09/2026)', () => {
    expect(paiementEnLigneActif({ ...ATELIER_PAYABLE, paiementEnLigne: false })).toBe(false);
    expect(paiementEnLigneActif({ ...ATELIER_PAYABLE, paiementEnLigne: undefined })).toBe(false);
    expect(paiementEnLigneActif({ ...ATELIER_PAYABLE, paiementEnLigne: null })).toBe(false);
  });

  it('est faux sans tarif : on n’encaisse pas « sur devis »', () => {
    for (const price of [null, undefined, '', '0', 0, -10, 'sur devis']) {
      expect(paiementEnLigneActif({ ...ATELIER_PAYABLE, price })).toBe(false);
    }
  });

  it('est faux hors catégorie ATELIER, comme le refuse le serveur', () => {
    for (const category of ['FORMATION', 'MEDIATION', 'ART_THERAPIE', 'PREVENTION', null, undefined]) {
      expect(paiementEnLigneActif({ ...ATELIER_PAYABLE, category })).toBe(false);
    }
  });

  it('est faux sur une fiche absente', () => {
    expect(paiementEnLigneActif(null)).toBe(false);
    expect(paiementEnLigneActif(undefined)).toBe(false);
  });
});

const RACINE = join(__dirname, '..', '..');
const lire = (chemin: string) => readFileSync(join(RACINE, chemin), 'utf8');
/** Le code seul : les commentaires doivent pouvoir raconter l'ancien défaut. */
const sansCommentaires = (source: string) =>
  source.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('La fiche atelier publique', () => {
  const fiche = sansCommentaires(lire('app/(public)/ateliers/[id]/page.tsx'));

  it('lit la règle partagée au lieu de la recopier', () => {
    expect(fiche).toContain('paiementEnLigneActif(service)');
    expect(fiche).not.toMatch(/paiementEnLigne\s*&&/);
  });

  it('ne propose plus « Réserver » par le choix de paiement qui menait à la connexion', () => {
    expect(fiche).not.toContain('ReserverModal');
  });

  it('ne mène plus nulle part vers l’espace connecté, « Poser une question » compris', () => {
    expect(fiche).not.toContain('/marketplace/');
    expect(fiche).not.toContain('/login');
    expect(fiche).toContain('objet="question"');
  });
});

describe('La fiche publique d’un intervenant', () => {
  it('envoie ses cartes sur la fiche publique, pas sur la connexion', () => {
    const page = sansCommentaires(lire('app/(public)/intervenants/[id]/page.tsx'));
    expect(page).not.toContain('/marketplace/services');
  });
});

describe('Le formulaire de devis sans compte', () => {
  const formulaire = lire('app/_shared/PublicQuoteForm.tsx');

  it('porte l’usage « question », pré-rempli, sur la même route que le devis', () => {
    expect(formulaire).toContain('messageInitial: "Ma question : "');
    expect(formulaire).toContain('/api/proxy/public/quote-request');
    expect(formulaire.match(/fetch\(/g)?.length).toBe(1);
  });
});
