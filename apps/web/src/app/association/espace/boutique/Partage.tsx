'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Encart } from '../../_ui';

/**
 * FAIRE CONNAITRE LA BOUTIQUE.
 *
 * Une boutique en ligne ne se trouve pas toute seule : il faut pouvoir tendre
 * son adresse. Deux gestes, et deux seulement — copier le lien pour un mail,
 * une signature, une bio ; imprimer le QR code pour une affiche, un stand, un
 * bulletin. Le reste (referencement, publicite) n'a pas sa place ici.
 *
 * Le QR affiche fait 320 pixels, ce qui suffit a l'ecran. Celui qu'on
 * TELECHARGE est regenere a 1200 pixels : un QR de 320 pixels etire sur une
 * affiche A4 se scanne mal, et personne ne s'en apercoit avant le jour J.
 */
export function Partage({
  slug,
  nom,
  publiee,
  modifie,
}: {
  slug: string;
  nom: string;
  publiee: boolean;
  /** Vrai tant que l'adresse saisie n'a pas ete enregistree. */
  modifie: boolean;
}) {
  const toile = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState('');
  const [dit, setDit] = useState<string | null>(null);

  useEffect(() => {
    const complet = `${window.location.origin}/boutique/${slug}`;
    setUrl(complet);
    if (!toile.current) return;
    QRCode.toCanvas(toile.current, complet, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1D1B5C', light: '#FFFFFF' },
    }).catch(() => undefined);
  }, [slug]);

  // Le message de confirmation s'efface tout seul : rien a fermer a la main.
  useEffect(() => {
    if (!dit) return;
    const t = window.setTimeout(() => setDit(null), 2500);
    return () => window.clearTimeout(t);
  }, [dit]);

  const copier = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setDit('Lien copié.');
    } catch {
      // Presse-papiers refuse (navigateur ancien, contexte non securise) :
      // on selectionne le champ, la personne fait le copier elle-meme.
      setDit('Copie impossible : sélectionne le lien à la main.');
    }
  }, [url]);

  const telecharger = useCallback(async () => {
    try {
      const donnees = await QRCode.toDataURL(url, {
        width: 1200,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#1D1B5C', light: '#FFFFFF' },
      });
      const a = document.createElement('a');
      a.href = donnees;
      a.download = `qr-boutique-${slug}.png`;
      a.click();
      setDit('QR code téléchargé.');
    } catch {
      setDit("Le QR code n'a pas pu être préparé.");
    }
  }, [url, slug]);

  const partager = useCallback(async () => {
    if (!navigator.share) {
      void copier();
      return;
    }
    try {
      await navigator.share({ title: nom, url });
    } catch {
      /* partage annule par la personne : rien a signaler */
    }
  }, [copier, nom, url]);

  const bouton =
    'rounded-xl border-2 border-[#C7C4F2] px-4 py-2 text-sm font-bold text-[#1D1B5C] transition-colors hover:bg-[#F3F2FD] disabled:opacity-60';

  return (
    <div className="grid gap-4 border-t-2 border-dashed border-[#E6E4F3] pt-5 md:grid-cols-[auto,1fr] md:items-start">
      {/* Fond blanc volontaire : un QR code clair sur fond sombre ne se scanne
          pas de facon fiable, quel que soit le theme de la page. */}
      <div className="justify-self-center rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgba(29,27,92,0.06)]">
        <canvas ref={toile} aria-label={`QR code vers la boutique ${nom}`} />
      </div>

      <div className="grid gap-3">
        <div>
          <p className="text-lg font-extrabold text-[#1D1B5C]">Faire connaître la boutique</p>
          <p className="mt-0.5 max-w-[60ch] text-sm text-[#6B6A8A]">
            Le lien se colle dans un mail, une signature, une bio de réseau social. Le QR code
            s&apos;imprime sur une affiche, un flyer, un bulletin : il est téléchargé en grand
            format, prêt pour le papier.
          </p>
        </div>

        <label className="grid gap-1 text-sm font-bold text-[#3B3A66]">
          L&apos;adresse à partager
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-xl border-2 border-[#E6E4F3] bg-[#FAFAFE] px-3 py-2 text-[15px] text-[#1D1B5C] focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void copier()} className={bouton}>
            Copier le lien
          </button>
          <button type="button" onClick={() => void telecharger()} className={bouton}>
            Télécharger le QR code
          </button>
          <button type="button" onClick={() => void partager()} className={bouton}>
            Partager
          </button>
          <a
            href={`/boutique/${slug}`}
            target="_blank"
            rel="noopener"
            className="rounded-xl px-4 py-2 text-sm font-bold text-[#4F46E5] underline underline-offset-4"
          >
            Voir la boutique
          </a>
          {dit ? <span className="text-sm font-bold text-[#0F5F3E]">{dit}</span> : null}
        </div>

        {modifie ? (
          <Encart ton="attention">
            L&apos;adresse a été modifiée mais pas encore enregistrée : ce lien et ce QR code
            pointent vers l&apos;adresse actuelle, pas vers la nouvelle.
          </Encart>
        ) : null}

        {!publiee ? (
          <Encart ton="attention">
            La boutique est fermée : ce lien mène à une page introuvable tant qu&apos;elle
            n&apos;est pas ouverte. Ouvre-la avant d&apos;imprimer quoi que ce soit.
          </Encart>
        ) : null}
      </div>
    </div>
  );
}
