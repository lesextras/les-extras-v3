import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../../_session';
import { Encart, Titre } from '../../_ui';
import { OngletsParametres } from '../_onglets';
import { CleApi, type Cle } from './CleApi';

export const metadata: Metadata = { title: 'API développeur', robots: { index: false, follow: false } };

/**
 * L'adresse publique de l'API de Pilote, celle que l'organisme écrit dans son
 * CRM ou dans Zapier. Elle est PROPRE À PILOTE : pilote.toulali.fr/api/v1/…,
 * relayée vers l'API par le site (`next.config.mjs`, réécriture limitée à
 * l'hôte de Pilote). Un produit à part ne fait pas écrire l'hôte d'un autre
 * produit dans les intégrations de ses clients. `NEXT_PUBLIC_PILOTE_API_URL`
 * prend le relais le jour où l'API a son propre domaine.
 */
const BASE_API = `${(process.env.NEXT_PUBLIC_PILOTE_API_URL ?? 'https://pilote.toulali.fr/api').replace(/\/$/, '')}/v1/academie`;

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
