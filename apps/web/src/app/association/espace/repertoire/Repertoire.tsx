'use client';

import { useState } from 'react';
import {
  CATEGORIES_CONTACT,
  LIBELLES_ROLE,
  dateCourte,
  type CategorieContact,
  type Contact,
  type RoleContact,
} from '../_types';
import { FicheContact } from './FicheContact';

type Onglet = 'EQUIPE' | 'MEMBRES' | CategorieContact;

const ROLES_BUREAU: RoleContact[] = ['PRESIDENT', 'TRESORIER', 'SECRETAIRE', 'MEMBRE_BUREAU'];
const ROLES_CLASSES: RoleContact[] = ['PARTENAIRE', 'FINANCEUR', 'ELU', 'INSTITUTIONNEL'];
const ROLES_INTERNES: RoleContact[] = ['PRESIDENT', 'TRESORIER', 'SECRETAIRE', 'MEMBRE_BUREAU', 'MEMBRE', 'BENEVOLE', 'SALARIE'];

/** Ce que chaque rôle permet de faire : les « droits » dans l'association. */
export const DROITS: Partial<Record<RoleContact, string>> = {
  PRESIDENT: "Représente l'association, signe les demandes de subvention",
  TRESORIER: 'Tient les comptes, engage les dépenses, signe le budget',
  SECRETAIRE: 'Rédige les comptes rendus, tient la liste des membres',
  MEMBRE_BUREAU: 'Décide avec le bureau entre deux assemblées',
  MEMBRE: "Vote à l'assemblée générale s'il est à jour de cotisation",
  BENEVOLE: 'Donne du temps, ne décide pas',
  SALARIE: "Travaille pour l'association, ne vote pas",
  PARTENAIRE: 'Agit avec vous sur le terrain',
  FINANCEUR: 'Donne de l’argent, demande des comptes',
  ELU: 'Peut appuyer un dossier auprès de sa collectivité',
  INSTITUTIONNEL: 'Instruit vos demandes, connaît les dispositifs',
};

function initiales(c: Contact) {
  return `${c.prenom[0] ?? ''}${c.nom[0] ?? ''}`.toUpperCase();
}

/**
 * Le répertoire. En mode INTERNE : l'équipe et les membres, avec ce que chaque
 * rôle permet de faire. En mode CONTACTS : les quatre familles de contacts
 * autour de l'association (partenaires, financeurs, institutionnels, divers).
 */
export function Repertoire({ contacts, mode = 'INTERNE' }: { contacts: Contact[]; mode?: 'INTERNE' | 'CONTACTS' }) {
  const [onglet, setOnglet] = useState<Onglet>(mode === 'CONTACTS' ? 'PARTENAIRE' : 'EQUIPE');
  const [ouverte, setOuverte] = useState<Contact | null | 'nouvelle'>(null);
  const [filtre, setFiltre] = useState('');

  const equipe = contacts.filter((c) => c.roles.some((r) => ROLES_BUREAU.includes(r) || r === 'BENEVOLE' || r === 'SALARIE'));
  const membres = contacts.filter((c) => c.roles.includes('MEMBRE'));

  /** Les divers ramassent aussi les contacts externes qu'on n'a pas rangés. */
  function parCategorie(code: CategorieContact): Contact[] {
    const famille = CATEGORIES_CONTACT.find((f) => f.code === code);
    if (!famille) return [];
    if (code !== 'DIVERS') return contacts.filter((c) => c.roles.some((r) => famille.roles.includes(r)));
    return contacts.filter(
      (c) => c.roles.includes('AUTRE') || (!c.roles.some((r) => ROLES_CLASSES.includes(r)) && !c.roles.some((r) => ROLES_INTERNES.includes(r))),
    );
  }

  const listeBrute = onglet === 'EQUIPE' ? equipe : onglet === 'MEMBRES' ? membres : parCategorie(onglet);
  const liste = listeBrute.filter((c) => {
    const q = filtre.trim().toLowerCase();
    return !q || `${c.prenom} ${c.nom} ${c.structure ?? ''} ${c.poste ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q);
  });

  const onglets: { code: Onglet; libelle: string; nombre: number }[] =
    mode === 'CONTACTS'
      ? CATEGORIES_CONTACT.map((f) => ({ code: f.code as Onglet, libelle: f.libelle, nombre: parCategorie(f.code).length }))
      : [
          { code: 'EQUIPE', libelle: "L'équipe", nombre: equipe.length },
          { code: 'MEMBRES', libelle: 'Les membres', nombre: membres.length },
        ];

  const famille = CATEGORIES_CONTACT.find((f) => f.code === onglet);
  const rolesParDefaut: RoleContact[] = onglet === 'EQUIPE' ? ['BENEVOLE'] : onglet === 'MEMBRES' ? ['MEMBRE'] : [famille?.roles[0] ?? 'AUTRE'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {onglets.map((o) => (
          <button
            key={o.code}
            type="button"
            onClick={() => {
              setOnglet(o.code);
              setOuverte(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold ${onglet === o.code ? 'bg-[#1D1B5C] text-white' : 'bg-white text-[#3B3A66] hover:bg-[#ECEBFC]'}`}
          >
            {o.libelle} <span className={onglet === o.code ? 'text-[#C7C4F2]' : 'text-[#9A99B5]'}>{o.nombre}</span>
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <input
            type="search"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            placeholder="Chercher un nom…"
            className="w-44 rounded-xl border border-[#D9D6EE] bg-white px-3 py-2 text-sm focus:border-[#4F46E5] focus:outline-none"
          />
          <button type="button" onClick={() => setOuverte('nouvelle')} className="rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-bold text-white hover:bg-[#4338CA]">
            + Ajouter
          </button>
        </div>
      </div>

      {famille ? <p className="text-sm text-[#6B6A8A]">{famille.enUnMot}.</p> : null}

      {ouverte === 'nouvelle' ? <FicheContact contact={null} rolesParDefaut={rolesParDefaut} onFermer={() => setOuverte(null)} /> : null}

      {liste.length === 0 ? (
        <div className="rounded-2xl border border-[#E6E4F3] bg-white px-6 py-10 text-center">
          <p className="font-bold text-[#1D1B5C]">
            {onglet === 'EQUIPE'
              ? 'Personne dans l’équipe pour l’instant.'
              : onglet === 'MEMBRES'
                ? 'Aucun membre pour l’instant.'
                : `Rien dans « ${famille?.libelle ?? 'cette famille'} » pour l’instant.`}
          </p>
          <p className="mt-1 text-sm text-[#6B6A8A]">
            {onglet === 'EQUIPE'
              ? 'Commence par le président, le trésorier et le secrétaire : les financeurs demandent qui décide.'
              : onglet === 'MEMBRES'
                ? 'Chaque membre, avec sa date d’entrée et sa cotisation : c’est ce qui prouve qu’une décision est valable.'
                : 'Un nom, un poste, un téléphone : le jour où il faut appeler, on ne cherche plus.'}
          </p>
          <button type="button" onClick={() => setOuverte('nouvelle')} className="mt-4 rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA]">
            Ajouter une personne
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[#E6E4F3] overflow-hidden rounded-2xl border border-[#E6E4F3] bg-white">
          {liste.map((c) => {
            const droit = c.roles.map((r) => DROITS[r]).find(Boolean);
            return (
              <li key={c.id}>
                {ouverte && ouverte !== 'nouvelle' && ouverte.id === c.id ? (
                  <div className="p-3">
                    <FicheContact contact={c} onFermer={() => setOuverte(null)} />
                  </div>
                ) : (
                  <button type="button" onClick={() => setOuverte(c)} className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-[#F5F4FC]">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ECEBFC] text-sm font-extrabold text-[#4338CA]">{initiales(c)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold text-[#1D1B5C]">
                        {c.prenom} {c.nom}
                        {c.structure ? <span className="font-normal text-[#6B6A8A]"> · {c.structure}</span> : null}
                      </span>
                      {c.poste ? <span className="mt-0.5 block text-sm text-[#3B3A66]">{c.poste}</span> : null}
                      <span className="mt-0.5 flex flex-wrap gap-1.5">
                        {c.roles.map((r) => (
                          <span key={r} className="rounded-full bg-[#F0EFF7] px-2 py-0.5 text-xs font-bold text-[#6B6A8A]">
                            {LIBELLES_ROLE[r]}
                          </span>
                        ))}
                        {c.roles.includes('MEMBRE') ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.cotisationAJour ? 'bg-[#E3F5EC] text-[#0F5F3E]' : 'bg-[#FEF3E2] text-[#7C3E06]'}`}>
                            {c.cotisationAJour ? 'Cotisation à jour' : 'Cotisation à régler'}
                          </span>
                        ) : null}
                        {c.mandatFin ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${new Date(c.mandatFin).getTime() < Date.now() ? 'bg-[#FDE8E6] text-[#8A2419]' : 'bg-[#F0EFF7] text-[#6B6A8A]'}`}>
                            Mandat jusqu&apos;au {dateCourte(c.mandatFin)}
                          </span>
                        ) : null}
                      </span>
                      {droit ? <span className="mt-1 block text-sm text-[#6B6A8A]">{droit}</span> : null}
                    </span>
                    <span className="hidden text-sm text-[#6B6A8A] sm:block">{c.email ?? c.telephone ?? ''}</span>
                    <span className="text-[#C7C4F2]">›</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
