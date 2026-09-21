/**
 * UN LIBELLÉ PAR DESTINATION — la règle, écrite une fois pour toutes.
 *
 * ⚠⚠ CE FICHIER EXISTE PARCE QUE LA RÈGLE S'EST DÉFAITE TROIS FOIS.
 *
 * Le 12/08/2026, `/register` portait quatre libellés différents sur l'accueil
 * seul : « Créer un compte », « Créer mon compte », « Créer mon compte pour
 * entrer » et « Découvrir LEX » — ce dernier promettant une découverte et
 * livrant un formulaire d'inscription. Corrigé. Le 03/09, « Découvrir LEX »
 * était revenu par une autre page. Le 16/09, un audit en a compté NEUF sur le
 * site entier : « Créer un compte gratuit », « Créez un compte », « Rejoindre
 * le réseau », « Essayer LEX gratuitement », « Utiliser LEX sans limite »…
 *
 * Le défaut n'est pas cosmétique : le visiteur qui a déjà vu « Essayer LEX
 * gratuitement » et qui lit ensuite « Rejoindre le réseau » croit à deux
 * portes. Il en ouvre une, tombe sur le même écran, et comprend que le site
 * lui a raconté quelque chose. C'est exactement la confiance qu'une petite
 * association n'a pas les moyens de dépenser.
 *
 * La règle ne se tient pas à la relecture — elle se défait à chaque page
 * ajoutée, parce que chaque page a une bonne raison locale d'avoir SON verbe.
 * D'où ce fichier : le libellé n'est plus écrit dans la page, il est importé.
 * `lib/__tests__/inscription-liens.test.ts` échoue si une page recommence.
 *
 * ⚠ UNE DESTINATION = UN COUPLE (chemin + paramètres). `/register` et
 * `/register?type=etablissement&next=/dashboard/renforts` ne mènent PAS au même
 * écran : le second saute l'étape des cartes de profil, parce que la personne
 * a déjà choisi sur la page d'atterrissage d'où elle vient. Ils ont donc
 * chacun leur libellé, et c'est normal.
 *
 * ⚠ NE PAS METTRE `?type=…` SUR UN BOUTON GÉNÉRIQUE. Le paramètre saute
 * l'écran de choix ; posé sur un « Créer un compte » de barre de navigation,
 * il ferait disparaître les cartes pour tout le monde.
 */
export const INSCRIPTION = {
  /**
   * L'écran de choix de profil. C'est la destination par défaut : tout lien
   * qui ne sait pas à qui il parle mène ici.
   *
   * ⚠ Le libellé ne promet RIEN d'autre que ce que l'écran fait. « Essayer LEX
   * gratuitement » promettait un essai de produit et livrait un formulaire.
   */
  compte: { href: '/register', libelle: 'Créer un compte' },

  /**
   * Le chemin établissement → publier un besoin de renfort. Porté par les
   * pages d'atterrissage renfort (villes, métiers, comparatif, RenforTeam) :
   * la personne y a déjà dit ce qu'elle était, lui reposer la question est une
   * marche de plus sur le trafic le plus qualifié du site.
   */
  publierBesoin: {
    href: '/register?type=etablissement&next=/dashboard/renforts',
    libelle: 'Publier un besoin',
  },

  /**
   * Le chemin DEMANDEUR → décrire un besoin de renfort, SANS forcer le type de
   * compte.
   *
   * ⚠ IL NE FAUT PAS LE REMPLACER PAR `publierBesoin` (21/09/2026). Hors offre
   * complète, RenforTeam s'adresse aussi aux particuliers, aux familles, aux
   * écoles et aux mairies — la page le dit noir sur blanc (« Qui peut
   * demander ? Tout le monde »). `?type=etablissement` saute l'écran des
   * cartes et crée un compte ESTABLISHMENT : une mère qui cliquait se
   * retrouvait à devoir nommer son établissement, avec un compte du mauvais
   * type dont le slug public ne se recalcule jamais.
   */
  demanderIntervenant: {
    href: '/register?next=/dashboard/renforts',
    libelle: 'Demander un intervenant',
  },

  /** Le chemin intervenant → voir les missions ouvertes. */
  chercherMissions: {
    href: '/register?next=/dashboard/opportunites',
    libelle: 'Je cherche des missions',
  },

  /**
   * Le chemin intervenant → créer sa fiche. Distinct du précédent : celui-ci
   * vient de `/intervenant-independant`, où la personne veut PUBLIER, pas
   * répondre à une mission.
   */
  compteIntervenant: {
    href: '/register?type=intervenant',
    libelle: 'Créer mon compte intervenant',
  },
} as const;
