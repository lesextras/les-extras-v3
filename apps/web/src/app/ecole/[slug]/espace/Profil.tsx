'use client';

import { useState } from 'react';
import { appelApprenant } from '../../_espace/coque';

export function Profil({
  apprenant,
  couleur,
  slug,
}: {
  apprenant: { email: string; prenom: string | null; nom: string | null };
  couleur: string;
  slug: string;
}) {
  const [prenom, setPrenom] = useState(apprenant.prenom ?? '');
  const [nom, setNom] = useState(apprenant.nom ?? '');
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function agir(fn: () => Promise<unknown>, ok: string) {
    setOccupe(true);
    setMessage(null);
    try {
      await fn();
      setMessage({ ok: true, texte: ok });
    } catch (e) {
      setMessage({ ok: false, texte: e instanceof Error ? e.message : 'Erreur inconnue' });
    } finally {
      setOccupe(false);
    }
  }

  const champ = 'w-full rounded-xl border-2 border-[#DDEBE4] bg-white px-4 py-3 text-base focus:outline-none';
  const bouton = 'rounded-xl px-5 py-3 text-base font-extrabold text-white disabled:opacity-60';

  return (
    <div className="grid max-w-[640px] gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#12312A]">Mon profil</h1>
      {message ? (
        <p className={`rounded-xl px-4 py-3 font-bold ${message.ok ? 'bg-[#E3F5EC] text-[#0F5F3E]' : 'bg-[#FDE7EC] text-[#8A1B3D]'}`}>{message.texte}</p>
      ) : null}

      <section className="rounded-2xl border border-[#DDEBE4] bg-white p-6">
        <h2 className="text-lg font-extrabold text-[#12312A]">Mes informations</h2>
        <p className="mt-1 text-sm text-[#5E7A6E]">Adresse de connexion : {apprenant.email}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-bold text-[#12312A]">
            Prénom
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className={champ} />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-[#12312A]">
            Nom
            <input value={nom} onChange={(e) => setNom(e.target.value)} className={champ} />
          </label>
        </div>
        <button
          type="button"
          disabled={occupe}
          onClick={() => agir(() => appelApprenant('/apprenant/moi', { methode: 'PATCH', corps: { prenom, nom } }), 'Vos informations sont enregistrées.')}
          className={`${bouton} mt-4`}
          style={{ backgroundColor: couleur }}
        >
          Enregistrer
        </button>
      </section>

      <section className="rounded-2xl border border-[#DDEBE4] bg-white p-6">
        <h2 className="text-lg font-extrabold text-[#12312A]">Changer mon mot de passe</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-bold text-[#12312A]">
            Mot de passe actuel
            <input type="password" autoComplete="current-password" value={actuel} onChange={(e) => setActuel(e.target.value)} className={champ} />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-[#12312A]">
            Nouveau mot de passe
            <input type="password" autoComplete="new-password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} className={champ} />
          </label>
        </div>
        <button
          type="button"
          disabled={occupe || !actuel || nouveau.length < 8}
          onClick={() =>
            agir(async () => {
              await appelApprenant('/apprenant/mot-de-passe', { methode: 'POST', corps: { actuel, nouveau } });
              setActuel('');
              setNouveau('');
            }, 'Votre mot de passe est changé. Vos autres appareils devront se reconnecter.')
          }
          className={`${bouton} mt-4`}
          style={{ backgroundColor: couleur }}
        >
          Changer le mot de passe
        </button>
      </section>

      <button
        type="button"
        onClick={async () => {
          await appelApprenant('/deconnexion', { methode: 'POST' }).catch(() => undefined);
          window.location.href = `/ecole/${slug}/connexion`;
        }}
        className="justify-self-start rounded-xl border-2 border-[#DDEBE4] bg-white px-5 py-2.5 font-bold text-[#12312A]"
      >
        Me déconnecter
      </button>
    </div>
  );
}
