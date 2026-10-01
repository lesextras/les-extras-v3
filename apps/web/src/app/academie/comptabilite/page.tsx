/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_DISCRET, CARTE, Encart, Pastille, Titre, formaterDate } from '../_ui';
import type { Vente } from '../_ecole/types';
import type { ListeFactures } from '../_gestion/types';

export const metadata: Metadata = { title: 'Ma comptabilité', robots: { index: false, follow: false } };

const MOIS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function euros(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

/**
 * `/academie/comptabilite` — CE QUI RENTRE, ET CE QUI N'EST PAS ENCORE RENTRÉ.
 *
 * Trois chiffres suffisent à tenir une petite académie : ce qui est encaissé
 * cette année, ce qui est vendu mais pas payé, et ce qui a été remboursé. Le
 * reste — le détail vente par vente — se lit dessous.
 */
export default async function ComptabilitePage() {
  const s = await sessionAcademie('/academie/comptabilite');
  const annee0 = new Date().getFullYear();
  const [{ data, error }, factures] = await Promise.all([
    apiAcademie<Vente[]>(s, '/ecole/ventes'),
    apiAcademie<ListeFactures>(s, `/academie/gestion/factures?annee=${annee0}`),
  ]);
  const pro = factures.data?.resume;

  if (!data) {
    return (
      <>
        <Titre surtitre="L'argent">Ma comptabilité</Titre>
        <Encart ton="attention">{error ?? 'La comptabilité ne se charge pas pour le moment.'}</Encart>
      </>
    );
  }

  const ventes = Array.isArray(data) ? data : [];
  const annee = new Date().getFullYear();
  const deCetteAnnee = ventes.filter((v) => new Date(v.le).getFullYear() === annee);

  const somme = (liste: Vente[]) => liste.reduce((t, v) => t + (v.montantCents ?? 0), 0);
  const payees = deCetteAnnee.filter((v) => v.statut === 'PAYEE');
  const attente = deCetteAnnee.filter((v) => v.statut === 'EN_ATTENTE');
  const remboursees = deCetteAnnee.filter((v) => v.statut === 'REMBOURSEE');

  /** Douze mois, même les vides : le trou se voit mieux que la moyenne. */
  const parMois = MOIS.map((nom, i) => ({
    nom,
    total: somme(payees.filter((v) => new Date(v.le).getMonth() === i)),
  }));
  const plafond = Math.max(1, ...parMois.map((m) => m.total));

  /** Ce qui rapporte : par formation, sur l'année. */
  const parCours = new Map<string, number>();
  for (const v of payees) {
    const nom = v.cours?.titre ?? (v.packId ? 'Pack' : 'Autre');
    parCours.set(nom, (parCours.get(nom) ?? 0) + (v.montantCents ?? 0));
  }
  const classement = [...parCours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const dernieres = [...ventes].sort((a, b) => +new Date(b.le) - +new Date(a.le)).slice(0, 20);

  return (
    <>
      <Titre
        surtitre="L'argent"
        sousTitre={`Encaissé et à payer, ${annee}.`}
      >
        Ma comptabilité
      </Titre>

      {/* ------------------------------------------------ les trois chiffres */}
      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        <div className={`${CARTE} p-5`}>
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">Encaissé en {annee}</p>
          <p className="mt-1 text-[30px] font-black leading-none text-[#0F5F3E]">{euros(somme(payees))}</p>
          <p className="mt-1 text-[14px] text-[#5E7A6E]">
            {payees.length} vente{payees.length > 1 ? 's' : ''} payée{payees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className={`${CARTE} p-5`}>
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">En attente de paiement</p>
          <p className={`mt-1 text-[30px] font-black leading-none ${attente.length ? 'text-[#7C3E06]' : 'text-[#12312A]'}`}>
            {euros(somme(attente))}
          </p>
          <p className="mt-1 text-[14px] text-[#5E7A6E]">
            {attente.length} vente{attente.length > 1 ? 's' : ''} à relancer
          </p>
        </div>
        <div className={`${CARTE} p-5`}>
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">Remboursé</p>
          <p className="mt-1 text-[30px] font-black leading-none text-[#12312A]">{euros(somme(remboursees))}</p>
          <p className="mt-1 text-[14px] text-[#5E7A6E]">
            {remboursees.length} remboursement{remboursees.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ------------------------------ la formation professionnelle facturée */}
      {pro ? (
        <section className={`${CARTE} mb-7 p-5`}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-[17px] font-extrabold text-[#12312A]">Devis et factures</h2>
            <Link href="/academie/facturation" className={`${BTN_DISCRET} ml-auto`}>
              Ouvrir
            </Link>
            <Link href="/academie/bpf" className={BTN_DISCRET}>
              Mon BPF
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">Facturé HT en {annee0}</p>
              <p className="mt-1 text-[26px] font-black leading-none text-[#0F5F3E]">{euros(Math.round(pro.chiffreAffairesHt * 100))}</p>
            </div>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">À encaisser</p>
              <p className={`mt-1 text-[26px] font-black leading-none ${pro.aEncaisser ? 'text-[#7C3E06]' : 'text-[#12312A]'}`}>{euros(Math.round(pro.aEncaisser * 100))}</p>
            </div>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">En retard</p>
              <p className={`mt-1 text-[26px] font-black leading-none ${pro.enRetard ? 'text-[#C42B57]' : 'text-[#12312A]'}`}>
                {pro.enRetard} facture{pro.enRetard > 1 ? 's' : ''}
              </p>
              {pro.enRetard ? <p className="mt-1 text-[14px] text-[#5E7A6E]">{euros(Math.round(pro.montantEnRetard * 100))}, relancées automatiquement</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {attente.length ? (
        <div className="mb-7">
          <Encart ton="attention">
            {attente.length} vente{attente.length > 1 ? 's' : ''} en attente de paiement, pour {euros(somme(attente))}.
            Une relance à sept jours suffit le plus souvent.
          </Encart>
        </div>
      ) : null}

      {/* --------------------------------------------------- mois par mois */}
      <h2 className="mb-3 text-[19px] font-extrabold text-[#12312A]">Mois par mois</h2>
      <div className={`${CARTE} mb-8 overflow-x-auto p-5`}>
        <ul className="flex min-w-[560px] items-end gap-2" style={{ height: 160 }}>
          {parMois.map((m) => (
            <li key={m.nom} className="flex flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[12px] font-bold text-[#334A42]">{m.total ? euros(m.total) : ''}</span>
              <span
                className="w-full rounded-t-md bg-[#1E9E6A]"
                style={{ height: `${Math.round((m.total / plafond) * 110)}px`, minHeight: m.total ? 4 : 2, opacity: m.total ? 1 : 0.25 }}
              />
              <span className="text-[12px] text-[#5E7A6E]">{m.nom}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ------------------------------------------------- ce qui rapporte */}
      {classement.length ? (
        <>
          <h2 className="mb-3 text-[19px] font-extrabold text-[#12312A]">Ce qui rapporte</h2>
          <ul className="mb-8 grid gap-2">
            {classement.map(([nom, total]) => (
              <li key={nom} className={`${CARTE} flex flex-wrap items-center gap-3 p-4`}>
                <span className="min-w-[180px] flex-1 text-[15px] font-bold text-[#12312A]">{nom}</span>
                <span className="text-[16px] font-black text-[#0F5F3E]">{euros(total)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* ------------------------------------------------- le détail */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-extrabold text-[#12312A]">Les dernières ventes</h2>
        <Link href="/academie/ventes" className={`${BTN_DISCRET} ml-auto`}>
          Toutes mes ventes
        </Link>
      </div>

      {dernieres.length ? (
        <ul className="grid gap-2">
          {dernieres.map((v) => (
            <li key={v.id} className={`${CARTE} flex flex-wrap items-center gap-3 p-4`}>
              <div className="min-w-[200px] flex-1">
                <p className="text-[15px] font-bold text-[#12312A]">{v.cours?.titre ?? (v.packId ? 'Pack' : 'Vente')}</p>
                <p className="break-all text-[13px] text-[#5E7A6E]">
                  {v.nom || v.email} · {formaterDate(v.le)}
                </p>
              </div>
              <Pastille
                ton={
                  v.statut === 'PAYEE'
                    ? 'ok'
                    : v.statut === 'EN_ATTENTE'
                      ? 'attention'
                      : v.statut === 'REMBOURSEE'
                        ? 'neutre'
                        : 'alerte'
                }
              >
                {v.statut === 'PAYEE'
                  ? 'Payée'
                  : v.statut === 'EN_ATTENTE'
                    ? 'En attente'
                    : v.statut === 'REMBOURSEE'
                      ? 'Remboursée'
                      : 'Annulée'}
              </Pastille>
              <span className="text-[16px] font-black text-[#12312A]">{euros(v.montantCents ?? 0)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px] leading-relaxed text-[#5E7A6E]">Aucune vente.</p>
      )}

      <p className="mt-8 text-[14px] text-[#5E7A6E]">
        Versements des financeurs :{' '}
        <Link href="/academie/sessions" className="font-bold text-[#0F5F3E] underline underline-offset-4">
          Mes sessions
        </Link>
      </p>
    </>
  );
}
