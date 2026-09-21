'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * QUAND UN ÉCRAN DE PILOTER TOMBE.
 *
 * Sans cette page, l'erreur remontait jusqu'à la coque de l'autre site et
 * affichait « LES EXTRAS — la plateforme est momentanément indisponible » : la
 * personne se croyait ailleurs. Ici on reste chez soi, on propose de réessayer
 * sans recharger, et on garde une porte de sortie.
 */
export default function Erreur({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Piloter association]', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[560px] py-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDE7EC] text-[#C42B57]" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#1D1B5C] sm:text-3xl">Cet écran n&apos;a pas pu s&apos;afficher.</h1>
      <p className="mx-auto mt-2 max-w-[46ch] leading-relaxed text-[#3B3A66]">
        Rien n&apos;est perdu : tes données sont en sécurité. Réessaie, si ça recommence, écris-nous en disant sur quel
        bouton tu as cliqué.
      </p>
      {error.digest ? <p className="mt-2 text-[13px] text-[#6B6A8A]">Référence : {error.digest}</p> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-[#4F46E5] px-6 py-3 text-base font-extrabold text-white transition hover:bg-[#4338CA]"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-xl border-2 border-[#C7C4F2] bg-white px-6 py-3 text-base font-extrabold text-[#1D1B5C] no-underline transition hover:border-[#4F46E5]"
        >
          Revenir au tableau de bord
        </Link>
        <Link
          href="/nous-contacter"
          className="rounded-xl border-2 border-[#F3B0C2] bg-white px-6 py-3 text-base font-extrabold text-[#8A1B3D] no-underline transition hover:bg-[#FDE7EC]"
        >
          Nous écrire
        </Link>
      </div>
    </div>
  );
}
