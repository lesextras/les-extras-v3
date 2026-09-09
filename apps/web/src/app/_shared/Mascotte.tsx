// LEX, LE PERSONNAGE DE LA MAISON.
//
// POURQUOI IL EXISTE. L'accueil était une page de mots : chaque section
// expliquait, et rien ne regardait le visiteur. Un personnage fait ce qu'aucun
// paragraphe ne fait — il donne un visage à un logiciel, et il occupe la place
// que le texte libère.
//
// POURQUOI UN DESSIN ET PAS UN GIF. Un GIF pèse cent kilo-octets, se pixellise
// dès qu'on l'agrandit, ne connaît pas le mode sombre et s'anime même chez qui
// a demandé moins d'animations. Celui-ci est du SVG : quelques kilo-octets,
// net à toutes les tailles, aux couleurs du site, et il s'arrête tout seul si
// le système le demande (voir `prefers-reduced-motion` dans globals.css).
//
// IL EST DÉCORATIF. `aria-hidden` : rien de ce qu'il montre n'est une
// information que le texte ne donne pas déjà. Un lecteur d'écran n'a pas à
// entendre « illustration d'un personnage qui salue ».

interface Props {
  className?: string;
  /** Ce que le personnage tient : un stylo (LEX écrit) ou rien. */
  stylo?: boolean;
}

export function Mascotte({ className = '', stylo = true }: Props) {
  return (
    <svg
      viewBox="0 0 200 220"
      className={`lex-perso ${className}`}
      role="presentation"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="lexCorps" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24507F" />
          <stop offset="100%" stopColor="#183767" />
        </linearGradient>
        <linearGradient id="lexVisiere" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0E2547" />
          <stop offset="100%" stopColor="#1B3E72" />
        </linearGradient>
      </defs>

      {/* L'ombre portée : elle respire avec le personnage, sinon il flotte
          au-dessus de rien. */}
      <ellipse className="lex-ombre" cx="100" cy="206" rx="46" ry="8" fill="#000" opacity="0.16" />

      <g className="lex-flotte">
        {/* Antenne, avec sa petite lumière qui bat. */}
        <line x1="100" y1="30" x2="100" y2="14" stroke="#183767" strokeWidth="5" strokeLinecap="round" />
        <circle className="lex-lueur" cx="100" cy="11" r="6" fill="#C91D42" />

        {/* Corps */}
        <rect x="52" y="118" width="96" height="74" rx="26" fill="url(#lexCorps)" />
        {/* Écharpe framboise : le seul accent chaud, comme sur le site. */}
        <path d="M62 132 h76 a8 8 0 0 1 0 16 h-76 a8 8 0 0 1 0-16 z" fill="#C91D42" />
        <path className="lex-echarpe" d="M132 148 q14 10 8 30 q-10 4 -16 -2 q6 -16 -2 -26 z" fill="#A91534" />

        {/* Tête */}
        <rect x="42" y="30" width="116" height="94" rx="30" fill="url(#lexCorps)" />
        {/* Visière : la surface où vivent les yeux. */}
        <rect x="56" y="48" width="88" height="56" rx="24" fill="url(#lexVisiere)" />

        {/* Yeux. Le clignement est un `scaleY` sur le groupe : deux paupières
            dessinées coûteraient deux formes de plus pour le même effet. */}
        <g className="lex-yeux">
          <circle cx="84" cy="74" r="8.5" fill="#F5FBFF" />
          <circle cx="116" cy="74" r="8.5" fill="#F5FBFF" />
          <circle cx="86" cy="76" r="3.6" fill="#0E2547" />
          <circle cx="118" cy="76" r="3.6" fill="#0E2547" />
        </g>

        {/* Sourire */}
        <path d="M88 92 q12 9 24 0" stroke="#7FB3E8" strokeWidth="3.5" strokeLinecap="round" fill="none" />

        {/* Bras gauche, posé. */}
        <path d="M52 140 q-16 8 -14 28" stroke="#183767" strokeWidth="11" strokeLinecap="round" fill="none" />

        {/* Bras droit : celui qui salue. Le pivot est à l'épaule, sinon le bras
            se déplace au lieu de tourner. */}
        <g className="lex-salut" style={{ transformOrigin: '148px 140px' }}>
          <path d="M148 140 q18 4 22 -14" stroke="#183767" strokeWidth="11" strokeLinecap="round" fill="none" />
          <circle cx="172" cy="122" r="9" fill="#24507F" />
          {stylo ? (
            <g>
              <rect x="168" y="92" width="7" height="26" rx="3" fill="#F2C14E" transform="rotate(14 171 105)" />
              <path d="M167 118 l8 2 l-2 8 z" fill="#183767" />
            </g>
          ) : null}
        </g>
      </g>
    </svg>
  );
}
