/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Titre } from '../_ui';
import type { EspaceAcademie } from '../_types';
import { Facturation } from './Facturation';

export const metadata: Metadata = { title: 'Devis et factures', robots: { index: false, follow: false } };

export default async function FacturationPage() {
  const s = await sessionAcademie('/academie/facturation');
  const { data } = await apiAcademie<EspaceAcademie>(s, '/academie/espace');
  const a = data?.academie;
  return (
    <>
      <Titre
        surtitre="Gestion de l’organisme"
        sousTitre="Devis, factures et avoirs."
        info="Numérotation continue, mentions obligatoires et relances automatiques."
      >
        Devis et factures
      </Titre>
      <Facturation tvaParDefaut={a?.exonereTva ? 0 : (a?.tauxTva ?? 20)} siretManquant={!a?.siret} />
    </>
  );
}
