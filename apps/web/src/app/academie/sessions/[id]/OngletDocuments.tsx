'use client';

import { useCallback, useEffect, useState } from 'react';
import { appel } from '../../_client';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, Encart, Pastille } from '../../_ui';
import { DOCUMENTS, dateCourte, telecharger } from '../../_gestion/outils';
import type { Registre, ResultatEnvoi } from '../../_gestion/types';
import { Bloc } from './OngletApercu';
import type { ContexteFiche } from './Fiche';

const STATUT: Record<string, { libelle: string; ton: 'ok' | 'attention' | 'alerte' | 'neutre' }> = {
  PRODUIT: { libelle: 'Produit', ton: 'neutre' },
  ENVOYE: { libelle: 'Envoyé', ton: 'ok' },
  A_SIGNER: { libelle: 'En attente de signature', ton: 'attention' },
  SIGNE: { libelle: 'Signé', ton: 'ok' },
  REFUSE: { libelle: 'Refusé ou remplacé', ton: 'alerte' },
};

const lien = (type: string) => type.toLowerCase().replace(/_/g, '-');

/**
 * LES DOCUMENTS DE LA SESSION : fabriqués à la demande, envoyés, signés.
 *
 * Tous sortent des mêmes données (la session, son planning, ses stagiaires,
 * l'identité de l'académie) : on ne tape rien deux fois, et la convocation ne
 * peut pas dire une autre date que l'attestation.
 */
export function OngletDocuments({ ctx }: { ctx: ContexteFiche }) {
  const s = ctx.session;
  const [registre, setRegistre] = useState<Registre | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<string | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);

  const lire = useCallback(() => appel<Registre>(`/academie/gestion/sessions/${s.id}/documents`).then(setRegistre).catch((e: Error) => setErreur(e.message)), [s.id]);
  useEffect(() => {
    void lire();
  }, [lire]);

  const executer = async (cle: string, f: () => Promise<unknown>) => {
    setOccupe(cle);
    setErreur(null);
    setResultat(null);
    try {
      await f();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'action n'a pas abouti.");
    } finally {
      setOccupe(null);
    }
  };

  const envoyer = (type: string, cible: { inscriptionId?: string; entreprise?: string } = {}) =>
    executer(`envoi-${type}-${cible.inscriptionId ?? cible.entreprise ?? ''}`, async () => {
      const r = await appel<ResultatEnvoi>(`/academie/gestion/sessions/${s.id}/documents/envoyer`, { method: 'POST', body: { type, ...cible, ...(type === 'CONVENTION' || type === 'CONTRAT' ? { aSigner: true } : {}) } });
      const morceaux = [`${r.envoyes} envoi${r.envoyes > 1 ? 's' : ''} parti${r.envoyes > 1 ? 's' : ''}.`];
      if (r.sansAdresse.length) morceaux.push(`Sans adresse e-mail : ${r.sansAdresse.join(', ')}.`);
      if (r.echecs.length) morceaux.push(`Échecs : ${r.echecs.join(' ; ')}.`);
      setResultat(morceaux.join(' '));
      await lire();
      await ctx.recharger();
    });

  const pdf = (type: string, cible: { inscriptionId?: string; entreprise?: string } = {}, nom = 'document.pdf') => {
    const q = new URLSearchParams();
    if (cible.inscriptionId) q.set('inscriptionId', cible.inscriptionId);
    if (cible.entreprise) q.set('entreprise', cible.entreprise);
    return executer(`pdf-${type}-${cible.inscriptionId ?? cible.entreprise ?? ''}`, () => telecharger(`/academie/gestion/sessions/${s.id}/documents/${lien(type)}/pdf${q.size ? `?${q}` : ''}`, nom));
  };

  const zip = (type: string) => executer(`zip-${type}`, () => telecharger(`/academie/gestion/sessions/${s.id}/documents/${lien(type)}/zip`, `${lien(type)}.zip`));

  const docsDe = (type: string, filtre: (d: Registre['documents'][number]) => boolean = () => true) => (registre?.documents ?? []).filter((d) => d.type === type && filtre(d));

  return (
    <>
      {erreur ? (
        <div className="mb-4" role="alert">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}
      {resultat ? (
        <div className="mb-4" role="status">
          <Encart ton="ok">{resultat}</Encart>
        </div>
      ) : null}
      <Encart ton="info">
        Ces documents sont des <strong>modèles</strong> construits sur le code du travail (conventions D6353-1, contrats L6353-3 à 7, certificat de réalisation au modèle ministériel). Relis-les, et fais valider
        le premier par un juriste. Ils impriment l&apos;identité de ton académie : complète-la dans « Mon académie » et les réglages de facturation.
      </Encart>

      {!registre ? (
        <p className="mt-6 text-[15px] text-[#5E7A6E]">Chargement des documents…</p>
      ) : (
        <div className="mt-6">
          {DOCUMENTS.map((d) => (
            <Bloc key={d.type} titre={d.libelle} aide={d.aide}>
              {d.par === 'session' ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={BTN_SECONDAIRE} disabled={!!occupe} onClick={() => void pdf(d.type, {}, `${lien(d.type)}.pdf`)}>
                    Télécharger (PDF)
                  </button>
                  {d.type === 'PROGRAMME' ? (
                    <button type="button" className={BTN_SECONDAIRE} disabled={!!occupe} onClick={() => void envoyer('PROGRAMME')}>
                      Envoyer à tous les stagiaires
                    </button>
                  ) : null}
                </div>
              ) : null}

              {d.par === 'entreprise' ? (
                !registre.clients.length ? (
                  <p className="text-[15px] text-[#5E7A6E]">Aucune entreprise : renseigne l&apos;employeur sur la fiche des stagiaires (onglet Stagiaires).</p>
                ) : (
                  <>
                    <ul className="grid gap-2">
                      {registre.clients.map((c) => {
                        const derniers = docsDe('CONVENTION', (x) => x.titre.includes(c.nom));
                        const dernier = derniers[0];
                        return (
                          <li key={c.nom} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#DDEBE4] bg-white px-4 py-3">
                            <span className="font-bold text-[#12312A]">{c.nom}</span>
                            <span className="text-[14px] text-[#5E7A6E]">
                              {c.stagiaires} stagiaire{c.stagiaires > 1 ? 's' : ''}
                              {c.email ? ` · ${c.email}` : ' · sans e-mail'}
                            </span>
                            {dernier ? <Pastille ton={STATUT[dernier.statut].ton}>{STATUT[dernier.statut].libelle}</Pastille> : null}
                            <span className="ml-auto flex flex-wrap gap-1">
                              <button type="button" className={BTN_DISCRET} disabled={!!occupe} onClick={() => void pdf('CONVENTION', { entreprise: c.nom }, 'convention.pdf')}>
                                PDF
                              </button>
                              <button type="button" className={BTN_DISCRET} disabled={!!occupe || !c.email} onClick={() => void envoyer('CONVENTION', { entreprise: c.nom })}>
                                {dernier?.statut === 'A_SIGNER' ? 'Renvoyer à signer' : 'Envoyer à signer'}
                              </button>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className={BTN_PRIMAIRE} disabled={!!occupe} onClick={() => void envoyer('CONVENTION')}>
                        Envoyer toutes les conventions à signer
                      </button>
                      <button type="button" className={BTN_SECONDAIRE} disabled={!!occupe} onClick={() => void zip('CONVENTION')}>
                        Tout télécharger (ZIP)
                      </button>
                    </div>
                  </>
                )
              ) : null}

              {d.par === 'stagiaire' || d.par === 'particulier' ? (
                (() => {
                  const liste = registre.stagiaires.filter((x) => (d.par === 'particulier' ? x.particulier : true));
                  if (!liste.length) {
                    return (
                      <p className="text-[15px] text-[#5E7A6E]">
                        {d.par === 'particulier' ? 'Aucun stagiaire ne paie lui-même : pas de contrat à faire signer.' : 'Aucun stagiaire inscrit.'}
                      </p>
                    );
                  }
                  const fin = ['ATTESTATION', 'CERTIFICAT_REALISATION'].includes(d.type);
                  return (
                    <>
                      <ul className="grid gap-2">
                        {liste.map((x) => {
                          const dernier = docsDe(d.type, (doc) => doc.inscriptionId === x.id)[0];
                          const pret = !fin || x.heuresRealisees > 0;
                          return (
                            <li key={x.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#DDEBE4] bg-white px-4 py-3">
                              <span className="font-bold text-[#12312A]">{x.nom}</span>
                              {!x.email ? <Pastille ton="alerte">Sans e-mail</Pastille> : null}
                              {fin ? <span className="text-[14px] text-[#5E7A6E]">{String(x.heuresRealisees).replace('.', ',')} h réalisées</span> : null}
                              {d.type === 'CONVOCATION' && x.convocationEnvoyeeLe ? <Pastille ton="ok">Envoyée le {dateCourte(x.convocationEnvoyeeLe)}</Pastille> : null}
                              {dernier && d.type !== 'CONVOCATION' ? <Pastille ton={STATUT[dernier.statut].ton}>{STATUT[dernier.statut].libelle}</Pastille> : null}
                              <span className="ml-auto flex flex-wrap gap-1">
                                <button type="button" className={BTN_DISCRET} disabled={!!occupe || !pret} onClick={() => void pdf(d.type, { inscriptionId: x.id }, `${lien(d.type)}.pdf`)}>
                                  PDF
                                </button>
                                <button type="button" className={BTN_DISCRET} disabled={!!occupe || !x.email || !pret} onClick={() => void envoyer(d.type, { inscriptionId: x.id })}>
                                  {d.type === 'CONTRAT' ? 'Envoyer à signer' : 'Envoyer'}
                                </button>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className={BTN_PRIMAIRE} disabled={!!occupe} onClick={() => void envoyer(d.type)}>
                          {d.type === 'CONTRAT' ? 'Envoyer tous les contrats à signer' : `Envoyer à tous`}
                        </button>
                        <button type="button" className={BTN_SECONDAIRE} disabled={!!occupe} onClick={() => void zip(d.type)}>
                          Tout télécharger (ZIP)
                        </button>
                      </div>
                      {fin ? <p className="mt-2 text-[14px] text-[#5E7A6E]">Les heures réalisées viennent de l&apos;émargement : sans présence enregistrée, le document ne se produit pas.</p> : null}
                    </>
                  );
                })()
              ) : null}
            </Bloc>
          ))}

          <Bloc titre="Registre des envois" aide="Ce qui a été produit, envoyé à qui et quand, signé ou non : une preuve Qualiopi produite par l'activité.">
            {!registre.documents.length ? (
              <p className="text-[15px] text-[#5E7A6E]">Rien n&apos;a encore été envoyé.</p>
            ) : (
              <ul className="grid gap-1 text-[14px]">
                {registre.documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-2 border-b border-[#EDF3F0] py-2">
                    <span className="font-bold text-[#12312A]">{d.titre}</span>
                    <Pastille ton={STATUT[d.statut].ton}>{STATUT[d.statut].libelle}</Pastille>
                    <span className="text-[#5E7A6E]">
                      {d.envoyeLe ? `envoyé le ${dateCourte(d.envoyeLe)}` : `produit le ${dateCourte(d.createdAt)}`}
                      {d.envoyeA ? ` à ${d.envoyeA}` : ''}
                      {d.signeLe ? `, signé le ${dateCourte(d.signeLe)}${d.signataireNom ? ` par ${d.signataireNom}` : ''}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Bloc>
        </div>
      )}
    </>
  );
}
