// Illustrations vectorielles maison. Choix assumé : pas de photos de banque
// d'images de « professionnels souriants en réunion » — le secteur les
// reconnaît au premier coup d'œil et elles décrédibilisent. Des dessins
// abstraits, dans les couleurs de la charte, qui montrent le mécanisme du
// produit plutôt qu'une mise en scène.
// Tout est en variables CSS : la même illustration fonctionne sur fond ivoire
// et sur fond charbon.

type Props = { className?: string };

/** Notes brutes à gauche → écrit structuré à droite. Le geste central de LEX. */
export function IllustrationEcrit({ className }: Props) {
  return (
    <svg
      viewBox="0 0 420 300"
      className={className}
      role="img"
      aria-label="Des notes manuscrites en vrac se transforment en un écrit professionnel structuré"
    >
      <defs>
        <linearGradient id="lx-ecrit-fond" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.10" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="420" height="300" rx="24" fill="url(#lx-ecrit-fond)" />

      {/* Carnet : lignes irrégulières */}
      <g transform="translate(30 44)">
        <rect
          width="150"
          height="212"
          rx="12"
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        <g stroke="hsl(var(--muted-foreground))" strokeWidth="3" strokeLinecap="round" opacity="0.5">
          <path d="M22 34 h96" />
          <path d="M22 52 h64" />
          <path d="M22 78 h104" />
          <path d="M22 96 h48" />
          <path d="M22 122 h88" />
          <path d="M22 140 h72" />
          <path d="M22 166 h58" />
        </g>
        <text x="22" y="196" fontSize="11" fill="hsl(var(--muted-foreground))">
          notes brutes
        </text>
      </g>

      {/* Flèche de transformation */}
      <g transform="translate(190 140)">
        <circle r="19" fill="hsl(var(--primary))" opacity="0.12" />
        <path
          d="M-8 0 h15 m-6 -6 l6 6 l-6 6"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Document structuré : titre, sections, blocs alignés */}
      <g transform="translate(240 30)">
        <rect
          width="152"
          height="240"
          rx="12"
          fill="hsl(var(--card))"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        <rect x="20" y="24" width="72" height="9" rx="4.5" fill="hsl(var(--primary))" />
        <g fill="hsl(var(--muted-foreground))" opacity="0.35">
          <rect x="20" y="48" width="112" height="6" rx="3" />
          <rect x="20" y="62" width="96" height="6" rx="3" />
        </g>
        <rect x="20" y="88" width="54" height="8" rx="4" fill="hsl(var(--secondary))" opacity="0.8" />
        <g fill="hsl(var(--muted-foreground))" opacity="0.35">
          <rect x="20" y="108" width="112" height="6" rx="3" />
          <rect x="20" y="122" width="104" height="6" rx="3" />
          <rect x="20" y="136" width="80" height="6" rx="3" />
        </g>
        <rect x="20" y="162" width="46" height="8" rx="4" fill="hsl(var(--secondary))" opacity="0.8" />
        <g fill="hsl(var(--muted-foreground))" opacity="0.35">
          <rect x="20" y="182" width="112" height="6" rx="3" />
          <rect x="20" y="196" width="90" height="6" rx="3" />
        </g>
        {/* Pastille de validation : l'écrit reste relu par un humain */}
        <g transform="translate(112 212)">
          <circle r="15" fill="hsl(var(--success))" opacity="0.16" />
          <path
            d="M-6 0 l4 4 l8 -9"
            stroke="hsl(var(--success))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </g>
    </svg>
  );
}

/** Des professionnels isolés qui deviennent un réseau. Illustre le GAP. */
export function IllustrationReseau({ className }: Props) {
  const noeuds = [
    { x: 210, y: 46 },
    { x: 330, y: 112 },
    { x: 300, y: 226 },
    { x: 120, y: 226 },
    { x: 90, y: 112 },
  ];
  return (
    <svg
      viewBox="0 0 420 290"
      className={className}
      role="img"
      aria-label="Cinq professionnels reliés autour d'une même situation"
    >
      <rect x="0" y="0" width="420" height="290" rx="24" fill="hsl(var(--primary))" opacity="0.07" />
      <g stroke="hsl(var(--primary))" strokeOpacity="0.35" strokeWidth="1.5">
        {noeuds.map((n, i) => (
          <line key={i} x1="210" y1="146" x2={n.x} y2={n.y} />
        ))}
      </g>
      {noeuds.map((n, i) => (
        <g key={i} transform={`translate(${n.x} ${n.y})`}>
          <circle r="22" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
          <circle cy="-5" r="6" fill="hsl(var(--muted-foreground))" opacity="0.55" />
          <path
            d="M-9 11 a9 9 0 0 1 18 0"
            fill="hsl(var(--muted-foreground))"
            opacity="0.55"
          />
        </g>
      ))}
      {/* Centre : la situation posée */}
      <g transform="translate(210 146)">
        <circle r="34" fill="hsl(var(--primary))" opacity="0.14" />
        <circle r="26" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <text
          y="6"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="hsl(var(--primary))"
        >
          ?
        </text>
      </g>
    </svg>
  );
}

/** Le calcul de coût : trois curseurs, un résultat. Illustre les outils gratuits. */
export function IllustrationCalcul({ className }: Props) {
  const lignes = [
    { y: 60, largeur: 176, valeur: 118 },
    { y: 104, largeur: 176, valeur: 74 },
    { y: 148, largeur: 176, valeur: 146 },
  ];
  return (
    <svg
      viewBox="0 0 380 250"
      className={className}
      role="img"
      aria-label="Trois curseurs de paramètres aboutissant à un montant"
    >
      <rect x="0" y="0" width="380" height="250" rx="24" fill="hsl(var(--secondary))" opacity="0.07" />
      <g transform="translate(40 12)">
        {lignes.map((l, i) => (
          <g key={i}>
            <rect
              x="0"
              y={l.y}
              width={l.largeur}
              height="8"
              rx="4"
              fill="hsl(var(--muted-foreground))"
              opacity="0.25"
            />
            <rect x="0" y={l.y} width={l.valeur} height="8" rx="4" fill="hsl(var(--primary))" />
            <circle
              cx={l.valeur}
              cy={l.y + 4}
              r="9"
              fill="hsl(var(--card))"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
            />
          </g>
        ))}
        {/* Résultat */}
        <g transform="translate(212 44)">
          <rect
            width="112"
            height="128"
            rx="14"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />
          <rect x="20" y="24" width="46" height="6" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.4" />
          <text
            x="56"
            y="76"
            textAnchor="middle"
            fontSize="30"
            fontWeight="700"
            fill="hsl(var(--primary))"
          >
            €
          </text>
          <rect x="24" y="96" width="64" height="6" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
        </g>
      </g>
    </svg>
  );
}
