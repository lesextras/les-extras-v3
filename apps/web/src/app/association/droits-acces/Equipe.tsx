'use client';

import { useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { BTN_DISCRET, BTN_PRIMAIRE, CARTE, CHAMP, Encart, Pastille, formaterDate } from '../_ui';

/**
 * L'ÉQUIPE DE L'ASSOCIATION — qui entre, et jusqu'où.
 *
 * Aucune fiche n'est créée à la place de quelqu'un : on envoie une invitation
 * à une adresse, la personne crée son compte elle-même, et elle rejoint alors
 * l'équipe avec le rôle choisi. Tant qu'elle n'a pas accepté, elle reste dans
 * la liste des invitations en attente.
 */

export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface Membre {
  id: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt?: string | null;
  user: { id: string; email: string; firstName?: string | null; lastName?: string | null; job?: string | null };
  externe?: boolean;
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt?: string | null;
  createdAt?: string | null;
}

/** Les rôles qu'on peut donner. Le propriétaire ne se transmet pas d'ici. */
const ATTRIBUABLES: Role[] = ['ADMIN', 'MANAGER', 'MEMBER'];

const LIBELLE: Record<Role, string> = {
  OWNER: 'Propriétaire',
  ADMIN: 'Administrateur',
  MANAGER: 'Responsable',
  MEMBER: 'Membre',
};

/** Ce que chaque rôle permet, en une phrase — pour choisir sans se tromper. */
const PORTEE: Record<Role, string> = {
  OWNER: "Tout, y compris fermer l'espace. Un seul par association.",
  ADMIN: "Tout sauf fermer l'espace : l'équipe, les droits, les réglages.",
  MANAGER: 'Les dossiers de subvention, le budget, les documents, la comptabilité.',
  MEMBER: 'Consulte, suit les dossiers, dépose ses documents.',
};

const TEINTE: Record<Role, string> = {
  OWNER: 'bg-[#4338CA] text-white',
  ADMIN: 'bg-[#ECEBFC] text-[#4338CA]',
  MANAGER: 'bg-[#FDE7EC] text-[#8A1B3D]',
  MEMBER: 'bg-[#F5F4FC] text-[#3B3A66]',
};

function nomDe(m: Membre) {
  const complet = [m.user.firstName, m.user.lastName].filter(Boolean).join(' ').trim();
  return complet || m.user.email;
}

export function Equipe({ membres: initiaux, invitations: initiales }: { membres: Membre[]; invitations: Invitation[] }) {
  const [membres, setMembres] = useState(initiaux);
  const [invitations, setInvitations] = useState(initiales);
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');

  const enAttente = invitations.filter((i) => i.status === 'PENDING');
  const actifs = membres.filter((m) => m.status === 'ACTIVE');
  const suspendus = membres.filter((m) => m.status !== 'ACTIVE');
  const seuleAdmin = actifs.filter((m) => m.role === 'OWNER' || m.role === 'ADMIN').length <= 1;

  async function inviter(e: FormEvent) {
    e.preventDefault();
    const propre = email.trim().toLowerCase();
    if (!propre.includes('@')) {
      setErreur('Indique une adresse e-mail valide.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    setSucces(null);
    try {
      const creee = await appel<Invitation>('/invitations', { method: 'POST', body: { email: propre, role } });
      setInvitations((l) => [creee, ...l]);
      setEmail('');
      setOuvert(false);
      setSucces(`Invitation envoyée à ${propre}. La personne crée son compte elle-même avec ce lien.`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'invitation n'a pas pu être envoyée.");
    } finally {
      setEnCours(false);
    }
  }

  async function relancer(id: string) {
    setErreur(null);
    try {
      await appel(`/invitations/${id}/resend`, { method: 'POST' });
      setSucces('Invitation renvoyée.');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'invitation n'a pas pu être renvoyée.");
    }
  }

  async function annuler(id: string) {
    setErreur(null);
    try {
      await appel(`/invitations/${id}`, { method: 'DELETE' });
      setInvitations((l) => l.filter((i) => i.id !== id));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'invitation n'a pas pu être annulée.");
    }
  }

  async function changerRole(id: string, nouveau: Role) {
    setErreur(null);
    try {
      await appel(`/memberships/${id}/role`, { method: 'PATCH', body: { role: nouveau } });
      setMembres((l) => l.map((m) => (m.id === id ? { ...m, role: nouveau } : m)));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Le rôle n'a pas pu être changé.");
    }
  }

  async function basculerAcces(m: Membre) {
    setErreur(null);
    const vers = m.status === 'ACTIVE' ? 'suspend' : 'reactivate';
    try {
      await appel(`/memberships/${m.id}/${vers}`, { method: 'PATCH' });
      setMembres((l) =>
        l.map((x) => (x.id === m.id ? { ...x, status: x.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : x)),
      );
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'accès n'a pas pu être modifié.");
    }
  }

  return (
    <>
      {seuleAdmin ? (
        <div className="mb-6">
          <Encart ton="attention">
            Tu es la seule personne à pouvoir administrer cette association. Invite au moins une deuxième
            administratrice ou un deuxième administrateur : sans cela, un mot de passe perdu ferme l&apos;espace.
          </Encart>
        </div>
      ) : null}

      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}
      {succes ? (
        <div className="mb-5">
          <Encart ton="ok">{succes}</Encart>
        </div>
      ) : null}

      {/* --------------------------------------------------------- inviter */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-extrabold text-[#1D1B5C]">
          L&apos;équipe <span className="text-[#6B6A8A]">({actifs.length})</span>
        </h2>
        <button type="button" onClick={() => setOuvert((o) => !o)} className={`${BTN_PRIMAIRE} ml-auto`}>
          {ouvert ? 'Fermer' : "Inviter quelqu'un"}
        </button>
      </div>

      {ouvert ? (
        <form onSubmit={inviter} className={`${CARTE} mb-6 p-5`}>
          <p className="mb-4 text-[14px] leading-relaxed text-[#6B6A8A]">
            On n&apos;ouvre jamais un compte à la place de quelqu&apos;un. Tu envoies l&apos;invitation, la personne
            crée son propre compte et choisit son mot de passe : c&apos;est elle, et elle seule, qui y a accès.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#1D1B5C]">Adresse e-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={CHAMP}
                placeholder="prenom.nom@exemple.fr"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#1D1B5C]">Rôle</span>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={CHAMP}>
                {ATTRIBUABLES.map((r) => (
                  <option key={r} value={r}>
                    {LIBELLE[r]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-3 rounded-xl bg-[#F5F4FC] px-4 py-3 text-[14px] leading-relaxed text-[#3B3A66]">
            <span className="font-bold">{LIBELLE[role]}</span> — {PORTEE[role]}
          </p>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
              {enCours ? 'Envoi…' : "Envoyer l'invitation"}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className={BTN_DISCRET}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      {/* ---------------------------------------------------- les membres */}
      <ul className="grid gap-3">
        {actifs.concat(suspendus).map((m) => (
          <li key={m.id} className={`${CARTE} p-4 sm:p-5`}>
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-[220px] flex-1">
                <p className="text-[16px] font-extrabold text-[#1D1B5C]">{nomDe(m)}</p>
                <p className="break-all text-[13px] text-[#6B6A8A]">{m.user.email}</p>
                {m.user.job ? <p className="mt-0.5 text-[13px] text-[#3B3A66]">{m.user.job}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${TEINTE[m.role]}`}>
                  {LIBELLE[m.role]}
                </span>
                {m.status === 'ACTIVE' ? null : <Pastille ton="attention">Accès suspendu</Pastille>}
                {m.externe ? <Pastille ton="neutre">Compte indépendant</Pastille> : null}
              </div>
            </div>

            <p className="mt-2 text-[13px] leading-relaxed text-[#6B6A8A]">{PORTEE[m.role]}</p>

            {m.role === 'OWNER' ? null : (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#EEEDF8] pt-3">
                <label className="flex items-center gap-2 text-[13px] font-bold text-[#3B3A66]">
                  Rôle
                  <select
                    value={m.role}
                    onChange={(e) => changerRole(m.id, e.target.value as Role)}
                    className="rounded-lg border-2 border-[#E6E4F3] bg-white px-2.5 py-1.5 text-[13px] font-bold text-[#1D1B5C]"
                  >
                    {ATTRIBUABLES.map((r) => (
                      <option key={r} value={r}>
                        {LIBELLE[r]}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={() => basculerAcces(m)} className={`${BTN_DISCRET} ml-auto`}>
                  {m.status === 'ACTIVE' ? "Suspendre l'accès" : "Rendre l'accès"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* ------------------------------------------------ les invitations */}
      <h2 className="mb-3 mt-9 text-[19px] font-extrabold text-[#1D1B5C]">
        Invitations en attente <span className="text-[#6B6A8A]">({enAttente.length})</span>
      </h2>

      {enAttente.length ? (
        <ul className="grid gap-3">
          {enAttente.map((i) => (
            <li key={i.id} className={`${CARTE} flex flex-wrap items-center gap-3 p-4`}>
              <div className="min-w-[200px] flex-1">
                <p className="break-all text-[15px] font-bold text-[#1D1B5C]">{i.email}</p>
                <p className="text-[13px] text-[#6B6A8A]">
                  {LIBELLE[i.role]}
                  {i.expiresAt ? ` · valable jusqu'au ${formaterDate(i.expiresAt)}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => relancer(i.id)} className={BTN_DISCRET}>
                Renvoyer
              </button>
              <button type="button" onClick={() => annuler(i.id)} className={BTN_DISCRET}>
                Annuler
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px] leading-relaxed text-[#6B6A8A]">
          Aucune invitation en attente. Tout le monde a créé son compte.
        </p>
      )}
    </>
  );
}
