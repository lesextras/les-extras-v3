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
          <span className="min-w-0 flex-1">
            <span className="block text-2xl font-extrabold leading-tight text-[#7C3E06]">Pas encore de structure ?</span>
            <span className="mt-1 block text-[#7C3E06]/85">Ouvre un espace particulier. Tu suivras le chemin, et tu créeras ta structure en route.</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#7C3E06] px-5 py-3 text-base font-extrabold text-white">
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
      <section className="mt-5 flex flex-wrap items-center gap-5 rounded-[24px] border-2 border-[#C7C4F2] bg-white p-6 sm:p-7">
        <span className="pilote-icone flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#C42B57] text-white" style={{ animationDelay: '1.2s' }} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-4.4-9.3-8.4A5.3 5.3 0 0 1 12 6.6a5.3 5.3 0 0 1 9.3 6C19 16.6 12 21 12 21z" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-2xl font-extrabold leading-tight text-[#1D1B5C]">Cet outil est gratuit. Il a un porteur.</span>
          <span className="mt-1 block text-[#3B3A66]">
            <span className="font-bold text-[#1D1B5C]">ADéPA</span>, association éducative de Melun, porte ce dispositif avec Toulali. Un don ouvre droit
            à un reçu fiscal.
          </span>
        </span>
        <a
          href="https://adepa77.fr/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#C42B57] px-5 py-3 text-base font-extrabold text-white no-underline transition hover:bg-[#8A1B3D]"
        >
          Soutenir ADéPA
          <span aria-hidden="true">↗</span>
        </a>
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
@media (prefers-reduced-motion: reduce) {
  .pilote-hero, .pilote-bulle, .pilote-brille, .pilote-fleche, .pilote-icone, .pilote-piste { animation: none !important; }
  .pilote-brille { color: #F5B400; -webkit-text-fill-color: #F5B400; }
  .pilote-porte:hover { transform: none; }
}
`;
