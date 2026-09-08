'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BTN_DISCRET, CARTE, Encart, SousTitre } from './_ui';
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

/** Ce qu'on lit sous un chiffre : la même mesure, la période d'avant. */
function Avant({ valeur, avant, format }: { valeur: number; avant: number | null; format?: (n: number) => string }) {
  if (avant === null) return <span className="mt-1 block text-[14px] text-[#5E7A6E]">depuis le début</span>;
  const dire = format ?? ((n: number) => String(n));
  const ecart = valeur - avant;
  const ton = ecart > 0 ? 'text-[#0F5F3E]' : ecart < 0 ? 'text-[#8A1B3D]' : 'text-[#5E7A6E]';
  return (
    <span className="mt-1 block text-[14px] text-[#5E7A6E]">
      Période précédente : {dire(avant)} <span className={`font-bold ${ton}`}>{ecart > 0 ? `+${dire(ecart)}` : ecart < 0 ? dire(ecart) : '='}</span>
    </span>
  );
}

export function BlocStatistiques({
  ventes,
  inscriptions,
  cours,
}: {
  ventes: Vente[];
  inscriptions: Apprenant[];
  cours: CoursResume[];
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

  return (
    <section className="mt-10" id="statistiques">
      <SousTitre>Ce que disent les chiffres</SousTitre>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex flex-wrap items-center gap-2 text-[14px] font-bold text-[#12312A]">
          Sur quelle période
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="rounded-xl border-2 border-[#DDEBE4] bg-white px-3 py-2 text-[15px] font-normal text-[#12312A]"
          >
            {PERIODES.map((p) => (
              <option key={p.cle} value={p.cle}>
                {p.nom}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { t: 'Apprenants', n: fenetre.maintenant.apprenants, a: fenetre.avant?.apprenants ?? null, f: undefined, c: 'text-[#12312A]' },
          { t: 'Ventes', n: fenetre.maintenant.ventes, a: fenetre.avant?.ventes ?? null, f: undefined, c: 'text-[#12312A]' },
          { t: 'Revenus', n: fenetre.maintenant.revenus, a: fenetre.avant?.revenus ?? null, f: euros, c: 'text-[#0F5F3E]' },
          { t: 'Inscriptions', n: fenetre.maintenant.inscriptions, a: fenetre.avant?.inscriptions ?? null, f: undefined, c: 'text-[#12312A]' },
        ].map((x) => (
          <div key={x.t} className={`${CARTE} p-5`}>
            <p className="text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">{x.t}</p>
            <p className={`mt-1 text-[28px] font-black leading-none ${x.c}`}>{x.f ? x.f(x.n) : x.n}</p>
            <Avant valeur={x.n} avant={x.a} format={x.f} />
          </div>
        ))}
      </div>

      <p className="mb-6 text-[15px] text-[#334A42]">
        Sur cette période, <strong className="font-extrabold text-[#12312A]">{fenetre.maintenant.commences}</strong>{' '}
        apprenant{fenetre.maintenant.commences > 1 ? 's ont' : ' a'} commencé une formation et{' '}
        <strong className="font-extrabold text-[#12312A]">{fenetre.maintenant.finis}</strong>{' '}
        {fenetre.maintenant.finis > 1 ? "l'ont" : "l'a"} terminée.
      </p>

      {rienDuTout ? (
        <Encart ton="info">
          Aucune vente ni inscription pour l&apos;instant. Dès qu&apos;une formation part, les chiffres apparaissent
          ici : ce qui rentre, qui suit, qui décroche.
        </Encart>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: `Encaissé en ${annee}`, v: euros(caAnnee), d: `${payeesAnnee.length} vente${payeesAnnee.length > 1 ? 's' : ''} payée${payeesAnnee.length > 1 ? 's' : ''}`, c: 'text-[#0F5F3E]' },
              { t: 'Apprenants', v: String(personnes.size), d: `${inscriptions.length} inscription${inscriptions.length > 1 ? 's' : ''}`, c: 'text-[#12312A]' },
              { t: "Taux d'achèvement", v: `${achevement} %`, d: `${terminees} parcours terminé${terminees > 1 ? 's' : ''}`, c: achevement >= 50 ? 'text-[#0F5F3E]' : 'text-[#7C3E06]' },
              { t: 'Sans visite depuis un mois', v: String(inactifs), d: inactifs ? 'à relancer' : 'personne à relancer', c: inactifs ? 'text-[#8A1B3D]' : 'text-[#12312A]' },
            ].map((x) => (
              <div key={x.t} className={`${CARTE} p-5`}>
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">{x.t}</p>
                <p className={`mt-1 text-[28px] font-black leading-none ${x.c}`}>{x.v}</p>
                <p className="mt-1 text-[14px] text-[#5E7A6E]">{x.d}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className={`${CARTE} p-5`}>
              <h3 className="mb-3 text-[17px] font-extrabold text-[#12312A]">Ce qui rentre, mois par mois</h3>
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
              <h3 className="mb-3 text-[17px] font-extrabold text-[#12312A]">Les inscriptions, mois par mois</h3>
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

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/academie/ventes" className={BTN_DISCRET}>
              Le détail des ventes
            </Link>
            <Link href="/academie/apprenants" className={BTN_DISCRET}>
              Le détail des apprenants
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
