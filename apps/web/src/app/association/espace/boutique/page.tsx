/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import { apiEspace, sessionAssociation } from '../../_session';
import { nomCourt } from '../../_nom';
import Link from 'next/link';
import { Encart, SousTitre, Titre, Tuile } from '../../_ui';
import { ETAPES_PRESENCE } from '../../_avantages';
import type { Espace } from '../_types';
import { euros, type Commande, type EtatStripe, type Produit, type Vitrine as VitrineType } from './_types';
import { Vitrine } from './Vitrine';
import { Produits } from './Produits';
import { Commandes } from './Commandes';
import { Encaissement } from './Encaissement';

/**
 * MA BOUTIQUE.
 *
 * Une association vend autre chose que des formations : des places, un livret,
 * un t-shirt, un enregistrement. Deux natures de produit — l'objet qu'on
 * remet ou qu'on expédie, et le fichier qu'on remet à l'instant du paiement —
 * et un seul endroit pour dire où l'argent doit arriver.
 */
export default async function BoutiquePage() {
  const s = await sessionAssociation('/espace/boutique');
  const [espace, vitrine, produits, commandes, stripe] = await Promise.all([
    apiEspace<Espace>(s, '/association/espace'),
    apiEspace<VitrineType>(s, '/boutique/vitrine'),
    apiEspace<Produit[]>(s, '/boutique/produits'),
    apiEspace<Commande[]>(s, '/boutique/commandes'),
    apiEspace<EtatStripe>(s, '/paiements/stripe/etat'),
  ]);

  if (!vitrine.data) {
    return (
      <Encart ton="attention">
        {vitrine.error ?? 'La boutique ne se charge pas pour le moment.'}
      </Encart>
    );
  }

  const listeProduits = produits.data ?? [];
  const listeCommandes = commandes.data ?? [];
  const enVente = listeProduits.filter((p) => p.statut === 'PUBLIE');
  const aExpedier = listeCommandes.filter(
    (c) => c.statut === 'PAYEE' && c.lignes.some((l) => l.nature === 'REEL'),
  );
  const encaisse = listeCommandes
    .filter((c) => c.statut !== 'ANNULEE' && c.statut !== 'REMBOURSEE')
    .reduce((t, c) => t + c.totalCents, 0);

  return (
    <>
      <Titre
        surtitre={espace.data ? nomCourt(espace.data.organisation.nom) : undefined}
        sousTitre="Vendre et se faire trouver."
        info="Une commande n'est enregistrée qu'une fois le paiement confirmé."
      >
        Boutique et visibilité
      </Titre>

      <nav className="-mt-2 mb-6 flex flex-wrap gap-2 text-sm font-bold">
        {[
          ['#produits', 'Vendre'],
          ['#commandes', 'Commandes'],
          ['#visible', 'Être visible'],
        ].map(([href, libelle]) => (
          <a key={href} href={href} className="rounded-full border border-[#D9D6EE] bg-white px-4 py-2 text-[#1D1B5C] no-underline hover:border-[#4F46E5] hover:bg-[#ECEBFC]">
            {libelle}
          </a>
        ))}
      </nav>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile
          libelle="En vente"
          valeur={enVente.length}
          detail={`sur ${listeProduits.length}`}
          ton={enVente.length ? 'ok' : undefined}
        />
        <Tuile libelle="Commandes" valeur={listeCommandes.length} />
        <Tuile
          libelle="À préparer"
          valeur={aExpedier.length}
          ton={aExpedier.length ? 'attention' : 'ok'}
        />
        <Tuile libelle="Encaissé" valeur={euros(encaisse)} detail="hors remboursements" />
      </section>

      <section id="encaissement" className="mb-10 scroll-mt-24">
        <SousTitre info="Où l'argent arrive. Sert aussi à l'académie.">Compte d&apos;encaissement</SousTitre>
        <Encaissement etat={stripe.data ?? null} />
      </section>

      <section id="produits" className="mb-10 scroll-mt-24">
        <SousTitre info="Objet : expédié ou remis. Fichier ou accès : remis au paiement.">Mes produits</SousTitre>
        <Produits initiaux={listeProduits} />
      </section>

      <section id="vitrine" className="mb-10 scroll-mt-24">
        <SousTitre info="La page publique de la boutique.">Vitrine</SousTitre>
        <Vitrine initiale={vitrine.data} />
      </section>

      <section id="commandes" className="mb-10 scroll-mt-24">
        <SousTitre>Commandes</SousTitre>
        <Commandes initiales={listeCommandes} />
      </section>

      <section id="visible" className="scroll-mt-24">
        <SousTitre info="Tout est gratuit, sauf le nom de domaine.">Être visible en ligne</SousTitre>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {ETAPES_PRESENCE.map((e) => (
            <li key={e.code}>
              <Link
                href={`/presence-en-ligne#${e.code}`}
                className="flex h-full items-start gap-2 rounded-xl border border-[#E6E4F3] bg-white p-3 no-underline transition hover:border-[#4F46E5] hover:bg-[#ECEBFC]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1D1B5C] text-xs font-extrabold text-white">{e.numero}</span>
                <span>
                  <span className="block text-sm font-extrabold leading-snug text-[#1D1B5C]">{e.nom}</span>
                  <span className="block text-xs text-[#6B6A8A]">{e.duree}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
