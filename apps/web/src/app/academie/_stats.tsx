'use client';
/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */

import { useMemo, useState, type ReactNode } from 'react';
import { CARTE, Pastille, Tuile } from './_ui';
import { euros, type Apprenant, type CoursResume, type Vente } from './_ecole/types';

/**
 * LES CHIFFRES DE L'ÉCOLE, POSÉS DANS LE TABLEAU DE BORD.
 *
 * Ils étaient sur un écran à part ; personne n'allait les voir. Ils sont donc
 * là où l'on arrive, sous ce qui presse : quatre mesures sur lesquelles on
 * peut agir, deux courbes, et le classement des formations.
 */

const MOIS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/**
 * LES PÉRIODES.
 *
 * `jours` à zéro veut dire « depuis le début » : il n'y a alors pas de période
 * précédente à laquelle se comparer, et on ne prétend pas le contraire.
 */
const PERIODES: { cle: string; nom: string; jours: number }[] = [
  { cle: 'j1', nom: "Aujourd'hui", jours: 1 },
  { cle: 'j7', nom: '7 derniers jours', jours: 7 },
  { cle: 'j30', nom: '30 derniers jours', jours: 30 },
  { cle: 'm3', nom: '3 derniers mois', jours: 90 },
  { cle: 'm6', nom: '6 derniers mois', jours: 182 },
  { cle: 'm12', nom: '12 derniers mois', jours: 365 },
  { cle: 'tout', nom: 'Tout, depuis le début', jours: 0 },
];

/** Ce qu'on lit sous un chiffre : l'écart avec la période d'avant. */
function Ecart({ valeur, avant, format }: { valeur: number; avant: number | null; format?: (n: number) => string }) {
  if (avant === null) return null;
  const dire = format ?? ((n: number) => String(n));
  const ecart = valeur - avant;
  const ton = ecart > 0 ? 'text-[#0F5F3E]' : ecart < 0 ? 'text-[#8A1B3D]' : 'text-[#5E7A6E]';
  return <span className={`font-bold ${ton}`}>{ecart > 0 ? `+${dire(ecart)}` : ecart < 0 ? dire(ecart) : '='}</span>;
}

export function BlocStatistiques({
  ventes,
  inscriptions,
  cours,
  avant,
  apres,
}: {
  ventes: Vente[];
  inscriptions: Apprenant[];
  cours: CoursResume[];
  /** Les tuiles fixes posées avant celles de la période (formations, sessions). */
  avant?: ReactNode;
  /** Et celles posées après (devoirs à corriger). */
  apres?: ReactNode;
}) {
  const [periode, setPeriode] = useState('j30');
  const jours = PERIODES.find((p) => p.cle === periode)?.jours ?? 30;

  /**
   * CE QUE DIT LA PÉRIODE CHOISIE — et ce que disait la précédente.
   *
   * Deux fenêtres de même longueur, l'une collée à l'autre : c'est la seule
   * comparaison honnête. Sur « depuis le début », il n'y a pas d'avant.
   */
  const fenetre = useMemo(() => {
    const maintenant = Date.now();
    const debut = jours ? maintenant - jours * 86400000 : 0;
    const debutAvant = jours ? debut - jours * 86400000 : 0;

    const dans = (iso: string | null | undefined, a: number, b: number) => {
      if (!iso) return false;
      const d = new Date(iso).getTime();
      return !Number.isNaN(d) && d >= a && d < b;
    };

    const vendues = ventes.filter((v) => v.statut === 'PAYEE');
    const compter = (a: number, b: number) => {
      const v = vendues.filter((x) => dans(x.le, a, b));
      const i = inscriptions.filter((x) => dans(x.inscritLe, a, b));
      return {
        ventes: v.length,
        revenus: v.reduce((t, x) => t + (x.montantCents ?? 0), 0),
        apprenants: new Set(i.map((x) => x.email.trim().toLowerCase())).size,
        inscriptions: i.length,
        finis: i.filter((x) => x.statut === 'TERMINEE').length,
        commences: i.filter((x) => (x.progression ?? 0) > 0).length,
      };
    };

    return {
      maintenant: compter(debut, maintenant + 1),
      avant: jours ? compter(debutAvant, debut) : null,
    };
  }, [ventes, inscriptions, jours]);

  const annee = new Date().getFullYear();
  const payees = ventes.filter((v) => v.statut === 'PAYEE');
  const payeesAnnee = payees.filter((v) => new Date(v.le).getFullYear() === annee);
  const caAnnee = payeesAnnee.reduce((t, v) => t + (v.montantCents ?? 0), 0);

  const personnes = new Set(inscriptions.map((i) => i.email.trim().toLowerCase()));
  const terminees = inscriptions.filter((i) => i.statut === 'TERMINEE').length;
  const achevement = inscriptions.length ? Math.round((terminees / inscriptions.length) * 100) : 0;

  const inactifs = inscriptions.filter((i) => {
    if (!i.derniereVisite) return true;
    const d = new Date(i.derniereVisite).getTime();
    return Number.isNaN(d) ? true : Date.now() - d >= 30 * 86400000;
  }).length;

  const caParMois = MOIS.map((nom, i) => ({
    nom,
    total: payeesAnnee.filter((v) => new Date(v.le).getMonth() === i).reduce((t, v) => t + (v.montantCents ?? 0), 0),
  }));
  const plafondCa = Math.max(1, ...caParMois.map((m) => m.total));

  const inscritsParMois = MOIS.map((nom, i) => ({
    nom,
    total: inscriptions.filter((x) => {
      const d = new Date(x.inscritLe);
      return d.getFullYear() === annee && d.getMonth() === i;
    }).length,
  }));
  const plafondInscrits = Math.max(1, ...inscritsParMois.map((m) => m.total));

  const parCours = cours
    .map((c) => ({
      titre: c.titre,
      inscrits: inscriptions.filter((i) => i.cours.id === c.id).length,
      caCents: payees.filter((v) => v.cours?.id === c.id).reduce((t, v) => t + (v.montantCents ?? 0), 0),
    }))
    .filter((c) => c.inscrits || c.caCents)
    .sort((a, b) => b.caCents - a.caCents || b.inscrits - a.inscrits)
    .slice(0, 6);

  const rienDuTout = !ventes.length && !inscriptions.length;

  const ici = fenetre.maintenant;
  const prec = fenetre.avant;

  /*
   * ⚠ UNE SEULE RANGÉE DE TUILES (01/10/2026). Le tableau de bord en avait deux
   * qui se répétaient (Apprenants en haut, APPRENANTS en bas, avec deux chiffres
   * différents). « Apprenants » compte ici les mêmes personnes que l'écran
   * Mes apprenants : une adresse e-mail = une personne, tous cours confondus.
   */
  return (
    <section className="mt-8" id="statistiques">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight text-[#12312A] sm:text-2xl">En chiffres</h2>
        <select
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          aria-label="Période"
          className="rounded-xl border-2 border-[#DDEBE4] bg-white px-3 py-2 text-[15px] font-bold text-[#12312A]"
        >
          {PERIODES.map((p) => (
            <option key={p.cle} value={p.cle}>
              {p.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {avant}
        <Tuile
          libelle="Apprenants"
          valeur={personnes.size}
          detail={
            <>
              +{ici.apprenants} sur la période <Ecart valeur={ici.apprenants} avant={prec?.apprenants ?? null} />
            </>
          }
          href="/academie/apprenants"
        />
        <Tuile
          libelle="Revenus"
          valeur={euros(ici.revenus)}
          ton="ok"
          detail={
            <>
              {ici.ventes} vente{ici.ventes > 1 ? 's' : ''} <Ecart valeur={ici.revenus} avant={prec?.revenus ?? null} format={euros} />
            </>
          }
          href="/academie/ventes"
        />
        {apres}
      </div>

      {rienDuTout ? null : (
        <>
          <p className="mb-6 mt-4 flex flex-wrap gap-2">
            <Pastille ton="accent">
              {ici.commences} commencé{ici.commences > 1 ? 's' : ''}
            </Pastille>
            <Pastille ton="ok">
              {ici.finis} terminé{ici.finis > 1 ? 's' : ''}
            </Pastille>
            <Pastille ton={achevement >= 50 ? 'ok' : 'attention'}>{achevement} % d&apos;achèvement</Pastille>
            {inactifs ? (
              <Pastille ton="alerte">
                {inactifs} inactif{inactifs > 1 ? 's' : ''} (+30 j)
              </Pastille>
            ) : null}
          </p>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className={`${CARTE} p-5`}>
              <h3 className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-[17px] font-extrabold text-[#12312A]">
                Encaissements {annee}
                <span className="text-[15px] font-black text-[#0F5F3E]">{euros(caAnnee)}</span>
              </h3>
              <div className="overflow-x-auto">
                <ul className="flex min-w-[500px] items-end gap-2" style={{ height: 140 }}>
                  {caParMois.map((m) => (
                    <li key={m.nom} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                      <span className="text-[11px] font-bold text-[#334A42]">{m.total ? euros(m.total) : ''}</span>
                      <span
                        className="w-full rounded-t-md bg-[#1E9E6A]"
                        style={{ height: `${Math.round((m.total / plafondCa) * 90)}px`, minHeight: m.total ? 4 : 2, opacity: m.total ? 1 : 0.25 }}
                      />
                      <span className="text-[11px] text-[#5E7A6E]">{m.nom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={`${CARTE} p-5`}>
              <h3 className="mb-3 text-[17px] font-extrabold text-[#12312A]">Inscriptions / mois</h3>
              <div className="overflow-x-auto">
                <ul className="flex min-w-[500px] items-end gap-2" style={{ height: 140 }}>
                  {inscritsParMois.map((m) => (
                    <li key={m.nom} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                      <span className="text-[11px] font-bold text-[#334A42]">{m.total || ''}</span>
                      <span
                        className="w-full rounded-t-md bg-[#4F46E5]"
                        style={{ height: `${Math.round((m.total / plafondInscrits) * 90)}px`, minHeight: m.total ? 4 : 2, opacity: m.total ? 1 : 0.25 }}
                      />
                      <span className="text-[11px] text-[#5E7A6E]">{m.nom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {parCours.length ? (
            <>
              <h3 className="mb-3 mt-6 text-[17px] font-extrabold text-[#12312A]">Par formation</h3>
              <ul className="grid gap-2">
                {parCours.map((c) => (
                  <li key={c.titre} className={`${CARTE} flex flex-wrap items-center gap-3 p-4`}>
                    <span className="min-w-[200px] flex-1 text-[15px] font-bold text-[#12312A]">{c.titre}</span>
                    <span className="text-[15px] text-[#334A42]">
                      {c.inscrits} inscrit{c.inscrits > 1 ? 's' : ''}
                    </span>
                    <span className="w-[110px] text-right text-[16px] font-black text-[#0F5F3E]">{euros(c.caCents)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
