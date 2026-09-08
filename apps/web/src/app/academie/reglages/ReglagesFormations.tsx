'use client';

import { useState, type FormEvent } from 'react';
import { appel, messageDe } from '../_ecole/api';
import { BTN_PRIMAIRE, CARTE, CHAMP, Encart } from '../_ui';
import type { Vitrine } from '../_ecole/types';

/**
 * LES RÉGLAGES QUI VALENT POUR TOUTES LES FORMATIONS.
 *
 * Trois blocs, trois boutons : on enregistre ce qu'on vient de changer, pas
 * le reste. C'est plus lent à lire qu'un seul gros formulaire, mais on sait
 * toujours ce qu'on est en train de modifier.
 */

/** Les modèles de certificat proposés. Le nom dit ce qu'on voit. */
const MODELES: { cle: string; nom: string; quoi: string }[] = [
  { cle: 'sobre', nom: 'Sobre', quoi: 'Un cadre fin, le nom de la formation, la date. Rien d’autre.' },
  { cle: 'classique', nom: 'Classique', quoi: 'Un liseré, un sceau, la signature de l’organisme.' },
  { cle: 'colore', nom: 'Coloré', quoi: 'Le fond prend ta couleur principale.' },
];

export function ReglagesFormations({ vitrine }: { vitrine: Vitrine }) {
  const [v, setV] = useState(vitrine);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState<string | null>(null);

  function set<K extends keyof Vitrine>(cle: K, valeur: Vitrine[K]) {
    setV((x) => ({ ...x, [cle]: valeur }));
    setFait(null);
  }

  async function enregistrer(bloc: string, corps: Record<string, unknown>, e?: FormEvent) {
    e?.preventDefault();
    setEnCours(bloc);
    setErreur(null);
    try {
      const maj = await appel<Vitrine>('/ecole/vitrine', { methode: 'PATCH', corps });
      setV(maj);
      setFait(bloc);
    } catch (err) {
      setErreur(messageDe(err));
    } finally {
      setEnCours(null);
    }
  }

  const modele = v.certificatModele ?? 'sobre';

  return (
    <>
      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {/* -------------------------------------------- le certificat de réussite */}
      <form
        onSubmit={(e) => enregistrer('certificat', { certificatModele: modele, certificatsActifs: v.certificatsActifs }, e)}
        className={`${CARTE} mb-5 p-5`}
      >
        <h2 className="mb-1 text-[18px] font-extrabold text-[#12312A]">Le certificat de réussite</h2>
        <p className="mb-4 text-[15px] leading-relaxed text-[#334A42]">
          L&apos;apprenant l&apos;édite lui-même, une fois toutes les leçons terminées. C&apos;est un
          document de fin de parcours : il n&apos;a pas la valeur d&apos;un diplôme, et ne remplace
          pas l&apos;attestation de fin de formation que tu délivres au titre de Qualiopi.
        </p>

        <label className="mb-4 flex items-start gap-2 text-[15px] text-[#334A42]">
          <input
            type="checkbox"
            checked={v.certificatsActifs !== false}
            onChange={(e) => set('certificatsActifs', e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="font-bold text-[#12312A]">Délivrer un certificat de réussite</span>
            <br />
            Décoche pour ne plus en proposer. Les certificats déjà édités ne sont pas retirés.
          </span>
        </label>

        {v.certificatsActifs !== false ? (
          <ul className="mb-4 grid gap-2 sm:grid-cols-3">
            {MODELES.map((m) => (
              <li key={m.cle}>
                <button
                  type="button"
                  onClick={() => set('certificatModele', m.cle)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition ${
                    modele === m.cle ? 'border-[#1E9E6A] bg-[#E3F5EC]' : 'border-[#DDEBE4] bg-white'
                  }`}
                >
                  <span className="block text-[15px] font-extrabold text-[#12312A]">{m.nom}</span>
                  <span className="mt-1 block text-[13px] text-[#5E7A6E]">{m.quoi}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={enCours === 'certificat'} className={BTN_PRIMAIRE}>
            {enCours === 'certificat' ? 'Enregistrement…' : 'Mettre à jour'}
          </button>
          {fait === 'certificat' ? <span className="text-[15px] font-bold text-[#0F5F3E]">Enregistré.</span> : null}
        </div>
      </form>

      {/* ------------------------------------------------------ les commentaires */}
      <form
        onSubmit={(e) => enregistrer('commentaires', { commentairesActifs: v.commentairesActifs }, e)}
        className={`${CARTE} mb-5 p-5`}
      >
        <h2 className="mb-1 text-[18px] font-extrabold text-[#12312A]">Les commentaires</h2>
        <p className="mb-4 text-[15px] leading-relaxed text-[#334A42]">
          Sous chaque leçon, un apprenant peut écrire une question ou une remarque. Tu peux couper
          cette possibilité partout d&apos;un coup — ou formation par formation, dans l&apos;onglet
          « Paramètres » de chacune.
        </p>

        <label className="mb-4 flex items-start gap-2 text-[15px] text-[#334A42]">
          <input
            type="checkbox"
            checked={v.commentairesActifs !== false}
            onChange={(e) => set('commentairesActifs', e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="font-bold text-[#12312A]">Autoriser les commentaires</span>
            <br />
            Décoche pour les fermer sur toutes tes formations. Ce qui a déjà été écrit reste
            visible depuis « Mes formations ».
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={enCours === 'commentaires'} className={BTN_PRIMAIRE}>
            {enCours === 'commentaires' ? 'Enregistrement…' : 'Mettre à jour'}
          </button>
          {fait === 'commentaires' ? <span className="text-[15px] font-bold text-[#0F5F3E]">Enregistré.</span> : null}
        </div>
      </form>

      {/* ------------------------------------------------------ le suivi d'audience */}
      <form
        onSubmit={(e) =>
          enregistrer('suivi', { googleAnalytics: v.googleAnalytics ?? '', pixelMeta: v.pixelMeta ?? '' }, e)
        }
        className={`${CARTE} p-5`}
      >
        <h2 className="mb-1 text-[18px] font-extrabold text-[#12312A]">Savoir d&apos;où viennent tes inscrits</h2>
        <p className="mb-4 text-[15px] leading-relaxed text-[#334A42]">
          Ces deux codes se posent sur ta page publique et sur l&apos;espace apprenant. Ils
          n&apos;ont d&apos;intérêt que si tu fais de la publicité ou que tu regardes tes
          statistiques ailleurs. Laisse vide si ce n&apos;est pas ton cas.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Code Google Analytics</span>
            <input
              value={v.googleAnalytics ?? ''}
              onChange={(e) => set('googleAnalytics', e.target.value)}
              className={CHAMP}
              maxLength={60}
              placeholder="G-XXXXXXXXXX"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Pixel Meta (Facebook)</span>
            <input
              value={v.pixelMeta ?? ''}
              onChange={(e) => set('pixelMeta', e.target.value)}
              className={CHAMP}
              maxLength={60}
              placeholder="123456789012345"
            />
          </label>
        </div>

        <p className="mt-3 text-[13px] text-[#5E7A6E]">
          Si tu poses l&apos;un de ces codes, dis-le dans tes mentions légales et laisse tes
          visiteurs refuser le suivi : c&apos;est ce que demande le RGPD.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={enCours === 'suivi'} className={BTN_PRIMAIRE}>
            {enCours === 'suivi' ? 'Enregistrement…' : 'Mettre à jour'}
          </button>
          {fait === 'suivi' ? <span className="text-[15px] font-bold text-[#0F5F3E]">Enregistré.</span> : null}
        </div>
      </form>
    </>
  );
}
