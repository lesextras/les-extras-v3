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
        sousTitre="Tout ce que l'association vend en dehors des formations : ce qu'on remet en main propre ou qu'on expédie, et ce qui se télécharge à l'instant du paiement. Rien n'est enregistré tant que le paiement n'est pas confirmé."
      >
        Ma boutique
      </Titre>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile
          libelle="En vente"
          valeur={enVente.length}
          detail={`${listeProduits.length} produit${listeProduits.length > 1 ? 's' : ''} au total`}
          ton={enVente.length ? 'ok' : undefined}
        />
        <Tuile
          libelle="Commandes"
          valeur={listeCommandes.length}
          detail="Toutes payées : rien n'est écrit avant"
        />
        <Tuile
          libelle="À préparer"
          valeur={aExpedier.length}
          detail={aExpedier.length ? 'Des colis attendent' : 'Rien en attente'}
          ton={aExpedier.length ? 'attention' : 'ok'}
        />
        <Tuile libelle="Encaissé" valeur={euros(encaisse)} detail="Hors annulations et remboursements" />
      </section>

      <section id="encaissement" className="mb-10 scroll-mt-24">
        <SousTitre>Le compte d&apos;encaissement</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          C&apos;est ici qu&apos;on dit où l&apos;argent doit arriver. Le même branchement sert la
          boutique et, si l&apos;association vend aussi des formations, son académie.
        </p>
        <Encaissement etat={stripe.data ?? null} />
      </section>

      <section id="produits" className="mb-10 scroll-mt-24">
        <SousTitre>Ce que je vends</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Un objet se compte, s&apos;expédie et demande une adresse ; un fichier ou un accès se
          remet à l&apos;instant du paiement. Choisis la nature en premier : le reste du formulaire
          s&apos;y adapte.
        </p>
        <Produits initiaux={listeProduits} />
      </section>

      <section id="vitrine" className="mb-10 scroll-mt-24">
        <SousTitre>La vitrine</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          La page publique de la boutique : son nom, ses couleurs, ce qu&apos;on y lit avant
          d&apos;acheter.
        </p>
        <Vitrine initiale={vitrine.data} />
      </section>

      <section id="commandes" className="scroll-mt-24">
        <SousTitre>Les commandes</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Ce qui a été payé, et ce qu&apos;il reste à faire : préparer, expédier, remettre.
        </p>
        <Commandes initiales={listeCommandes} />
      </section>
    </>
  );
}
