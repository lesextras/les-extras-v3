import Link from 'next/link';
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

export function BlocStatistiques({
  ventes,
  inscriptions,
  cours,
}: {
  ventes: Vente[];
  inscriptions: Apprenant[];
  cours: CoursResume[];
}) {
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
