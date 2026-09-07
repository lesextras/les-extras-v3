'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';

interface Etape {
  numero: number;
  slug: string;
  titre: string;
  faite: boolean;
  verifiee: boolean;
}

export function CaseEtape({ etape }: { etape: Etape }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function basculer() {
    if (etape.verifiee) return;
    setEnCours(true);
    try {
      await appel(`/association/chemin/${etape.slug}`, { method: 'POST', body: { faite: !etape.faite } });
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <li className={`flex items-center gap-3 rounded-md border px-4 py-3 ${etape.faite ? 'border-[#B9D6C6] bg-[#E4EFE8]' : 'border-[#DDD8CC] bg-white'}`}>
      <input
        id={`etape-${etape.slug}`}
        type="checkbox"
        checked={etape.faite}
        disabled={etape.verifiee || enCours}
        onChange={basculer}
        className="h-5 w-5 accent-[#1F6A4E]"
      />
      <label htmlFor={`etape-${etape.slug}`} className="flex-1 cursor-pointer">
        <span className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Étape {etape.numero}</span>
        <span className="block font-medium">{etape.titre}</span>
        {etape.verifiee ? <span className="text-xs text-[#5C6B63]">Confirmée par les répertoires publics</span> : null}
      </label>
      <Link href={`/chemin/${etape.slug}`} className="shrink-0 text-sm underline underline-offset-4">
        Voir
      </Link>
    </li>
  );
}
