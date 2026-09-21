import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Rendezvous } from './Rendezvous';
import { visioconsultationVisible } from '@/lib/offre';

/**
 * LA PAGE D'UN RENDEZ-VOUS À DISTANCE.
 *
 * ⚠⚠ `noindex, nofollow`, ET CE N'EST PAS NÉGOCIABLE. Cette adresse porte un
 * jeton de rendez-vous. Indexée, elle serait cherchable ; suivie, elle
 * partirait dans les référents des ressources chargées. Une page qui ouvre une
 * salle où se trouve une famille ne s'indexe pas, jamais, et elle n'est dans
 * aucun sitemap.
 *
 * ⚠ AUCUNE DONNÉE DANS LE TITRE NI DANS LA DESCRIPTION. Le titre d'onglet se
 * lit par-dessus l'épaule et s'écrit dans l'historique du navigateur : il dit
 * « Rendez-vous à distance », et rien de plus — ni le nom de l'intervenant, ni
 * celui de la personne accompagnée.
 */
export const metadata: Metadata = {
  title: 'Rendez-vous à distance',
  robots: { index: false, follow: false },
};

/**
 * ⚠ RENDU DYNAMIQUE OBLIGATOIRE. Sans cela, Next mettrait la coquille en cache
 * et, surtout, `visioconsultationVisible()` serait figée au build — alors que
 * c'est précisément l'interrupteur qui met le service en route.
 */
export const dynamic = 'force-dynamic';

export default async function PageVisio({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;

  /*
   * ⚠ L'INTERRUPTEUR GARDE AUSSI CETTE PAGE. Tant que la visioconsultation
   * n'est pas ouverte, l'adresse n'existe pas — plutôt qu'un écran qui
   * demanderait un prénom pour finir sur « service indisponible ». Voir
   * `@/lib/offre`.
   */
  if (!visioconsultationVisible()) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Votre rendez-vous à distance
      </h1>
      <p className="mt-2 text-muted-foreground" lang="fr">
        Rien à installer, aucun compte à créer. La séance se passe dans cette page.
      </p>
      <div className="mt-8">
        <Rendezvous jeton={jeton} />
      </div>
    </div>
  );
}
