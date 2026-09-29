'use client';

import { espaceCourant } from '../_client';

/**
 * Télécharge un fichier produit par l'API (PDF, ZIP, CSV, XLSX) au nom de
 * l'académie affichée. On passe par `fetch` plutôt que par un simple lien pour
 * envoyer l'en-tête du compte : sans lui, le relais choisirait peut-être un
 * autre espace de la personne.
 */
export async function telecharger(chemin: string, nomParDefaut: string): Promise<void> {
  const headers: Record<string, string> = {};
  const espace = espaceCourant();
  if (espace) headers['x-account-id'] = espace;
  const res = await fetch(`/api/proxy${chemin}`, { headers, credentials: 'include' });
  if (!res.ok) {
    let message = `Le fichier n'a pas pu être produit (erreur ${res.status}).`;
    try {
      const j = (await res.json()) as { message?: string | string[] };
      const m = Array.isArray(j.message) ? j.message.join(' · ') : j.message;
      if (m && !/^(Bad Request|Not Found|Forbidden)$/.test(m)) message = m;
    } catch {
      /* rien */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const dispo = res.headers.get('content-disposition') ?? '';
  const nom = /filename="([^"]+)"/.exec(dispo)?.[1] ?? nomParDefaut;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export const euros = (n: number | null | undefined) =>
  n === null || n === undefined ? '' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export const dateCourte = (iso: string | Date | null | undefined) => {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const heure = (iso: string | Date) =>
  new Date(iso).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });

export const jourLong = (iso: string | Date) =>
  new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' });

/** Le jour de Paris au format AAAA-MM-JJ (pour les champs date). */
export const jourIso = (d: Date) => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

export const MOMENT: Record<string, string> = { MORNING: 'Matin', AFTERNOON: 'Après-midi' };

export const TYPE_STAGIAIRE: Record<string, string> = {
  SALARIE_PRIVE: 'Salarié d’un employeur privé',
  APPRENTI: 'Apprenti',
  DEMANDEUR_EMPLOI: 'Demandeur d’emploi',
  PARTICULIER: 'Particulier à ses frais',
  AUTRE: 'Autre (agent public, bénévole…)',
};

export const ORIGINE: Record<string, string> = {
  ENTREPRISE: 'Entreprise (plan de formation)',
  OPCO_PLAN: 'OPCO : plan de développement des compétences',
  OPCO_CPF: 'CPF (Mon Compte Formation)',
  OPCO_APPRENTISSAGE: 'OPCO : apprentissage',
  OPCO_PROFESSIONNALISATION: 'OPCO : professionnalisation',
  OPCO_PRO_A: 'OPCO : Pro-A',
  OPCO_TRANSITION: 'Projet de transition professionnelle',
  OPCO_DEMANDEURS: 'OPCO : demandeurs d’emploi',
  OPCO_NON_SALARIES: 'Fonds des non-salariés (FAF)',
  PUBLICS_AGENTS: 'Employeur public (ses agents)',
  EUROPE: 'Fonds européens',
  ETAT: 'État',
  REGION: 'Région',
  FRANCE_TRAVAIL: 'France Travail',
  AUTRES_PUBLICS: 'Autres fonds publics',
  PARTICULIER: 'Le stagiaire lui-même',
  AUTRE_ORGANISME: 'Un autre organisme de formation',
  AUTRES: 'Autre',
};

export const DOCUMENTS: { type: string; libelle: string; par: 'session' | 'stagiaire' | 'entreprise' | 'particulier'; aide: string }[] = [
  { type: 'CONVENTION', libelle: 'Conventions', par: 'entreprise', aide: 'Une par entreprise cliente, à faire signer avant la formation.' },
  { type: 'CONTRAT', libelle: 'Contrats', par: 'particulier', aide: 'Pour la personne qui paie elle-même : dix jours de rétractation.' },
  { type: 'CONVOCATION', libelle: 'Convocations', par: 'stagiaire', aide: 'Envoyées avec le programme et le lien de l’espace stagiaire.' },
  { type: 'PROGRAMME', libelle: 'Programme', par: 'session', aide: 'Objectifs, contenu, méthodes, évaluation, accessibilité.' },
  { type: 'EMARGEMENT', libelle: "Feuille d'émargement", par: 'session', aide: 'Signatures par demi-journée, formateur compris.' },
  { type: 'ATTESTATION', libelle: 'Attestations de fin', par: 'stagiaire', aide: 'Avec les heures réalisées et l’évaluation des acquis.' },
  { type: 'CERTIFICAT_REALISATION', libelle: 'Certificats de réalisation', par: 'stagiaire', aide: 'Le modèle officiel que demandent les OPCO et le CPF.' },
];
