import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, Titre } from '../../_ui';
import type { DocumentLibre } from '../_types';
import { Documents } from './Documents';

/** MES DOCUMENTS : tout ce qui n'est pas une pièce du classeur, réuni au même endroit. */
export default async function DocumentsPage() {
  const s = await sessionAssociation('/espace/documents');
  const { data, error } = await apiEspace<DocumentLibre[]>(s, '/association/documents');
  if (!data) return <Encart ton="attention">{error ?? 'Les documents ne se chargent pas pour le moment.'}</Encart>;

  return (
    <>
      <Titre
        surtitre="Mes documents"
        sousTitre="Les procès-verbaux, les courriers, les devis, les photos des actions : tout au même endroit. Les treize pièces officielles, elles, sont dans le classeur."
        actions={
          <Link href="/espace/classeur" className="inline-flex items-center rounded-xl border-2 border-[#D9D6EE] bg-white px-4 py-2 text-sm font-bold text-[#1D1B5C] no-underline hover:border-[#4F46E5]">
            Aller au classeur
          </Link>
        }
      >
        Tous les documents réunis
      </Titre>
      <Documents documents={data} />
    </>
  );
}
