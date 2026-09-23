import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../../_session';
import { Encart, Titre } from '../../_ui';
import { OngletsParametres } from '../_onglets';
import { CleApi, type Cle } from './CleApi';

export const metadata: Metadata = { title: 'API développeur', robots: { index: false, follow: false } };

const BASE_API = `${(process.env.NEXT_PUBLIC_API_URL ?? 'https://api.les-extras.fr/api').replace(/\/$/, '')}/v1/academie`;

export default async function PageApi() {
  const s = await sessionAcademie('/academie/parametres/api');
  const { data, error } = await apiAcademie<Cle[]>(s, '/ecole/cles-api');
  return (
    <>
      <Titre surtitre="Paramètres" sousTitre="Relier ton école à tes autres outils (CRM, Zapier, Make, ton site) : lire tes formations, tes apprenants et tes ventes, inscrire un apprenant.">
        API développeur
      </Titre>
      <OngletsParametres actif="/academie/parametres/api" />
      {Array.isArray(data) ? <CleApi initiales={data} base={BASE_API} /> : <Encart ton="attention">{error ?? 'Les clés ne se chargent pas.'}</Encart>}
    </>
  );
}
