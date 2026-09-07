import Link from 'next/link';
import type { Metadata } from 'next';
import { apiEspace, sessionAssociation } from '../_session';
import { CARTE, Carte, Encart, SousTitre, Titre } from '../_ui';
import { FormulaireProfil, type Profil } from './FormulaireProfil';

export const metadata: Metadata = {
  title: 'Mon profil',
  robots: { index: false, follow: false },
};

function initiale(nom: string) {
  return (nom.trim()[0] ?? '?').toUpperCase();
}

/**
 * MON PROFIL : la personne derrière l'association. Séparé de « Mon
 * association » exprès — on peut changer de bureau sans changer de compte.
 */
export default async function MonProfilPage() {
  const s = await sessionAssociation('/mon-profil');
  const { data, error } = await apiEspace<Partial<Profil> & { email?: string }>(s, '/users/me');
  if (!data?.email) return <Encart ton="attention">{error ?? 'Ton profil ne se charge pas pour le moment.'}</Encart>;

  const profil: Profil = {
    email: data.email,
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    phone: data.phone ?? null,
    hebdoOptIn: data.hebdoOptIn ?? null,
  };
  const affiche = [profil.firstName, profil.lastName].filter(Boolean).join(' ') || profil.email;

  return (
    <div className="mx-auto max-w-[860px]">
      <Titre surtitre="Mon compte" sousTitre="Qui tu es, toi. Ton association et son classeur se règlent ailleurs.">
        Mon profil
      </Titre>

      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
        <Carte>
          <div className="flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#4F46E5] text-3xl font-extrabold text-white">{initiale(affiche)}</span>
            <p className="mt-3 font-extrabold leading-snug text-[#1D1B5C]">{affiche}</p>
            <p className="mt-1 text-sm text-[#6B6A8A]">{s.compte.name}</p>
          </div>
        </Carte>

        <div className={`${CARTE} p-5 sm:p-7`}>
          <SousTitre>Mes informations</SousTitre>
          <div className="mt-4">
            <FormulaireProfil profil={profil} />
          </div>
        </div>
      </div>

      <section className="mt-8">
        <Carte>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#1D1B5C]">Mon association</h2>
              <p className="mt-1 text-sm text-[#6B6A8A]">Son identité, ses papiers, son secrétariat et sa comptabilité.</p>
            </div>
            <Link href="/espace/association" className="text-sm font-bold text-[#4F46E5] underline underline-offset-4">
              Ouvrir mon association →
            </Link>
          </div>
        </Carte>
      </section>
    </div>
  );
}
