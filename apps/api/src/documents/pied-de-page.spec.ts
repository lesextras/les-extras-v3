import * as zlib from 'node:zlib';
import { attestationSuiviPdf } from './attestation-suivi.pdf';
import { emargementPdf } from './formation.pdf';

/**
 * LE PIED DE PAGE, ET LA PAGINATION — deux défauts silencieux, refermés
 * ensemble le 16/09/2026.
 *
 * ⚠⚠ CES TESTS EXISTENT PARCE QUE LES DEUX DÉFAUTS NE LEVAIENT AUCUNE ERREUR.
 *
 *  1. `nouveauDocument` n'ouvrait pas le document avec `bufferPages`. `pied()`
 *     parcourt `doc.bufferedPageRange()` : la plage était VIDE, la boucle ne
 *     tournait jamais, et TOUS les documents du produit — factures, contrats
 *     CDD, devis, propositions, attestations, feuilles d'émargement —
 *     sortaient sans leur mention de pied et SANS « Page N / M ». Un contrat de
 *     travail ou une feuille d'émargement non paginés, ce sont des pages qu'on
 *     peut retirer sans que cela se voie : c'est précisément ce qu'un contrôle
 *     regarde.
 *  2. Une fois `bufferPages` posé, le pied s'écrivait sous la marge basse :
 *     pdfkit en concluait qu'il manquait de place et AJOUTAIT UNE PAGE à
 *     chaque appel à `text()`. Une attestation d'une page en faisait trois,
 *     dont deux blanches. La marge basse est donc annulée le temps d'écrire le
 *     pied.
 *
 * Un test qui se contenterait de vérifier qu'un PDF sort n'aurait rien vu
 * passer : dans les deux cas, le fichier était valide.
 */

/** Le nombre de pages, lu dans le nœud Pages du document. */
function nombreDePages(pdf: Buffer): number {
  const m = pdf.toString('latin1').match(/\/Count (\d+)/);
  return m ? Number(m[1]) : 0;
}

/**
 * Le texte des flux de contenu.
 *
 * ⚠ pdfkit N'ÉCRIT PAS DU TEXTE LISIBLE DANS LE FLUX. Il compresse le flux, et
 * à l'intérieur il découpe chaque mot en morceaux hexadécimaux séparés par des
 * valeurs de crénage : « Page 3 / 3 » s'y écrit `[<50> 40 <616765...> 0] TJ`.
 * Chercher la chaîne telle quelle ne trouve donc jamais rien — un test qui le
 * ferait passerait pour une preuve et n'en serait pas une.
 *
 * On décompresse, puis on recolle les morceaux : les `<hex>` décodés et les
 * `(littéraux)`, dans l'ordre, crénage jeté.
 *
 * ⚠ LE CRÉNAGE MANGE PARFOIS UNE ESPACE : un mot peut se recoller au suivant.
 * Les assertions portent donc sur des fragments courts, jamais sur une phrase
 * entière — sinon le test échouerait sur un document parfaitement juste.
 */
function texte(pdf: Buffer): string {
  let flux = '';
  let i = 0;
  while (true) {
    const debut = pdf.indexOf('stream', i);
    if (debut === -1) break;
    const fin = pdf.indexOf('endstream', debut);
    if (fin === -1) break;
    const brut = pdf.subarray(debut + 6, fin);
    try {
      flux += zlib.inflateSync(brut.subarray(brut[0] === 0x0d ? 2 : 1)).toString('latin1');
    } catch {
      /* Tous les flux ne sont pas du contenu compressé : polices, métadonnées. */
    }
    i = fin + 9;
  }

  let sortie = '';
  const morceaux = /<([0-9a-fA-F]+)>|\(((?:\\.|[^)\\])*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = morceaux.exec(flux)) !== null) {
    sortie += m[1] ? Buffer.from(m[1], 'hex').toString('latin1') : m[2];
  }
  return sortie;
}

const demande = {
  id: 'cmattestation001z',
  prenom: 'Camille',
  nom: 'Durand',
  payeeLe: new Date('2026-09-01T10:00:00Z'),
  delivreeLe: new Date('2026-09-16T10:00:00Z'),
};

const parcours = {
  title: 'Les premieres minutes d une crise',
  summary: 'Reduire ce que l adulte ajoute pendant la crise.',
  objectives: 'Reperer ce que l on ajoute soi-meme.',
  durationHours: null,
  durationMinutes: 45,
  ownerAccount: { name: 'ADePA', city: 'Melun' },
};

describe('Le pied de page des documents', () => {
  it('écrit sa mention et sa pagination sur une attestation d’une page', async () => {
    const pdf = await attestationSuiviPdf({ demande, formation: parcours });
    const contenu = texte(pdf);

    expect(contenu).toContain('Page 1 / 1');
    // La référence est ce qui permet de retrouver la commande quand quelqu'un
    // écrit « mon attestation comporte une faute » sans autre détail.
    expect(contenu).toContain('Attestation de suivi · ADePA · référence TION001Z');
  });

  /**
   * ⚠ LE COMPTE DE PAGES EST L'ASSERTION QUI ATTRAPE LE SECOND DÉFAUT. Écrire
   * le pied sous la marge basse faisait ajouter deux pages blanches par page
   * existante — un document valide, plus lourd, et faux.
   */
  it('n’ajoute aucune page blanche en écrivant le pied', async () => {
    const pdf = await attestationSuiviPdf({ demande, formation: parcours });
    expect(nombreDePages(pdf)).toBe(1);
  });

  /**
   * La feuille d'émargement est le document où la pagination compte le plus :
   * c'est la pièce la plus contrôlée d'un dossier de formation, et elle tient
   * sur plusieurs pages dès qu'une session dépasse une douzaine d'inscrits.
   */
  it('numérote chaque page d’un document qui en compte plusieurs', async () => {
    const inscriptions = Array.from({ length: 40 }, (_, n) => ({
      id: `insc_${n}`,
      learnerName: `Stagiaire ${n}`,
      learnerEmail: null,
      learner: null,
    }));
    const pdf = await emargementPdf({
      session: {
        id: 'sess_12345678',
        startDate: new Date('2026-09-14T00:00:00Z'),
        endDate: null,
        location: 'Melun',
        trainer: { firstName: 'Karim', lastName: 'Benali' },
        formation: {
          title: 'Prevenir et desamorcer la violence',
          durationHours: 14,
          ownerAccount: { name: 'ADePA', city: 'Melun' },
        },
      },
      inscriptions,
      emargements: [],
    });

    const pages = nombreDePages(pdf);
    expect(pages).toBeGreaterThan(1);

    const contenu = texte(pdf);
    for (let n = 1; n <= pages; n++) {
      expect(contenu).toContain(`Page ${n} / ${pages}`);
    }
  });
});
