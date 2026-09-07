'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import { LIBELLES_ROLE, pourInput, type Contact, type RoleContact } from '../_types';

const CHAMP =
  'w-full rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]';

const ROLES_EQUIPE: RoleContact[] = ['PRESIDENT', 'TRESORIER', 'SECRETAIRE', 'MEMBRE_BUREAU', 'MEMBRE', 'BENEVOLE', 'SALARIE'];
const ROLES_AUTOUR: RoleContact[] = ['PARTENAIRE', 'FINANCEUR', 'ELU', 'AUTRE'];

interface Valeurs {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  structure: string;
  roles: RoleContact[];
  dateAdhesion: string;
  cotisationAJour: boolean;
  mandatDebut: string;
  mandatFin: string;
  notes: string;
}

function depuis(c: Contact | null, rolesParDefaut: RoleContact[]): Valeurs {
  return {
    prenom: c?.prenom ?? '',
    nom: c?.nom ?? '',
    email: c?.email ?? '',
    telephone: c?.telephone ?? '',
    structure: c?.structure ?? '',
    roles: c?.roles ?? rolesParDefaut,
    dateAdhesion: pourInput(c?.dateAdhesion),
    cotisationAJour: c?.cotisationAJour ?? false,
    mandatDebut: pourInput(c?.mandatDebut),
    mandatFin: pourInput(c?.mandatFin),
    notes: c?.notes ?? '',
  };
}

/**
 * La fiche d'une personne : à créer ou à modifier. Une personne peut cumuler
 * les rôles (présidente ET bénévole, partenaire ET élu…).
 */
export function FicheContact({
  contact,
  rolesParDefaut = ['MEMBRE'],
  onFermer,
}: {
  contact: Contact | null;
  rolesParDefaut?: RoleContact[];
  onFermer: () => void;
}) {
  const router = useRouter();
  const [v, setV] = useState<Valeurs>(depuis(contact, rolesParDefaut));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const estBureau = v.roles.some((r) => r === 'PRESIDENT' || r === 'TRESORIER' || r === 'SECRETAIRE' || r === 'MEMBRE_BUREAU');
  const estAutour = v.roles.some((r) => ROLES_AUTOUR.includes(r));

  function basculerRole(r: RoleContact) {
    setV((x) => ({ ...x, roles: x.roles.includes(r) ? x.roles.filter((y) => y !== r) : [...x.roles, r] }));
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const body = {
      prenom: v.prenom.trim(),
      nom: v.nom.trim(),
      email: v.email.trim() || null,
      telephone: v.telephone.trim() || null,
      structure: v.structure.trim() || null,
      roles: v.roles.length ? v.roles : ['MEMBRE'],
      dateAdhesion: v.dateAdhesion || null,
      cotisationAJour: v.cotisationAJour,
      mandatDebut: v.mandatDebut || null,
      mandatFin: v.mandatFin || null,
      notes: v.notes.trim() || null,
    };
    try {
      if (contact) await appel(`/association/repertoire/${contact.id}`, { method: 'PATCH', body });
      else await appel('/association/repertoire', { method: 'POST', body });
      router.refresh();
      onFermer();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer() {
    if (!contact) return;
    if (!window.confirm(`Retirer ${contact.prenom} ${contact.nom} du répertoire ?`)) return;
    setEnCours(true);
    try {
      await appel(`/association/repertoire/${contact.id}`, { method: 'DELETE' });
      router.refresh();
      onFermer();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La suppression a échoué.');
      setEnCours(false);
    }
  }

  const caseRole = (r: RoleContact) => (
    <label
      key={r}
      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${
        v.roles.includes(r) ? 'border-[#4F46E5] bg-[#ECEBFC] text-[#4338CA]' : 'border-[#D9D6EE] bg-white text-[#3B3A66]'
      }`}
    >
      <input type="checkbox" checked={v.roles.includes(r)} onChange={() => basculerRole(r)} className="accent-[#4F46E5]" />
      {LIBELLES_ROLE[r]}
    </label>
  );

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-4 rounded-2xl border-2 border-[#4F46E5] bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-[#1D1B5C]">{contact ? `${contact.prenom} ${contact.nom}` : 'Une nouvelle personne'}</h3>
        <button type="button" onClick={onFermer} className="text-sm font-bold text-[#6B6A8A] hover:text-[#1D1B5C]">
          Fermer
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Prénom *</span>
          <input type="text" required maxLength={80} value={v.prenom} onChange={(e) => setV({ ...v, prenom: e.target.value })} className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Nom *</span>
          <input type="text" required maxLength={80} value={v.nom} onChange={(e) => setV({ ...v, nom: e.target.value })} className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">E-mail</span>
          <input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Téléphone</span>
          <input type="tel" maxLength={40} value={v.telephone} onChange={(e) => setV({ ...v, telephone: e.target.value })} className={CHAMP} />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-[#1D1B5C]">Dans l&apos;association</legend>
        <div className="flex flex-wrap gap-2">{ROLES_EQUIPE.map(caseRole)}</div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-[#1D1B5C]">Autour de l&apos;association</legend>
        <div className="flex flex-wrap gap-2">{ROLES_AUTOUR.map(caseRole)}</div>
      </fieldset>

      {estAutour ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Sa structure</span>
          <span className="text-[#6B6A8A]">La mairie, le département, l&apos;école, l&apos;entreprise…</span>
          <input type="text" maxLength={160} value={v.structure} onChange={(e) => setV({ ...v, structure: e.target.value })} className={CHAMP} />
        </label>
      ) : null}

      {v.roles.includes('MEMBRE') ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#1D1B5C]">Membre depuis le</span>
            <input type="date" value={v.dateAdhesion} onChange={(e) => setV({ ...v, dateAdhesion: e.target.value })} className={CHAMP} />
          </label>
          <label className="flex items-center gap-3 self-end rounded-xl border border-[#D9D6EE] px-4 py-3 text-sm font-bold text-[#1D1B5C]">
            <input type="checkbox" checked={v.cotisationAJour} onChange={(e) => setV({ ...v, cotisationAJour: e.target.checked })} className="h-5 w-5 accent-[#4F46E5]" />
            Cotisation payée cette année
          </label>
        </div>
      ) : null}

      {estBureau ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#1D1B5C]">Élu·e le</span>
            <input type="date" value={v.mandatDebut} onChange={(e) => setV({ ...v, mandatDebut: e.target.value })} className={CHAMP} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#1D1B5C]">Fin du mandat</span>
            <span className="text-[#6B6A8A]">On te préviendra deux mois avant.</span>
            <input type="date" value={v.mandatFin} onChange={(e) => setV({ ...v, mandatFin: e.target.value })} className={CHAMP} />
          </label>
        </div>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold text-[#1D1B5C]">Notes</span>
        <textarea rows={2} maxLength={2000} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} className={CHAMP} />
      </label>

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
          {enCours ? 'Enregistrement…' : contact ? 'Enregistrer' : 'Ajouter cette personne'}
        </button>
        {contact ? (
          <button type="button" onClick={supprimer} disabled={enCours} className="rounded-xl px-4 py-3 text-sm font-bold text-[#8A2419] hover:bg-[#FDE8E6]">
            Retirer du répertoire
          </button>
        ) : null}
      </div>
    </form>
  );
}
