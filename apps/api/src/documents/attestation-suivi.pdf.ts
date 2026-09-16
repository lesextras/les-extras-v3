import {
  dateFr,
  encadre,
  enTete,
  filet,
  garderPlace,
  LARGEUR_UTILE,
  ligne,
  MARGE,
  nouveauDocument,
  paragraphe,
  pied,
  titreSection,
} from './pdf';

/**
 * L'ATTESTATION DE SUIVI D'UN PARCOURS GRATUIT — le document vendu 20 €.
 *
 * ⚠⚠ CE N'EST PAS `formation.pdf.ts`, ET ÇA NE POUVAIT PAS L'ÊTRE. L'attestation
 * d'assiduité de ce fichier-là part d'une `Inscription` : un apprenant inscrit à
 * une SESSION, des émargements, un formateur, un lieu, des demi-journées. Rien
 * de tout cela n'existe ici — l'acheteur n'a pas de compte Les Extras (il suit
 * le parcours sur la plateforme pédagogique de l'association) et il n'y a aucune
 * session à laquelle le rattacher. Faire passer sa commande pour une inscription
 * reviendrait à fabriquer une session fictive pour produire un document.
 *
 * ⚠⚠ L'ASSIDUITÉ N'EST PAS MESURÉE, ET LE DOCUMENT LE DIT. Les parcours sont en
 * accès libre et se suivent en autonomie ; rien, dans ce dépôt, ne relie une
 * adresse e-mail à une progression sur la plateforme pédagogique. L'attestation
 * est donc établie SUR DÉCLARATION, et c'est écrit dessus. Un document qui
 * laisserait croire à une présence contrôlée serait exactement la pratique
 * commerciale trompeuse (art. L121-1 c. conso) que toute cette chaîne évite —
 * lourdement retenue contre un organisme par ailleurs certifié Qualiopi.
 *
 * ⚠ « ATTESTATION DE SUIVI », JAMAIS « CERTIFICAT ». Un certificat désigne une
 * certification enregistrée au RNCP ou au Répertoire spécifique, délivrée par un
 * organisme habilité par France Compétences. Qualiopi certifie la QUALITÉ DU
 * PROCESSUS et n'autorise à délivrer aucun titre. Le mot ne doit apparaître ni
 * dans le document, ni dans ce fichier autrement que pour l'interdire — un test
 * le vérifie sur le source.
 */

/**
 * Numéro de déclaration d'activité de l'organisme — le même que celui de
 * `formation.pdf.ts` et des mentions légales. Il est répété ici plutôt
 * qu'importé : ces deux fichiers produisent des pièces qui circulent seules, et
 * une constante partagée entre deux documents juridiques donne l'illusion qu'on
 * peut la changer une fois pour les deux, alors que chacune porte sa propre
 * mention réglementaire.
 */
const NUMERO_DECLARATION_ACTIVITE = '11771011677';

export interface DonneesAttestationSuivi {
  demande: {
    id: string;
    prenom: string;
    nom: string;
    payeeLe: Date | null;
    delivreeLe: Date | null;
  };
  formation: {
    title: string;
    summary: string | null;
    objectives: string | null;
    durationHours: number | null;
    durationMinutes: number | null;
    ownerAccount: { name: string; city: string | null } | null;
  };
}

/**
 * La durée annoncée, dans l'unité où elle a été saisie.
 *
 * ⚠ ON N'ARRONDIT PAS DES MINUTES EN HEURES. `durationHours` est un entier :
 * 45 minutes y vaudraient 0 (durée effacée) ou 1 (durée fausse). C'est la raison
 * d'être de `durationMinutes`, et c'est aussi la règle « une durée annoncée
 * s'adosse au contenu mesuré » — sur un document remis à quelqu'un, encore plus
 * que sur une fiche.
 */
function duree(f: DonneesAttestationSuivi['formation']): string | null {
  if (f.durationMinutes && f.durationMinutes > 0) {
    return `${f.durationMinutes} minutes`;
  }
  if (f.durationHours && f.durationHours > 0) {
    return `${f.durationHours} heure${f.durationHours > 1 ? 's' : ''}`;
  }
  return null;
}

export async function attestationSuiviPdf(
  d: DonneesAttestationSuivi,
): Promise<Buffer> {
  const { demande: c, formation: f } = d;
  const organisme = f.ownerAccount?.name ?? 'ADéPA';
  const ville = f.ownerAccount?.city ?? 'Melun';
  const etabliLe = c.delivreeLe ?? new Date();
  const nomPorte = `${c.prenom} ${c.nom}`.trim();

  const { doc, termine } = nouveauDocument(
    `Attestation de suivi, ${f.title}`,
    organisme,
  );

  enTete(
    doc,
    'Attestation de suivi',
    `${organisme}${ville ? ` · ${ville}` : ''} · organisme de formation · déclaration d'activité n° ${NUMERO_DECLARATION_ACTIVITE} · délivrée le ${dateFr(etabliLe)}`,
  );

  doc.moveDown(0.6);
  paragraphe(doc, `${organisme} atteste que :`);
  doc.moveDown(0.2);
  doc.fillColor('#1b2430').font('Helvetica-Bold').fontSize(15).text(nomPorte);
  doc.moveDown(0.6);
  paragraphe(doc, 'a suivi le parcours de formation en ligne suivant :');
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#1b2430').text(`« ${f.title} »`);
  doc.moveDown(0.8);
  filet(doc);

  titreSection(doc, 'Le parcours');
  ligne(doc, 'Modalité', 'En ligne, en autonomie, sans date de fin');
  const d1 = duree(f);
  if (d1) ligne(doc, 'Durée annoncée', d1);
  ligne(doc, 'Accès', 'Gratuit, sans condition');
  if (c.payeeLe) ligne(doc, 'Demande enregistrée le', dateFr(c.payeeLe));

  if (f.objectives) {
    titreSection(doc, 'Objectifs du parcours');
    paragraphe(doc, f.objectives, { gris: true });
  } else if (f.summary) {
    titreSection(doc, 'Contenu du parcours');
    paragraphe(doc, f.summary, { gris: true });
  }

  /**
   * ⚠ LES DEUX ENCADRÉS SONT LE CŒUR DU DOCUMENT, PAS SA MARGE. Le premier dit
   * sur quoi l'attestation est établie, le second dit ce qu'elle n'ouvre pas.
   * Ensemble, ils sont ce qui distingue une attestation honnête d'un document
   * qui laisse croire à un titre. Ne pas les raccourcir pour gagner une page.
   */
  titreSection(doc, 'Portée de la présente attestation');
  encadre(
    doc,
    'Les parcours de l’association sont en accès libre et se suivent en autonomie, sans inscription ' +
      'à une session ni émargement. La présente attestation est établie sur la déclaration de la ' +
      'personne nommée ci-dessus, au nom qu’elle a indiqué. Elle ne constate donc ni une présence ' +
      'contrôlée, ni un résultat à une évaluation.',
  );
  encadre(
    doc,
    'Ce document n’est ni un diplôme, ni une certification professionnelle : il n’est enregistré ni au ' +
      'Répertoire national des certifications professionnelles, ni au Répertoire spécifique. Il ne confère ' +
      'aucun titre et n’ouvre aucun droit à exercer une activité ou une fonction. ' +
      `${organisme} est un organisme de formation enregistré sous le numéro de déclaration d’activité ` +
      `${NUMERO_DECLARATION_ACTIVITE} auprès du préfet de région d’Île-de-France ; cet enregistrement ne vaut ` +
      'pas agrément de l’État.',
  );

  paragraphe(
    doc,
    'Une erreur sur le nom ou sur l’intitulé du parcours se rectifie sans frais : il suffit de répondre au ' +
      'message qui accompagne ce document.',
    { gris: true },
  );

  garderPlace(doc, 110);
  doc.moveDown(1.2);
  const y = doc.y;
  doc
    .fillColor('#5b6470')
    .font('Helvetica')
    .fontSize(9.5)
    .text(`Fait à ${ville}, le ${dateFr(etabliLe)}`, MARGE, y, {
      width: LARGEUR_UTILE * 0.5,
    });
  doc
    .fillColor('#5b6470')
    .fontSize(9.5)
    .text(`Pour ${organisme}`, MARGE + LARGEUR_UTILE * 0.55, y, {
      width: LARGEUR_UTILE * 0.45,
      align: 'right',
    });
  doc
    .strokeColor('#d8dde3')
    .lineWidth(0.75)
    .roundedRect(MARGE + LARGEUR_UTILE * 0.55, y + 18, LARGEUR_UTILE * 0.45, 62, 4)
    .stroke();
  doc
    .fillColor('#9aa3ad')
    .fontSize(8)
    .text('Signature et cachet', MARGE + LARGEUR_UTILE * 0.55 + 8, y + 24, {
      width: LARGEUR_UTILE * 0.45 - 16,
    });
  doc.y = y + 92;
  doc.x = MARGE;

  // ⚠ Pas de `flushPages()` ici : il viderait le tampon de pages et `pied()`
  // n'aurait plus aucune page à parcourir — le pied disparaîtrait sans erreur.
  //
  // La référence permet à l'association de retrouver la commande quand
  // quelqu'un écrit « mon attestation comporte une faute » sans autre détail.
  pied(
    doc,
    `Attestation de suivi · ${organisme} · référence ${c.id.slice(-8).toUpperCase()}`,
  );
  doc.end();
  return termine;
}
