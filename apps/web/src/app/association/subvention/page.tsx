import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Carte, Encart, SousTitre, Titre } from '../_ui';
import { chargerChemin } from '../_chemin';

export const metadata: Metadata = {
  title: 'Demander une subvention ou répondre à un appel à projets',
  description:
    "À qui demander, quoi remplir (CERFA 12156), quels papiers joindre, comment rendre compte (CERFA 15059) : la demande de subvention expliquée simplement, avec des exemples.",
  alternates: { canonical: '/subvention' },
};

const FINANCEURS = [
  {
    nom: 'Ta mairie',
    quand: "Souvent avant la fin de l'année, pour l'année suivante.",
    comment: "Rendez-vous au service vie associative. Formulaire CERFA 12156 ou le leur.",
    pourQui: 'Toutes les associations de la commune, même toutes petites.',
  },
  {
    nom: "L'État : le FDVA",
    quand: 'Une campagne par an et par département, souvent au premier semestre.',
    comment: 'Sur Le Compte Asso. Le formulaire se remplit en ligne.',
    pourQui: 'Les petites associations, pour le fonctionnement ou un projet nouveau.',
  },
  {
    nom: 'Le département, la région',
    quand: 'Des appels à projets par thème, à des dates précises.',
    comment: 'Leur portail en ligne. On cherche les dates sur Aides-territoires.',
    pourQui: 'Les projets qui touchent leur sujet : jeunesse, sport, culture, solidarité…',
  },
];

const PAPIERS = [
  'Les statuts',
  'Le récépissé de la préfecture',
  'La liste des dirigeants',
  'Le certificat SIRET',
  "Le RIB de l'association",
  "Le dernier procès-verbal d'assemblée générale",
  "Les comptes de l'année passée",
  'Le budget prévisionnel',
  "Le projet en une page",
];

export default async function SubventionPage() {
  const chemin = await chargerChemin();
  const etapes = (chemin?.etapes ?? []).filter((e) => e.partie === 'SUBVENTION');

  return (
    <>
      <Titre
        surtitre="Demander une subvention"
        sousTitre="Une subvention, c'est de l'argent public qu'on te donne pour ton projet. Un appel à projets, c'est quand un financeur dit « j'ai de l'argent pour tel sujet, envoyez vos projets avant telle date ». Dans les deux cas, on fait la même chose : on raconte, on chiffre, on dépose, on rend compte."
      >
        La subvention, <Accent>pas à pas</Accent>.
      </Titre>

      {/* ------------------------------------------------ les 5 étapes */}
      <section>
        <SousTitre>Les cinq étapes, dans l&apos;ordre</SousTitre>
        <ol className="grid gap-3 md:grid-cols-5">
          {etapes.map((e, i) => (
            <li key={e.slug}>
              <Link href={`/chemin/${e.slug}`} className={`${CARTE} group flex h-full flex-col p-4 no-underline transition hover:border-[#4F46E5]`}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F46E5] text-base font-extrabold text-white">{i + 1}</span>
                <span className="mt-3 font-extrabold leading-snug text-[#1D1B5C] group-hover:text-[#4F46E5]">{e.titre}</span>
                <span className="mt-1 flex-1 text-sm leading-relaxed">{e.enUnMot}</span>
                <span className="mt-3 text-sm font-bold text-[#4F46E5]">Voir l&apos;étape {e.numero} →</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------ à qui demander */}
      <section className="mt-10">
        <SousTitre>À qui demander, en commençant par le plus près</SousTitre>
        <div className="grid gap-4 md:grid-cols-3">
          {FINANCEURS.map((f, i) => (
            <Carte key={f.nom}>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">{i + 1}. D&apos;abord</p>
              <h3 className="mt-1 text-xl font-extrabold text-[#1D1B5C]">{f.nom}</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="font-bold text-[#6B6A8A]">Pour qui</dt>
                  <dd className="leading-relaxed">{f.pourQui}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#6B6A8A]">Quand</dt>
                  <dd className="leading-relaxed">{f.quand}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#6B6A8A]">Comment</dt>
                  <dd className="leading-relaxed">{f.comment}</dd>
                </div>
              </dl>
            </Carte>
          ))}
        </div>
        <p className="mt-3 text-sm text-[#6B6A8A]">
          Pour trouver les dates et les appels à projets près de chez toi :{' '}
          <a href="https://aides-territoires.beta.gouv.fr/" target="_blank" rel="noopener" className="font-bold text-[#4F46E5] underline underline-offset-4">
            Aides-territoires ↗
          </a>{' '}
          (public et gratuit).
        </p>
      </section>

      {/* ------------------------------------------------ les formulaires */}
      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-[#4F46E5] bg-[#ECEBFC] p-6">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#4338CA]">Le formulaire pour demander</p>
          <h3 className="mt-1 text-2xl font-extrabold text-[#1D1B5C]">CERFA 12156</h3>
          <p className="mt-2 leading-relaxed">
            Le même formulaire pour presque tous les financeurs publics. Il demande qui tu es, ton projet, ton budget. Tu recopies ce
            que tu as préparé aux étapes 8 et 9. Sa notice (la 51781) explique chaque case.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/R1271" target="_blank" rel="noopener" className={BTN_PRIMAIRE}>
              Ouvrir le CERFA 12156 ↗
            </a>
            <Link href="/chemin/constituer-et-deposer-le-dossier" className={BTN_SECONDAIRE}>
              Comment le remplir
            </Link>
          </div>
        </div>
        <div className={`${CARTE} p-6`}>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Le formulaire pour rendre compte</p>
          <h3 className="mt-1 text-2xl font-extrabold text-[#1D1B5C]">CERFA 15059</h3>
          <p className="mt-2 leading-relaxed">
            Quand tu as reçu l&apos;argent et fait le projet, tu montres ce que tu as dépensé et ce que ça a produit. À envoyer dans
            les six mois. Sans lui, pas de subvention l&apos;année d&apos;après.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/R46623" target="_blank" rel="noopener" className={BTN_SECONDAIRE}>
              Ouvrir le CERFA 15059 ↗
            </a>
            <Link href="/chemin/rendre-compte" className={BTN_SECONDAIRE}>
              Comment le remplir
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ les papiers */}
      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Carte>
          <SousTitre>Les papiers qu&apos;on te demandera</SousTitre>
          <ul className="grid gap-2 sm:grid-cols-2">
            {PAPIERS.map((p) => (
              <li key={p} className="flex items-center gap-2 rounded-xl bg-[#F5F4FC] px-3 py-2 text-sm font-bold text-[#1D1B5C]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#4F46E5]" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[#6B6A8A]">
            Chaque financeur a sa liste, mais c&apos;est presque toujours celle-ci. Dans ton espace, le classeur les garde et te
            prévient quand l&apos;une expire.
          </p>
        </Carte>
        <div className="space-y-4">
          <Encart ton="info">
            <p className="font-extrabold">Les documents exemples</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a href="/association/modeles/exemple-projet-en-une-page.docx" download className="font-bold text-[#4F46E5] underline underline-offset-4">
                  Le projet en une page ↓
                </a>
              </li>
              <li>
                <a href="/association/modeles/exemple-budget-previsionnel.xlsx" download className="font-bold text-[#4F46E5] underline underline-offset-4">
                  Le budget prévisionnel (tableau) ↓
                </a>
              </li>
              <li>
                <a href="/association/modeles/exemple-lettre-demande-subvention-mairie.docx" download className="font-bold text-[#4F46E5] underline underline-offset-4">
                  La lettre à la mairie ↓
                </a>
              </li>
              <li>
                <a href="/association/modeles/exemple-cahier-de-comptes.xlsx" download className="font-bold text-[#4F46E5] underline underline-offset-4">
                  Le cahier de comptes (tableau) ↓
                </a>
              </li>
            </ul>
          </Encart>
          <Carte>
            <p className="font-extrabold text-[#1D1B5C]">Suivre mes dossiers dans mon espace</p>
            <p className="mt-1 text-sm leading-relaxed">
              Chaque demande a sa fiche : le financeur, la date limite, les papiers cochés, le montant demandé puis accordé, et la
              date du compte rendu. Le lundi, on te dit ce qui presse.
            </p>
            <Link href="/espace/dossiers" className={`${BTN_PRIMAIRE} mt-3`}>
              Mes dossiers de subvention
            </Link>
          </Carte>
        </div>
      </section>
    </>
  );
}
