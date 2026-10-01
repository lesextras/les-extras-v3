'use client';
/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */

import { useEffect, useState } from 'react';
import { appel } from '../../_client';
import { Squelette } from '../../Squelette';
import { Encart, Tuile } from '../../_ui';
import type { RapportSession } from '../../_gestion/types';
import { Bloc } from './OngletApercu';
import type { ContexteFiche } from './Fiche';

const virgule = (n: number | null | undefined, suffixe = '') => (n === null || n === undefined ? 'Aucune réponse' : `${String(n).replace('.', ',')}${suffixe}`);

/**
 * CE QUE LA SESSION A PRODUIT COMME PREUVES DE QUALITÉ.
 *
 * Les enquêtes partent seules (si la session l'a demandé) et reviennent par le
 * lien personnel de chacun. Aucune réponse ne se corrige ici : un indicateur
 * qu'on peut retoucher n'indique plus rien.
 */
export function OngletQualite({ ctx }: { ctx: ContexteFiche }) {
  const s = ctx.session;
  const [r, setR] = useState<RapportSession | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    appel<RapportSession>(`/academie/gestion/sessions/${s.id}/qualite`).then(setR).catch((e: Error) => setErreur(e.message));
  }, [s.id]);

  if (erreur) return <Encart ton="alerte">{erreur}</Encart>;
  if (!r) return <Squelette tuiles={4} lignes={2} />;

  const actifs = s.inscriptions.filter((i) => i.status !== 'CANCELLED');
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Satisfaction en fin" valeur={virgule(r.chaud.note, ' / 5')} detail={`${r.chaud.reponses} réponse${r.chaud.reponses > 1 ? 's' : ''}${r.chaud.taux !== null ? `, ${r.chaud.taux} %` : ''}`} ton={r.chaud.note && r.chaud.note >= 4 ? 'ok' : 'neutre'} />
        <Tuile libelle="Recommanderaient" valeur={r.chaud.recommandation === null ? '—' : `${r.chaud.recommandation} %`} />
        <Tuile libelle="Assiduité moyenne" valeur={r.assiduite.moyenne === null ? '—' : `${r.assiduite.moyenne} %`} detail="réalisé / prévu" />
        <Tuile libelle="Progression des acquis" valeur={r.positionnement.progression === null ? '—' : `+${String(r.positionnement.progression).replace('.', ',')} pt`} detail={`${r.positionnement.mesures} mesuré${r.positionnement.mesures > 1 ? 's' : ''} (sur 4)`} />
      </div>

      <Bloc titre="Détail" aide="Notes sur 5 (enquête de fin) ; acquis mesurés à froid.">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {[
            ['Objectifs atteints', virgule(r.chaud.objectifs, ' / 5')],
            ['Pédagogie', virgule(r.chaud.pedagogie, ' / 5')],
            ['Organisation', virgule(r.chaud.organisation, ' / 5')],
            ['Enquête à froid', `${virgule(r.froid.note, ' / 5')} (${r.froid.reponses} réponse${r.froid.reponses > 1 ? 's' : ''})`],
            ['Mise en œuvre', r.froid.reponses ? `${r.froid.miseEnOeuvre.oui} oui, ${r.froid.miseEnOeuvre.partiellement} en partie, ${r.froid.miseEnOeuvre.non} non` : 'Aucune réponse'],
            ['Commanditaires', `${virgule(r.commanditaires.note, ' / 5')} (${r.commanditaires.reponses} réponse${r.commanditaires.reponses > 1 ? 's' : ''})`],
            ['Abandons', String(r.effectifs.abandons)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-[#EDF3F0] pb-2">
              <dt className="text-[15px] text-[#5E7A6E]">{k}</dt>
              <dd className="text-[15px] font-bold text-[#12312A]">{v}</dd>
            </div>
          ))}
        </dl>
      </Bloc>

      <Bloc titre="Réponses" aide="Lien à renvoyer depuis l'onglet Stagiaires.">
        <ul className="grid gap-2">
          {actifs.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-[#DDEBE4] bg-white px-4 py-2 text-[14px]">
              <span className="font-bold text-[#12312A]">{i.learnerName}</span>
              <span className={i.positionnementEntree ? 'text-[#0F5F3E]' : 'text-[#8FA79B]'}>Entrée {i.positionnementEntree ? '✓' : '·'}</span>
              <span className={i.positionnementSortie ? 'text-[#0F5F3E]' : 'text-[#8FA79B]'}>Sortie {i.positionnementSortie ? '✓' : '·'}</span>
              <span className={i.satisfactionAt ? 'text-[#0F5F3E]' : 'text-[#8FA79B]'}>Fin {i.satisfactionAt ? '✓' : '·'}</span>
              <span className={i.coldAt ? 'text-[#0F5F3E]' : 'text-[#8FA79B]'}>À froid {i.coldAt ? '✓' : '·'}</span>
            </li>
          ))}
        </ul>
      </Bloc>

      {r.commentaires.length ? (
        <Bloc titre="Ce qu'ils en disent">
          <ul className="grid gap-3">
            {r.commentaires.map((c, i) => (
              <li key={i} className="rounded-xl bg-[#F7FBF9] px-4 py-3 text-[15px] leading-relaxed text-[#334A42]">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#5E7A6E]">
                  {c.type === 'chaud' ? 'En fin de formation' : c.type === 'froid' ? 'À froid' : 'Commanditaire'}
                  {c.nom ? ` · ${c.nom}` : ''}
                </span>
                {c.texte}
              </li>
            ))}
          </ul>
        </Bloc>
      ) : null}
    </>
  );
}
