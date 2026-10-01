/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import type { Metadata } from 'next';
import { sessionAcademie } from '../_session';
import { Titre } from '../_ui';
import { Bpf } from './Bpf';

export const metadata: Metadata = { title: 'Bilan pédagogique et financier', robots: { index: false, follow: false } };

export default async function BpfPage() {
  await sessionAcademie('/academie/bpf');
  const courante = new Date().getFullYear();
  // Avant le 31 mai, on prépare le bilan de l'année écoulée.
  const annee = new Date().getMonth() < 6 ? courante - 1 : courante;
  return (
    <>
      <Titre
        surtitre="Gestion de l’organisme"
        sousTitre="À déposer avant le 31 mai."
        info="Art. L6352-11 du code du travail. Pré-rempli depuis tes sessions et factures."
      >
        Mon BPF
      </Titre>
      <Bpf anneeInitiale={annee} />
    </>
  );
}
