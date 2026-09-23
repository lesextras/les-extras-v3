'use client';

import { useMemo, useState } from 'react';
import { BTN_SECONDAIRE, CARTE, CHAMP } from '../_ui';
import { Partager } from '../_ecole/Partager';
import type { CoursResume, Pack } from '../_ecole/types';

type Choix = { genre: 'cours' | 'pack'; slug: string; titre: string };

function Code({ titre, aide, code }: { titre: string; aide: string; code: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <section className={`${CARTE} p-5`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-[220px] flex-1">
          <h3 className="text-[17px] font-extrabold text-[#12312A]">{titre}</h3>
          <p className="text-[15px] text-[#5E7A6E]">{aide}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopie(true);
              setTimeout(() => setCopie(false), 2000);
            } catch {
              window.prompt('Copie ce code :', code);
            }
          }}
          className={BTN_SECONDAIRE}
        >
          {copie ? 'Copié' : 'Copier le code'}
        </button>
      </div>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-[#12312A] p-4 text-[13px] leading-relaxed text-[#D3E7DC]">{code}</pre>
    </section>
  );
}

export function Integrations({ origine, cours, packs }: { origine: string; cours: CoursResume[]; packs: Pack[] }) {
  const options: Choix[] = useMemo(
    () => [...cours.map((c) => ({ genre: 'cours' as const, slug: c.slug, titre: c.titre })), ...packs.map((p) => ({ genre: 'pack' as const, slug: p.slug, titre: p.titre }))],
    [cours, packs],
  );
  const [cle, setCle] = useState(options[0] ? `${options[0].genre}:${options[0].slug}` : '');
  const [texte, setTexte] = useState('Je m’inscris');
  const [couleur, setCouleur] = useState('#1E9E6A');
  const choix = options.find((o) => `${o.genre}:${o.slug}` === cle) ?? options[0];
  if (!choix) return null;

  const page = `${origine}/${choix.genre === 'cours' ? 'cours' : 'boutique'}/${choix.slug}`;
  const carte = `${origine}/integration/${choix.genre}/${choix.slug}${texte ? `?bouton=${encodeURIComponent(texte)}` : ''}`;
  const echappe = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const bouton = `<a href="${page}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 26px;border-radius:12px;background:${couleur};color:#ffffff;font:700 16px/1.2 system-ui,-apple-system,sans-serif;text-decoration:none">${echappe(texte || 'Découvrir')}</a>`;
  const iframe = `<iframe src="${carte}" title="${echappe(choix.titre)}" width="400" height="470" style="border:0;max-width:100%" loading="lazy"></iframe>`;

  return (
    <div className="grid gap-5">
      <section className={`${CARTE} grid gap-4 p-5 sm:grid-cols-3`}>
        <label className="block sm:col-span-3">
          <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Ce que tu veux vendre</span>
          <select value={cle} onChange={(e) => setCle(e.target.value)} className={CHAMP}>
            {cours.length ? (
              <optgroup label="Formations">
                {cours.map((c) => (
                  <option key={c.id} value={`cours:${c.slug}`}>
                    {c.titre}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {packs.length ? (
              <optgroup label="Packs">
                {packs.map((p) => (
                  <option key={p.id} value={`pack:${p.slug}`}>
                    {p.titre}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Texte du bouton</span>
          <input value={texte} onChange={(e) => setTexte(e.target.value.slice(0, 40))} className={CHAMP} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Couleur du bouton</span>
          <input type="color" value={couleur} onChange={(e) => setCouleur(e.target.value)} className="h-[50px] w-full cursor-pointer rounded-xl border border-[#CFE4D9] bg-white p-1" />
        </label>
      </section>

      <section className={`${CARTE} p-5`}>
        <h3 className="text-[17px] font-extrabold text-[#12312A]">Aperçu</h3>
        <div className="mt-4 grid items-start gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold text-[#5E7A6E]">Le bouton</p>
            <div dangerouslySetInnerHTML={{ __html: bouton }} />
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-[#5E7A6E]">La carte</p>
            <iframe key={carte} src={carte.replace(origine, '')} title="Aperçu de la carte" width={400} height={470} style={{ border: 0, maxWidth: '100%' }} />
          </div>
        </div>
      </section>

      <Code titre="Le lien" aide="À coller dans un post, une signature d'e-mail, un QR code." code={page} />
      <Code titre="Le bouton" aide="À coller dans un bloc HTML de ton site (WordPress : bloc « HTML personnalisé »)." code={bouton} />
      <Code titre="La carte" aide="Image, titre, prix et bouton, à coller dans un bloc HTML. Elle se met à jour toute seule quand tu modifies la formation." code={iframe} />

      <section className={`${CARTE} p-5`}>
        <h3 className="text-[17px] font-extrabold text-[#12312A]">Partager en un clic</h3>
        <p className="mb-3 text-[15px] text-[#5E7A6E]">{choix.titre}</p>
        <Partager url={page} titre={choix.titre} />
      </section>
    </div>
  );
}
