'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { appel } from '../../_client';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CHAMP, Encart } from '../../_ui';
import { LigneFactureOrg } from '../../_gestion/Factures';
import type { ListeFactures } from '../../_gestion/types';
import { Bloc } from './OngletApercu';
import type { ContexteFiche } from './Fiche';

/**
 * FACTURER LA SESSION EN UN GESTE.
 *
 * Les brouillons se préparent depuis les stagiaires : une facture par
 * entreprise, par financeur quand il paie directement (subrogation), ou une
 * seule. Rien n'est émis sans relecture.
 */
export function OngletFacturation({ ctx }: { ctx: ContexteFiche }) {
  const s = ctx.session;
  const [liste, setListe] = useState<ListeFactures | null>(null);
  const [regroupement, setRegroupement] = useState<'PAR_CLIENT' | 'PAR_FINANCEUR' | 'UNIQUE'>(s.intra ? 'UNIQUE' : 'PAR_CLIENT');
  const [type, setType] = useState<'FACTURE' | 'DEVIS'>('FACTURE');
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const lire = useCallback(async () => {
    setListe(await appel<ListeFactures>(`/academie/gestion/factures?sessionId=${s.id}`));
  }, [s.id]);
  useEffect(() => {
    lire().catch((e: Error) => setErreur(e.message));
  }, [lire]);

  const preparer = async () => {
    setOccupe(true);
    setErreur(null);
    setInfo(null);
    try {
      const r = await appel<{ crees: number; sansPrix: number }>(`/academie/gestion/sessions/${s.id}/facturer`, { method: 'POST', body: { regroupement, type } });
      setInfo(
        `${r.crees} brouillon${r.crees > 1 ? 's' : ''} préparé${r.crees > 1 ? 's' : ''}. Relis-les puis émets-les.${
          r.sansPrix ? ` ⚠ ${r.sansPrix} stagiaire${r.sansPrix > 1 ? 's' : ''} sans prix : fixe le prix de la session ou le sien avant d'émettre.` : ''
        }`,
      );
      await lire();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Les brouillons ne se sont pas préparés.');
    } finally {
      setOccupe(false);
    }
  };

  return (
    <>
      <Bloc titre="Préparer les factures ou les devis de la session" aide="Chaque stagiaire n'est facturé qu'une fois : les suivants se préparent pour ceux qui n'ont encore rien.">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Document</span>
            <select className={CHAMP} value={type} onChange={(e) => setType(e.target.value as 'FACTURE' | 'DEVIS')}>
              <option value="FACTURE">Factures</option>
              <option value="DEVIS">Devis</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Regrouper</span>
            <select className={CHAMP} value={regroupement} onChange={(e) => setRegroupement(e.target.value as typeof regroupement)}>
              <option value="PAR_CLIENT">Une par entreprise</option>
              <option value="PAR_FINANCEUR">Une par financeur (subrogation)</option>
              <option value="UNIQUE">Une seule pour la session</option>
            </select>
          </label>
          <button type="button" className={BTN_PRIMAIRE} disabled={occupe} onClick={() => void preparer()}>
            Préparer les brouillons
          </button>
          <Link href="/academie/facturation" className={BTN_SECONDAIRE}>
            Toute la facturation
          </Link>
        </div>
        <p className="mt-3 text-[14px] text-[#5E7A6E]">Les particuliers reçoivent toujours leur propre facture. Le prix vient de la fiche du stagiaire, sinon de la session.</p>
      </Bloc>

      {erreur ? (
        <div className="mb-4">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}
      {info ? (
        <div className="mb-4">
          <Encart ton="ok">{info}</Encart>
        </div>
      ) : null}

      {liste ? (
        liste.factures.length ? (
          <ul className="grid gap-3">
            {liste.factures.map((f) => (
              <LigneFactureOrg key={f.id} f={f} apres={lire} />
            ))}
          </ul>
        ) : (
          <Encart ton="info">Aucune facture ni aucun devis pour cette session.</Encart>
        )
      ) : (
        <p className="text-[15px] text-[#5E7A6E]">Chargement…</p>
      )}
    </>
  );
}
