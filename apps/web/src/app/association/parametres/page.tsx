import Link from 'next/link';
import type { Metadata } from 'next';
import { apiEspace, sessionAssociation } from '../_session';
import { BTN_DISCRET, CARTE, Encart, Pastille, Titre, formaterDate } from '../_ui';
import type { Espace } from '../espace/_types';

export const metadata: Metadata = { title: 'Paramètres', robots: { index: false, follow: false } };

const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const NIVEAUX: Record<string, { titre: string; quoi: string }> = {
  PETITE: {
    titre: 'Petite association',
    quoi: "Pas de salarié, une comptabilité simple. L'espace reste léger : le classeur, les dossiers, le budget.",
  },
  GESTIONNAIRE: {
    titre: 'Association gestionnaire',
    quoi: "Des salariés, des conventions, des comptes annuels. L'espace ouvre les pièces employeur et le compte de résultat.",
  },
  RESEAU: {
    titre: 'Tête de réseau',
    quoi: 'Plusieurs antennes ou établissements. Les pièces se tiennent par entité.',
  },
};

/**
 * `/parametres` — CE QUI RÈGLE L'ESPACE.
 *
 * Pas un deuxième formulaire d'identité : la fiche de l'association se remplit
 * dans « Mon association ». Ici, on voit d'un coup ce qui commande le reste —
 * la taille de la structure, la clôture de l'exercice, la durée des mandats —
 * et on rejoint en un clic l'écran qui le modifie.
 */
export default async function ParametresPage() {
  const s = await sessionAssociation('/parametres');
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');

  if (!data) {
    return (
      <>
        <Titre surtitre="Mon compte">Paramètres</Titre>
        <Encart ton="attention">{error ?? 'Les paramètres ne se chargent pas pour le moment.'}</Encart>
      </>
    );
  }

  const o = data.organisation;
  const vs = data.vieStatutaire;
  const niveau = NIVEAUX[o.niveau] ?? NIVEAUX.PETITE;

  return (
    <>
      <Titre
        surtitre="Mon compte"
        sousTitre="Ce qui commande le fonctionnement de ton espace. La fiche complète de l'association se remplit dans « Mon association »."
      >
        Paramètres
      </Titre>

      <div className="grid gap-4">
        {/* ------------------------------------------------- la structure */}
        <section className={`${CARTE} p-5`}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[220px] flex-1">
              <h2 className="text-[18px] font-extrabold text-[#1D1B5C]">La taille de ta structure</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-[#3B3A66]">
                <span className="font-bold">{niveau.titre}.</span> {niveau.quoi}
              </p>
            </div>
            <Link href="/espace/association" className={BTN_DISCRET}>
              Changer
            </Link>
          </div>
        </section>

        {/* -------------------------------------------------- l'exercice */}
        <section className={`${CARTE} p-5`}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[220px] flex-1">
              <h2 className="text-[18px] font-extrabold text-[#1D1B5C]">La clôture de l&apos;exercice</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-[#3B3A66]">
                Fin {MOIS[Math.min(11, Math.max(0, (o.moisClotureExercice || 12) - 1))]}. C&apos;est cette date qui
                découpe le budget, les comptes annuels et les pièces demandées par exercice.
              </p>
            </div>
            <Link href="/espace/association" className={BTN_DISCRET}>
              Changer
            </Link>
          </div>
        </section>

        {/* ------------------------------------------------- les mandats */}
        <section className={`${CARTE} p-5`}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[220px] flex-1">
              <h2 className="text-[18px] font-extrabold text-[#1D1B5C]">Les mandats et l&apos;assemblée générale</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-[#3B3A66]">
                Mandats de {Math.round((vs.dureeMandatMois || 12) / 12) || 1} an
                {(vs.dureeMandatMois || 12) >= 24 ? 's' : ''}.{' '}
                {vs.dateDerniereAG
                  ? `Dernière AG le ${formaterDate(vs.dateDerniereAG)}.`
                  : "Aucune assemblée générale n'est encore enregistrée."}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {vs.agEnRetard ? <Pastille ton="alerte">Assemblée générale en retard</Pastille> : null}
                {vs.agBientot ? <Pastille ton="attention">Assemblée générale bientôt</Pastille> : null}
                {vs.mandatsExpires.length ? (
                  <Pastille ton="alerte">
                    {vs.mandatsExpires.length} mandat{vs.mandatsExpires.length > 1 ? 's' : ''} expiré
                    {vs.mandatsExpires.length > 1 ? 's' : ''}
                  </Pastille>
                ) : null}
                {!vs.agEnRetard && !vs.agBientot && !vs.mandatsExpires.length ? (
                  <Pastille ton="ok">La vie statutaire est à jour</Pastille>
                ) : null}
              </div>
            </div>
            <Link href="/espace/repertoire" className={BTN_DISCRET}>
              Le répertoire
            </Link>
          </div>
        </section>

        {/* ------------------------------------------------------ l'accès */}
        <section className={`${CARTE} p-5`}>
          <h2 className="text-[18px] font-extrabold text-[#1D1B5C]">Qui a accès à cet espace</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-[#3B3A66]">
            Chaque personne entre avec son propre compte : tu invites par l&apos;adresse e-mail, elle s&apos;inscrit
            elle-même et tu choisis jusqu&apos;où elle peut aller. Aucun compte n&apos;est créé à la place de
            quelqu&apos;un.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/droits-acces" className={BTN_DISCRET}>
              Droits d&apos;accès
            </Link>
            <Link href="/mon-profil" className={BTN_DISCRET}>
              Mon profil
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------- mes données */}
        <section className={`${CARTE} p-5`}>
          <h2 className="text-[18px] font-extrabold text-[#1D1B5C]">Tes données</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-[#3B3A66]">
            {data.nbDocuments} document{data.nbDocuments > 1 ? 's' : ''} déposé{data.nbDocuments > 1 ? 's' : ''},{' '}
            {data.dossiers.length} dossier{data.dossiers.length > 1 ? 's' : ''} de financement,{' '}
            {data.repertoire.total} personne{data.repertoire.total > 1 ? 's' : ''} au répertoire. Tout t&apos;appartient :
            tu peux tout ressortir quand tu veux, et demander la fermeture de l&apos;espace à tout moment.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/espace/documents" className={BTN_DISCRET}>
              Mes documents
            </Link>
            <Link href="/nous-contacter" className={BTN_DISCRET}>
              Demander la fermeture
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
