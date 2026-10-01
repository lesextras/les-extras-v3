/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import { apiEspace, sessionAssociation } from '../../_session';
import { nomCourt } from '../../_nom';
import { Encart, SousTitre, Titre, Tuile } from '../../_ui';
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
        sousTitre="Objets, fichiers et accès à vendre."
        info="Une commande n'est enregistrée qu'une fois le paiement confirmé."
      >
        Ma boutique
      </Titre>

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

      <section id="commandes" className="scroll-mt-24">
        <SousTitre>Commandes</SousTitre>
        <Commandes initiales={listeCommandes} />
      </section>
    </>
  );
}
