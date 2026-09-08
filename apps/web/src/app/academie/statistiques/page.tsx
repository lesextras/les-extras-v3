import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_DISCRET, CARTE, Encart, Titre } from '../_ui';
import { euros, type Apprenant, type CoursResume, type Vente } from '../_ecole/types';

export const metadata: Metadata = { title: 'Mes statistiques', robots: { index: false, follow: false } };

const MOIS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/**
 * `/academie/statistiques` — QUATRE CHIFFRES ET DEUX COURBES.
 *
 * Pas un tableau de bord d'analyste : les seules mesures sur lesquelles on
 * peut agir. Ce qui rentre, qui suit, qui décroche, et quelles formations
 * portent l'activité.
 */
export default async function StatistiquesPage() {
  const s = await sessionAcademie('/academie/statistiques');
  const [ventesR, apprenantsR, coursR] = await Promise.all([
    apiAcademie<Vente[]>(s, '/ecole/ventes'),
    apiAcademie<Apprenant[]>(s, '/ecole/apprenants'),
    apiAcademie<CoursResume[]>(s, '/ecole/cours'),
  ]);

  if (!ventesR.data && !apprenantsR.data) {
    return (
      <>
        <Titre surtitre="Ce que disent les chiffres">Mes statistiques</Titre>
        <Encart ton="attention">{ventesR.error ?? 'Les statistiques ne se chargent pas pour le moment.'}</Encart>
      </>
    );
  }

  const ventes = Array.isArray(ventesR.data) ? ventesR.data : [];
  const inscriptions = Array.isArray(apprenantsR.data) ? apprenantsR.data : [];
  const cours = Array.isArray(coursR.data) ? coursR.data : [];

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

  const publies = cours.filter((c) => c.statut === 'PUBLIE').length;

  /** Le chiffre d'affaires mois par mois, sur l'année en cours. */
  const caParMois = MOIS.map((nom, i) => ({
    nom,
    total: payeesAnnee.filter((v) => new Date(v.le).getMonth() === i).reduce((t, v) => t + (v.montantCents ?? 0), 0),
  }));
  const plafondCa = Math.max(1, ...caParMois.map((m) => m.total));

  /** Les inscriptions mois par mois : la courbe qui précède les ventes. */
  const inscritsParMois = MOIS.map((nom, i) => ({
    nom,
    total: inscriptions.filter((x) => {
      const d = new Date(x.inscritLe);
      return d.getFullYear() === annee && d.getMonth() === i;
    }).length,
  }));
  const plafondInscrits = Math.max(1, ...inscritsParMois.map((m) => m.total));

  /** Ce qui porte l'activité : par cours, inscrits et chiffre d'affaires. */
  const parCours = cours
    .map((c) => ({
      titre: c.titre,
      inscrits: inscriptions.filter((i) => i.cours.id === c.id).length,
      caCents: payees.filter((v) => v.cours?.id === c.id).reduce((t, v) => t + (v.montantCents ?? 0), 0),
    }))
    .sort((a, b) => b.caCents - a.caCents || b.inscrits - a.inscrits)
    .slice(0, 8);

  return (
    <>
      <Titre
        surtitre="Ce que disent les chiffres"
        sousTitre={`L'année ${annee} : ce qui est rentré, qui suit, qui décroche, et quelles formations portent l'activité.`}
      >
        Mes statistiques
      </Titre>

      {/* ------------------------------------------------------ les chiffres */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { t: `Encaissé en ${annee}`, v: euros(caAnnee), d: `${payeesAnnee.length} ventes payées`, c: 'text-[#0F5F3E]' },
          { t: 'Apprenants', v: String(personnes.size), d: `${inscriptions.length} inscriptions à des cours`, c: 'text-[#12312A]' },
          { t: 'Taux d’achèvement', v: `${achevement} %`, d: `${terminees} parcours terminés`, c: achevement >= 50 ? 'text-[#0F5F3E]' : 'text-[#7C3E06]' },
          { t: 'Sans visite depuis un mois', v: String(inactifs), d: inactifs ? 'à relancer' : 'personne à relancer', c: inactifs ? 'text-[#8A1B3D]' : 'text-[#12312A]' },
        ].map((x) => (
          <div key={x.t} className={`${CARTE} p-5`}>
            <p className="text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">{x.t}</p>
            <p className={`mt-1 text-[30px] font-black leading-none ${x.c}`}>{x.v}</p>
            <p className="mt-1 text-[14px] text-[#5E7A6E]">{x.d}</p>
          </div>
        ))}
      </div>

      {/* --------------------------------------------------------- les courbes */}
      <div className="mb-8 grid gap-5 lg:grid-cols-2">
        <section className={`${CARTE} p-5`}>
          <h2 className="mb-3 text-[18px] font-extrabold text-[#12312A]">Ce qui rentre, mois par mois</h2>
          <div className="overflow-x-auto">
            <ul className="flex min-w-[520px] items-end gap-2" style={{ height: 150 }}>
              {caParMois.map((m) => (
                <li key={m.nom} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[11px] font-bold text-[#334A42]">{m.total ? euros(m.total) : ''}</span>
                  <span
                    className="w-full rounded-t-md bg-[#1E9E6A]"
                    style={{ height: `${Math.round((m.total / plafondCa) * 100)}px`, minHeight: m.total ? 4 : 2, opacity: m.total ? 1 : 0.25 }}
                  />
                  <span className="text-[11px] text-[#5E7A6E]">{m.nom}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${CARTE} p-5`}>
          <h2 className="mb-3 text-[18px] font-extrabold text-[#12312A]">Les inscriptions, mois par mois</h2>
          <div className="overflow-x-auto">
            <ul className="flex min-w-[520px] items-end gap-2" style={{ height: 150 }}>
              {inscritsParMois.map((m) => (
                <li key={m.nom} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[11px] font-bold text-[#334A42]">{m.total || ''}</span>
                  <span
                    className="w-full rounded-t-md bg-[#4F46E5]"
                    style={{ height: `${Math.round((m.total / plafondInscrits) * 100)}px`, minHeight: m.total ? 4 : 2, opacity: m.total ? 1 : 0.25 }}
                  />
                  <span className="text-[11px] text-[#5E7A6E]">{m.nom}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------ par formation */}
      <h2 className="mb-3 text-[19px] font-extrabold text-[#12312A]">Par formation</h2>
      {parCours.length ? (
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
      ) : (
        <Encart ton="info">
          Aucun cours à mesurer pour l&apos;instant. {publies ? '' : 'Commence par en publier un.'}
        </Encart>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/academie/ventes" className={BTN_DISCRET}>
          Le détail des ventes
        </Link>
        <Link href="/academie/apprenants" className={BTN_DISCRET}>
          Le détail des apprenants
        </Link>
      </div>
    </>
  );
}
