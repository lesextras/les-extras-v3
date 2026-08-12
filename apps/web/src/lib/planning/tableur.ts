// LIRE UN .XLSX SANS BIBLIOTHÈQUE.
//
// Un classeur Excel est une archive ZIP contenant du XML. Le navigateur sait
// déjà tout faire : `DecompressionStream('deflate-raw')` décompresse, et
// `DOMParser` lit le XML. On évite ainsi d'embarquer une dépendance de
// plusieurs centaines de kilo-octets — et, s'agissant de `xlsx` sur npm, une
// version figée en 0.18.5 qui traîne des failles connues.
//
// On ne lit que ce dont on a besoin : la première feuille et la table des
// chaînes partagées. Rien ne sort du navigateur.

/** Une entrée d'archive, décompressée en texte. */
type Entrees = Map<string, Uint8Array>;

function u16(d: DataView, o: number) {
  return d.getUint16(o, true);
}
function u32(d: DataView, o: number) {
  return d.getUint32(o, true);
}

/** Décompresse un flux « deflate brut » (méthode ZIP 8) avec l'API du navigateur. */
async function inflater(donnees: Uint8Array): Promise<Uint8Array> {
  // On alimente le flux directement plutôt que de passer par un Blob : c'est
  // une allocation de moins, et `Blob.stream()` manque à certains
  // environnements de test alors que `ReadableStream` est partout.
  const source = new ReadableStream<Uint8Array>({
    start(controleur) {
      controleur.enqueue(donnees.slice());
      controleur.close();
    },
  });
  // Les types du DOM décrivent l'entrée comme `BufferSource` ; on lui donne
  // des `Uint8Array`, ce qui en fait partie.
  const flux = source.pipeThrough(
    new DecompressionStream('deflate-raw') as unknown as ReadableWritablePair<Uint8Array, Uint8Array>,
  );
  return new Uint8Array(await new Response(flux).arrayBuffer());
}

/**
 * Ouvre une archive ZIP et rend ses entrées.
 *
 * On part de la fin (le « répertoire central »), seule façon fiable de lister
 * une archive : les en-têtes locaux, eux, peuvent annoncer des tailles à zéro
 * quand le producteur a écrit en flux.
 */
export async function ouvrirZip(fichier: ArrayBuffer): Promise<Entrees> {
  const octets = new Uint8Array(fichier);
  const vue = new DataView(fichier);
  const entrees: Entrees = new Map();

  // Signature de fin de répertoire central : 0x06054b50, dans les 64 derniers Ko.
  let fin = -1;
  for (let i = octets.length - 22; i >= Math.max(0, octets.length - 66000); i--) {
    if (u32(vue, i) === 0x06054b50) {
      fin = i;
      break;
    }
  }
  if (fin === -1) throw new Error("Ce fichier n'est pas une archive lisible.");

  const nb = u16(vue, fin + 10);
  let p = u32(vue, fin + 16);

  for (let n = 0; n < nb; n++) {
    if (u32(vue, p) !== 0x02014b50) break;
    const methode = u16(vue, p + 10);
    const tailleCompressee = u32(vue, p + 20);
    const longueurNom = u16(vue, p + 28);
    const longueurExtra = u16(vue, p + 30);
    const longueurCommentaire = u16(vue, p + 32);
    const decalageLocal = u32(vue, p + 42);
    const nom = new TextDecoder().decode(octets.subarray(p + 46, p + 46 + longueurNom));

    // En-tête local : ses champs « extra » ont leur propre longueur.
    const nomLocal = u16(vue, decalageLocal + 26);
    const extraLocal = u16(vue, decalageLocal + 28);
    const debut = decalageLocal + 30 + nomLocal + extraLocal;
    const brut = octets.subarray(debut, debut + tailleCompressee);

    entrees.set(nom, methode === 0 ? brut : await inflater(brut));
    p += 46 + longueurNom + longueurExtra + longueurCommentaire;
  }
  return entrees;
}

/** « BC12 » → 54 (index de colonne, base 0). */
export function indexColonne(reference: string): number {
  const lettres = reference.replace(/\d+/g, '');
  let n = 0;
  for (const c of lettres) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * Lit la première feuille d'un classeur et rend une matrice de chaînes.
 *
 * Les cellules vides ne sont pas écrites dans le XML : on se sert de la
 * référence (`r="C5"`) pour remettre chaque valeur dans sa colonne. Sans cela,
 * une case vide décalerait toute la ligne — et les horaires d'une personne
 * atterriraient dans la colonne d'une autre.
 */
export async function lireClasseur(fichier: ArrayBuffer): Promise<string[][]> {
  const zip = await ouvrirZip(fichier);
  const texte = (nom: string) => {
    const d = zip.get(nom);
    return d ? new TextDecoder().decode(d) : null;
  };

  const partagees: string[] = [];
  const xmlPartagees = texte('xl/sharedStrings.xml');
  if (xmlPartagees) {
    const doc = new DOMParser().parseFromString(xmlPartagees, 'application/xml');
    for (const si of Array.from(doc.getElementsByTagName('si'))) {
      // Une chaîne peut être découpée en plusieurs fragments mis en forme.
      const morceaux = Array.from(si.getElementsByTagName('t')).map((t) => t.textContent ?? '');
      partagees.push(morceaux.join(''));
    }
  }

  // La première feuille dans l'ordre du classeur, quel que soit son nom.
  const nomFeuille =
    [...zip.keys()].filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0] ?? null;
  if (!nomFeuille) throw new Error('Classeur sans feuille lisible.');

  const doc = new DOMParser().parseFromString(texte(nomFeuille)!, 'application/xml');
  const matrice: string[][] = [];

  for (const row of Array.from(doc.getElementsByTagName('row'))) {
    const ligne: string[] = [];
    for (const c of Array.from(row.getElementsByTagName('c'))) {
      const ref = c.getAttribute('r') ?? '';
      const col = ref ? indexColonne(ref) : ligne.length;
      const type = c.getAttribute('t');
      let valeur = '';
      if (type === 's') {
        const v = c.getElementsByTagName('v')[0]?.textContent;
        valeur = v ? (partagees[Number(v)] ?? '') : '';
      } else if (type === 'inlineStr') {
        valeur = Array.from(c.getElementsByTagName('t'))
          .map((t) => t.textContent ?? '')
          .join('');
      } else {
        valeur = c.getElementsByTagName('v')[0]?.textContent ?? '';
      }
      while (ligne.length < col) ligne.push('');
      ligne[col] = valeur.trim();
    }
    matrice.push(ligne);
  }
  return matrice;
}
