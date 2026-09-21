'use client';

import { useState } from 'react';
import type { CompteAdmin, CoursAdmin, FormulaireAdmin, PersonneAdmin, Tableau } from './_admin';

/**
 * LA CONSOLE.
 *
 * Quatre vues, un seul écran : ce qu'il y a, les espaces, les personnes, ce qui
 * a été créé. Tout est déjà chargé côté serveur — la console ne fait que
 * montrer, filtrer, et deux gestes d'écriture : renommer un espace, donner ou
 * retirer un accès.
 */
export function Console({
  tableau,
  comptes: comptesInitiaux,
  personnes: personnesInitiales,
  formulaires,
  cours,
}: {
  tableau: Tableau;
  comptes: CompteAdmin[];
  personnes: PersonneAdmin[];
  formulaires: FormulaireAdmin[];
  cours: CoursAdmin[];
}) {
  const [vue, setVue] = useState<'tableau' | 'espaces' | 'personnes' | 'contenus'>('tableau');
  const [comptes, setComptes] = useState(comptesInitiaux);
  const [personnes, setPersonnes] = useState(personnesInitiales);
  const [filtre, setFiltre] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function ecrire(chemin: string, corps: unknown) {
    setOccupe(true);
    setErreur(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/proxy${chemin}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify(corps),
      });
      const texte = await res.text();
      const data = texte ? JSON.parse(texte) : {};
      if (!res.ok) throw new Error(data?.message ?? "L'opération n'a pas abouti.");
      return data as Record<string, unknown>;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
      return null;
    } finally {
      setOccupe(false);
    }
  }

  async function renommer(c: CompteAdmin, nom: string) {
    const d = await ecrire(`/administration/comptes/${c.id}`, { name: nom });
    if (!d) return;
    setComptes((p) => p.map((x) => (x.id === c.id ? { ...x, nom } : x)));
    setMessage(`L'espace s'appelle maintenant « ${nom} ».`);
  }

  async function changerRole(p: PersonneAdmin, role: 'USER' | 'ADMIN') {
    const d = await ecrire(`/administration/personnes/${p.id}`, { role });
    if (!d) return;
    setPersonnes((liste) => liste.map((x) => (x.id === p.id ? { ...x, role } : x)));
    setMessage(role === 'ADMIN' ? `${p.email} entre dans l'administration.` : `${p.email} redevient un compte ordinaire.`);
  }

  async function changerStatut(p: PersonneAdmin, statut: 'VERIFIED' | 'BANNED') {
    const d = await ecrire(`/administration/personnes/${p.id}`, { status: statut });
    if (!d) return;
    setPersonnes((liste) => liste.map((x) => (x.id === p.id ? { ...x, statut } : x)));
    setMessage(statut === 'BANNED' ? `${p.email} est suspendu.` : `${p.email} peut de nouveau se connecter.`);
  }

  const cherche = (t: string) => (filtre.trim() ? t.toLowerCase().includes(filtre.trim().toLowerCase()) : true);

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-1 rounded-2xl bg-[#151428] p-1.5">
        {(
          [
            ['tableau', 'Vue générale'],
            ['espaces', `Les espaces (${comptes.length})`],
            ['personnes', `Les personnes (${personnes.length})`],
            ['contenus', 'Ce qui a été créé'],
          ] as const
        ).map(([cle, libelle]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setVue(cle)}
            className={`rounded-xl px-4 py-2.5 text-[15px] font-bold transition ${
              vue === cle ? 'bg-[#4F46E5] text-white' : 'text-[#A6A3D0] hover:bg-[#201F3A] hover:text-white'
            }`}
          >
            {libelle}
          </button>
        ))}
      </nav>

      {erreur ? (
        <p className="mb-4 rounded-2xl border border-[#7A1D3A] bg-[#2A1220] px-5 py-4 text-[15px] font-bold text-[#F3B0C2]">{erreur}</p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-2xl border border-[#2E4B3E] bg-[#12241C] px-5 py-4 text-[15px] font-bold text-[#8FD9B4]">{message}</p>
      ) : null}

      {vue === 'tableau' ? <Vue tableau={tableau} /> : null}

      {vue !== 'tableau' ? (
        <input
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          placeholder="Chercher un nom, une adresse e-mail, un titre"
          className="mb-4 w-full rounded-xl border border-[#312F55] bg-[#151428] px-4 py-3 text-[15px] text-white placeholder:text-[#6B6890] focus:border-[#4F46E5] focus:outline-none"
        />
      ) : null}

      {vue === 'espaces' ? (
        <Tableaux
          entetes={['Espace', 'Porté par', 'Créé le', 'Contenu']}
          lignes={comptes
            .filter((c) => cherche(`${c.nom} ${c.slug} ${c.proprietaire?.email ?? ''}`))
            .map((c) => ({
              cle: c.id,
              cellules: [
                <div key="n">
                  <input
                    defaultValue={c.nom}
                    onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== c.nom && renommer(c, e.target.value.trim())}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-bold text-white focus:border-[#4F46E5] focus:outline-none"
                    aria-label="Nom de l'espace"
                  />
                  <span className="ml-2 text-sm text-[#8F8CB8]">
                    {c.type === 'ASSOCIATION' ? 'Association' : c.type === 'ACADEMIE' ? 'Académie' : c.type} · /{c.slug}
                  </span>
                </div>,
                <span key="p" className="text-[#C9C7E8]">
                  {c.proprietaire?.email ?? 'Non renseigné'}
                </span>,
                <span key="d" className="text-[#8F8CB8]">
                  {date(c.creeLe)}
                </span>,
                <span key="c" className="text-[#C9C7E8]">
                  {c.nbFormulaires} formulaire{c.nbFormulaires > 1 ? 's' : ''} · {c.nbCours} cours · {c.nbMembres} membre
                  {c.nbMembres > 1 ? 's' : ''}
                </span>,
              ],
            }))}
        />
      ) : null}

      {vue === 'personnes' ? (
        <Tableaux
          entetes={['Personne', 'Espaces', 'Dernière connexion', 'Accès']}
          lignes={personnes
            .filter((p) => cherche(`${p.email} ${p.nom ?? ''}`))
            .map((p) => ({
              cle: p.id,
              cellules: [
                <div key="p">
                  <span className="font-bold text-white">{p.nom ?? 'Non renseigné'}</span>
                  <br />
                  <span className="text-sm text-[#8F8CB8]">{p.email}</span>
                </div>,
                <span key="e" className="text-[#C9C7E8]">
                  {p.espaces.length ? p.espaces.map((e) => e.nom).join(', ') : 'Non renseigné'}
                </span>,
                <span key="d" className="text-[#8F8CB8]">
                  {date(p.derniereConnexion)}
                </span>,
                <div key="a" className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={occupe}
                    onClick={() => changerRole(p, p.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                    className={`rounded-lg px-3 py-1.5 text-sm font-bold transition disabled:opacity-50 ${
                      p.role === 'ADMIN' ? 'bg-[#4F46E5] text-white' : 'border border-[#312F55] text-[#C9C7E8] hover:border-[#4F46E5]'
                    }`}
                  >
                    {p.role === 'ADMIN' ? 'Administration' : 'Donner accès'}
                  </button>
                  <button
                    type="button"
                    disabled={occupe}
                    onClick={() => changerStatut(p, p.statut === 'BANNED' ? 'VERIFIED' : 'BANNED')}
                    className={`rounded-lg px-3 py-1.5 text-sm font-bold transition disabled:opacity-50 ${
                      p.statut === 'BANNED'
                        ? 'bg-[#C42B57] text-white'
                        : 'border border-[#312F55] text-[#C9C7E8] hover:border-[#C42B57]'
                    }`}
                  >
                    {p.statut === 'BANNED' ? 'Suspendu, rétablir' : 'Suspendre'}
                  </button>
                </div>,
              ],
            }))}
        />
      ) : null}

      {vue === 'contenus' ? (
        <div className="grid gap-6">
          <section>
            <h2 className="mb-3 text-lg font-extrabold tracking-tight text-white">Les formulaires</h2>
            <Tableaux
              entetes={['Titre', 'Espace', 'État', 'Réponses']}
              lignes={formulaires
                .filter((f) => cherche(`${f.titre} ${f.espace?.nom ?? ''}`))
                .map((f) => ({
                  cle: f.id,
                  cellules: [
                    <a key="t" href={`/f/${f.slug}`} target="_blank" rel="noopener noreferrer" className="font-bold text-white no-underline hover:underline">
                      {f.titre}
                    </a>,
                    <span key="e" className="text-[#C9C7E8]">
                      {f.espace?.nom ?? 'Non renseigné'}
                    </span>,
                    <span key="s" className="text-[#8F8CB8]">
                      {f.statut}
                    </span>,
                    <span key="r" className="tabular-nums text-[#C9C7E8]">
                      {f.nbReponses}
                    </span>,
                  ],
                }))}
            />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-extrabold tracking-tight text-white">Les cours en ligne</h2>
            <Tableaux
              entetes={['Titre', 'Espace', 'Prix', 'Apprenants']}
              lignes={cours
                .filter((c) => cherche(`${c.titre} ${c.espace?.nom ?? ''}`))
                .map((c) => ({
                  cle: c.id,
                  cellules: [
                    <a key="t" href={`/cours/${c.slug}`} target="_blank" rel="noopener noreferrer" className="font-bold text-white no-underline hover:underline">
                      {c.titre}
                    </a>,
                    <span key="e" className="text-[#C9C7E8]">
                      {c.espace?.nom ?? 'Non renseigné'}
                    </span>,
                    <span key="p" className="text-[#8F8CB8]">
                      {c.gratuit || c.prixCents === 0 ? 'Gratuit' : euros(c.prixCents)}
                    </span>,
                    <span key="a" className="tabular-nums text-[#C9C7E8]">
                      {c.nbApprenants}
                    </span>,
                  ],
                }))}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------- vues */

function Vue({ tableau: t }: { tableau: Tableau }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Espaces ouverts" valeur={`${t.comptes.associations + t.comptes.academies}`} detail={`${t.comptes.associations} associations · ${t.comptes.academies} académies`} />
        <Tuile libelle="Personnes" valeur={String(t.personnes.total)} detail={`${t.personnes.administration} dans l'administration`} />
        <Tuile libelle="Formulaires" valeur={String(t.formulaires.total)} detail={`${t.formulaires.reponses} réponses reçues`} />
        <Tuile libelle="École en ligne" valeur={String(t.ecole.cours)} detail={`${t.ecole.apprenants} apprenants · ${euros(t.ecole.chiffreCents)}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#312F55] bg-[#151428] p-5">
          <h2 className="text-lg font-extrabold tracking-tight text-white">Les derniers espaces ouverts</h2>
          <ul className="mt-3 grid gap-2">
            {t.derniersComptes.length === 0 ? (
              <li className="text-[#8F8CB8]">Aucun espace pour le moment.</li>
            ) : (
              t.derniersComptes.map((c) => (
                <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#252344] pb-2 last:border-0">
                  <span className="font-bold text-white">{c.nom}</span>
                  <span className="text-sm text-[#8F8CB8]">
                    {c.type === 'ASSOCIATION' ? 'Association' : 'Académie'} · {c.courriel ?? 'Non renseigné'} · {date(c.creeLe)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-[#312F55] bg-[#151428] p-5">
          <h2 className="text-lg font-extrabold tracking-tight text-white">Les dernières inscriptions</h2>
          <ul className="mt-3 grid gap-2">
            {t.dernieresPersonnes.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#252344] pb-2 last:border-0">
                <span className="font-bold text-white">{p.nom ?? p.email}</span>
                <span className="text-sm text-[#8F8CB8]">
                  {p.statut === 'VERIFIED' ? 'vérifié' : p.statut === 'PENDING' ? 'en attente' : p.statut.toLowerCase()} · {date(p.creeLe)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Tuile({ libelle, valeur, detail }: { libelle: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-[#312F55] bg-[#151428] p-5">
      <p className="text-sm font-bold text-[#8F8CB8]">{libelle}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums text-white">{valeur}</p>
      {detail ? <p className="mt-1 text-sm text-[#8F8CB8]">{detail}</p> : null}
    </div>
  );
}

function Tableaux({ entetes, lignes }: { entetes: string[]; lignes: { cle: string; cellules: React.ReactNode[] }[] }) {
  if (lignes.length === 0) {
    return <p className="rounded-2xl border border-[#312F55] bg-[#151428] px-5 py-6 text-center text-[#8F8CB8]">Rien à afficher.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#312F55] bg-[#151428]">
      <table className="w-full min-w-[760px] text-left text-[15px]">
        <thead>
          <tr className="text-[#8F8CB8]">
            {entetes.map((e) => (
              <th key={e} className="px-4 py-3 font-bold">
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.cle} className="border-t border-[#252344]">
              {l.cellules.map((c, i) => (
                <td key={i} className="px-4 py-3 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function date(iso: string | null | undefined) {
  if (!iso) return 'Non renseigné';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Non renseigné';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function euros(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
}
