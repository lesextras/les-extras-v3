import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, CARTE } from '../_ui';
import { FormulaireOubli } from './FormulaireOubli';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  robots: { index: false, follow: true },
};

/**
 * MOT DE PASSE OUBLIÉ, CÔTÉ PILOTE (01/10/2026).
 *
 * Servie sur pilote.toulali.fr/mot-de-passe-oublie. La demande part avec
 * `produit: 'pilote'` : le courriel arrive au gabarit de Pilote et son lien
 * revient ici, jamais sur les-extras.fr.
 */
export default function MotDePasseOubliePage() {
  return (
    <div className="mx-auto max-w-[560px]">
      <div className={`${CARTE} p-6 sm:p-10`}>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1D1B5C] sm:text-4xl">
          Mot de passe <Accent>oublié</Accent> ?
        </h1>
        <p className="mt-3 text-lg leading-relaxed">Ton adresse e-mail, et on t&apos;envoie un lien.</p>
        <div className="mt-8">
          <FormulaireOubli />
        </div>
      </div>
      <p className="mt-4 text-center text-sm">
        <Link href="/connexion" className="font-bold text-[#4F46E5] underline underline-offset-4">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
