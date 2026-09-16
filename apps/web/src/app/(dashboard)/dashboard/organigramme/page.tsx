// L'ORGANIGRAMME DE L'ÉTABLISSEMENT.
//
// ⚠ CE QUI TIENT CET ÉCRAN, ET QU'IL NE FAUT PAS DÉFAIRE :
//
// 1. L'ARBORESCENCE EST VISIBLE PAR TOUS LES RATTACHÉS, LES NOMS NE LE SONT
//    PAS. Structure → établissement → services → effectifs : tout le monde le
//    voit, et c'est ce qui donne une raison de se déclarer. Les NOMS
//    n'apparaissent que dans le périmètre de qui regarde. Un organigramme qui
//    ne se peuplerait que pour la direction serait vide le premier jour, et
//    personne ne le remplirait jamais.
//
// 2. DEUX MARQUES DISTINCTES SUR CHAQUE PERSONNE, ET ELLES NE SE FONDENT PAS.
//    « Rattachement vérifié » dit que cette personne est bien dans ce service.
//    « Niveau validé » dit que son titre a été confirmé par qui pouvait le
//    faire. Un chef de service qui invite un collègue atteste de son
//    appartenance, pas de son titre : afficher « Directeur ✓ » sur la foi d'un
//    badge posé par un collègue serait un mensonge, et c'est exactement le
//    genre de mensonge qui ruine la confiance dans un annuaire professionnel.
//
// 3. LES PERSONNES MASQUÉES SONT COMPTÉES, PAS CACHÉES. « + 4 personnes »
//    plutôt que rien : le lecteur sait qu'il ne voit pas tout, au lieu de
//    croire que le service est vide.
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSession, fetchApi } from '../../../_shared/server';
import { PageHeader, ErrorState } from '../../../_shared/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Organigramme, type DonneesOrganigramme } from './Organigramme';

export const metadata: Metadata = { title: 'Organigramme' };

export default async function OrganigrammePage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<DonneesOrganigramme>(
    session,
    '/organisation/organigramme',
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organigramme"
        subtitle="Votre structure, votre établissement et ses services. Les noms que vous voyez dépendent de votre périmètre."
      />

      {error || !data ? (
        <ErrorState
          title="Organigramme indisponible"
          description="Impossible de charger l’organigramme de votre établissement pour le moment."
          retryHref="/dashboard/organigramme"
        />
      ) : (
        <Organigramme donnees={data} />
      )}

      <Card>
        <CardContent className="space-y-2 p-5 text-sm">
          <p className="font-semibold">Vous ne voyez pas tout le monde ?</p>
          <p className="text-muted-foreground" lang="fr">
            C’est normal, et c’est la règle : on voit les personnes de ses
            propres services et celles qu’on a fait venir. Pour voir tout
            l’établissement, il faut le niveau Direction — il se demande depuis{' '}
            <Link href="/dashboard/mon-poste" className="font-medium text-primary hover:underline">
              votre poste
            </Link>{' '}
            et Les Extras le valide à la main.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
