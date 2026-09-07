import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, CARTE, Encart } from '../_ui';
import { FormulaireConnexion } from '../connexion/FormulaireConnexion';

export const metadata: Metadata = {
  title: "Ouvrir l'espace de mon association",
  robots: { index: false, follow: true },
};

/**
 * POUR CELLES QUI ONT COMMENCÉ SANS ASSOCIATION. Le compte existe, le chemin
 * est en cours ; l'association vient d'être déclarée. Ici on ouvre son espace :
 * on retrouve l'association par son nom, et son classeur naît pré-rempli.
 *
 * On repasse par le formulaire de connexion : c'est lui qui sait ouvrir un
 * espace puis rafraîchir la session sur le nouveau compte.
 */
export default function OuvrirMonEspacePage() {
  return (
    <div className="mx-auto max-w-[640px]">
      <div className={`${CARTE} p-6 sm:p-10`}>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">
          Ouvre l&apos;espace de ton <Accent>association</Accent>
        </h1>
        <p className="mt-3 text-lg leading-relaxed">
          Ton compte existe déjà, mais aucune association n&apos;y est encore rattachée. Confirme ton adresse et ton mot de passe : on retrouve ton association
          par son nom, et son classeur se remplit tout seul depuis les répertoires publics.
        </p>
        <div className="mt-6">
          <Encart ton="info">
            Ton association n&apos;est pas encore déclarée ? C&apos;est normal, et c&apos;est justement l&apos;objet du{' '}
            <Link href="/chemin" className="font-bold underline underline-offset-4">
              chemin
            </Link>{' '}
            : douze étapes, de l&apos;idée à la première subvention. Reviens ici le jour où elle existe.
          </Encart>
        </div>
        <div className="mt-8">
          <FormulaireConnexion suivant="/espace?bienvenue=1" />
        </div>
      </div>
    </div>
  );
}
