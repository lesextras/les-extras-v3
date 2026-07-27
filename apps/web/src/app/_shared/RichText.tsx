// Rendu d'un texte enrichi (Markdown restreint) SANS dangerouslySetInnerHTML.
// On construit des éléments React : rien de ce que l'auteur écrit ne peut
// devenir du HTML exécutable. C'est la garantie qu'un compte tiers publiant sur
// le fil public ne peut pas injecter de script.
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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

export function RichText({ value }: { value: string }) {
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
  const plat = value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plat.length > max ? `${plat.slice(0, max - 1).trimEnd()}…` : plat;
}
