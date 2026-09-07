import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, Titre } from '../../_ui';
import type { Espace } from '../_types';
import { Recherche } from './Recherche';

/**
 * TROUVER DES FINANCEURS : des pistes publiques, des fondations et des
 * mécènes d'entreprise, proposées à partir de ce que l'association a noté.
 * Toujours à vérifier auprès du financeur : rien ici ne fait foi.
 */
export default async function FinanceursPage() {
  const s = await sessionAssociation('/espace/financeurs');
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');
  if (!data) return <Encart ton="attention">{error ?? 'La page ne se charge pas pour le moment.'}</Encart>;
  const projetComplet = data.projet.complet;

  return (
    <>
      <Titre
        surtitre="Chercher de l'argent"
        sousTitre="À partir de ton projet, de ta commune et de ce que tu fais déjà : des financeurs publics, des fondations et des entreprises à qui parler. Des pistes à vérifier, pas des promesses."
      >
        Trouver des financeurs
      </Titre>

      {!projetComplet ? (
        <Encart ton="attention">
          <p className="font-extrabold">Remplis d&apos;abord ton projet en une page.</p>
          <p className="mt-1 text-sm leading-relaxed">
            Quatre questions : pour qui, quoi, comment, ce que ça change. C&apos;est ce texte qui sert à chercher les bons financeurs — sans lui, les pistes seront
            vagues.
          </p>
          <Link href="/espace/association#projet" className="mt-3 inline-flex text-sm font-bold text-[#4F46E5] underline underline-offset-4">
            Écrire mon projet →
          </Link>
        </Encart>
      ) : null}

      <div className="mt-6">
        <Recherche disponible={data.ia?.disponible ?? false} />
      </div>

      <p className="mt-8 text-sm text-[#6B6A8A]">
        Les dispositifs publics déjà repérés et vérifiés à la main sont sur{' '}
        <Link href="/avantages" className="font-bold text-[#4F46E5] underline underline-offset-4">
          ce à quoi j&apos;ai droit
        </Link>
        , et les reconnaissances officielles sur{' '}
        <Link href="/espace/association#agrements" className="font-bold text-[#4F46E5] underline underline-offset-4">
          nos agréments
        </Link>
        .
      </p>
    </>
  );
}
