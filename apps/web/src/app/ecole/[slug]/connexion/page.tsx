import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CoqueEcole } from '../../_espace/coque';
import { ecoleDuSlug, moiSurEcole } from '../../_espace/donnees';
import { Connexion } from './Connexion';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Espace apprenant', robots: { index: false, follow: false } };

/**
 * `/ecole/<slug>/connexion` : LA PORTE DE L'ESPACE APPRENANT.
 *
 * Une adresse et un mot de passe. Première fois, ou mot de passe oublié : on
 * reçoit un lien qui le fait choisir. Même réponse pour une adresse connue et
 * une adresse inconnue.
 */
export default async function PageConnexion({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ecole = await ecoleDuSlug(slug);
  if (!ecole) notFound();
  if (await moiSurEcole(slug)) redirect(`/ecole/${slug}/espace`);
  return (
    <CoqueEcole ecole={ecole} actif="connexion" connecte={false}>
      <Connexion slug={slug} couleur={ecole.couleur} nom={ecole.nom} />
    </CoqueEcole>
  );
}
