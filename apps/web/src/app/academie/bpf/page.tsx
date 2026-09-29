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
        surtitre="Gestion de l’organisme · art. L6352-11 du code du travail"
        sousTitre="Le bilan à déposer chaque année avant le 31 mai sur Mon Activité Formation. Tout ce que tes sessions et tes factures permettent de calculer est déjà rempli ; le reste se saisit ici."
      >
        Bilan pédagogique et financier
      </Titre>
      <Bpf anneeInitiale={annee} />
    </>
  );
}
