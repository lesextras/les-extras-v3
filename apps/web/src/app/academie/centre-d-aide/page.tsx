import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent } from '../_ui';

export const metadata: Metadata = {
  title: "Centre d'aide",
  description: "Les réponses courtes aux questions qu'on nous pose le plus souvent, et une porte pour nous écrire.",
  alternates: { canonical: '/academie/centre-d-aide' },
};

/**
 * `/centre-d-aide` — L'AIDE, EN COURT.
 *
 * Des réponses de trois lignes, pas des pages. Chaque famille de questions a
 * sa couleur et son icône : on repère d'un coup d'œil où chercher. Écrire à
 * quelqu'un reste possible en bas, quand la situation sort du cadre.
 */
export default function CentreAide() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ANIMATIONS }} />

      {/* ---------------------------------------------------------------- l'entrée */}
      <section className="aide-hero relative overflow-hidden rounded-[28px] border-2 border-[#B7E4CE] p-7 sm:p-10">
        <span className="aide-lueur aide-lueur-a" aria-hidden="true" />
        <span className="aide-lueur aide-lueur-b" aria-hidden="true" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#5E7A6E]">Aide</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#12312A] [text-wrap:balance] sm:text-5xl">
              On répond <Accent>en court</Accent>.
            </h1>
            <p className="mt-3 max-w-[46ch] text-lg leading-relaxed text-[#334A42]">
              Les questions qu&apos;on nous pose vraiment. Si la tienne n&apos;y est pas, une personne te répond.
            </p>
          </div>
          <SceneAide />
        </div>
      </section>

      {/* ------------------------------------------------------------ les raccourcis */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {RACCOURCIS.map((r) => (
          <Link key={r.href} href={r.href} className={`aide-carte rounded-2xl border-2 p-5 no-underline ${r.fond}`}>
            <span className={`aide-icone flex h-12 w-12 items-center justify-center rounded-2xl text-white ${r.pastille}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={r.icone} />
              </svg>
            </span>
            <span className={`mt-3 block text-[18px] font-extrabold ${r.encre}`}>{r.titre}</span>
            <span className={`mt-0.5 block text-[14px] ${r.texte}`}>{r.detail}</span>
          </Link>
        ))}
      </div>

      {/* -------------------------------------------------------------- les réponses */}
      {SECTIONS.map((s) => (
        <section key={s.titre} className={`mt-6 rounded-[24px] border-2 p-6 sm:p-7 ${s.fond}`}>
          <div className="flex items-center gap-3">
            <span className={`aide-icone flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${s.pastille}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icone} />
              </svg>
            </span>
            <h2 className={`text-2xl font-extrabold tracking-tight ${s.encre}`}>{s.titre}</h2>
          </div>

          <div className="mt-4 space-y-2.5">
            {s.questions.map((q) => (
              <details key={q.q} className="group rounded-2xl border border-white/70 bg-white/85 p-4 backdrop-blur open:bg-white">
                <summary className={`flex cursor-pointer list-none items-center gap-2 text-[16px] font-extrabold marker:hidden ${s.encre}`}>
                  <span className={`aide-plus flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${s.pastille}`} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  {q.q}
                </summary>
                <p className={`mt-2 pl-8 text-[15px] leading-relaxed ${s.texte}`}>{q.r}</p>
                {q.lien ? (
                  <Link href={q.lien.href} className={`mt-2 ml-8 inline-block text-[14px] font-extrabold underline underline-offset-4 ${s.encre}`}>
                    {q.lien.libelle} →
                  </Link>
                ) : null}
              </details>
            ))}
          </div>
        </section>
      ))}

      {/* ------------------------------------------------------------------- écrire */}
      <section className="aide-contact relative mt-6 overflow-hidden rounded-[24px] border-2 border-[#F3B0C2] p-7 text-center sm:p-9">
        <span className="aide-lueur aide-lueur-c" aria-hidden="true" />
        <div className="relative">
          <span className="aide-battement mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C42B57] text-white" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
            </svg>
          </span>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-[#8A1B3D] sm:text-3xl">
            Ta question n&apos;est pas là ?
          </h2>
          <p className="mx-auto mt-2 max-w-[42ch] leading-relaxed text-[#8A1B3D]/85">
            Écris-nous en trois lignes. C&apos;est une personne qui répond.
          </p>
          <Link
            href="/academie/nous-contacter"
            className="mt-5 inline-flex rounded-xl bg-[#C42B57] px-6 py-3.5 text-base font-extrabold text-white no-underline transition hover:bg-[#8A1B3D]"
          >
            Nous écrire
          </Link>
        </div>
      </section>
    </>
  );
}

/* ========================================================================== */

/**
 * TROIS PERSONNES ET UNE QUESTION. Un dessin original : quelqu'un lève la
 * main, deux autres arrivent. Rien de figuratif à décoder — juste l'idée
 * qu'on n'est pas seul devant la paperasse.
 */
function SceneAide() {
  return (
    <svg viewBox="0 0 300 240" className="mx-auto h-auto w-full max-w-[300px]" role="img" aria-label="Trois personnes qui répondent à une question">
      <defs>
        <linearGradient id="aide-sol" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0" />
          <stop offset="50%" stopColor="#4F46E5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#C42B57" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* la bulle de question, qui respire */}
      <g className="aide-bulle">
        <rect x="112" y="12" width="76" height="56" rx="18" fill="#F5B400" />
        <path d="M140 68l10 16 10-16z" fill="#F5B400" />
        <path
          d="M139 34a11 11 0 0 1 21 4c0 7-11 8-11 13"
          fill="none"
          stroke="#1D1B5C"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="149" cy="58" r="3.4" fill="#1D1B5C" />
      </g>

      {/* trois étincelles */}
      <circle className="aide-etincelle" cx="72" cy="46" r="4" fill="#4F46E5" />
      <circle className="aide-etincelle" style={{ animationDelay: '0.9s' }} cx="232" cy="36" r="5" fill="#C42B57" />
      <circle className="aide-etincelle" style={{ animationDelay: '1.7s' }} cx="252" cy="92" r="3.5" fill="#1E9E6A" />

      {/* les trois personnes */}
      <g className="aide-perso">
        <circle cx="70" cy="128" r="17" fill="#4F46E5" />
        <path d="M46 200v-18a24 24 0 0 1 48 0v18z" fill="#1D1B5C" />
        <path d="M92 154l22-22" stroke="#4F46E5" strokeWidth="9" strokeLinecap="round" />
      </g>
      <g className="aide-perso" style={{ animationDelay: '0.6s' }}>
        <circle cx="150" cy="140" r="19" fill="#1E9E6A" />
        <path d="M124 202v-16a26 26 0 0 1 52 0v16z" fill="#0F5F3E" />
      </g>
      <g className="aide-perso" style={{ animationDelay: '1.2s' }}>
        <circle cx="230" cy="130" r="17" fill="#C42B57" />
        <path d="M206 200v-16a24 24 0 0 1 48 0v16z" fill="#8A1B3D" />
      </g>

      <rect x="20" y="202" width="260" height="7" rx="3.5" fill="url(#aide-sol)" />
    </svg>
  );
}

const ANIMATIONS = `
.aide-hero { background: radial-gradient(120% 130% at 10% 0%, #FFFFFF 0%, #E3F5EC 55%, #CDEBDC 100%); }
.aide-contact { background: radial-gradient(120% 130% at 90% 0%, #FFFFFF 0%, #FDE7EC 60%, #F9CFDB 100%); }
.aide-lueur { position:absolute; border-radius:9999px; filter:blur(50px); opacity:.28; pointer-events:none; }
.aide-lueur-a { width:220px; height:220px; background:#1E9E6A; top:-80px; right:14%; animation: aide-flotte 18s ease-in-out infinite; }
.aide-lueur-b { width:180px; height:180px; background:#C42B57; bottom:-90px; left:-30px; animation: aide-flotte 23s ease-in-out infinite reverse; }
.aide-lueur-c { width:200px; height:200px; background:#C42B57; top:-90px; left:8%; animation: aide-flotte 20s ease-in-out infinite; }
@keyframes aide-flotte { 0%,100%{transform:translate3d(0,0,0)} 50%{transform:translate3d(18px,22px,0)} }
.aide-carte { transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease; }
.aide-carte:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(29,27,92,0.12); }
.aide-icone { animation: aide-respire 4.5s ease-in-out infinite; }
@keyframes aide-respire { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-4px) rotate(-3deg)} }
.aide-perso { animation: aide-monte 5.5s ease-in-out infinite; transform-origin: 50% 100%; }
@keyframes aide-monte { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.aide-bulle { animation: aide-bulle-monte 4s ease-in-out infinite; transform-origin: 50% 100%; }
@keyframes aide-bulle-monte { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-6px) scale(1.04)} }
.aide-etincelle { animation: aide-scintille 3.2s ease-in-out infinite; transform-origin: center; }
@keyframes aide-scintille { 0%,100%{opacity:.25; transform:scale(.7)} 50%{opacity:1; transform:scale(1.25)} }
.aide-battement { animation: aide-bat 3s ease-in-out infinite; }
@keyframes aide-bat { 0%,100%{transform:scale(1)} 20%{transform:scale(1.08)} 40%{transform:scale(1)} }
details[open] .aide-plus svg { transform: rotate(45deg); }
.aide-plus svg { transition: transform .25s ease; }
@media (prefers-reduced-motion: reduce) {
  .aide-lueur, .aide-icone, .aide-perso, .aide-bulle, .aide-etincelle, .aide-battement, .aide-carte, .aide-plus svg {
    animation: none !important; transition: none !important;
  }
}
`;

const RACCOURCIS = [
  {
    href: '/academie/chemin',
    titre: 'Le chemin',
    detail: "Les douze étapes de l'organisme.",
    icone: 'M4 20V9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v0M4 20h16M8 4v4M16 16v4M12 10v10',
    fond: 'border-[#C7C4F2] bg-gradient-to-br from-white to-[#ECEBFC]',
    pastille: 'bg-[#4F46E5]',
    encre: 'text-[#1D1B5C]',
    texte: 'text-[#3B3A66]',
  },
  {
    href: '/academie/inscription',
    titre: 'Ouvrir un espace',
    detail: 'Académie, association ou particulier.',
    icone: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
    fond: 'border-[#B7E4CE] bg-gradient-to-br from-white to-[#E3F5EC]',
    pastille: 'bg-[#1E9E6A]',
    encre: 'text-[#12312A]',
    texte: 'text-[#334A42]',
  },
  {
    href: '/academie/nous-contacter',
    titre: 'Nous écrire',
    detail: 'Une personne répond.',
    icone: 'M4 6h16v12H4zM4 7l8 6 8-6',
    fond: 'border-[#F3B0C2] bg-gradient-to-br from-white to-[#FDE7EC]',
    pastille: 'bg-[#C42B57]',
    encre: 'text-[#8A1B3D]',
    texte: 'text-[#8A1B3D]/80',
  },
];

const SECTIONS = [
  {
    titre: 'Commencer',
    icone: 'M12 2l2.6 6.6L21 10l-5 4.4L17.2 21 12 17.6 6.8 21 8 14.4 3 10l6.4-1.4z',
    fond: 'border-[#C7C4F2] bg-gradient-to-br from-[#F5F4FC] to-[#DEDCFA]',
    pastille: 'bg-[#4F46E5]',
    encre: 'text-[#1D1B5C]',
    texte: 'text-[#3B3A66]',
    questions: [
      {
        q: 'Par où je commence ?',
        r: 'Par le chemin : les douze étapes dans l’ordre, avec ce qu’il faut pour chacune.',
        lien: { libelle: 'Voir le chemin', href: '/academie/chemin' },
      },
      {
        q: 'Je n’ai pas encore d’organisme',
        r: 'Ouvre un espace : tu suis le chemin et tu déclares l’activité en route.',
        lien: { libelle: 'Ouvrir un espace', href: '/academie/inscription' },
      },
      {
        q: 'Association ou académie ?',
        r: 'L’association est une forme juridique ; l’organisme de formation, une déclaration à la DREETS. On peut être les deux.',
        lien: { libelle: 'Comparer', href: '/chemin' },
      },
      {
        q: 'Qualiopi, à quel moment ?',
        r: 'Après la déclaration d’activité, jamais avant. Sept critères, un certificateur accrédité, un audit.',
        lien: { libelle: "Le chemin de l'académie", href: '/academie/chemin' },
      },
      {
        q: 'Le NDA, comment ?',
        r: 'À demander à la DREETS dans les trois mois qui suivent la première convention. Ce n’est pas un agrément.',
        lien: { libelle: "Le chemin de l'académie", href: '/academie/chemin' },
      },
    ],
  },
  {
    titre: "L'outil",
    icone: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 13.6H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9.4A1.7 1.7 0 0 0 10.4 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1A2 2 0 1 1 20.2 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1z',
    fond: 'border-[#B7E4CE] bg-gradient-to-br from-[#F2F7F5] to-[#D6EDE1]',
    pastille: 'bg-[#1E9E6A]',
    encre: 'text-[#12312A]',
    texte: 'text-[#334A42]',
    questions: [
      {
        q: 'C’est vraiment gratuit ?',
        r: 'Oui. Pas d’essai limité, pas de carte bancaire. Porté par ADéPA avec Toulali ; un don est possible, jamais demandé.',
      },
      {
        q: 'Faut-il installer quelque chose ?',
        r: 'Non. Sur téléphone, tu peux l’ajouter à l’écran d’accueil : il s’ouvre alors comme une application.',
      },
      {
        q: 'Je ne trouve pas ma structure',
        r: 'La recherche lit les répertoires publics. Trop récente ? Tape le nom à la main, tu compléteras plus tard.',
      },
    ],
  },
  {
    titre: 'Mes pièces',
    icone: 'M12 3l8 4v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V7z',
    fond: 'border-[#F5D6A8] bg-gradient-to-br from-[#FEF3E2] to-[#FBE3BE]',
    pastille: 'bg-[#F5B400]',
    encre: 'text-[#7C3E06]',
    texte: 'text-[#7C3E06]/85',
    questions: [
      {
        q: 'Que deviennent mes documents ?',
        r: 'Ils restent dans ton espace, ne servent à rien d’autre, ne sont jamais revendus. Tu peux les retirer.',
      },
      {
        q: 'Travailler à plusieurs ?',
        r: 'Oui : tu invites le bureau et tu choisis ce que chacun voit. Chacun garde son compte.',
        lien: { libelle: 'Droits d’accès', href: '/academie/droits-acces' },
      },
      {
        q: 'Supprimer mon compte ?',
        r: 'Écris-nous depuis l’adresse du compte : on confirme ce qui sera effacé, puis on procède.',
        lien: { libelle: 'Nous écrire', href: '/academie/nous-contacter' },
      },
    ],
  },
];
