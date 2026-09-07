'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../_client';
import { BTN_PRIMAIRE, CHAMP } from '../_ui';

export interface Profil {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  hebdoOptIn: boolean | null;
}

/**
 * MON PROFIL : la personne, pas l'association. Le prénom sert partout dans
 * l'outil ; le nom et le téléphone servent aux documents qu'on fabrique.
 * L'adresse e-mail est l'identifiant de connexion : elle ne se change pas ici.
 */
export function FormulaireProfil({ profil }: { profil: Profil }) {
  const router = useRouter();
  const [prenom, setPrenom] = useState(profil.firstName ?? '');
  const [nom, setNom] = useState(profil.lastName ?? '');
  const [telephone, setTelephone] = useState(profil.phone ?? '');
  const [hebdo, setHebdo] = useState(Boolean(profil.hebdoOptIn));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (!prenom.trim()) {
      setErreur('Le prénom est nécessaire : c’est lui qu’on affiche partout.');
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      await appel('/users/me', {
        method: 'PATCH',
        body: {
          firstName: prenom.trim(),
          lastName: nom.trim() || undefined,
          phone: telephone.trim() || undefined,
          hebdoOptIn: hebdo,
        },
      });
      setEnregistre(true);
      setTimeout(() => setEnregistre(false), 4000);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="space-y-5">
      <p className="text-sm text-[#6B6A8A]">
        Les champs suivis d&apos;une étoile <span className="font-bold text-[#4F46E5]">*</span> sont nécessaires.
      </p>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">Adresse e-mail</span>
        <input type="email" value={profil.email} readOnly className={`${CHAMP} bg-[#F5F4FC] text-[#6B6A8A]`} />
        <span className="mt-1 block text-xs text-[#6B6A8A]">
          C&apos;est ton identifiant de connexion. Pour en changer, écris-nous depuis{' '}
          <a href="/nous-contacter" className="font-bold text-[#4F46E5] underline underline-offset-4">
            Nous contacter
          </a>
          .
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">
            Prénom <span className="text-[#4F46E5]">*</span>
          </span>
          <input type="text" required maxLength={50} value={prenom} onChange={(e) => setPrenom(e.target.value)} className={CHAMP} autoComplete="given-name" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">Nom</span>
          <input type="text" maxLength={50} value={nom} onChange={(e) => setNom(e.target.value)} className={CHAMP} autoComplete="family-name" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">Téléphone</span>
        <input type="tel" maxLength={30} value={telephone} onChange={(e) => setTelephone(e.target.value)} className={CHAMP} autoComplete="tel" />
        <span className="mt-1 block text-xs text-[#6B6A8A]">Il se recopie dans les documents que tu fabriques, quand ils demandent un contact.</span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-[#E6E4F3] bg-white px-4 py-3">
        <input type="checkbox" checked={hebdo} onChange={(e) => setHebdo(e.target.checked)} className="mt-1 h-4 w-4 accent-[#4F46E5]" />
        <span className="text-sm">
          <span className="block font-bold text-[#1D1B5C]">Recevoir le rendez-vous du lundi</span>
          <span className="block text-[#6B6A8A]">Un e-mail par semaine : ce qui presse, les dates limites qui approchent, une étape à avancer.</span>
        </span>
      </label>

      {erreur ? <p className="rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-4 py-3 text-sm font-bold text-[#8A1B3D]">{erreur}</p> : null}
      {enregistre ? <p className="rounded-xl border border-[#BFE6D2] bg-[#E3F5EC] px-4 py-3 text-sm font-bold text-[#0F5F3E]">C&apos;est enregistré.</p> : null}

      <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
        {enCours ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
