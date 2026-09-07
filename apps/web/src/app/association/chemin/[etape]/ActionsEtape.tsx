'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE_VIVE, Pastille } from '../../_ui';
import type { DocumentEtape } from '../../_chemin';
import type { ModeleFabrique, Prerempli } from '../../_fabrique';
import { FabriqueDocument } from '../../FabriqueDocument';
import { BoutonDeposerFichiers } from '../../DeposerFichiers';

/**
 * CE QU'IL Y A À FAIRE À CETTE ÉTAPE, EN CARTES.
 *
 * Une carte par papier (déposer ou fabriquer), une par démarche en ligne,
 * une pour les exemples. Chaque carte : une icône, un titre, un état, un
 * bouton. Comme la page « Vérification » d'HelloAsso.
 */

export interface PieceEtape {
  code: string;
  libelle: string;
  pourquoi: string;
  ouLaTrouver: string;
}

export interface EtatPiece {
  situation: string;
  fileId: string | null;
  libelle: string;
}

const ICONE = {
  papier: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6',
  stylo: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  site: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  exemple: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z',
  cerfa: 'M9 2h6l1 3h3a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3zM8 12h8M8 16h5',
  espace: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
};

/** Une action dans l'espace de l'association (ajouter un membre, créer le dossier…). */
export interface LienEspace {
  titre: string;
  detail: string;
  href: string;
  bouton: string;
}

function Icone({ d }: { d: string }) {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ECEBFC] text-[#4F46E5]">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
      </svg>
    </span>
  );
}

function Carte({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <article id={id} className={`${CARTE_VIVE} flex flex-col items-center p-5 text-center`}>
      {children}
    </article>
  );
}

function titreCourt(libelle: string) {
  return libelle.split(' (')[0];
}

function etatDe(etat: EtatPiece | undefined, connecte: boolean): { ton: 'ok' | 'attention' | 'alerte' | 'neutre'; texte: string } {
  if (!connecte) return { ton: 'neutre', texte: 'À faire' };
  switch (etat?.situation) {
    case 'A_JOUR':
      return { ton: 'ok', texte: 'Prêt' };
    case 'DEDUITE':
      return { ton: 'ok', texte: 'Prouvé par les répertoires' };
    case 'BIENTOT_PERIMEE':
      return { ton: 'attention', texte: 'Expire bientôt' };
    case 'PERIMEE':
      return { ton: 'alerte', texte: 'Périmé' };
    default:
      return { ton: 'attention', texte: 'Manquant' };
  }
}

export function ActionsEtape({
  slug,
  pieces,
  classeur,
  modeles,
  documents,
  connecte,
  prerempli,
  liens = [],
}: {
  slug: string;
  liens?: LienEspace[];
  pieces: PieceEtape[];
  classeur: Record<string, EtatPiece> | null;
  modeles: ModeleFabrique[];
  documents: DocumentEtape[];
  connecte: boolean;
  prerempli: Prerempli;
}) {
  const [fabrique, setFabrique] = useState<ModeleFabrique | null>(null);
  const [depot, setDepot] = useState<string | null>(null);

  if (fabrique) {
    return <FabriqueDocument modele={fabrique} prerempli={prerempli} connecte={connecte} onFermer={() => setFabrique(null)} />;
  }

  const modelesParPiece = new Map(modeles.filter((m) => m.piece).map((m) => [m.piece as string, m]));
  const modelesLibres = modeles.filter((m) => !m.piece || !pieces.some((p) => p.code === m.piece));
  const demarches = documents.filter((d) => d.genre === 'SITE' || d.genre === 'CERFA');
  const exemples = documents.filter((d) => d.genre === 'EXEMPLE' || d.genre === 'MODELE');
  const retour = `/chemin/${slug}`;

  const Connexion = () => (
    <div className="mt-3 w-full rounded-xl bg-[#F5F4FC] p-3 text-sm">
      <p className="font-bold text-[#1D1B5C]">Pour le garder, crée ton espace. C&apos;est gratuit.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link href="/inscription" className={`${BTN_PRIMAIRE} !py-2 text-sm`}>
          Créer mon espace
        </Link>
        <Link href={`/connexion?next=${encodeURIComponent(retour)}`} className={`${BTN_SECONDAIRE} !py-2 text-sm`}>
          Se connecter
        </Link>
      </div>
    </div>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pieces.map((p) => {
        const etat = classeur?.[p.code];
        const e = etatDe(etat, connecte);
        const modele = modelesParPiece.get(p.code);
        const ouvert = depot === p.code;
        return (
          <Carte key={p.code} id={p.code}>
            <Icone d={ICONE.papier} />
            <h3 className="mt-3 text-lg font-extrabold leading-snug text-[#1D1B5C]">{titreCourt(p.libelle)}</h3>
            <div className="mt-2">
              <Pastille ton={e.ton}>{e.texte}</Pastille>
            </div>
            {etat?.fileId ? (
              <a href={`/api/proxy/files/${etat.fileId}`} target="_blank" rel="noopener" className="mt-2 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                Voir le fichier
              </a>
            ) : (
              <p className="mt-2 line-clamp-2 text-sm text-[#6B6A8A]" title={p.ouLaTrouver}>
                {p.ouLaTrouver}
              </p>
            )}
            <div className="mt-4 flex w-full flex-col gap-2">
              {modele ? (
                <button type="button" onClick={() => setFabrique(modele)} className={`${BTN_PRIMAIRE} w-full`}>
                  Fabriquer
                </button>
              ) : null}
              {connecte ? (
                <BoutonDeposerFichiers
                  classeNom={`${modele ? BTN_SECONDAIRE : BTN_PRIMAIRE} w-full`}
                  libelle={etat?.fileId ? 'Remplacer les fichiers' : 'Déposer des fichiers'}
                  piece={p.code}
                  categorie="Autre"
                />
              ) : (
                <button type="button" onClick={() => setDepot(ouvert ? null : p.code)} className={`${modele ? BTN_SECONDAIRE : BTN_PRIMAIRE} w-full`}>
                  Déposer des fichiers
                </button>
              )}
            </div>
            {ouvert && !connecte ? <Connexion /> : null}
          </Carte>
        );
      })}

      {modelesLibres.map((m) => (
        <Carte key={m.code} id={`fabriquer-${m.code}`}>
          <Icone d={ICONE.stylo} />
          <h3 className="mt-3 text-lg font-extrabold leading-snug text-[#1D1B5C]">{m.titre}</h3>
          <div className="mt-2">
            <Pastille ton="accent">À fabriquer ici</Pastille>
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-[#6B6A8A]">{m.enUnMot}</p>
          <div className="mt-4 flex w-full flex-col gap-2">
            <button type="button" onClick={() => setFabrique(m)} className={`${BTN_PRIMAIRE} w-full`}>
              Fabriquer
            </button>
            {connecte ? (
              <BoutonDeposerFichiers
                classeNom={`${BTN_SECONDAIRE} w-full`}
                libelle="Déposer des fichiers"
                piece={m.piece ?? undefined}
                categorie={m.categorie ?? 'Autre'}
                titre={m.titre}
              />
            ) : (
              <button type="button" onClick={() => setDepot(depot === m.code ? null : m.code)} className={`${BTN_SECONDAIRE} w-full`}>
                Déposer des fichiers
              </button>
            )}
          </div>
          {depot === m.code && !connecte ? <Connexion /> : null}
        </Carte>
      ))}

      {demarches.map((d) => (
        <Carte key={d.lien}>
          <Icone d={d.genre === 'CERFA' ? ICONE.cerfa : ICONE.site} />
          <h3 className="mt-3 text-lg font-extrabold leading-snug text-[#1D1B5C]">{d.titre}</h3>
          <div className="mt-2">
            <Pastille ton="neutre">{d.numero ?? (d.genre === 'CERFA' ? 'Formulaire officiel' : 'Site officiel')}</Pastille>
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-[#6B6A8A]">{d.aQuoiCaSert}</p>
          <div className="mt-4 w-full">
            <a href={d.lien} target="_blank" rel="noopener" className={`${BTN_PRIMAIRE} w-full`}>
              {d.genre === 'CERFA' ? 'Ouvrir le formulaire ↗' : 'Faire la démarche ↗'}
            </a>
          </div>
        </Carte>
      ))}

      {liens.map((l) => (
        <Carte key={l.href}>
          <Icone d={ICONE.espace} />
          <h3 className="mt-3 text-lg font-extrabold leading-snug text-[#1D1B5C]">{l.titre}</h3>
          <div className="mt-2">
            <Pastille ton="accent">Dans mon espace</Pastille>
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-[#6B6A8A]">{l.detail}</p>
          <div className="mt-4 w-full">
            <Link href={connecte ? l.href : `/connexion?next=${encodeURIComponent(l.href)}`} className={`${BTN_PRIMAIRE} w-full`}>
              {l.bouton} →
            </Link>
          </div>
        </Carte>
      ))}

      {exemples.length ? (
        <Carte>
          <Icone d={ICONE.exemple} />
          <h3 className="mt-3 text-lg font-extrabold leading-snug text-[#1D1B5C]">Des exemples à recopier</h3>
          <div className="mt-2">
            <Pastille ton="neutre">Association imaginaire</Pastille>
          </div>
          <ul className="mt-3 w-full space-y-1.5 text-left text-sm">
            {exemples.map((d) => {
              const externe = d.lien.startsWith('http');
              return (
                <li key={d.lien}>
                  <a href={d.lien} target={externe ? '_blank' : undefined} rel={externe ? 'noopener' : undefined} download={externe ? undefined : true} className="font-bold text-[#4F46E5] underline underline-offset-4">
                    {d.titre} {externe ? '↗' : '↓'}
                  </a>
                </li>
              );
            })}
          </ul>
        </Carte>
      ) : null}
    </div>
  );
}
