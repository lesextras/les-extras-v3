import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../../_session';
import { Encart, Titre } from '../../_ui';
import { OngletsParametres } from '../_onglets';
import { CleApi, type Cle } from './CleApi';

export const metadata: Metadata = { title: 'API développeur', robots: { index: false, follow: false } };

/**
 * L'adresse publique de l'API de Pilote, celle que l'organisme écrit dans son
 * CRM ou dans Zapier. Elle est PROPRE À PILOTE (`NEXT_PUBLIC_PILOTE_API_URL`,
 * ex. https://api.pilote.toulali.fr/api) : un produit à part ne fait pas
 * écrire l'hôte d'un autre produit dans les intégrations de ses clients. Tant
 * que ce domaine n'est pas posé sur l'app API dans Coolify, on retombe sur
 * l'adresse commune.
 */
const BASE_API = `${(process.env.NEXT_PUBLIC_PILOTE_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://api.les-extras.fr/api').replace(/\/$/, '')}/v1/academie`;

export default async function PageApi() {
  const s = await sessionAcademie('/academie/parametres/api');
  const { data, error } = await apiAcademie<Cle[]>(s, '/ecole/cles-api');
  return (
    <>
      <Titre surtitre="Paramètres" sousTitre="Relier ton école à ton CRM, Zapier, Make ou ton site.">
        API développeur
      </Titre>
      <OngletsParametres actif="/academie/parametres/api" />
      {Array.isArray(data) ? <CleApi initiales={data} base={BASE_API} /> : <Encart ton="attention">{error ?? 'Les clés ne se chargent pas.'}</Encart>}
    </>
  );
}
