'use client';

import { useState } from 'react';
import { appelApprenant } from './coque';
import { appel as appelAcademie } from '../../academie/_ecole/api';

export interface Commentaire {
  id: string;
  auteur: string;
  parAcademie: boolean;
  texte: string;
  masque?: boolean;
  publieLe: string;
}

export interface Publication {
  id: string;
  titre: string | null;
  texte: string;
  auteur: string;
  parAcademie: boolean;
  estMoi?: boolean;
  epinglee: boolean;
  masquee?: boolean;
  jaime: number;
  jAime: boolean;
  publieLe: string;
  commentaires: Commentaire[];
}

/**
 * LE FIL D'UN ESPACE DE LA COMMUNAUTÉ.
 *
 * Le même composant sert l'apprenant et l'académie : l'un publie, commente et
 * aime ; l'autre publie aussi, épingle, masque et supprime. Une publication
 * masquée reste visible, grisée, pour l'académie seulement.
 */
export function FilCommunaute({
  mode,
  espaceId,
  peutPublier,
  couleur,
  initiales,
}: {
  mode: 'apprenant' | 'academie';
  espaceId: string;
  peutPublier: boolean;
  couleur: string;
  initiales: Publication[];
}) {
  const [publications, setPublications] = useState(initiales);
  const [titre, setTitre] = useState('');
  const [texte, setTexte] = useState('');
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const appeler = <T,>(chemin: string, methode: 'GET' | 'POST' | 'PATCH' | 'DELETE', corps?: unknown): Promise<T> =>
    mode === 'apprenant'
      ? appelApprenant<T>(`/apprenant/communaute${chemin}`, { methode, corps })
      : appelAcademie<T>(`/ecole/communaute${chemin}`, { methode, corps });

  async function agir(fn: () => Promise<void>) {
    setOccupe(true);
    setErreur(null);
    try {
      await fn();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setOccupe(false);
    }
  }

  const publier = () =>
    agir(async () => {
      if (!texte.trim()) throw new Error('Écrivez quelque chose avant de publier.');
      const p = await appeler<Publication>(`/espaces/${espaceId}/publications`, 'POST', { titre: titre.trim() || undefined, texte });
      setPublications((l) => [p, ...l]);
      setTitre('');
      setTexte('');
    });

  const commenter = (id: string) =>
    agir(async () => {
      const t = (reponses[id] ?? '').trim();
      if (!t) return;
      const c = await appeler<Commentaire>(`/publications/${id}/commentaires`, 'POST', { texte: t });
      setPublications((l) => l.map((p) => (p.id === id ? { ...p, commentaires: [...p.commentaires, c] } : p)));
      setReponses((r) => ({ ...r, [id]: '' }));
    });

  const aimer = (id: string) =>
    agir(async () => {
      const r = await appelApprenant<{ jaime: boolean; total: number }>(`/apprenant/communaute/publications/${id}/aimer`, { methode: 'POST' });
      setPublications((l) => l.map((p) => (p.id === id ? { ...p, jAime: r.jaime, jaime: r.total } : p)));
    });

  const moderer = (id: string, corps: { epinglee?: boolean; masquee?: boolean }) =>
    agir(async () => {
      await appelAcademie(`/ecole/communaute/publications/${id}`, { methode: 'PATCH', corps });
      setPublications((l) => l.map((p) => (p.id === id ? { ...p, ...corps } : p)));
    });

  const supprimer = (id: string) =>
    agir(async () => {
      if (!window.confirm('Supprimer définitivement cette publication et ses commentaires ?')) return;
      if (mode === 'academie') await appelAcademie(`/ecole/communaute/publications/${id}`, { methode: 'DELETE' });
      else await appelApprenant(`/apprenant/communaute/publications/${id}`, { methode: 'DELETE' });
      setPublications((l) => l.filter((p) => p.id !== id));
    });

  const masquerCommentaire = (pid: string, cid: string, masque: boolean) =>
    agir(async () => {
      await appelAcademie(`/ecole/communaute/commentaires/${cid}`, { methode: 'PATCH', corps: { masque } });
      setPublications((l) => l.map((p) => (p.id === pid ? { ...p, commentaires: p.commentaires.map((c) => (c.id === cid ? { ...c, masque } : c)) } : p)));
    });

  const champ = 'w-full rounded-xl border-2 border-[#DDEBE4] bg-white px-4 py-3 text-base focus:outline-none';

  return (
    <div className="mt-6 grid gap-4">
      {peutPublier || mode === 'academie' ? (
        <div className="rounded-2xl border border-[#DDEBE4] bg-white p-5">
          <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre (facultatif)" className={champ} maxLength={200} />
          <textarea value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Partagez une question, une ressource, une réussite…" rows={3} className={`${champ} mt-3`} maxLength={10000} />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-[#5E7A6E]">Pas de nom ni d’élément permettant de reconnaître une personne accompagnée.</p>
            <button type="button" onClick={publier} disabled={occupe} className="shrink-0 rounded-xl px-5 py-2.5 font-extrabold text-white disabled:opacity-60" style={{ backgroundColor: couleur }}>
              Publier
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-[#DDEBE4] bg-white px-4 py-3 text-[15px]">Dans cet espace, l’école publie ; vous pouvez commenter et aimer.</p>
      )}
      {erreur ? <p className="font-bold text-[#8A1B3D]">{erreur}</p> : null}

      {publications.length === 0 ? <p className="rounded-2xl border-2 border-dashed border-[#DDEBE4] px-5 py-8 text-center">Aucune publication pour le moment.</p> : null}

      {publications.map((p) => (
        <article key={p.id} className={`rounded-2xl border bg-white p-5 ${p.masquee ? 'opacity-50' : ''}`} style={{ borderColor: p.epinglee ? couleur : '#DDEBE4' }}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <strong className="text-[#12312A]">{p.auteur}</strong>
            {p.parAcademie ? <span className="rounded-full px-2 py-0.5 text-xs font-extrabold text-white" style={{ backgroundColor: couleur }}>École</span> : null}
            {p.epinglee ? <span className="rounded-full bg-[#FEF3E2] px-2 py-0.5 text-xs font-extrabold text-[#7C3E06]">Épinglé</span> : null}
            {p.masquee ? <span className="rounded-full bg-[#FDE7EC] px-2 py-0.5 text-xs font-extrabold text-[#8A1B3D]">Masqué aux apprenants</span> : null}
            <span className="text-[#5E7A6E]">· {new Date(p.publieLe).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' })}</span>
          </div>
          {p.titre ? <h3 className="mt-2 text-lg font-extrabold tracking-tight text-[#12312A]">{p.titre}</h3> : null}
          <p className="mt-2 whitespace-pre-line leading-relaxed">{p.texte}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {mode === 'apprenant' ? (
              <button type="button" onClick={() => aimer(p.id)} disabled={occupe} className="rounded-lg border-2 px-3 py-1.5 font-bold" style={{ borderColor: p.jAime ? couleur : '#DDEBE4', color: p.jAime ? couleur : '#334A42' }}>
                {p.jAime ? '♥' : '♡'} {p.jaime}
              </button>
            ) : (
              <span className="text-[#5E7A6E]">♥ {p.jaime}</span>
            )}
            {mode === 'academie' ? (
              <>
                <button type="button" onClick={() => moderer(p.id, { epinglee: !p.epinglee })} disabled={occupe} className="rounded-lg border-2 border-[#DDEBE4] px-3 py-1.5 font-bold">
                  {p.epinglee ? 'Désépingler' : 'Épingler'}
                </button>
                <button type="button" onClick={() => moderer(p.id, { masquee: !p.masquee })} disabled={occupe} className="rounded-lg border-2 border-[#DDEBE4] px-3 py-1.5 font-bold">
                  {p.masquee ? 'Rendre visible' : 'Masquer'}
                </button>
              </>
            ) : null}
            {mode === 'academie' || p.estMoi ? (
              <button type="button" onClick={() => supprimer(p.id)} disabled={occupe} className="rounded-lg border-2 border-[#F3B0C2] px-3 py-1.5 font-bold text-[#8A1B3D]">
                Supprimer
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2 border-t border-[#EEF3F0] pt-3">
            {p.commentaires.map((c) => (
              <div key={c.id} className={`rounded-xl bg-[#F7F8F7] px-4 py-2.5 ${c.masque ? 'opacity-50' : ''}`}>
                <p className="text-sm">
                  <strong className="text-[#12312A]">{c.auteur}</strong>
                  {c.parAcademie ? ' · École' : ''}
                  {mode === 'academie' ? (
                    <button type="button" onClick={() => masquerCommentaire(p.id, c.id, !c.masque)} className="ml-2 font-bold underline underline-offset-2">
                      {c.masque ? 'Rendre visible' : 'Masquer'}
                    </button>
                  ) : null}
                </p>
                <p className="mt-0.5 whitespace-pre-line text-[15px] leading-relaxed">{c.texte}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={reponses[p.id] ?? ''}
                onChange={(e) => setReponses((r) => ({ ...r, [p.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commenter(p.id);
                }}
                placeholder="Écrire un commentaire…"
                className="min-w-0 flex-1 rounded-xl border-2 border-[#DDEBE4] bg-white px-3 py-2 text-[15px] focus:outline-none"
                maxLength={4000}
              />
              <button type="button" onClick={() => commenter(p.id)} disabled={occupe} className="rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60" style={{ backgroundColor: couleur }}>
                Répondre
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
