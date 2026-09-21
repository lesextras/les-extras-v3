import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EnConstruction } from '../EnConstruction';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, ORIGINE_SITE, Titre } from '../_ui';
import {
  FormulaireVitrine,
  TableauAffilies,
  TableauApprenants,
  TableauClasses,
  TableauPacks,
  TableauPromos,
  TableauVentes,
} from '../_ecole/Boutique';
import { VERT, euros, type Affilie, type Apprenant, type Classe, type CoursResume, type Pack, type Promo, type Statistiques, type Vente, type Vitrine } from '../_ecole/types';

/**
 * LES ÉCRANS DU MENU QUI RESTENT À ÉCRIRE.
 *
 * Une seule route dynamique plutôt que quinze dossiers d'une page : chacune
 * annonce précisément ce qu'elle contiendra et où sont déjà les données. Les
 * routes réelles — /chemin, /mon-academie, /connexion… — sont des segments
 * statiques : Next les sert en priorité, celle-ci ne les intercepte jamais.
 * Toute autre adresse tombe sur la page introuvable.
 */
const SECTIONS: Record<string, { titre: string; surtitre: string; quoi: string; contenu: string[]; deja: string }> = {
  "certification": {
    titre: "Ma certification",
    surtitre: "Qualiopi",
    quoi: "Les sept critères et les trente-deux indicateurs du référentiel national qualité, chacun avec sa preuve, son état et sa date de revue.",
    contenu: [
      "Les 7 critères dépliables, et sous chacun ses indicateurs",
      "Pour chaque indicateur : la preuve attendue, le fichier déposé, son état (à faire, déposé, validé, refusé)",
      "Le dépôt de fichiers, un ou plusieurs à la fois",
      "Le taux de couverture en haut de page, et ce qui manque en premier",
      "Les indicateurs qui ne te concernent pas (apprentissage, bilan de compétences) mis de côté",
    ],
    deja: "Les preuves que tu déposes sont déjà stockées : les modèles QualiopiCriterion, QualiopiIndicator et QualiopiProof existent en base et l'API les sert. Il manque l'écran, pas les données.",
  },
  "catalogue": {
    titre: "Mon catalogue",
    surtitre: "Les programmes",
    quoi: "Ce que tu vends : un programme, sa fiche conforme, son tarif. C'est la première pièce que l'auditeur ouvre et la seule que le financeur lit.",
    contenu: [
      "La liste de tes programmes, publiés ou en brouillon",
      "La fiche complète : objectifs évaluables, prérequis, public, durée, modalités, tarif, délais d'accès, accessibilité",
      "La génération de la fiche programme conforme en PDF",
      "Les taux de résultat calculés depuis tes inscriptions, à publier comme le critère 1 l'exige",
    ],
    deja: "Le modèle Formation est en base avec tous ses champs, et le module formations de l'API le sert déjà.",
  },
  "sessions": {
    titre: "Mes sessions",
    surtitre: "L'agenda",
    quoi: "Quelle formation, quelles dates, quel formateur, quelle salle, combien de places, qui est inscrit.",
    contenu: [
      "Le calendrier des sessions à venir et passées",
      "Le formateur, le lieu ou le distanciel, les places et les inscrits",
      "Les feuilles d'émargement par demi-journée, à signer ou à imprimer",
      "Les convocations et les documents de session",
    ],
    deja: "FormationSession et Emargement sont en base, avec la signature horodatée par demi-journée.",
  },
  "apprenants": {
    titre: "Mes apprenants",
    surtitre: "Les inscrits",
    quoi: "Qui suit quoi, qui paie, qui a signé, qui a reçu son attestation.",
    contenu: [
      "Les inscriptions et leur état : en attente, confirmée, présente, certifiée",
      "Le financement de chacune : CPF, OPCO, entreprise, France Travail, personnel",
      "Les conventions, contrats et convocations",
      "Les attestations de fin de formation et les certificats",
      "Les évaluations à chaud et à froid, et leurs relances",
    ],
    deja: "Le modèle Inscription porte déjà le financement, la satisfaction à chaud, l'évaluation à froid, l'attestation et le certificat.",
  },
  "cours-en-ligne": {
    titre: "Mes cours en ligne",
    surtitre: "Le contenu à distance",
    quoi: "Cours, modules, leçons. Les vidéos restent sur YouTube : on intègre le lien, on n'héberge rien.",
    contenu: [
      "Cours → modules → leçons, dans l'ordre où on les suit",
      "Cinq types de leçon : vidéo (lien YouTube intégré), texte, document, quiz, devoir",
      "Les quiz avec score et seuil de réussite",
      "La progression de chaque apprenant : leçon vue, date, temps passé, score",
      "Cette trace remplace l'émargement pour la partie à distance, comme la FOAD l'exige",
    ],
    deja: "C'est le lot 3 : les modèles Cours, Module, Lecon, Progression et Quiz restent à créer.",
  },
  "cours-en-presentiel": {
    titre: "Mes cours en présentiel",
    surtitre: "Le contenu en salle",
    quoi: "De quoi animer vraiment : le déroulé heure par heure, les supports, le matériel, la feuille d'émargement.",
    contenu: [
      "Le conducteur de séance : durée, objectif, technique d'animation, matériel, pour chaque séquence",
      "Les supports à projeter et à distribuer",
      "La feuille d'émargement à imprimer, déjà remplie des inscrits",
      "L'évaluation de fin de séance",
    ],
    deja: "Même socle que les cours en ligne : un seul modèle Cours, séparé par sa modalité. Lot 3.",
  },
  "formateurs": {
    titre: "Mes formateurs",
    surtitre: "L'équipe pédagogique",
    quoi: "Qui anime, avec quelles qualifications, le critère 5 ne demande rien d'autre, mais il le demande précisément.",
    contenu: [
      "La fiche de chaque formateur : CV, diplômes, expérience",
      "Le développement de ses compétences dans l'année",
      "Les conventions de sous-traitance quand l'animation est confiée",
      "Qui anime quelle session, repris depuis l'agenda",
    ],
    deja: "Les formateurs sont déjà rattachés aux sessions en base (FormationSession.trainer).",
  },
  "veille": {
    titre: "Mon journal de veille",
    surtitre: "Critère 6",
    quoi: "La veille légale, métier, handicap et innovation, datée et tracée. C'est le motif de non-conformité le plus fréquent en audit initial.",
    contenu: [
      "Une entrée par veille : type, date, source, lien, résumé",
      "Et surtout la colonne que l'auditeur regarde : ce que tu en as fait",
      "Le filtre par type, pour montrer d'un coup les trois indicateurs concernés",
    ],
    deja: "Le modèle VeilleEntree vient d'être créé : l'API l'accepte déjà, il manque l'écran.",
  },
  "reclamations": {
    titre: "Mes réclamations",
    surtitre: "Critère 7",
    quoi: "Le registre des réclamations et de leur traitement. Une réclamation notée sans suite donnée ne compte pas.",
    contenu: [
      "Une entrée par réclamation : date, origine, auteur, objet",
      "Le traitement apporté et la date de clôture",
      "L'état : ouverte, en cours, résolue, classée",
    ],
    deja: "Le modèle Reclamation vient d'être créé : l'API l'accepte déjà, il manque l'écran.",
  },
  "comptabilite": {
    titre: "Ma comptabilité",
    surtitre: "L'argent",
    quoi: "Devis, conventions, factures, subrogation OPCO, encaissements, et le bilan pédagogique et financier de l'année.",
    contenu: [
      "Le cahier de recettes et de dépenses de l'organisme",
      "Les factures et leur suivi de règlement, avec la subrogation OPCO",
      "Le chiffre d'affaires par formation et par financeur",
      "Le bilan pédagogique et financier, à déposer chaque année avant le 30 avril",
    ],
    deja: "Les modèles Invoice et Quote existent déjà ; l'écran reprendra celui de l'espace association, adapté au métier.",
  },
  "secretariat": {
    titre: "Mon secrétariat",
    surtitre: "Les papiers",
    quoi: "Le classeur des pièces de l'organisme, les modèles à fabriquer, les documents déposés.",
    contenu: [
      "Le règlement intérieur, les CGV, le livret d'accueil, la procédure de réclamation",
      "Le récépissé de déclaration d'activité et le certificat Qualiopi",
      "Les modèles à fabriquer et à remplir en ligne",
      "Le dépôt de fichiers, un ou plusieurs à la fois",
    ],
    deja: "Le classeur et la fabrique de documents existent déjà dans l'espace association : ils se reprennent avec le référentiel de pièces d'un organisme de formation.",
  },
  "ma-page": {
    titre: "Ma page académie",
    surtitre: "Mon compte",
    quoi: "La vitrine publique de ton organisme : une adresse à donner, une page à remplir toi-même, et un bouton pour passer de l'édition à la version publique.",
    contenu: [
      "Une bannière et un logo, remplaçables en un clic",
      "Ta thématique et ta description en 300 caractères, c'est aussi l'aperçu au partage et la description pour Google",
      "« Nos formations » : ce que tu proposes, repris du catalogue",
      "« Qui sommes-nous ? » dans un éditeur riche, avec images et vidéos",
      "Ton adresse partageable : pilote.toulali.fr/academie/ton-nom",
      "La page reste privée tant que tu n'as pas cliqué « publier »",
    ],
    deja: "C'est le lot 4 du cahier des charges. Le modèle PagePublique reste à créer, et le texte riche devra être nettoyé côté serveur avant d'être rendu.",
  },
  "versements": {
    titre: "Versements",
    surtitre: "Mon compte",
    quoi: "Ce que tu as encaissé, ce qui reste à te verser, et sur quel compte bancaire.",
    contenu: [
      "Le solde disponible et le solde en attente de validation",
      "L'historique des versements sur le compte bancaire, avec leur date",
      "Le compte bancaire de destination, et de quoi le changer",
      "Le versement automatique une fois par mois, si tu le choisis",
    ],
    deja: "L'encaissement en ligne arrive avec la billetterie et Stripe, au lot 4. En attendant, les règlements hors ligne se notent dans ta comptabilité.",
  },
  "parametres": {
    titre: "Paramètres",
    surtitre: "Mon compte",
    quoi: "Les réglages de l'espace : la structure, la banque, les notifications, la fermeture du compte.",
    contenu: [
      "L'identité de la structure et ses coordonnées",
      "Le compte bancaire et les informations de vérification",
      "Les notifications : ce qu'on t'envoie, et à quelle fréquence",
      "La fermeture du compte et l'export de tes données",
    ],
    deja: "L'identité de ton organisme se règle déjà dans « Mon académie » ; cet écran regroupera le reste.",
  },
  "droits-acces": {
    titre: "Droits d'accès",
    surtitre: "Mon compte",
    quoi: "Qui peut entrer dans l'espace de ton académie, et jusqu'où.",
    contenu: [
      "La liste des personnes qui administrent l'espace, avec leur adresse e-mail",
      "Inviter quelqu'un, et retirer un accès",
      "Trois niveaux : propriétaire, administrateur, membre",
      "Qui a fait quoi, et quand",
    ],
    deja: "Les modèles Membership et Invitation existent déjà en base, avec leurs rôles OWNER, ADMIN, MANAGER et MEMBER : il manque l'écran, pas le mécanisme.",
  },
};

interface Params {
  params: Promise<{ section: string }>;
}

/**
 * LES ÉCRANS DE L'ÉCOLE EN LIGNE, DÉJÀ ÉCRITS.
 *
 * Ils passent par cette route parce qu'ils tiennent chacun en un tableau : une
 * page par fichier n'apporterait rien. Ce qui n'est pas dans cette liste tombe
 * sur la description de l'écran à venir, comme avant.
 */
const REELLES: Record<string, { titre: string; surtitre: string; sousTitre: string }> = {
  apprenants: {
    titre: 'Qui apprend, et où il en est',
    surtitre: 'Mes apprenants',
    sousTitre:
      "Toutes les personnes inscrites à un cours, leur avancement leçon par leçon, et le lien personnel qui leur ouvre le cours.",
  },
  ventes: {
    titre: 'Ce qui rentre',
    surtitre: 'Mes ventes',
    sousTitre:
      "Le paiement se fait où tu veux, virement, espèces, lien de paiement, facture OPCO. On note ici ce qui est entré, et le reste se calcule.",
  },
  'codes-promo': {
    titre: 'Les codes de réduction',
    surtitre: 'Mes codes promo',
    sousTitre: "Un pourcentage ou un montant, avec une date de fin et un nombre d'utilisations si tu veux les compter.",
  },
  packs: {
    titre: 'Plusieurs cours, un seul prix',
    surtitre: 'Mes packs',
    sousTitre: "Un pack réunit des cours à un prix qui n'est pas la somme des prix. C'est ce qui fait monter le panier.",
  },
  'classes-virtuelles': {
    titre: 'Les rendez-vous en direct',
    surtitre: 'Mes classes virtuelles',
    sousTitre: "Une visio programmée, rattachée ou non à un cours. Le lien est ce que tu envoies aux inscrits.",
  },
  statistiques: {
    titre: 'Ce que disent les chiffres',
    surtitre: 'Mes statistiques',
    sousTitre: "Les inscrits, l'avancement, ce qui se vend, et l'évolution des douze derniers mois.",
  },
  personnalisation: {
    titre: 'La vitrine de mon école',
    surtitre: 'Personnalisation',
    sousTitre: "Une seule adresse à donner, qui rassemble tous tes cours, avec ton nom, ton logo, ta couleur.",
  },
  affiliation: {
    titre: 'Ceux qui parlent de toi',
    surtitre: 'Affiliation',
    sousTitre: "Un partenaire partage un lien qui porte son code. Quand une vente arrive avec ce code, on sait à qui elle revient.",
  },
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { section } = await params;
  const reelle = REELLES[section];
  if (reelle) return { title: reelle.surtitre, robots: { index: false, follow: false } };
  const s = SECTIONS[section];
  return { title: s ? s.titre : 'Introuvable', robots: { index: false, follow: false } };
}

export default async function SectionPage({ params }: Params) {
  const { section } = await params;

  const reelle = REELLES[section];
  if (reelle) return <Ecran section={section} entete={reelle} />;

  const s = SECTIONS[section];
  if (!s) notFound();
  return <EnConstruction titre={s.titre} surtitre={s.surtitre} quoi={s.quoi} contenu={s.contenu} deja={s.deja} />;
}

/* ------------------------------------------------------------------ écrans */

async function Ecran({
  section,
  entete,
}: {
  section: string;
  entete: { titre: string; surtitre: string; sousTitre: string };
}) {
  const s = await sessionAcademie(`/academie/${section}`);

  const enTete = (
    <Titre surtitre={entete.surtitre} sousTitre={entete.sousTitre}>
      {entete.titre}
    </Titre>
  );

  if (section === 'apprenants') {
    const { data, error } = await apiAcademie<Apprenant[]>(s, '/ecole/apprenants');
    if (!data) return <Encart ton="attention">{error ?? 'La liste ne se charge pas.'}</Encart>;
    return (
      <>
        {enTete}
        <TableauApprenants apprenants={data} origine={ORIGINE_SITE} />
      </>
    );
  }

  if (section === 'ventes') {
    const [v, c] = await Promise.all([
      apiAcademie<Vente[]>(s, '/ecole/ventes'),
      apiAcademie<CoursResume[]>(s, '/ecole/cours'),
    ]);
    if (!v.data) return <Encart ton="attention">{v.error ?? 'Les ventes ne se chargent pas.'}</Encart>;
    return (
      <>
        {enTete}
        <TableauVentes ventes={v.data} cours={c.data ?? []} />
      </>
    );
  }

  if (section === 'codes-promo') {
    const { data, error } = await apiAcademie<Promo[]>(s, '/ecole/codes-promo');
    if (!data) return <Encart ton="attention">{error ?? 'Les codes ne se chargent pas.'}</Encart>;
    return (
      <>
        {enTete}
        <TableauPromos promos={data} />
      </>
    );
  }

  if (section === 'packs') {
    const [p, c] = await Promise.all([
      apiAcademie<Pack[]>(s, '/ecole/packs'),
      apiAcademie<CoursResume[]>(s, '/ecole/cours'),
    ]);
    if (!p.data) return <Encart ton="attention">{p.error ?? 'Les packs ne se chargent pas.'}</Encart>;
    return (
      <>
        {enTete}
        <TableauPacks packs={p.data} cours={c.data ?? []} />
      </>
    );
  }

  if (section === 'classes-virtuelles') {
    const [cl, c] = await Promise.all([
      apiAcademie<Classe[]>(s, '/ecole/classes'),
      apiAcademie<CoursResume[]>(s, '/ecole/cours'),
    ]);
    if (!cl.data) return <Encart ton="attention">{cl.error ?? 'Les classes ne se chargent pas.'}</Encart>;
    return (
      <>
        {enTete}
        <TableauClasses classes={cl.data} cours={c.data ?? []} />
      </>
    );
  }

  if (section === 'personnalisation') {
    const { data, error } = await apiAcademie<Vitrine>(s, '/ecole/vitrine');
    if (!data) return <Encart ton="attention">{error ?? 'La vitrine ne se charge pas.'}</Encart>;
    return (
      <>
        {enTete}
        <FormulaireVitrine vitrine={data} origine={ORIGINE_SITE} />
      </>
    );
  }

  if (section === 'affiliation') {
    const { data, error } = await apiAcademie<Affilie[]>(s, '/ecole/affilies');
    if (!data) return <Encart ton="attention">{error ?? 'Les partenaires ne se chargent pas.'}</Encart>;
    return (
      <>
        {enTete}
        <TableauAffilies affilies={data} origine={ORIGINE_SITE} />
      </>
    );
  }

  const { data, error } = await apiAcademie<Statistiques>(s, '/ecole/statistiques');
  if (!data) return <Encart ton="attention">{error ?? 'Les statistiques ne se chargent pas.'}</Encart>;
  return (
    <>
      {enTete}
      <Chiffres stats={data} />
    </>
  );
}

/* ------------------------------------------------------- les statistiques */

function Chiffres({ stats }: { stats: Statistiques }) {
  const maxMois = Math.max(1, ...stats.mois.map((m) => m.chiffreCents));

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Cours publiés" valeur={`${stats.coursPublies} / ${stats.coursTotal}`} />
        <Tuile libelle="Apprenants" valeur={String(stats.apprenants)} detail={`${stats.apprenantsRecents} sur 30 jours`} />
        <Tuile libelle="Avancement moyen" valeur={`${stats.progressionMoyenne} %`} detail={`${stats.termines} cours terminés`} />
        <Tuile libelle="Encaissé" valeur={euros(stats.chiffreCents)} detail={`${euros(stats.chiffreMoisCents)} ce mois-ci`} />
      </div>

      <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: VERT.bord }}>
        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: VERT.encre }}>
          Les douze derniers mois
        </h2>
        <div className="mt-5 flex h-40 items-end gap-1.5">
          {stats.mois.map((m) => (
            <div key={m.mois} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max(2, Math.round((m.chiffreCents / maxMois) * 130))}px`,
                  backgroundColor: m.chiffreCents ? VERT.plein : VERT.clair,
                }}
                title={`${m.mois} : ${euros(m.chiffreCents)}`}
              />
              <span className="truncate text-[11px]" style={{ color: VERT.sourdine }}>
                {m.mois.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border bg-white" style={{ borderColor: VERT.bord }}>
        <table className="w-full min-w-[640px] text-left text-[15px]">
          <thead>
            <tr style={{ backgroundColor: VERT.fond, color: VERT.sourdine }}>
              <th className="px-4 py-3 font-bold">Cours</th>
              <th className="px-4 py-3 font-bold">Apprenants</th>
              <th className="px-4 py-3 font-bold">Terminés</th>
              <th className="px-4 py-3 font-bold">Avancement moyen</th>
              <th className="px-4 py-3 font-bold">Encaissé</th>
            </tr>
          </thead>
          <tbody>
            {stats.parCours.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center" style={{ color: VERT.texte }}>
                  Aucun cours pour le moment.
                </td>
              </tr>
            ) : (
              stats.parCours.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: VERT.bord }}>
                  <td className="px-4 py-3 font-bold" style={{ color: VERT.encre }}>
                    {c.titre}
                  </td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: VERT.texte }}>
                    {c.apprenants}
                  </td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: VERT.texte }}>
                    {c.termines}
                  </td>
                  <td className="px-4 py-3 tabular-nums" style={{ color: VERT.texte }}>
                    {c.progressionMoyenne} %
                  </td>
                  <td className="px-4 py-3 tabular-nums font-bold" style={{ color: VERT.encre }}>
                    {euros(c.chiffreCents)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Tuile({ libelle, valeur, detail }: { libelle: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: VERT.bord }}>
      <p className="text-sm font-bold" style={{ color: VERT.sourdine }}>
        {libelle}
      </p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color: VERT.encre }}>
        {valeur}
      </p>
      {detail ? (
        <p className="mt-1 text-sm" style={{ color: VERT.sourdine }}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}
