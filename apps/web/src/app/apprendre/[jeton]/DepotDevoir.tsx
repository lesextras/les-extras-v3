'use client';

import { useEffect, useState, type FormEvent } from 'react';

/**
 * LE DÉPÔT D'UN DEVOIR.
 *
 * L'apprenant écrit sa réponse ou joint ses fichiers ; l'académie corrige
 * dans « Devoirs à corriger ». Tant que ce n'est pas validé, la leçon ne se
 * coche pas : c'est la correction qui la fait avancer, pas l'apprenant.
 */
interface Rendu {
  id: string;
  texte: string | null;
  fichiers: { n: number; nom: string; taille: number; type: string }[];
  statut: 'A_CORRIGER' | 'VALIDE' | 'A_REPRENDRE';
  note: number | null;
  commentaire: string | null;
  corrigeLe: string | null;
  tentative: number;
}

const STATUT: Record<Rendu['statut'], { libelle: string; fond: string; texte: string }> = {
  A_CORRIGER: { libelle: 'Déposé, en attente de correction', fond: '#FEF3E2', texte: '#7C3E06' },
  VALIDE: { libelle: 'Validé', fond: '#E3F5EC', texte: '#0F5F3E' },
  A_REPRENDRE: { libelle: 'À reprendre', fond: '#FDE7EC', texte: '#8A1B3D' },
};

export function DepotDevoir({ jeton, leconId, couleur, onValide }: { jeton: string; leconId: string; couleur: string; onValide: () => void }) {
  const base = `/api/proxy/public/ecole/apprendre/${encodeURIComponent(jeton)}/devoirs/${leconId}`;
  const [rendu, setRendu] = useState<Rendu | null>(null);
  const [charge, setCharge] = useState(false);
  const [texte, setTexte] = useState('');
  const [fichiers, setFichiers] = useState<FileList | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let vivant = true;
    setCharge(false);
    fetch(base, { headers: { Accept: 'application/json' } })
      .then(async (r) => (r.ok ? ((await r.text()) || 'null') : 'null'))
      .then((t) => {
        if (!vivant) return;
        const r = JSON.parse(t) as Rendu | null;
        setRendu(r);
        setTexte(r?.texte ?? '');
        if (r?.statut === 'VALIDE') onValide();
      })
      .catch(() => undefined)
      .finally(() => vivant && setCharge(true));
    return () => {
      vivant = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  async function deposer(e: FormEvent) {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const form = new FormData();
      if (texte.trim()) form.append('texte', texte.trim());
      Array.from(fichiers ?? []).forEach((f) => form.append('fichiers', f));
      const r = await fetch(base, { method: 'POST', body: form, headers: { Accept: 'application/json' } });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(typeof d?.message === 'string' ? d.message : Array.isArray(d?.message) ? d.message[0] : "Le dépôt n'a pas abouti.");
      setRendu(d as Rendu);
      setFichiers(null);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Le dépôt n'a pas abouti.");
    } finally {
      setOccupe(false);
    }
  }

  if (!charge) return <p className="mt-6 text-[15px] text-[#5E7A6E]">Chargement du devoir…</p>;
  const s = rendu ? STATUT[rendu.statut] : null;
  const verrouille = rendu?.statut === 'VALIDE';

  return (
    <section className="mt-7 rounded-2xl border border-[#DDEBE4] bg-[#FBFCFB] p-5">
      <h3 className="text-xl font-extrabold tracking-tight text-[#12312A]">Mon devoir</h3>
      {rendu && s ? (
        <div className="mt-3 rounded-xl px-4 py-3" style={{ backgroundColor: s.fond, color: s.texte }}>
          <p className="font-extrabold">
            {s.libelle}
            {rendu.note !== null ? ` · ${rendu.note}/100` : ''}
          </p>
          {rendu.commentaire ? <p className="mt-1 whitespace-pre-line leading-relaxed">{rendu.commentaire}</p> : null}
          {rendu.fichiers.length ? (
            <ul className="mt-2 grid gap-1 text-[15px]">
              {rendu.fichiers.map((f) => (
                <li key={f.n}>
                  <a href={`${base}/fichiers/${f.n}`} className="font-bold underline underline-offset-4">
                    {f.nom}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-[15px] leading-relaxed">Écrivez votre réponse ou joignez vos fichiers (5 au plus, 20 Mo chacun : PDF, image, texte, Word, Excel, PowerPoint).</p>
      )}

      {!verrouille ? (
        <form onSubmit={deposer} className="mt-4 grid gap-3">
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={6}
            maxLength={20000}
            placeholder="Votre réponse…"
            className="w-full rounded-xl border-2 border-[#DDEBE4] bg-white px-4 py-3 text-base focus:outline-none"
          />
          <input type="file" multiple onChange={(e) => setFichiers(e.target.files)} className="text-[15px]" />
          {erreur ? <p className="font-bold text-[#8A1B3D]">{erreur}</p> : null}
          <div>
            <button type="submit" disabled={occupe} className="rounded-xl px-6 py-3 font-extrabold text-white disabled:opacity-60" style={{ backgroundColor: couleur }}>
              {occupe ? 'Envoi…' : rendu ? 'Déposer une nouvelle version' : 'Rendre mon devoir'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
