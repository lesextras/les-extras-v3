'use client';

import { useState } from 'react';

/**
 * PARTAGER EN UN CLIC.
 *
 * Les six réseaux que Teachizy propose, plus la copie du lien. Chaque bouton
 * ouvre le partage du réseau lui-même : rien ne passe par nous, aucun compte
 * n'est relié, aucun traceur n'est posé.
 */
export function Partager({ url, titre }: { url: string; titre: string }) {
  const [copie, setCopie] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(titre);
  const reseaux = [
    { nom: 'E-mail', href: `mailto:?subject=${t}&body=${t}%0A%0A${u}`, fond: '#334A42' },
    { nom: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, fond: '#1877F2' },
    { nom: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, fond: '#0A66C2' },
    { nom: 'Pinterest', href: `https://pinterest.com/pin/create/button/?url=${u}&description=${t}`, fond: '#E60023' },
    { nom: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, fond: '#25D366' },
    { nom: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}`, fond: '#229ED9' },
  ];
  async function copier() {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      window.prompt('Copie ce lien :', url);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {reseaux.map((r) => (
        <a
          key={r.nom}
          href={r.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg px-3 py-2 text-sm font-bold text-white no-underline"
          style={{ backgroundColor: r.fond }}
        >
          {r.nom}
        </a>
      ))}
      <button type="button" onClick={copier} className="rounded-lg border-2 border-[#CFE4D9] bg-white px-3 py-1.5 text-sm font-bold text-[#12312A]">
        {copie ? 'Lien copié' : 'Copier le lien'}
      </button>
    </div>
  );
}
