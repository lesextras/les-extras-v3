'use client';

import { useMemo, useState } from 'react';
import {
  AVEC_BORNES,
  AVEC_OPTIONS,
  NOM_DU_TYPE,
  TYPES_CHAMP,
  nouvelIdentifiant,
  valeurLisible,
  type Champ,
  type FormulaireComplet,
  type Reponse,
  type Teinte,
  type TypeChamp,
} from './types';

/**
 * L'ATELIER : on compose le formulaire question par question.
 *
 * Le même écran sert les deux espaces. Il fait trois choses, dans trois
 * onglets : les questions, les réglages, les réponses. Rien n'est enregistré
 * tant qu'on n'a pas cliqué — on peut donc essayer sans casser.
 *
 * Le glisser-déposer est volontairement absent : deux flèches montent et
 * descendent une question, et ça marche au clavier, au doigt et à la souris.
 */
export function Atelier({
  formulaire: initial,
  reponsesInitiales,
  teinte,
  origine,
}: {
  formulaire: FormulaireComplet;
  reponsesInitiales: Reponse[];
  teinte: Teinte;
  /** L'adresse du site, pour composer le lien à partager. */
  origine: string;
}) {
  const [f, setF] = useState<FormulaireComplet>(initial);
  const [onglet, setOnglet] = useState<'questions' | 'reglages' | 'reponses'>('questions');
  const [enregistre, setEnregistre] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  // Ceinture et bretelles : si l'API changeait de forme, la page afficherait
  // « aucune réponse » plutôt que de tomber en panne devant la personne.
  const reponses = Array.isArray(reponsesInitiales) ? reponsesInitiales : [];

  const lien = `${origine}/f/${f.slug}`;

  function changer(patch: Partial<FormulaireComplet>) {
    setF((p) => ({ ...p, ...patch }));
    setEnregistre(false);
    setMessage(null);
  }

  function changerChamp(index: number, patch: Partial<Champ>) {
    changer({ champs: f.champs.map((c, i) => (i === index ? { ...c, ...patch } : c)) });
  }

  function ajouter(type: TypeChamp) {
    const champ: Champ = {
      id: nouvelIdentifiant(),
      type,
      libelle: type === 'TITRE' ? 'Nouvelle partie' : 'Nouvelle question',
      obligatoire: false,
    };
    if (AVEC_OPTIONS.includes(type)) champ.options = ['Première réponse', 'Deuxième réponse'];
    if (type === 'ECHELLE') { champ.min = 1; champ.max = 5; }
    changer({ champs: [...f.champs, champ] });
  }

  function deplacer(index: number, sens: -1 | 1) {
    const cible = index + sens;
    if (cible < 0 || cible >= f.champs.length) return;
    const copie = [...f.champs];
    [copie[index], copie[cible]] = [copie[cible], copie[index]];
    changer({ champs: copie });
  }

  async function enregistrer(patch?: Partial<FormulaireComplet>) {
    const corps = { ...f, ...patch };
    setOccupe(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/proxy/formulaires/${f.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          titre: corps.titre,
          introduction: corps.introduction ?? '',
          champs: corps.champs,
          remerciement: corps.remerciement ?? '',
          reponseUnique: corps.reponseUnique,
          demanderEmail: corps.demanderEmail,
          slug: corps.slug,
          statut: corps.statut,
        }),
      });
      const charge = await res.json().catch(() => null);
      if (!res.ok) throw new Error(charge?.message ?? "L'enregistrement n'a pas abouti.");
      setF(charge as FormulaireComplet);
      setEnregistre(true);
      setMessage('Enregistré.');
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'enregistrement n'a pas abouti.");
    } finally {
      setOccupe(false);
    }
  }

  const csv = useMemo(() => construireCsv(f.champs, reponses), [f.champs, reponses]);

  return (
    <div>
      {/* ------------------------------------------------------- l'en-tête */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <input
            value={f.titre}
            onChange={(e) => changer({ titre: e.target.value })}
            className="w-full rounded-xl border-2 border-transparent bg-transparent px-2 py-1 text-3xl font-extrabold tracking-tight outline-none focus:border-current sm:text-4xl"
            style={{ color: teinte.encre }}
            aria-label="Titre du formulaire"
          />
          <p className="mt-1 px-2 text-sm" style={{ color: teinte.sourdine }}>
            {f.statut === 'PUBLIE' ? 'Publié' : f.statut === 'FERME' ? 'Fermé' : 'Brouillon'} ·{' '}
            {f.champs.filter((c) => c.type !== 'TITRE').length} question(s) · {reponses.length} réponse(s)
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => enregistrer()}
            disabled={occupe}
            className="rounded-xl px-4 py-2.5 text-[15px] font-extrabold text-white transition disabled:opacity-60"
            style={{ background: teinte.plein }}
          >
            {occupe ? 'Enregistrement…' : enregistre ? 'Enregistré' : 'Enregistrer'}
          </button>
          {f.statut === 'PUBLIE' ? (
            <button
              type="button"
              onClick={() => enregistrer({ statut: 'FERME' })}
              disabled={occupe}
              className="rounded-xl border-2 bg-white px-4 py-2 text-[15px] font-extrabold transition disabled:opacity-60"
              style={{ borderColor: teinte.bord, color: teinte.encre }}
            >
              Fermer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => enregistrer({ statut: 'PUBLIE' })}
              disabled={occupe}
              className="rounded-xl border-2 bg-white px-4 py-2 text-[15px] font-extrabold transition disabled:opacity-60"
              style={{ borderColor: teinte.bord, color: teinte.encre }}
            >
              Publier
            </button>
          )}
        </div>
      </div>

      {message ? (
        <p className="mb-4 rounded-xl px-4 py-2.5 text-[15px] font-bold" style={{ background: teinte.clair, color: teinte.plein }}>
          {message}
        </p>
      ) : null}
      {erreur ? (
        <p className="mb-4 rounded-xl bg-[#FDE7EC] px-4 py-2.5 text-[15px] font-bold text-[#8A1B3D]">{erreur}</p>
      ) : null}

      {/* --------------------------------------------------- l'adresse à partager */}
      {f.statut !== 'BROUILLON' ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border p-4" style={{ borderColor: teinte.bord, background: 'white' }}>
          <span className="text-sm font-extrabold uppercase tracking-[0.1em]" style={{ color: teinte.sourdine }}>
            À partager
          </span>
          <code className="min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-[15px]" style={{ background: teinte.fond, color: teinte.encre }}>
            {lien}
          </code>
          <button
            type="button"
            onClick={() => { void navigator.clipboard?.writeText(lien); setMessage('Adresse copiée.'); }}
            className="rounded-xl border-2 bg-white px-4 py-2 text-[15px] font-bold transition"
            style={{ borderColor: teinte.bord, color: teinte.encre }}
          >
            Copier
          </button>
          <a
            href={`/f/${f.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl px-4 py-2 text-[15px] font-bold text-white no-underline"
            style={{ background: teinte.plein }}
          >
            Voir
          </a>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- les onglets */}
      <div className="mb-5 flex flex-wrap gap-2 border-b" style={{ borderColor: teinte.bord }}>
        {([
          ['questions', 'Les questions'],
          ['reglages', 'Les réglages'],
          ['reponses', `Les réponses (${reponses.length})`],
        ] as const).map(([code, libelle]) => (
          <button
            key={code}
            type="button"
            onClick={() => setOnglet(code)}
            className="-mb-px border-b-[3px] px-3 py-2.5 text-[15px] font-extrabold transition"
            style={{
              borderColor: onglet === code ? teinte.plein : 'transparent',
              color: onglet === code ? teinte.plein : teinte.sourdine,
            }}
          >
            {libelle}
          </button>
        ))}
      </div>

      {onglet === 'questions' ? (
        <Questions f={f} teinte={teinte} changer={changer} changerChamp={changerChamp} deplacer={deplacer} ajouter={ajouter} />
      ) : null}

      {onglet === 'reglages' ? <Reglages f={f} teinte={teinte} changer={changer} /> : null}

      {onglet === 'reponses' ? <Reponses f={f} teinte={teinte} reponses={reponses} csv={csv} /> : null}
    </div>
  );
}

/* ============================================================== les questions */

function Questions({
  f,
  teinte,
  changer,
  changerChamp,
  deplacer,
  ajouter,
}: {
  f: FormulaireComplet;
  teinte: Teinte;
  changer: (patch: Partial<FormulaireComplet>) => void;
  changerChamp: (index: number, patch: Partial<Champ>) => void;
  deplacer: (index: number, sens: -1 | 1) => void;
  ajouter: (type: TypeChamp) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-extrabold" style={{ color: teinte.encre }}>
        Le mot d&apos;introduction
      </label>
      <textarea
        value={f.introduction ?? ''}
        onChange={(e) => changer({ introduction: e.target.value })}
        rows={2}
        placeholder="Ce qu'il faut savoir avant de répondre. Facultatif."
        className="mb-7 w-full rounded-xl border bg-white px-4 py-3 text-base outline-none"
        style={{ borderColor: teinte.bord, color: teinte.texte }}
      />

      <ol className="space-y-4">
        {f.champs.map((champ, i) => (
          <li key={champ.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: teinte.bord }}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold" style={{ color: teinte.sourdine }}>
                {champ.type === 'TITRE' ? 'Partie' : `Question ${f.champs.slice(0, i + 1).filter((c) => c.type !== 'TITRE').length}`}
              </span>
              <select
                value={champ.type}
                onChange={(e) => {
                  const type = e.target.value as TypeChamp;
                  const patch: Partial<Champ> = { type };
                  if (AVEC_OPTIONS.includes(type) && !champ.options?.length) patch.options = ['Première réponse'];
                  if (type === 'ECHELLE') { patch.min = champ.min ?? 1; patch.max = champ.max ?? 5; }
                  if (type === 'TITRE') patch.obligatoire = false;
                  changerChamp(i, patch);
                }}
                className="rounded-lg border px-2 py-1.5 text-sm font-bold"
                style={{ borderColor: teinte.bord, color: teinte.encre }}
                aria-label="Type de question"
              >
                {TYPES_CHAMP.map((t) => (
                  <option key={t} value={t}>
                    {NOM_DU_TYPE[t]}
                  </option>
                ))}
              </select>

              <span className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => deplacer(i, -1)} aria-label="Monter la question"
                  className="rounded-lg border px-2 py-1 text-sm font-bold" style={{ borderColor: teinte.bord, color: teinte.texte }}>↑</button>
                <button type="button" onClick={() => deplacer(i, 1)} aria-label="Descendre la question"
                  className="rounded-lg border px-2 py-1 text-sm font-bold" style={{ borderColor: teinte.bord, color: teinte.texte }}>↓</button>
                <button
                  type="button"
                  onClick={() => changer({ champs: f.champs.filter((_, n) => n !== i) })}
                  className="rounded-lg border border-[#F3B0C2] px-2 py-1 text-sm font-bold text-[#8A1B3D]"
                >
                  Retirer
                </button>
              </span>
            </div>

            <input
              value={champ.libelle}
              onChange={(e) => changerChamp(i, { libelle: e.target.value })}
              placeholder="La question, telle qu'elle sera lue"
              className="mb-2 w-full rounded-xl border px-4 py-2.5 text-base font-bold outline-none"
              style={{ borderColor: teinte.bord, color: teinte.encre }}
            />
            <input
              value={champ.aide ?? ''}
              onChange={(e) => changerChamp(i, { aide: e.target.value })}
              placeholder="Une précision sous la question. Facultatif."
              className="w-full rounded-xl border px-4 py-2 text-[15px] outline-none"
              style={{ borderColor: teinte.bord, color: teinte.texte }}
            />

            {AVEC_OPTIONS.includes(champ.type) ? (
              <div className="mt-3">
                <p className="mb-1.5 text-sm font-extrabold" style={{ color: teinte.encre }}>Les réponses possibles</p>
                <div className="space-y-2">
                  {(champ.options ?? []).map((option, n) => (
                    <div key={n} className="flex items-center gap-2">
                      <input
                        value={option}
                        onChange={(e) =>
                          changerChamp(i, { options: (champ.options ?? []).map((o, k) => (k === n ? e.target.value : o)) })
                        }
                        className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-[15px] outline-none"
                        style={{ borderColor: teinte.bord, color: teinte.texte }}
                      />
                      <button
                        type="button"
                        onClick={() => changerChamp(i, { options: (champ.options ?? []).filter((_, k) => k !== n) })}
                        className="rounded-lg border px-2 py-1.5 text-sm font-bold"
                        style={{ borderColor: teinte.bord, color: teinte.sourdine }}
                        aria-label="Retirer cette réponse"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => changerChamp(i, { options: [...(champ.options ?? []), `Réponse ${(champ.options?.length ?? 0) + 1}`] })}
                  className="mt-2 rounded-lg px-3 py-1.5 text-sm font-bold"
                  style={{ background: teinte.clair, color: teinte.plein }}
                >
                  Ajouter une réponse
                </button>
              </div>
            ) : null}

            {AVEC_BORNES.includes(champ.type) ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="text-sm font-bold" style={{ color: teinte.texte }}>
                  De{' '}
                  <input
                    type="number"
                    value={champ.min ?? ''}
                    onChange={(e) => changerChamp(i, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-20 rounded-lg border px-2 py-1.5"
                    style={{ borderColor: teinte.bord, color: teinte.encre }}
                  />
                </label>
                <label className="text-sm font-bold" style={{ color: teinte.texte }}>
                  à{' '}
                  <input
                    type="number"
                    value={champ.max ?? ''}
                    onChange={(e) => changerChamp(i, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-20 rounded-lg border px-2 py-1.5"
                    style={{ borderColor: teinte.bord, color: teinte.encre }}
                  />
                </label>
              </div>
            ) : null}

            {champ.type !== 'TITRE' ? (
              <label className="mt-3 flex items-center gap-2 text-[15px] font-bold" style={{ color: teinte.texte }}>
                <input
                  type="checkbox"
                  checked={champ.obligatoire}
                  onChange={(e) => changerChamp(i, { obligatoire: e.target.checked })}
                  className="h-4 w-4"
                />
                Réponse obligatoire
              </label>
            ) : null}
          </li>
        ))}
      </ol>

      {!f.champs.length ? (
        <p className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: teinte.bord, color: teinte.sourdine }}>
          Aucune question pour l&apos;instant. Ajoute la première ci-dessous.
        </p>
      ) : null}

      <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: teinte.bord, background: teinte.fond }}>
        <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.1em]" style={{ color: teinte.sourdine }}>
          Ajouter une question
        </p>
        <div className="flex flex-wrap gap-2">
          {TYPES_CHAMP.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => ajouter(t)}
              className="rounded-xl border-2 bg-white px-3 py-2 text-sm font-bold transition"
              style={{ borderColor: teinte.bord, color: teinte.encre }}
            >
              + {NOM_DU_TYPE[t]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =============================================================== les réglages */

function Reglages({
  f,
  teinte,
  changer,
}: {
  f: FormulaireComplet;
  teinte: Teinte;
  changer: (patch: Partial<FormulaireComplet>) => void;
}) {
  return (
    <div className="max-w-[62ch] space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-extrabold" style={{ color: teinte.encre }}>
          L&apos;adresse à partager
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[15px]" style={{ color: teinte.sourdine }}>/f/</span>
          <input
            value={f.slug}
            onChange={(e) => changer({ slug: e.target.value })}
            className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-2.5 text-base outline-none"
            style={{ borderColor: teinte.bord, color: teinte.encre }}
          />
        </div>
        <p className="mt-1.5 text-sm" style={{ color: teinte.sourdine }}>
          Lettres, chiffres et tirets. Si tu la changes, l&apos;ancienne adresse ne fonctionne plus.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-extrabold" style={{ color: teinte.encre }}>
          Le mot après l&apos;envoi
        </label>
        <textarea
          value={f.remerciement ?? ''}
          onChange={(e) => changer({ remerciement: e.target.value })}
          rows={2}
          placeholder="Merci, ta réponse est bien arrivée."
          className="w-full rounded-xl border bg-white px-4 py-3 text-base outline-none"
          style={{ borderColor: teinte.bord, color: teinte.texte }}
        />
      </div>

      <label className="flex items-start gap-3 rounded-2xl border bg-white p-4" style={{ borderColor: teinte.bord }}>
        <input
          type="checkbox"
          checked={f.demanderEmail}
          onChange={(e) => changer({ demanderEmail: e.target.checked })}
          className="mt-1 h-4 w-4"
        />
        <span>
          <span className="block text-[15px] font-extrabold" style={{ color: teinte.encre }}>Demander l&apos;adresse e-mail</span>
          <span className="mt-0.5 block text-sm" style={{ color: teinte.sourdine }}>
            Elle est demandée avant les questions, et sert à répondre.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border bg-white p-4" style={{ borderColor: teinte.bord }}>
        <input
          type="checkbox"
          checked={f.reponseUnique}
          onChange={(e) => changer({ reponseUnique: e.target.checked })}
          className="mt-1 h-4 w-4"
        />
        <span>
          <span className="block text-[15px] font-extrabold" style={{ color: teinte.encre }}>Une seule réponse par adresse</span>
          <span className="mt-0.5 block text-sm" style={{ color: teinte.sourdine }}>
            Utile pour une adhésion ou un vote. Sans effet si l&apos;e-mail n&apos;est pas demandé.
          </span>
        </span>
      </label>
    </div>
  );
}

/* =============================================================== les réponses */

function Reponses({
  f,
  teinte,
  reponses,
  csv,
}: {
  f: FormulaireComplet;
  teinte: Teinte;
  reponses: Reponse[];
  csv: string;
}) {
  const questions = f.champs.filter((c) => c.type !== 'TITRE');

  if (!reponses.length) {
    return (
      <p className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: teinte.bord, color: teinte.sourdine }}>
        Aucune réponse pour l&apos;instant. Partage l&apos;adresse, elles arriveront ici.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-[15px] font-bold" style={{ color: teinte.texte }}>
          {reponses.length} réponse{reponses.length > 1 ? 's' : ''}
        </p>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download={`${f.slug}-reponses.csv`}
          className="rounded-xl border-2 bg-white px-4 py-2 text-[15px] font-bold no-underline"
          style={{ borderColor: teinte.bord, color: teinte.encre }}
        >
          Télécharger en CSV
        </a>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white" style={{ borderColor: teinte.bord }}>
        <table className="w-full min-w-[640px] text-left text-[15px]">
          <thead>
            <tr style={{ background: teinte.fond }}>
              <th className="px-4 py-3 font-extrabold" style={{ color: teinte.encre }}>Reçue le</th>
              {f.demanderEmail ? <th className="px-4 py-3 font-extrabold" style={{ color: teinte.encre }}>E-mail</th> : null}
              {questions.map((c) => (
                <th key={c.id} className="px-4 py-3 font-extrabold" style={{ color: teinte.encre }}>{c.libelle}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reponses.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: teinte.bord }}>
                <td className="whitespace-nowrap px-4 py-3" style={{ color: teinte.sourdine }}>
                  {new Date(r.recueLe).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                {f.demanderEmail ? <td className="px-4 py-3" style={{ color: teinte.texte }}>{r.email ?? '—'}</td> : null}
                {questions.map((c) => (
                  <td key={c.id} className="px-4 py-3" style={{ color: teinte.texte }}>
                    {valeurLisible(r.valeurs?.[c.id]) || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Un CSV qu'Excel ouvre sans se plaindre : point-virgule et guillemets doublés. */
function construireCsv(champs: Champ[], reponses: Reponse[]) {
  const questions = champs.filter((c) => c.type !== 'TITRE');
  const entete = ['Reçue le', 'E-mail', ...questions.map((c) => c.libelle)];
  const lignes = reponses.map((r) => [
    new Date(r.recueLe).toLocaleString('fr-FR'),
    r.email ?? '',
    ...questions.map((c) => valeurLisible(r.valeurs?.[c.id])),
  ]);
  return [entete, ...lignes]
    .map((ligne) => ligne.map((cellule) => `"${String(cellule).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
}
