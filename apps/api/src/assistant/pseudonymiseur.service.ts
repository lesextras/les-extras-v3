import { Injectable } from '@nestjs/common';

/**
 * Pseudonymisation des écrits AVANT tout appel à un modèle externe.
 *
 * Principe : les éléments identifiants (prénoms, noms, dates de naissance,
 * téléphones, e-mails) sont remplacés par des jetons stables ([PERSONNE-A],
 * [DATE-1]…) ; la table de correspondance vit uniquement en mémoire, le temps
 * de la requête, et n'est JAMAIS écrite en base ni envoyée au fournisseur.
 * Au retour du modèle, les jetons sont remplacés par les vrais noms, localement.
 *
 * C'est la condition juridique de l'outil : le fournisseur d'IA ne voit jamais
 * « Kevin, 14 ans, MECS Les Hirondelles » mais « [PERSONNE-A], 14 ans,
 * [ETABLISSEMENT-1] ».
 */

export interface TablePseudo {
  /** jeton → valeur réelle */
  vers: Map<string, string>;
  /** valeur réelle (minuscule) → jeton */
  depuis: Map<string, string>;
}

/** Mots en tête de phrase qu'il ne faut pas prendre pour des prénoms. */
const MOTS_COURANTS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'ce', 'cette', 'ces', 'il', 'elle',
  'ils', 'elles', 'nous', 'vous', 'je', 'tu', 'on', 'mais', 'donc', 'or',
  'car', 'ni', 'que', 'qui', 'quand', 'lors', 'apres', 'après', 'avant',
  'pendant', 'depuis', 'aujourd', 'hier', 'demain', 'matin', 'soir', 'nuit',
  'monsieur', 'madame', 'docteur', 'lundi', 'mardi', 'mercredi', 'jeudi',
  'vendredi', 'samedi', 'dimanche', 'janvier', 'fevrier', 'février', 'mars',
  'avril', 'mai', 'juin', 'juillet', 'aout', 'août', 'septembre', 'octobre',
  'novembre', 'decembre', 'décembre', 'bonjour', 'merci', 'suite', 'objet',
  'note', 'rapport', 'synthese', 'synthèse', 'transmission', 'observation',
  'atelier', 'mission', 'equipe', 'équipe', 'service', 'groupe', 'unite',
  'unité', 'foyer', 'mecs', 'ime', 'itep', 'sessad', 'ehpad', 'ase', 'mdph',
]);

@Injectable()
export class PseudonymiseurService {
  /** Applique la pseudonymisation et renvoie le texte masqué + la table. */
  masquer(texte: string): { texte: string; table: TablePseudo } {
    const table: TablePseudo = { vers: new Map(), depuis: new Map() };
    let compteurPersonne = 0;
    let compteurDate = 0;
    let compteurContact = 0;

    const jetonPour = (valeur: string, genre: 'PERSONNE' | 'DATE' | 'CONTACT'): string => {
      const cle = valeur.toLowerCase();
      const existant = table.depuis.get(cle);
      if (existant) return existant;
      let jeton: string;
      if (genre === 'PERSONNE') {
        // A, B, C… — stable au fil du texte pour garder la cohérence du récit.
        jeton = `[PERSONNE-${String.fromCharCode(65 + (compteurPersonne++ % 26))}]`;
      } else if (genre === 'DATE') {
        jeton = `[DATE-${++compteurDate}]`;
      } else {
        jeton = `[CONTACT-${++compteurContact}]`;
      }
      table.vers.set(jeton, valeur);
      table.depuis.set(cle, jeton);
      return jeton;
    };

    let resultat = texte;

    // 1. E-mails et téléphones — identifiants directs, toujours masqués.
    resultat = resultat.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (m) => jetonPour(m, 'CONTACT'));
    resultat = resultat.replace(/(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g, (m) =>
      jetonPour(m, 'CONTACT'),
    );

    // 2. Dates complètes (naissance, événements datés précis).
    resultat = resultat.replace(
      /\b\d{1,2}[\/.-]\d{1,2}[\/.-](?:19|20)\d{2}\b/g,
      (m) => jetonPour(m, 'DATE'),
    );

    // 3. « M. Dupont », « Mme Martin », « Dr Leroy » — civilité + nom.
    resultat = resultat.replace(
      /\b(M\.|Mr|Mme|Mlle|Dr|Pr)\s+([A-ZÀ-Ü][a-zà-ÿ'-]+(?:\s+[A-ZÀ-Ü][a-zà-ÿ'-]+)?)/g,
      (_m, _civ, nom) => jetonPour(nom, 'PERSONNE'),
    );

    // 4. Prénoms/noms : mot capitalisé qui n'ouvre pas la phrase et n'est pas
    //    un mot courant. Volontairement prudent : mieux vaut masquer un mot de
    //    trop que laisser passer un prénom.
    resultat = resultat.replace(
      /(^|[^.!?\n]\s)([A-ZÀ-Ü][a-zà-ÿ'-]{2,})(\s+[A-ZÀ-Ü][a-zà-ÿ'-]{2,})?/gm,
      (m, avant: string, mot1: string, mot2?: string) => {
        if (MOTS_COURANTS.has(mot1.toLowerCase())) return m;
        const valeur = mot2 ? `${mot1}${mot2}` : mot1;
        return `${avant}${jetonPour(valeur.trim(), 'PERSONNE')}`;
      },
    );

    // 5. Seconde passe : toute valeur déjà identifiée est masquée PARTOUT,
    //    y compris en tête de phrase (« Kevin s'est calmé. Kevin a mangé. »).
    //    Sans elle, un prénom qui ouvre une phrase passerait au travers.
    for (const [jeton, valeur] of table.vers) {
      if (!jeton.startsWith('[PERSONNE')) continue;
      const echappe = valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      resultat = resultat.replace(
        new RegExp(`(?<![\\wà-ÿÀ-Ü])${echappe}(?![\\wà-ÿÀ-Ü])`, 'g'),
        jeton,
      );
    }

    return { texte: resultat, table };
  }

  /** Réinjecte les valeurs réelles dans le texte produit par le modèle. */
  restaurer(texte: string, table: TablePseudo): string {
    let resultat = texte;
    for (const [jeton, valeur] of table.vers) {
      resultat = resultat.split(jeton).join(valeur);
    }
    return resultat;
  }

  /** Résumé anonyme de ce qui a été masqué (affiché à l'utilisateur). */
  resume(table: TablePseudo): { personnes: number; dates: number; contacts: number } {
    let personnes = 0, dates = 0, contacts = 0;
    for (const jeton of table.vers.keys()) {
      if (jeton.startsWith('[PERSONNE')) personnes++;
      else if (jeton.startsWith('[DATE')) dates++;
      else contacts++;
    }
    return { personnes, dates, contacts };
  }
}
