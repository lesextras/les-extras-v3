import Link from 'next/link';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { associationConnectee } from './_session';
import { Accent, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE_VIVE } from './_ui';

/**
 * DEUX PAGES, UN SEUL FICHIER.
 *
 * Le middleware sert `/` et `/association` avec ce fichier et pose l'adresse
 * réelle dans l'en-tête `x-chemin` :
 *   /             la plateforme, qui présente les deux espaces ;
 *   /association  l'espace association, qui se présente lui-même.
 */
async function adresse() {
  return (await headers()).get('x-chemin') ?? '/';
}

export async function generateMetadata(): Promise<Metadata> {
  if ((await adresse()) === '/association') {
    return {
      title: 'Piloter mon association — par Toulali',
      description:
        "Le chemin en 12 étapes, le classeur qui prévient, les subventions, la comptabilité et les agréments. Gratuit, pendant que l'outil se construit.",
      alternates: { canonical: '/association' },
    };
  }
  return {
    title: 'Piloter — par Toulali',
    description:
      "Un outil, deux espaces : piloter mon association (papiers, subventions, comptabilité) ou piloter mon académie (Qualiopi, catalogue, apprenants). Gratuit.",
    alternates: { canonical: '/' },
  };
}

export default async function AccueilPilote() {
  // Connectée avec un espace ouvert : l'accueil, c'est le tableau de bord.
  if (await associationConnectee()) redirect('/espace');
  if ((await adresse()) === '/association') return <EspaceAssociation />;
  return <Plateforme />;
}

/* ================================================================ plateforme */

/**
 * LA PAGE D'ACCUEIL DE PILOTE.
 *
 * Peu de mots, beaucoup de couleur : on montre les espaces plutôt que de les
 * décrire. Chaque porte a sa teinte — indigo pour l'association, vert pour
 * l'académie, jaune pour la personne — et mène directement à la création du
 * compte correspondant.
 *
 * Tout bouge en CSS pur, sans une ligne de JavaScript, et tout s'arrête si la
 * personne a demandé moins d'animations.
 */
function Plateforme() {
  return (
    <>
      <style>{ANIMATIONS}</style>

      {/* ------------------------------------------------------------- hero */}
      <section className="pilote-hero relative overflow-hidden rounded-[28px] px-6 py-14 text-center sm:px-10 sm:py-20">
        <span className="pilote-bulle pilote-bulle-1" aria-hidden="true" />
        <span className="pilote-bulle pilote-bulle-2" aria-hidden="true" />
        <span className="pilote-bulle pilote-bulle-3" aria-hidden="true" />

        <p className="relative mb-4 text-sm font-extrabold uppercase tracking-[0.18em] text-white/70">Gratuit · par Toulali</p>
        <h1 className="relative text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-white [text-wrap:balance] sm:text-[4.2rem]">
          Un outil.
          <br />
          Deux <span className="pilote-brille">manières</span> de{' '}
          <em
            className="not-italic"
            style={{ fontFamily: 'var(--font-pilote-serif), Georgia, serif', fontStyle: 'italic', fontWeight: 600 }}
          >
            piloter
          </em>
          .
        </h1>
        <p className="relative mx-auto mt-5 max-w-[34ch] text-lg text-white/85 sm:text-xl">
          Ton association. Ton organisme de formation. Choisis ta porte.
        </p>
        <span className="pilote-fleche relative mx-auto mt-8 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/40 text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </span>
      </section>

      {/* ---------------------------------------------------------- les portes */}
      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {PORTES.map((p, n) => (
          <Link key={p.href} href={p.href} className={`pilote-porte group relative block overflow-hidden rounded-[24px] p-7 no-underline sm:p-9 ${p.fond}`}>
            <span className={`pilote-halo ${p.halo}`} aria-hidden="true" />
            <span className={`pilote-icone relative flex h-16 w-16 items-center justify-center rounded-2xl ${p.pastille} text-white`} style={{ animationDelay: `${n * 0.4}s` }} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={p.icone} />
              </svg>
            </span>
            <span className={`relative mt-6 block text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl ${p.titreCouleur}`}>{p.titre}</span>
            <span className={`relative mt-3 block text-lg leading-snug ${p.texte}`}>{p.phrase}</span>

            <span className="relative mt-6 flex flex-wrap gap-2">
              {p.mots.map((m) => (
                <span key={m} className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${p.pilule}`}>
                  {m}
                </span>
              ))}
            </span>

            <span className={`relative mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-extrabold text-white ${p.bouton}`}>
              {p.action}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </span>
          </Link>
        ))}
      </section>

      {/* -------------------------------------------- la troisième porte, plus petite */}
      <section className="mt-5">
        <Link
          href="/inscription?type=particulier"
          className="pilote-porte group flex flex-wrap items-center gap-5 rounded-[24px] border-2 border-[#F5D6A8] bg-[#FEF3E2] p-6 no-underline sm:p-7"
        >
          <span className="pilote-icone flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F5B400] text-white" style={{ animationDelay: '0.8s' }} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </svg>
          </span>
          {/* ⚠ SUR TÉLÉPHONE, CETTE CARTE SE CASSAIT EN UN MOT PAR LIGNE.
              Le texte était `flex-1 min-w-0` et le bouton `shrink-0` : dans un
              conteneur étroit, le texte se réduisait jusqu'à la largeur d'un
              mot au lieu de passer à la ligne, et le bouton se posait par-dessus.
              On lui donne une largeur de base : la somme « texte + bouton »
              dépasse alors la ligne, et `flex-wrap` fait ce pour quoi il est là. */}
          <span className="min-w-0 flex-1 basis-[15rem]">
            <span className="block text-2xl font-extrabold leading-tight text-[#7C3E06]">Pas encore de structure ?</span>
            <span className="mt-1 block text-[#7C3E06]/85">Ouvre un espace particulier. Tu suivras le chemin, et tu créeras ta structure en route.</span>
          </span>
          <span className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#7C3E06] px-5 py-3 text-base font-extrabold text-white sm:w-auto">
            Créer mon espace
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
          </span>
        </Link>
      </section>

      {/* ------------------------------------------------- le bandeau qui défile */}
      <section className="mt-10 overflow-hidden rounded-[24px] border border-[#E6E4F3] bg-white py-6">
        <p className="mb-4 px-6 text-sm font-extrabold uppercase tracking-[0.16em] text-[#6B6A8A]">Ce qu&apos;il y a dedans</p>
        <div className="pilote-piste flex w-max gap-3">
          {[...DEDANS, ...DEDANS].map((d, n) => (
            <span
              key={`${d.mot}-${n}`}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-bold ${d.style}`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={d.icone} />
              </svg>
              {d.mot}
            </span>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- soutenir le projet */}
      <section className="pilote-porteur relative mt-8 overflow-hidden rounded-[28px] border-2 border-[#F3B0C2] p-7 sm:p-10">
        <span className="pilote-lueur pilote-lueur-a" aria-hidden="true" />
        <span className="pilote-lueur pilote-lueur-b" aria-hidden="true" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#8A1B3D]">Qui porte cet outil</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-[1.1] tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">
              Cet outil est gratuit. Il a un <Accent>porteur</Accent>.
            </h2>
            <p className="mt-3 max-w-[58ch] text-lg leading-relaxed text-[#3B3A66]">
              <span className="font-bold text-[#1D1B5C]">ADéPA</span>, association éducative de Melun, porte ce dispositif
              avec <span className="font-bold text-[#1D1B5C]">Toulali</span>, son centre de formation. Pas d&apos;actionnaire,
              pas d&apos;abonnement : ce que tu construis ici t&apos;appartient.
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {SOUTIENS.map((s, i) => (
                <li
                  key={s.titre}
                  className="rounded-2xl border border-[#F3B0C2] bg-white/85 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[#D6335C]"
                >
                  <span
                    className="pilote-icone flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDE7EC] text-[#C42B57]"
                    style={{ animationDelay: `${0.3 * i}s` }}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.icone} />
                    </svg>
                  </span>
                  <span className="mt-2.5 block text-[15px] font-extrabold leading-snug text-[#1D1B5C]">{s.titre}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-[#3B3A66]">{s.detail}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="https://adepa77.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#C42B57] px-6 py-3.5 text-base font-extrabold text-white no-underline shadow-[0_10px_28px_-12px_rgba(196,43,87,0.9)] transition hover:bg-[#8A1B3D]"
              >
                Soutenir ADéPA
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href="https://toulali.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#D6335C] bg-white/80 px-5 py-3 text-base font-extrabold text-[#8A1B3D] no-underline transition hover:bg-white"
              >
                Découvrir Toulali
              </a>
            </div>
          </div>

          <TroisPorteurs />
        </div>
      </section>

      {/* ----------------------------------------------------------- la fin */}
      <section className="mt-10 rounded-[24px] border-2 border-[#F3B0C2] bg-[#FDE7EC] p-7 text-center sm:p-10">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-[#8A1B3D] [text-wrap:balance] sm:text-3xl">
          Un seul compte porte <Accent>les deux</Accent>.
        </h2>
        <p className="mx-auto mt-3 max-w-[46ch] text-[#8A1B3D]/85">
          Une association et son organisme de formation, deux antennes, deux marques : chacun son espace, rien ne se mélange.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/chemin" className="rounded-xl bg-[#D6335C] px-6 py-3.5 text-base font-extrabold text-white no-underline transition hover:bg-[#BC2A4E]">
            Voir le chemin
          </Link>
          <Link href="/connexion" className="rounded-xl border-2 border-[#D6335C] px-6 py-3 text-base font-extrabold text-[#8A1B3D] no-underline transition hover:bg-white">
            J&apos;ai déjà un espace
          </Link>
        </div>
      </section>
    </>
  );
}

/* ========================================================= espace association */

/**
 * `/association` — L'ESPACE ASSOCIATION SE PRÉSENTE.
 *
 * Même rôle que `/academie` pour l'académie : on dit ce que l'espace fait, on
 * ouvre le chemin, et on laisse partir vers la création du compte. Pas de
 * grande animation ici : c'est une page de travail, pas une vitrine.
 */
function EspaceAssociation() {
  return (
    <>
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#6B6A8A]">Par Toulali, centre de formation</p>
      <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-5xl">
        Piloter mon <Accent>association</Accent>
      </h1>
      <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-[#3B3A66]">
        Déclarer ton association, réunir ses papiers, demander tes premières subventions et tenir tes comptes. Le chemin est
        balisé, les pièces sont listées, et l&apos;espace garde tout au même endroit.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/association/inscription?type=association" className={BTN_PRIMAIRE}>
          Ouvrir mon espace, gratuit
        </Link>
        <Link href="/association/chemin" className={BTN_SECONDAIRE}>
          Voir le chemin
        </Link>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {POURQUOI.map((c) => (
          <div key={c.titre} className={`${CARTE_VIVE} p-6`}>
            <h2 className="text-lg font-extrabold leading-snug text-[#1D1B5C]">{c.titre}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#3B3A66]">{c.texte}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border-2 border-[#C7C4F2] bg-[#ECEBFC] p-6 sm:p-7">
        <h2 className="text-xl font-extrabold tracking-tight text-[#1D1B5C]">Tu portes aussi un organisme de formation ?</h2>
        <p className="mt-2 max-w-[62ch] leading-relaxed text-[#3B3A66]">
          L&apos;espace académie tient la déclaration d&apos;activité, les trente-deux indicateurs Qualiopi et le catalogue. Un même
          compte peut porter les deux : ce sont deux espaces, rien ne se mélange.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/academie"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E9E6A] px-5 py-3 text-base font-extrabold text-white no-underline transition hover:bg-[#17845A]"
          >
            Voir l&apos;espace académie
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/chemin"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C7C4F2] bg-white px-5 py-[10px] text-base font-extrabold text-[#4338CA] no-underline transition hover:border-[#4F46E5]"
          >
            Comparer les deux chemins
          </Link>
        </div>
      </div>
    </>
  );
}

const POURQUOI = [
  {
    titre: 'Le chemin, pas la paperasse',
    texte:
      "Douze étapes dans l'ordre où elles se posent vraiment : naître, vivre, demander. Chaque étape dit ce qu'il te faut, ce que ça coûte, et à quoi tu sais que c'est fini.",
  },
  {
    titre: 'Le classeur qui prévient',
    texte:
      "Statuts, PV, récépissés, comptes annuels : tout se dépose une fois. L'espace sait ce qui manque et ce qui va bientôt manquer.",
  },
  {
    titre: 'Les subventions, sans repartir de zéro',
    texte:
      "Ce que tu as déjà écrit sur l'association et sur tes projets remplit le dossier. Tu écris ce qui change, pas ce que tu as déjà dit.",
  },
];

/* ------------------------------------------------------------------ données */

const PORTES = [
  {
    href: '/association',
    titre: 'Mon association',
    phrase: 'Ses papiers, ses subventions, ses comptes.',
    action: 'Ouvrir mon espace association',
    icone: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01M9 14h.01M15 14h.01',
    fond: 'border-2 border-[#C7C4F2] bg-[#ECEBFC]',
    halo: 'bg-[#4F46E5]',
    pastille: 'bg-[#4F46E5]',
    titreCouleur: 'text-[#1D1B5C]',
    texte: 'text-[#3B3A66]',
    pilule: 'bg-white text-[#4338CA]',
    bouton: 'bg-[#4F46E5] group-hover:bg-[#4338CA]',
    mots: ['Le chemin en 12 étapes', 'Classeur', 'Subventions', 'Comptabilité', 'Agréments'],
  },
  {
    href: '/academie',
    titre: 'Mon académie',
    phrase: 'Sa certification, son catalogue, ses apprenants.',
    action: 'Ouvrir mon espace académie',
    icone: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
    fond: 'border-2 border-[#B7E4CE] bg-[#E3F5EC]',
    halo: 'bg-[#1E9E6A]',
    pastille: 'bg-[#1E9E6A]',
    titreCouleur: 'text-[#12312A]',
    texte: 'text-[#334A42]',
    pilule: 'bg-white text-[#0F5F3E]',
    bouton: 'bg-[#1E9E6A] group-hover:bg-[#17845A]',
    mots: ['Qualiopi', 'Déclaration d’activité', 'Sessions', 'Cours en ligne', 'Émargements'],
  },
];

const DEDANS = [
  { mot: 'Classeur qui prévient', icone: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', style: 'bg-[#ECEBFC] text-[#4338CA]' },
  { mot: 'Dossiers de subvention', icone: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15h6M9 11h2', style: 'bg-[#FDE7EC] text-[#8A1B3D]' },
  { mot: '32 indicateurs Qualiopi', icone: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.8L7 22l5-3 5 3-1.2-8.2', style: 'bg-[#E3F5EC] text-[#0F5F3E]' },
  { mot: 'Cahier de comptes', icone: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', style: 'bg-[#FEF3E2] text-[#7C3E06]' },
  { mot: 'Documents à fabriquer', icone: 'M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zM15 3v4h4M9 13h6M9 17h6', style: 'bg-[#ECEBFC] text-[#4338CA]' },
  { mot: 'Cours vidéo', icone: 'M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', style: 'bg-[#E3F5EC] text-[#0F5F3E]' },
  { mot: 'Ce qui presse ce lundi', icone: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', style: 'bg-[#FDE7EC] text-[#8A1B3D]' },
  { mot: 'Ce à quoi tu as droit', icone: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z', style: 'bg-[#FEF3E2] text-[#7C3E06]' },
];

/* ------------------------------------------------------- ceux qui portent */

const SOUTIENS = [
  {
    titre: 'Gratuit, et sans compteur',
    detail: "Pas d'abonnement, pas de limite de dossiers, pas de version payante qui arriverait plus tard.",
    icone: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  },
  {
    titre: 'Porté par une association',
    detail: "ADéPA est une association loi 1901, comme celles qui se servent de l'outil.",
    icone: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  },
  {
    titre: 'Un don, un reçu fiscal',
    detail: "66 % du montant se déduit de tes impôts. C'est ce qui paie les serveurs et le temps passé.",
    icone: 'M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zM15 3v4h4M9 13h6M9 17h4',
  },
];

/**
 * TROIS PERSONNAGES, DESSINÉS ICI.
 *
 * Une illustration originale, faite de formes simples aux couleurs des deux
 * espaces : celle qui pilote son association (indigo), celle qui forme (vert),
 * et celle qui donne un coup de main (rouge rosé). Elles se passent le cœur du
 * dispositif — c'est exactement ce que fait une association.
 *
 * Tout est en SVG : rien à charger, net sur tous les écrans, et les
 * animations s'arrêtent d'elles-mêmes si le système demande moins de
 * mouvement.
 */
function TroisPorteurs() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <svg viewBox="0 0 320 260" width="100%" role="img" aria-label="Trois personnes qui portent ensemble un même projet">
        <defs>
          <linearGradient id="porteurs-sol" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4F46E5" stopOpacity="0.18" />
            <stop offset="0.5" stopColor="#1E9E6A" stopOpacity="0.18" />
            <stop offset="1" stopColor="#C42B57" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {/* le sol commun : elles tiennent sur la même base */}
        <rect x="24" y="212" width="272" height="12" rx="6" fill="url(#porteurs-sol)" />

        {/* étincelles */}
        <g fill="#F5B400">
          <circle className="pilote-etincelle" cx="52" cy="52" r="4" />
          <circle className="pilote-etincelle" cx="268" cy="74" r="5" style={{ animationDelay: '0.9s' }} />
          <circle className="pilote-etincelle" cx="238" cy="34" r="3" style={{ animationDelay: '1.8s' }} />
        </g>

        {/* personnage 1 — l'association */}
        <g className="pilote-perso" style={{ animationDelay: '0s' }}>
          <path d="M46 212v-44a30 30 0 0 1 60 0v44z" fill="#4F46E5" />
          <path d="M56 212v-30a20 20 0 0 1 40 0v30z" fill="#6C63F0" />
          <circle cx="76" cy="124" r="22" fill="#1D1B5C" />
          <circle cx="76" cy="124" r="22" fill="#4F46E5" opacity="0.25" />
          <path d="M60 118a16 16 0 0 1 32 0" fill="#1D1B5C" />
          <rect x="30" y="168" width="16" height="34" rx="8" fill="#4F46E5" />
        </g>

        {/* personnage 2 — l'académie, au centre, un peu plus haut */}
        <g className="pilote-perso" style={{ animationDelay: '0.55s' }}>
          <path d="M126 212v-52a34 34 0 0 1 68 0v52z" fill="#1E9E6A" />
          <path d="M138 212v-36a22 22 0 0 1 44 0v36z" fill="#3EB884" />
          <circle cx="160" cy="106" r="25" fill="#0F5F3E" />
          <circle cx="160" cy="106" r="25" fill="#1E9E6A" opacity="0.25" />
          <path d="M136 96l24-13 24 13-24 12z" fill="#0F5F3E" />
          <path d="M176 104v10c0 4-7 7-16 7s-16-3-16-7v-10" fill="none" stroke="#0F5F3E" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* personnage 3 — celle qui donne un coup de main */}
        <g className="pilote-perso" style={{ animationDelay: '1.1s' }}>
          <path d="M214 212v-44a30 30 0 0 1 60 0v44z" fill="#C42B57" />
          <path d="M224 212v-30a20 20 0 0 1 40 0v30z" fill="#D6335C" />
          <circle cx="244" cy="124" r="22" fill="#8A1B3D" />
          <circle cx="244" cy="124" r="22" fill="#C42B57" opacity="0.25" />
          <path d="M228 118a16 16 0 0 1 32 0" fill="#8A1B3D" />
          <rect x="274" y="168" width="16" height="34" rx="8" fill="#C42B57" />
        </g>

        {/* le cœur qu'elles se passent */}
        <g className="pilote-coeur">
          <circle cx="160" cy="46" r="30" fill="#FFFFFF" stroke="#F3B0C2" strokeWidth="3" />
          <path
            d="M160 62s-13-8.2-17.3-15.6A9.9 9.9 0 0 1 160 39.6a9.9 9.9 0 0 1 17.3 6.8C173 53.8 160 62 160 62z"
            fill="#C42B57"
          />
        </g>

        {/* les liens entre les trois */}
        <g stroke="#C42B57" strokeWidth="3" strokeLinecap="round" opacity="0.45" fill="none">
          <path className="pilote-lien" d="M100 142q30-46 42-62" />
          <path className="pilote-lien" d="M220 142q-30-46-42-62" style={{ animationDelay: '0.8s' }} />
        </g>
      </svg>
    </div>
  );
}

/* --------------------------------------------------------------- animations */

const ANIMATIONS = `
.pilote-hero {
  background: linear-gradient(118deg, #1D1B5C 0%, #4F46E5 38%, #1E9E6A 72%, #C42B57 100%);
  background-size: 260% 260%;
  animation: pilote-degrade 22s ease-in-out infinite;
}
@keyframes pilote-degrade {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
.pilote-bulle {
  position: absolute; border-radius: 9999px; filter: blur(40px); opacity: .38; pointer-events: none;
}
.pilote-bulle-1 { width: 260px; height: 260px; background: #F5B400; top: -80px; left: -60px; animation: pilote-flotte 15s ease-in-out infinite; }
.pilote-bulle-2 { width: 300px; height: 300px; background: #1E9E6A; bottom: -120px; right: -70px; animation: pilote-flotte 19s ease-in-out infinite reverse; }
.pilote-bulle-3 { width: 200px; height: 200px; background: #C42B57; top: 40%; right: 22%; animation: pilote-flotte 13s ease-in-out infinite; }
@keyframes pilote-flotte {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  33%      { transform: translate3d(28px, -22px, 0) scale(1.12); }
  66%      { transform: translate3d(-20px, 18px, 0) scale(.94); }
}
.pilote-brille {
  background: linear-gradient(92deg, #FFFFFF 0%, #F5B400 46%, #FFFFFF 100%);
  background-size: 220% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: pilote-balaye 5.5s linear infinite;
}
@keyframes pilote-balaye {
  0%   { background-position: 220% 0; }
  100% { background-position: -60% 0; }
}
.pilote-fleche { animation: pilote-rebond 2.4s ease-in-out infinite; }
@keyframes pilote-rebond {
  0%, 100% { transform: translateY(0); opacity: .65; }
  50%      { transform: translateY(9px); opacity: 1; }
}
.pilote-porte { transition: transform .35s ease, box-shadow .35s ease; }
.pilote-porte:hover { transform: translateY(-6px); box-shadow: 0 26px 48px -26px rgba(29, 27, 92, .55); }
.pilote-halo {
  position: absolute; inset: auto -60px -80px auto; width: 240px; height: 240px;
  border-radius: 9999px; filter: blur(52px); opacity: .22; transition: opacity .35s ease, transform .35s ease;
  pointer-events: none;
}
.pilote-porte:hover .pilote-halo { opacity: .38; transform: scale(1.18); }
.pilote-icone { animation: pilote-respire 4.5s ease-in-out infinite; transition: transform .35s ease; }
.pilote-porte:hover .pilote-icone { transform: rotate(-8deg) scale(1.1); }
@keyframes pilote-respire {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-7px) rotate(4deg); }
}
.pilote-piste { animation: pilote-defile 34s linear infinite; }
.pilote-piste:hover { animation-play-state: paused; }
@keyframes pilote-defile {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.pilote-porteur {
  background:
    radial-gradient(120% 120% at 12% 0%, #FFFFFF 0%, #FDE7EC 55%, #FBD9E3 100%);
}
.pilote-lueur { position: absolute; border-radius: 9999px; filter: blur(52px); opacity: .30; pointer-events: none; }
.pilote-lueur-a { width: 240px; height: 240px; background: #C42B57; top: -90px; right: 18%; animation: pilote-flotte 17s ease-in-out infinite; }
.pilote-lueur-b { width: 200px; height: 200px; background: #4F46E5; bottom: -110px; left: -40px; animation: pilote-flotte 21s ease-in-out infinite reverse; }
.pilote-perso { animation: pilote-porte-haut 5.5s ease-in-out infinite; transform-origin: 50% 100%; }
@keyframes pilote-porte-haut {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-9px); }
}
.pilote-coeur { animation: pilote-bat 2.6s ease-in-out infinite; transform-origin: 160px 46px; }
@keyframes pilote-bat {
  0%, 100% { transform: scale(1) translateY(0); }
  18%      { transform: scale(1.10) translateY(-3px); }
  36%      { transform: scale(1) translateY(0); }
  54%      { transform: scale(1.06) translateY(-2px); }
}
.pilote-etincelle { animation: pilote-scintille 3.2s ease-in-out infinite; transform-origin: center; }
@keyframes pilote-scintille {
  0%, 100% { opacity: .25; transform: scale(.7); }
  50%      { opacity: 1;   transform: scale(1.25); }
}
.pilote-lien { stroke-dasharray: 6 10; animation: pilote-file 3.4s linear infinite; }
@keyframes pilote-file {
  0%   { stroke-dashoffset: 32; }
  100% { stroke-dashoffset: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .pilote-hero, .pilote-bulle, .pilote-brille, .pilote-fleche, .pilote-icone, .pilote-piste,
  .pilote-lueur, .pilote-perso, .pilote-coeur, .pilote-etincelle, .pilote-lien { animation: none !important; }
  .pilote-brille { color: #F5B400; -webkit-text-fill-color: #F5B400; }
  .pilote-porte:hover { transform: none; }
}
`;
