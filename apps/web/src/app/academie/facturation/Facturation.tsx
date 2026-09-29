'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { appel } from '../_client';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, Encart, Tuile } from '../_ui';
import { EditeurFacture, LigneFactureOrg } from '../_gestion/Factures';
import { euros, telecharger } from '../_gestion/outils';
import type { FactureOrg, ListeFactures } from '../_gestion/types';

const FILTRES = [
  ['tout', 'Tout'],
  ['brouillons', 'Brouillons'],
  ['a-encaisser', 'À encaisser'],
  ['retard', 'En retard'],
  ['devis', 'Devis'],
  ['payees', 'Payées'],
  ['avoirs', 'Avoirs'],
] as const;

/**
 * LA FACTURATION DE L'ACADÉMIE À SES CLIENTS.
 *
 * ⚠ À ne pas confondre avec « Mes factures » (premium), qui lit les factures
 * REÇUES des fournisseurs. Ici, l'académie ÉMET.
 */
export function Facturation({ tvaParDefaut, siretManquant }: { tvaParDefaut: number; siretManquant: boolean }) {
  const annee = new Date().getFullYear();
  const [liste, setListe] = useState<ListeFactures | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number][0]>('tout');
  const [edition, setEdition] = useState<FactureOrg | 'nouveau' | null>(null);

  const lire = useCallback(async () => {
    setListe(await appel<ListeFactures>(`/academie/gestion/factures?annee=${annee}`));
  }, [annee]);
  useEffect(() => {
    lire().catch((e: Error) => setErreur(e.message));
  }, [lire]);

  const visibles = useMemo(() => {
    const f = liste?.factures ?? [];
    switch (filtre) {
      case 'brouillons':
        return f.filter((x) => x.statut === 'BROUILLON');
      case 'a-encaisser':
        return f.filter((x) => x.type === 'FACTURE' && x.statut === 'EMISE');
      case 'retard':
        return f.filter((x) => x.enRetard);
      case 'devis':
        return f.filter((x) => x.type === 'DEVIS');
      case 'payees':
        return f.filter((x) => x.statut === 'PAYEE');
      case 'avoirs':
        return f.filter((x) => x.type === 'AVOIR');
      default:
        return f;
    }
  }, [liste, filtre]);

  const r = liste?.resume;
  return (
    <>
      {siretManquant ? (
        <div className="mb-5">
          <Encart ton="attention">
            Le SIRET de ton académie manque : une facture ne peut pas être émise sans lui.{' '}
            <Link href="/academie/mon-academie#fiche" className="font-bold underline">
              Le renseigner
            </Link>
          </Encart>
        </div>
      ) : null}
      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {r ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tuile libelle={`Chiffre d'affaires ${r.annee} (HT)`} valeur={euros(r.chiffreAffairesHt)} detail="Factures émises, moins les avoirs" />
          <Tuile libelle="À encaisser" valeur={euros(r.aEncaisser)} ton={r.aEncaisser ? 'attention' : 'neutre'} />
          <Tuile libelle="En retard" valeur={r.enRetard} detail={r.enRetard ? euros(r.montantEnRetard) : 'Aucune'} ton={r.enRetard ? 'alerte' : 'ok'} />
          <Tuile libelle="Devis en attente" valeur={r.devisOuverts} detail={r.devisOuverts ? `${euros(r.montantDevis)} HT` : undefined} />
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" className={BTN_PRIMAIRE} onClick={() => setEdition('nouveau')}>
          Nouvelle facture ou nouveau devis
        </button>
        <button type="button" className={BTN_SECONDAIRE} onClick={() => void telecharger(`/academie/gestion/factures/journal.csv?annee=${annee}`, `journal-des-ventes-${annee}.csv`).catch((e: Error) => setErreur(e.message))}>
          Journal des ventes {annee} (CSV)
        </button>
        <Link href="/academie/sessions" className={BTN_SECONDAIRE}>
          Facturer une session
        </Link>
      </div>

      {edition ? (
        <div className="mb-6">
          <EditeurFacture
            initiale={edition === 'nouveau' ? null : edition}
            tvaParDefaut={tvaParDefaut}
            annuler={() => setEdition(null)}
            enregistre={async () => {
              setEdition(null);
              await lire();
            }}
          />
        </div>
      ) : null}

      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filtrer">
        {FILTRES.map(([cle, libelle]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setFiltre(cle)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${filtre === cle ? 'bg-[#0F5F3E] text-white' : 'bg-[#E3F5EC] text-[#0F5F3E]'}`}
          >
            {libelle}
          </button>
        ))}
      </nav>

      {!liste ? (
        <p className="text-[15px] text-[#5E7A6E]">Chargement…</p>
      ) : visibles.length ? (
        <ul className="grid gap-3">
          {visibles.map((f) => (
            <LigneFactureOrg key={f.id} f={f} apres={lire} modifier={(x) => setEdition(x)} />
          ))}
        </ul>
      ) : (
        <Encart ton="info">Rien à afficher ici.</Encart>
      )}

      <p className="mt-8 max-w-[75ch] text-sm leading-relaxed text-[#5E7A6E]">
        Une facture émise ne se modifie plus : elle s&apos;annule par un avoir, qui porte son propre numéro (article 242 nonies A de l&apos;annexe II du CGI). Les factures
        échues sont relancées à J+1, J+15 et J+30, puis plus rien d&apos;automatique. La facturation électronique devient obligatoire par étapes (réception depuis
        septembre 2026, émission à partir de septembre 2027 pour les PME) : vérifie avec ton expert-comptable ce qu&apos;elle change pour ton organisme.
      </p>
    </>
  );
}
