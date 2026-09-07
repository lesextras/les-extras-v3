'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from './_client';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP } from './_ui';
import { valeursInitiales, type ChampFabrique, type ModeleFabrique, type Prerempli } from './_fabrique';
import { DeposerFichiers } from './DeposerFichiers';

/**
 * FABRIQUER UN DOCUMENT, ÉCRAN PAR ÉCRAN.
 *
 * Comme un formulaire HelloAsso : un titre, des pastilles 1 › 2 › 3, une
 * carte blanche avec peu de champs, un bouton en bas. À la fin, le PDF est
 * rangé dans le classeur (connecté) ou téléchargé (sans compte), et Word
 * reste disponible pour modifier.
 */

type Valeurs = Record<string, unknown>;
type Ligne = Record<string, unknown>;

interface Resultat {
  fileId?: string;
  nom?: string;
  range?: 'CLASSEUR' | 'DOCUMENTS';
  telecharge?: boolean;
}

async function telechargerFichier(code: string, valeurs: Valeurs, format: 'pdf' | 'docx') {
  const res = await fetch(`/api/proxy/public/association/fabrique/${code}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: '*/*' },
    body: JSON.stringify({ valeurs, format }),
  });
  if (!res.ok) {
    let message = 'La fabrication a échoué.';
    try {
      const j = (await res.json()) as { message?: string | string[] };
      const m = Array.isArray(j.message) ? j.message.join(' · ') : j.message;
      if (m) message = m;
    } catch {
      /* corps non JSON */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const dispo = res.headers.get('content-disposition') ?? '';
  const nom = /filename="([^"]+)"/.exec(dispo)?.[1] ?? `document.${format}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function FabriqueDocument({
  modele,
  prerempli,
  connecte,
  onFermer,
}: {
  modele: ModeleFabrique;
  prerempli: Prerempli;
  connecte: boolean;
  onFermer: () => void;
}) {
  const router = useRouter();
  const [valeurs, setValeurs] = useState<Valeurs>(() => valeursInitiales(modele, prerempli));
  const [page, setPage] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [depot, setDepot] = useState(false);

  const pages = useMemo(() => {
    const cites = new Set(modele.pages.flatMap((p) => p.champs));
    const restes = modele.champs.filter((c) => !cites.has(c.nom)).map((c) => c.nom);
    const liste = modele.pages.map((p) => ({ ...p, champs: [...p.champs] }));
    if (liste.length === 0) liste.push({ titre: 'Le document', champs: [] });
    liste[liste.length - 1].champs.push(...restes);
    return liste.map((p) => ({ titre: p.titre, champs: p.champs.map((n) => modele.champs.find((c) => c.nom === n)).filter(Boolean) as ChampFabrique[] }));
  }, [modele]);

  const derniere = page === pages.length - 1;

  function poser(nom: string, v: unknown) {
    setValeurs((prev) => ({ ...prev, [nom]: v }));
  }

  function manquantsSurPage(i: number) {
    return pages[i].champs
      .filter((c) => c.requis)
      .filter((c) => {
        const v = valeurs[c.nom];
        if (c.type === 'liste') return !(Array.isArray(v) && (v as Ligne[]).some((l) => Object.values(l).some((x) => String(x ?? '').trim())));
        return !String(v ?? '').trim();
      })
      .map((c) => c.libelle);
  }

  function suivant() {
    const m = manquantsSurPage(page);
    if (m.length) {
      setErreur(`À remplir : ${m.join(', ')}.`);
      return;
    }
    setErreur(null);
    setPage((p) => Math.min(p + 1, pages.length - 1));
  }

  function nettoyer(): Valeurs {
    const v: Valeurs = {};
    for (const c of modele.champs) {
      const x = valeurs[c.nom];
      if (c.type === 'liste') v[c.nom] = (Array.isArray(x) ? (x as Ligne[]) : []).filter((l) => Object.values(l).some((y) => String(y ?? '').trim()));
      else if (c.type === 'nombre') v[c.nom] = x === '' || x === null || x === undefined ? '' : Number(x);
      else v[c.nom] = x ?? '';
    }
    return v;
  }

  async function fabriquer() {
    const m = manquantsSurPage(page);
    if (m.length) {
      setErreur(`À remplir : ${m.join(', ')}.`);
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      const propres = nettoyer();
      if (connecte) {
        const r = await appel<Resultat>(`/association/fabrique/${modele.code}`, { method: 'POST', body: { valeurs: propres } });
        setResultat(r);
        router.refresh();
      } else {
        await telechargerFichier(modele.code, propres, 'pdf');
        setResultat({ telecharge: true });
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La fabrication a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  async function word() {
    setEnCours(true);
    setErreur(null);
    try {
      await telechargerFichier(modele.code, nettoyer(), 'docx');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le téléchargement a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  /* ------------------------------------------------------------- résultat */
  if (resultat) {
    return (
      <section className={`${CARTE} p-6 text-center sm:p-8`}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E3F5EC] text-2xl font-extrabold text-[#0F5F3E]">✓</span>
        <h2 className="mt-4 text-2xl font-extrabold text-[#1D1B5C]">{modele.titre} : c&apos;est prêt.</h2>
        <p className="mt-2 text-[#3B3A66]">
          {resultat.range === 'CLASSEUR'
            ? 'Le PDF est rangé dans ton classeur.'
            : resultat.range === 'DOCUMENTS'
              ? 'Le PDF est rangé dans « Mes documents ».'
              : 'Le PDF est téléchargé. Crée ton espace pour le garder au classeur.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {resultat.fileId ? (
            <a href={`/api/proxy/files/${resultat.fileId}`} target="_blank" rel="noopener" className={BTN_PRIMAIRE}>
              Voir le PDF
            </a>
          ) : null}
          <button type="button" onClick={word} disabled={enCours} className={BTN_SECONDAIRE}>
            {enCours ? 'Un instant…' : 'Version Word, pour modifier'}
          </button>
          <button type="button" onClick={onFermer} className={BTN_SECONDAIRE}>
            Fermer
          </button>
        </div>
        {erreur ? <p className="mt-3 text-sm text-[#8A2419]">{erreur}</p> : null}
      </section>
    );
  }

  /* ------------------------------------------------------------ formulaire */
  return (
    <section aria-label={`Fabriquer : ${modele.titre}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#1D1B5C]">{modele.titre}</h2>
        <button type="button" onClick={onFermer} className="text-sm font-bold text-[#6B6A8A] hover:text-[#1D1B5C]">
          Annuler
        </button>
      </div>

      {/* pastilles 1 › 2 › 3 */}
      <ol className="mb-5 flex flex-wrap items-center gap-2" aria-label="Écrans du formulaire">
        {pages.map((p, i) => (
          <li key={p.titre} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < page && setPage(i)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${
                i === page
                  ? 'border-[#4F46E5] bg-[#ECEBFC] text-[#1D1B5C]'
                  : i < page
                    ? 'border-[#D9D6EE] bg-white text-[#1D1B5C] hover:border-[#4F46E5]'
                    : 'border-[#E6E4F3] bg-white text-[#6B6A8A]'
              }`}
              aria-current={i === page ? 'step' : undefined}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${i === page ? 'bg-[#4F46E5] text-white' : i < page ? 'bg-[#1D1B5C] text-white' : 'border border-[#C7C4F2]'}`}>
                {i < page ? '✓' : i + 1}
              </span>
              {p.titre}
            </button>
            {i < pages.length - 1 ? <span className="text-[#9A99B5]">›</span> : null}
          </li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className={`${CARTE} p-5 sm:p-6`}>
          <h3 className="text-xl font-extrabold text-[#1D1B5C]">{pages[page].titre}</h3>
          <div className="mt-4 space-y-5">
            {pages[page].champs.map((c) => (
              <ChampFormulaire key={c.nom} champ={c} valeur={valeurs[c.nom]} onChange={(v) => poser(c.nom, v)} />
            ))}
          </div>
        </div>
        <aside className="rounded-2xl border-t-4 border-[#C7C4F2] bg-[#F5F4FC] p-5">
          <p className="font-extrabold text-[#1D1B5C]">Ce que ça fait</p>
          <p className="mt-1 text-sm leading-relaxed">{modele.enUnMot}</p>
          <p className="mt-3 text-sm leading-relaxed text-[#6B6A8A]">
            {connecte
              ? modele.piece
                ? 'À la fin, le PDF est rangé dans ton classeur, à la bonne place.'
                : 'À la fin, le PDF est rangé dans « Mes documents ».'
              : 'À la fin, tu télécharges le PDF. Avec un espace, il serait rangé dans ton classeur.'}{' '}
            La version Word reste disponible pour modifier une phrase.
          </p>
        </aside>
      </div>

      {erreur ? <p className="mt-3 text-sm font-bold text-[#8A2419]">{erreur}</p> : null}

      {/* On a déjà le document : pas la peine de le refaire, on le dépose. */}
      {connecte ? (
        <div className="mt-4 rounded-2xl border border-[#E6E4F3] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-relaxed text-[#3B3A66]">
              <span className="font-extrabold text-[#1D1B5C]">Tu as déjà ce document ?</span> Dépose-le plutôt, et plusieurs fichiers si besoin.
            </p>
            <button type="button" onClick={() => setDepot((v) => !v)} className={`${BTN_SECONDAIRE} !py-2 text-sm`}>
              {depot ? 'Masquer' : 'Déposer des fichiers'}
            </button>
          </div>
          {depot ? (
            <div className="mt-3">
              <DeposerFichiers
                piece={modele.piece ?? undefined}
                categorie={modele.categorie ?? 'Autre'}
                titre={modele.titre}
                onFini={onFermer}
                onAnnuler={() => setDepot(false)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E6E4F3] pt-4">
        <button type="button" onClick={() => (page > 0 ? setPage(page - 1) : onFermer())} className={BTN_SECONDAIRE}>
          {page > 0 ? '← Retour' : 'Annuler'}
        </button>
        {derniere ? (
          <button type="button" onClick={fabriquer} disabled={enCours} className={BTN_PRIMAIRE}>
            {enCours ? 'Fabrication…' : 'Fabriquer le document'}
          </button>
        ) : (
          <button type="button" onClick={suivant} className={BTN_PRIMAIRE}>
            Suivant →
          </button>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ champs */

function Etiquette({ champ, children }: { champ: ChampFabrique; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">
        {champ.libelle}
        {champ.requis ? <span className="text-[#4F46E5]"> *</span> : null}
      </span>
      {children}
      {champ.aide ? <span className="mt-1 block text-sm text-[#6B6A8A]">{champ.aide}</span> : null}
    </label>
  );
}

function ChampFormulaire({ champ, valeur, onChange }: { champ: ChampFabrique; valeur: unknown; onChange: (v: unknown) => void }) {
  if (champ.type === 'liste') {
    const lignes = (Array.isArray(valeur) ? valeur : []) as Ligne[];
    const colonnes = champ.colonnes ?? [];
    const vide = () => Object.fromEntries(colonnes.map((c) => [c.nom, '']));
    const modifier = (i: number, nom: string, v: string) => onChange(lignes.map((l, j) => (j === i ? { ...l, [nom]: v } : l)));
    return (
      <div>
        <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">
          {champ.libelle}
          {champ.requis ? <span className="text-[#4F46E5]"> *</span> : null}
        </span>
        {champ.aide ? <span className="mb-2 block text-sm text-[#6B6A8A]">{champ.aide}</span> : null}
        <div className="overflow-x-auto rounded-xl border border-[#E6E4F3]">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-[#F5F4FC] text-left text-xs font-bold uppercase tracking-wide text-[#6B6A8A]">
              <tr>
                {colonnes.map((c) => (
                  <th key={c.nom} className={`px-2 py-2 ${c.large ? 'w-2/5' : ''}`}>
                    {c.libelle}
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={i} className="border-t border-[#E6E4F3]">
                  {colonnes.map((c) => (
                    <td key={c.nom} className="px-1.5 py-1.5">
                      <input
                        type={c.type === 'nombre' ? 'number' : c.type === 'date' ? 'date' : 'text'}
                        step={c.type === 'nombre' ? 'any' : undefined}
                        value={String(l[c.nom] ?? '')}
                        onChange={(e) => modifier(i, c.nom, e.target.value)}
                        className="w-full rounded-lg border border-[#D9D6EE] px-2 py-1.5 text-sm focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#ECEBFC]"
                      />
                    </td>
                  ))}
                  <td className="px-1 text-center">
                    <button type="button" onClick={() => onChange(lignes.filter((_, j) => j !== i))} aria-label="Retirer la ligne" className="text-lg text-[#9A99B5] hover:text-[#C0392B]">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => onChange([...lignes, vide()])} className="mt-2 text-sm font-bold text-[#4F46E5] hover:underline">
          + Ajouter une ligne
        </button>
      </div>
    );
  }
  const commun = `${CHAMP} !py-2.5`;
  if (champ.type === 'long') {
    return (
      <Etiquette champ={champ}>
        <textarea value={String(valeur ?? '')} onChange={(e) => onChange(e.target.value)} rows={4} maxLength={2000} className={commun} />
      </Etiquette>
    );
  }
  return (
    <Etiquette champ={champ}>
      <input
        type={champ.type === 'nombre' ? 'number' : champ.type === 'date' ? 'date' : 'text'}
        step={champ.type === 'nombre' ? 'any' : undefined}
        value={String(valeur ?? '')}
        onChange={(e) => onChange(e.target.value)}
        maxLength={champ.type === 'texte' ? 300 : undefined}
        className={commun}
      />
    </Etiquette>
  );
}
