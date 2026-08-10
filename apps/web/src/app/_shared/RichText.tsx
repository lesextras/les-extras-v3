// Rendu d'un texte enrichi SANS dangerouslySetInnerHTML. On construit des
// éléments React : rien de ce que l'auteur écrit ne peut devenir du HTML
// exécutable. C'est la garantie qu'un compte tiers publiant sur le fil public
// ne peut pas injecter de script.
//
// Deux dialectes en entrée :
//   · le Markdown restreint, écrit depuis l'application ;
//   · le HTML, hérité des articles importés de WordPress. Il est relu par une
//     LISTE BLANCHE de balises (titres, paragraphes, listes, citations, gras,
//     italique, liens, images) ; tout le reste est réduit à son texte. Sans
//     cela, l'Édublog affichait ses balises en clair — constaté en direct le
//     10/08/2026 sur les vingt articles du blog.
import Image from "next/image";
import type { ReactNode } from "react";

/** Entités HTML rencontrées dans les exports WordPress. */
const ENTITES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  hellip: "…", mdash: "—", ndash: "–", laquo: "«", raquo: "»",
  eacute: "é", egrave: "è", agrave: "à", ccedil: "ç", ecirc: "ê", euro: "€",
};

export function decoderEntites(texte: string): string {
  return texte.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (brut, corps: string) => {
    if (corps[0] === "#") {
      const code = corps[1] === "x" || corps[1] === "X"
        ? Number.parseInt(corps.slice(2), 16)
        : Number.parseInt(corps.slice(1), 10);
      // On refuse les points de code hors plage : mieux vaut laisser l'entité
      // visible qu'émettre un caractère de contrôle.
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : brut;
    }
    return ENTITES[corps.toLowerCase()] ?? brut;
  });
}

/** Texte nu d'un fragment HTML : balises retirées, entités décodées. */
function texteNu(html: string): string {
  return decoderEntites(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

/**
 * Une adresse n'est retenue que si son schéma est inoffensif. `javascript:`,
 * `data:` et consorts sont écartés : c'est le seul endroit où une valeur
 * fournie par un auteur pourrait redevenir exécutable.
 */
function lienSur(href: string | undefined): string | null {
  if (!href) return null;
  const propre = decoderEntites(href).trim();
  return /^(https?:\/\/|mailto:|\/)/i.test(propre) ? propre : null;
}

/** Gras, italique et liens à l'intérieur d'une ligne. */
function inline(texte: string, cle: string): ReactNode[] {
  const sortie: ReactNode[] = [];
  const motif = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;
  let dernier = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = motif.exec(texte))) {
    if (m.index > dernier) sortie.push(texte.slice(dernier, m.index));
    const t = m[0];
    if (t.startsWith("**")) {
      sortie.push(<strong key={`${cle}-b${i}`}>{t.slice(2, -2)}</strong>);
    } else if (t.startsWith("*")) {
      sortie.push(<em key={`${cle}-i${i}`}>{t.slice(1, -1)}</em>);
    } else {
      const libelle = t.slice(1, t.indexOf("]"));
      const href = m[2];
      sortie.push(
        <a
          key={`${cle}-a${i}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-primary underline underline-offset-2"
        >
          {libelle}
        </a>,
      );
    }
    dernier = m.index + t.length;
    i += 1;
  }
  if (dernier < texte.length) sortie.push(texte.slice(dernier));
  return sortie;
}

/** Gras, italique, liens et sauts de ligne à l'intérieur d'un bloc HTML. */
function enligneHtml(html: string, cle: string): ReactNode[] {
  const sortie: ReactNode[] = [];
  const motif =
    /<(strong|b|em|i)\b[^>]*>([\s\S]*?)<\/\1\s*>|<a\b[^>]*\shref\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a\s*>|<br\s*\/?>/gi;
  let dernier = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  const pousserTexte = (fragment: string) => {
    const t = decoderEntites(fragment.replace(/<[^>]*>/g, ""));
    if (t) sortie.push(t);
  };

  while ((m = motif.exec(html))) {
    if (m.index > dernier) pousserTexte(html.slice(dernier, m.index));
    const balise = m[1]?.toLowerCase();

    if (balise === "strong" || balise === "b") {
      sortie.push(<strong key={`${cle}-b${i}`}>{texteNu(m[2])}</strong>);
    } else if (balise === "em" || balise === "i") {
      sortie.push(<em key={`${cle}-i${i}`}>{texteNu(m[2])}</em>);
    } else if (m[3] !== undefined) {
      const href = lienSur(m[3]);
      const libelle = texteNu(m[4]) || href || "";
      sortie.push(
        href ? (
          <a
            key={`${cle}-a${i}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-primary underline underline-offset-2"
          >
            {libelle}
          </a>
        ) : (
          // Schéma refusé : on garde le texte, on jette l'adresse.
          <span key={`${cle}-a${i}`}>{libelle}</span>
        ),
      );
    } else {
      sortie.push(<br key={`${cle}-br${i}`} />);
    }

    dernier = m.index + m[0].length;
    i += 1;
  }
  if (dernier < html.length) pousserTexte(html.slice(dernier));
  return sortie;
}

const BLOCS_HTML =
  /<(h[1-6]|p|ul|ol|blockquote|figure)\b[^>]*>([\s\S]*?)<\/\1\s*>|<img\b[^>]*>/gi;
const SOURCE_IMAGE = /<img\b[^>]*\ssrc\s*=\s*["']([^"']*)["'][^>]*>/i;
const TEXTE_ALTERNATIF = /\salt\s*=\s*["']([^"']*)["']/i;

function figure(balise: string, cle: string): ReactNode | null {
  const src = lienSur(SOURCE_IMAGE.exec(balise)?.[1]);
  if (!src) return null;
  const alt = decoderEntites(TEXTE_ALTERNATIF.exec(balise)?.[1] ?? "");
  return (
    <figure key={cle} className="my-2">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" unoptimized />
      </div>
      {alt ? (
        <figcaption className="mt-1.5 text-center text-xs text-muted-foreground">
          {alt}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Le HTML des articles importés, relu balise par balise. */
function htmlEnBlocs(html: string): ReactNode[] {
  const blocs: ReactNode[] = [];
  let dernier = 0;
  let m: RegExpExecArray | null;
  let k = 0;

  // Du texte hors de toute balise de bloc reste du texte : on ne le perd pas.
  const pousserOrphelin = (fragment: string) => {
    const t = fragment.trim();
    if (!t || !texteNu(t)) return;
    blocs.push(
      <p key={`o${k}`} className="leading-relaxed">
        {enligneHtml(t, `o${k}`)}
      </p>,
    );
  };

  while ((m = BLOCS_HTML.exec(html))) {
    if (m.index > dernier) pousserOrphelin(html.slice(dernier, m.index));
    dernier = m.index + m[0].length;
    const balise = m[1]?.toLowerCase();
    const dedans = m[2] ?? "";
    k += 1;

    if (!balise) {
      const f = figure(m[0], `f${k}`);
      if (f) blocs.push(f);
      continue;
    }

    if (/^h[1-6]$/.test(balise)) {
      const petit = balise >= "h3";
      const Balise = petit ? "h3" : "h2";
      blocs.push(
        <Balise
          key={`h${k}`}
          className={
            petit
              ? "mt-4 text-lg font-semibold text-foreground"
              : "mt-6 text-xl font-semibold text-foreground"
          }
        >
          {enligneHtml(dedans, `h${k}`)}
        </Balise>,
      );
      continue;
    }

    if (balise === "ul" || balise === "ol") {
      const elements = [...dedans.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li\s*>/gi)];
      if (!elements.length) continue;
      const Balise = balise === "ol" ? "ol" : "ul";
      blocs.push(
        <Balise
          key={`u${k}`}
          className={
            balise === "ol"
              ? "list-decimal space-y-1 pl-5"
              : "list-disc space-y-1 pl-5"
          }
        >
          {elements.map((el, j) => (
            <li key={j}>{enligneHtml(el[1], `u${k}-${j}`)}</li>
          ))}
        </Balise>,
      );
      continue;
    }

    if (balise === "blockquote") {
      blocs.push(
        <blockquote
          key={`q${k}`}
          className="border-l-2 border-primary/40 pl-4 italic text-muted-foreground"
        >
          {enligneHtml(dedans.replace(/<\/?p\b[^>]*>/gi, " "), `q${k}`)}
        </blockquote>,
      );
      continue;
    }

    // <p> et <figure> : une image seule devient une figure, pas un paragraphe
    // vide — c'est la forme que prennent les illustrations de WordPress.
    if (!texteNu(dedans)) {
      const f = figure(dedans, `f${k}`);
      if (f) blocs.push(f);
      continue;
    }
    blocs.push(
      <p key={`p${k}`} className="leading-relaxed">
        {enligneHtml(dedans, `p${k}`)}
      </p>,
    );
  }
  if (dernier < html.length) pousserOrphelin(html.slice(dernier));

  return blocs;
}

/** Le contenu vient-il de WordPress plutôt que de l'éditeur de l'application ? */
function ressembleAduHtml(value: string): boolean {
  return /<(p|h[1-6]|ul|ol|li|blockquote|figure|img|br|strong|em|a)\b[^>]*>/i.test(value);
}

export function RichText({ value }: { value: string }) {
  if (ressembleAduHtml(value)) {
    return (
      <div className="space-y-4 text-base text-foreground/90">{htmlEnBlocs(value)}</div>
    );
  }

  const lignes = value.replace(/\r\n/g, "\n").split("\n");
  const blocs: ReactNode[] = [];
  let paragraphe: string[] = [];
  let liste: string[] = [];

  const viderParagraphe = (k: number) => {
    if (!paragraphe.length) return;
    const texte = paragraphe.join(" ");
    blocs.push(
      <p key={`p${k}`} className="leading-relaxed">
        {inline(texte, `p${k}`)}
      </p>,
    );
    paragraphe = [];
  };
  const viderListe = (k: number) => {
    if (!liste.length) return;
    blocs.push(
      <ul key={`u${k}`} className="list-disc space-y-1 pl-5">
        {liste.map((el, j) => (
          <li key={j}>{inline(el, `u${k}-${j}`)}</li>
        ))}
      </ul>,
    );
    liste = [];
  };

  lignes.forEach((brute, k) => {
    const l = brute.trimEnd();

    if (!l.trim()) {
      viderParagraphe(k);
      viderListe(k);
      return;
    }

    const img = /^!\[([^\]]*)\]\((\S+)\)$/.exec(l.trim());
    if (img) {
      viderParagraphe(k);
      viderListe(k);
      blocs.push(
        <figure key={`f${k}`} className="my-2">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
            <Image src={img[2]} alt={img[1] || ""} fill sizes="100vw" className="object-cover" unoptimized />
          </div>
          {img[1] ? (
            <figcaption className="mt-1.5 text-center text-xs text-muted-foreground">
              {img[1]}
            </figcaption>
          ) : null}
        </figure>,
      );
      return;
    }

    const titre = /^(#{2,3})\s+(.*)$/.exec(l);
    if (titre) {
      viderParagraphe(k);
      viderListe(k);
      const Balise = titre[1].length === 2 ? "h2" : "h3";
      blocs.push(
        <Balise
          key={`h${k}`}
          className={
            titre[1].length === 2
              ? "mt-6 text-xl font-semibold text-foreground"
              : "mt-4 text-lg font-semibold text-foreground"
          }
        >
          {inline(titre[2], `h${k}`)}
        </Balise>,
      );
      return;
    }

    if (/^>\s?/.test(l)) {
      viderParagraphe(k);
      viderListe(k);
      blocs.push(
        <blockquote
          key={`q${k}`}
          className="border-l-2 border-primary/40 pl-4 italic text-muted-foreground"
        >
          {inline(l.replace(/^>\s?/, ""), `q${k}`)}
        </blockquote>,
      );
      return;
    }

    if (/^[-*]\s+/.test(l)) {
      viderParagraphe(k);
      liste.push(l.replace(/^[-*]\s+/, ""));
      return;
    }

    viderListe(k);
    paragraphe.push(l.trim());
  });
  viderParagraphe(lignes.length);
  viderListe(lignes.length);

  return <div className="space-y-4 text-base text-foreground/90">{blocs}</div>;
}

/** Version texte brut : meta description, aperçus, données structurées. */
export function texteBrut(value: string, max = 300): string {
  const plat = decoderEntites(
    value
      // Les balises d'abord : sinon `<p>` finirait dans la meta description.
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1"),
  )
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plat.length > max ? `${plat.slice(0, max - 1).trimEnd()}…` : plat;
}
