'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import { dateCourte, type DocumentLibre } from '../_types';

const CATEGORIES = ['Réunions', 'Projets', 'Comptes', 'Courriers', 'Photos', 'Autre'];
const CHAMP =
  'w-full rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]';

function taille(octets: number) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Tous les documents de l'association qui ne sont pas des pièces du classeur : réunions, projets, courriers, photos. */
export function Documents({ documents }: { documents: DocumentLibre[] }) {
  const router = useRouter();
  const fichier = useRef<HTMLInputElement>(null);
  const [titre, setTitre] = useState('');
  const [categorie, setCategorie] = useState('Autre');
  const [filtre, setFiltre] = useState<string>('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function deposer(e: FormEvent) {
    e.preventDefault();
    const f = fichier.current?.files?.[0];
    if (!f) {
      setErreur('Choisis un fichier.');
      return;
    }
    setErreur(null);
    setEnCours(true);
    const form = new FormData();
    form.append('file', f);
    form.append('titre', titre.trim() || f.name);
    form.append('categorie', categorie);
    try {
      await appel('/association/documents', { method: 'POST', form });
      setTitre('');
      if (fichier.current) fichier.current.value = '';
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le dépôt a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer(d: DocumentLibre) {
    if (!window.confirm(`Supprimer « ${d.titre} » ? Le fichier sera effacé.`)) return;
    try {
      await appel(`/association/documents/${d.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La suppression a échoué.');
    }
  }

  const visibles = filtre ? documents.filter((d) => (d.categorie ?? 'Autre') === filtre) : documents;
  const categoriesPresentes = [...new Set(documents.map((d) => d.categorie ?? 'Autre'))];

  return (
    <div className="space-y-6">
      <form onSubmit={deposer} className="rounded-2xl border border-[#E6E4F3] bg-white p-5">
        <p className="mb-3 font-extrabold text-[#1D1B5C]">Ajouter un document</p>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_auto] sm:items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#1D1B5C]">Le fichier</span>
            <input ref={fichier} type="file" required className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#ECEBFC] file:px-3 file:py-2 file:font-bold file:text-[#4338CA]" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#1D1B5C]">Son titre</span>
            <input type="text" maxLength={160} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Sinon, le nom du fichier" className={CHAMP} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#1D1B5C]">Catégorie</span>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={CHAMP}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
            {enCours ? 'Envoi…' : 'Déposer'}
          </button>
        </div>
        {erreur ? <p className="mt-3 rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}
      </form>

      {documents.length ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setFiltre('')} className={`rounded-full px-3 py-1.5 text-sm font-bold ${!filtre ? 'bg-[#1D1B5C] text-white' : 'bg-white text-[#3B3A66]'}`}>
            Tout <span className="opacity-60">{documents.length}</span>
          </button>
          {categoriesPresentes.map((c) => (
            <button key={c} type="button" onClick={() => setFiltre(c)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${filtre === c ? 'bg-[#1D1B5C] text-white' : 'bg-white text-[#3B3A66]'}`}>
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-[#E6E4F3] bg-white px-6 py-10 text-center">
          <p className="font-bold text-[#1D1B5C]">Aucun document pour l&apos;instant.</p>
          <p className="mt-1 text-sm text-[#6B6A8A]">Les procès-verbaux, les courriers reçus, les photos des actions, les devis… Tout au même endroit, retrouvable en un clic.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#E6E4F3] overflow-hidden rounded-2xl border border-[#E6E4F3] bg-white">
          {visibles.map((d) => (
            <li key={d.id} className="flex items-center gap-4 px-5 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECEBFC] text-xs font-extrabold uppercase text-[#4338CA]">
                {(d.file?.originalName.split('.').pop() ?? 'doc').slice(0, 4)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold text-[#1D1B5C]">{d.titre}</span>
                <span className="block text-sm text-[#6B6A8A]">
                  {d.categorie ?? 'Autre'} · {dateCourte(d.createdAt)}
                  {d.file ? ` · ${taille(d.file.size)}` : ''}
                </span>
              </span>
              {d.fileId ? (
                <a href={`/api/proxy/files/${d.fileId}`} target="_blank" rel="noopener" className="rounded-lg px-3 py-2 text-sm font-bold text-[#4F46E5] hover:bg-[#ECEBFC]">
                  Ouvrir
                </a>
              ) : null}
              <button type="button" onClick={() => supprimer(d)} className="rounded-lg px-3 py-2 text-sm font-bold text-[#8A2419] hover:bg-[#FDE8E6]">
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
