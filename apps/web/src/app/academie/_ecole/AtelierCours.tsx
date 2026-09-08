'use client';

import { useMemo, useState } from 'react';
import { appel, messageDe } from './api';
import {
  NOM_NIVEAU,
  NOM_TYPE_LECON,
  VERT,
  dateCourte,
  duree,
  euros,
  nouvelIdentifiant,
  type Apprenant,
  type Chapitre,
  type CoursComplet,
  type Lecon,
  type NiveauCours,
  type QuestionQuiz,
  type Quiz,
  type TypeLecon,
} from './types';

/**
 * L'ATELIER D'UN COURS.
 *
 * Trois onglets : le contenu (chapitres et leçons), la fiche (ce qui se vend),
 * les apprenants (qui suit, où il en est). Rien n'est envoyé tant qu'on n'a pas
 * cliqué sur « Enregistrer » — sauf ce qui change la structure (ajouter un
 * chapitre, monter une leçon), qui s'écrit tout de suite et renvoie le cours
 * entier : c'est le serveur qui tient l'ordre, jamais le navigateur.
 */
export function AtelierCours({
  cours: initial,
  apprenants: apprenantsInitiaux,
  origine,
}: {
  cours: CoursComplet;
  apprenants: Apprenant[];
  origine: string;
}) {
  const [c, setC] = useState<CoursComplet>(initial);
  const [apprenants, setApprenants] = useState(apprenantsInitiaux);
  const [onglet, setOnglet] = useState<'contenu' | 'fiche' | 'apprenants'>('contenu');
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [leconOuverte, setLeconOuverte] = useState<string | null>(null);

  const lien = `${origine}/cours/${c.slug}`;
  const nbLecons = useMemo(() => c.chapitres.reduce((n, ch) => n + ch.lecons.length, 0), [c]);

  async function agir<T = CoursComplet>(chemin: string, init?: Parameters<typeof appel>[1], surRetour?: (d: T) => void) {
    setOccupe(true);
    setErreur(null);
    setMessage(null);
    try {
      const d = await appel<T>(chemin, init);
      if (surRetour) surRetour(d);
      else setC(d as unknown as CoursComplet);
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  /* ------------------------------------------------------------- structure */

  const ajouterChapitre = () => agir(`/ecole/cours/${c.id}/chapitres`, { methode: 'POST', corps: {} });
  const supprimerChapitre = (id: string) => agir(`/ecole/cours/${c.id}/chapitres/${id}`, { methode: 'DELETE' });
  const renommerChapitre = (id: string, titre: string) =>
    agir(`/ecole/cours/${c.id}/chapitres/${id}`, { methode: 'PATCH', corps: { titre } });
  const ajouterLecon = (chapitreId: string, type: TypeLecon) =>
    agir(`/ecole/cours/${c.id}/chapitres/${chapitreId}/lecons`, { methode: 'POST', corps: { type } });
  const supprimerLecon = (id: string) => agir(`/ecole/cours/${c.id}/lecons/${id}`, { methode: 'DELETE' });

  function deplacerChapitre(index: number, sens: -1 | 1) {
    const ids = c.chapitres.map((ch) => ch.id);
    const cible = index + sens;
    if (cible < 0 || cible >= ids.length) return;
    [ids[index], ids[cible]] = [ids[cible], ids[index]];
    void agir(`/ecole/cours/${c.id}/chapitres/ordre`, { methode: 'POST', corps: { ids } });
  }

  function deplacerLecon(chapitre: Chapitre, index: number, sens: -1 | 1) {
    const ids = chapitre.lecons.map((l) => l.id);
    const cible = index + sens;
    if (cible < 0 || cible >= ids.length) return;
    [ids[index], ids[cible]] = [ids[cible], ids[index]];
    void agir(`/ecole/cours/${c.id}/chapitres/${chapitre.id}/lecons/ordre`, { methode: 'POST', corps: { ids } });
  }

  /* ---------------------------------------------------------------- fiche */

  async function enregistrerFiche() {
    await agir(`/ecole/cours/${c.id}`, {
      methode: 'PATCH',
      corps: {
        titre: c.titre,
        sousTitre: c.sousTitre ?? '',
        description: c.description ?? '',
        imageUrl: c.imageUrl ?? '',
        bandeAnnonceUrl: c.bandeAnnonceUrl ?? '',
        niveau: c.niveau,
        categorie: c.categorie ?? '',
        objectifs: c.objectifs,
        prerequis: c.prerequis ?? '',
        pourQui: c.pourQui ?? '',
        dureeMinutes: c.dureeMinutes,
        prixCents: c.prixCents,
        prixBarreCents: c.prixBarreCents ?? 0,
        gratuit: c.gratuit,
        certificat: c.certificat,
        slug: c.slug,
      },
    });
    setMessage('La fiche est enregistrée.');
  }

  async function changerStatut(statut: CoursComplet['statut']) {
    await agir(`/ecole/cours/${c.id}`, { methode: 'PATCH', corps: { statut } });
    setMessage(statut === 'PUBLIE' ? 'Le cours est publié.' : statut === 'ARCHIVE' ? 'Le cours est archivé.' : 'Le cours est repassé en brouillon.');
  }

  /* ----------------------------------------------------------- apprenants */

  async function inscrire(email: string, prenom: string, nom: string) {
    setOccupe(true);
    setErreur(null);
    try {
      await appel(`/ecole/cours/${c.id}/apprenants`, { methode: 'POST', corps: { email, prenom, nom } });
      const liste = await appel<Apprenant[]>(`/ecole/apprenants?cours=${c.id}`);
      setApprenants(liste);
      setMessage('La personne est inscrite. Envoie-lui son lien.');
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  async function retirer(id: string) {
    setOccupe(true);
    setErreur(null);
    try {
      await appel(`/ecole/apprenants/${id}`, { methode: 'DELETE' });
      setApprenants((p) => p.filter((a) => a.id !== id));
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  /* ------------------------------------------------------------------ vue */

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight" style={{ color: VERT.encre }}>
            {c.titre}
          </h1>
          <p className="mt-1.5 text-[15px]" style={{ color: VERT.sourdine }}>
            {c.chapitres.length} chapitre{c.chapitres.length > 1 ? 's' : ''} · {nbLecons} leçon{nbLecons > 1 ? 's' : ''} ·{' '}
            {duree(c.dureeMinutes || c.dureeCalculee)} · {c.gratuit || c.prixCents === 0 ? 'Gratuit' : euros(c.prixCents)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.statut === 'PUBLIE' ? (
            <button
              type="button"
              onClick={() => changerStatut('BROUILLON')}
              disabled={occupe}
              className="rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-bold disabled:opacity-60"
              style={{ borderColor: VERT.bord, color: VERT.encre }}
            >
              Dépublier
            </button>
          ) : (
            <button
              type="button"
              onClick={() => changerStatut('PUBLIE')}
              disabled={occupe}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: VERT.fonce }}
            >
              Publier le cours
            </button>
          )}
        </div>
      </div>

      {c.statut === 'PUBLIE' ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4" style={{ borderColor: VERT.bord, backgroundColor: VERT.clair }}>
          <span className="text-sm font-bold" style={{ color: VERT.fonce }}>
            Le lien à partager
          </span>
          <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 text-sm" style={{ color: VERT.texte }}>
            {lien}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(lien);
              setMessage('Le lien est copié.');
            }}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: VERT.fonce }}
          >
            Copier
          </button>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2 border-b" style={{ borderColor: VERT.bord }}>
        {(
          [
            ['contenu', 'Le contenu'],
            ['fiche', 'La fiche'],
            ['apprenants', `Les apprenants (${apprenants.length})`],
          ] as const
        ).map(([cle, libelle]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setOnglet(cle)}
            className="-mb-px border-b-2 px-4 py-2.5 text-[15px] font-bold transition"
            style={
              onglet === cle
                ? { borderColor: VERT.fonce, color: VERT.fonce }
                : { borderColor: 'transparent', color: VERT.sourdine }
            }
          >
            {libelle}
          </button>
        ))}
      </div>

      {erreur ? (
        <p className="mb-4 rounded-2xl border border-[#F3B0C2] bg-[#FDE7EC] px-5 py-4 text-[15px] font-bold text-[#8A1B3D]">{erreur}</p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-2xl border px-5 py-4 text-[15px] font-bold" style={{ borderColor: VERT.bord, backgroundColor: VERT.clair, color: VERT.fonce }}>
          {message}
        </p>
      ) : null}

      {onglet === 'contenu' ? (
        <Contenu
          cours={c}
          occupe={occupe}
          leconOuverte={leconOuverte}
          setLeconOuverte={setLeconOuverte}
          ajouterChapitre={ajouterChapitre}
          supprimerChapitre={supprimerChapitre}
          renommerChapitre={renommerChapitre}
          deplacerChapitre={deplacerChapitre}
          ajouterLecon={ajouterLecon}
          supprimerLecon={supprimerLecon}
          deplacerLecon={deplacerLecon}
          enregistrerLecon={(id, patch) => agir(`/ecole/cours/${c.id}/lecons/${id}`, { methode: 'PATCH', corps: patch })}
        />
      ) : null}

      {onglet === 'fiche' ? (
        <Fiche cours={c} setCours={setC} occupe={occupe} enregistrer={enregistrerFiche} />
      ) : null}

      {onglet === 'apprenants' ? (
        <Apprenants apprenants={apprenants} occupe={occupe} inscrire={inscrire} retirer={retirer} origine={origine} />
      ) : null}
    </div>
  );
}

/* ========================================================== LE CONTENU ==== */

function Contenu({
  cours,
  occupe,
  leconOuverte,
  setLeconOuverte,
  ajouterChapitre,
  supprimerChapitre,
  renommerChapitre,
  deplacerChapitre,
  ajouterLecon,
  supprimerLecon,
  deplacerLecon,
  enregistrerLecon,
}: {
  cours: CoursComplet;
  occupe: boolean;
  leconOuverte: string | null;
  setLeconOuverte: (id: string | null) => void;
  ajouterChapitre: () => void;
  supprimerChapitre: (id: string) => void;
  renommerChapitre: (id: string, titre: string) => void;
  deplacerChapitre: (index: number, sens: -1 | 1) => void;
  ajouterLecon: (chapitreId: string, type: TypeLecon) => void;
  supprimerLecon: (id: string) => void;
  deplacerLecon: (chapitre: Chapitre, index: number, sens: -1 | 1) => void;
  enregistrerLecon: (id: string, patch: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid gap-4">
      {cours.chapitres.map((ch, i) => (
        <section key={ch.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: VERT.bord }}>
          <div className="flex flex-wrap items-center gap-2">
            <input
              defaultValue={ch.titre}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== ch.titre) renommerChapitre(ch.id, e.target.value.trim());
              }}
              className="min-w-0 flex-1 rounded-lg border-2 border-transparent px-2 py-1.5 text-lg font-extrabold tracking-tight focus:border-[#B7E4CE] focus:outline-none"
              style={{ color: VERT.encre }}
              aria-label="Titre du chapitre"
            />
            <div className="flex shrink-0 gap-1">
              <BoutonIcone titre="Monter le chapitre" onClick={() => deplacerChapitre(i, -1)} disabled={occupe || i === 0}>
                ↑
              </BoutonIcone>
              <BoutonIcone
                titre="Descendre le chapitre"
                onClick={() => deplacerChapitre(i, 1)}
                disabled={occupe || i === cours.chapitres.length - 1}
              >
                ↓
              </BoutonIcone>
              <BoutonIcone titre="Supprimer le chapitre" onClick={() => supprimerChapitre(ch.id)} disabled={occupe} danger>
                ✕
              </BoutonIcone>
            </div>
          </div>

          <ul className="mt-3 grid gap-2">
            {ch.lecons.map((l, j) => (
              <li key={l.id} className="rounded-xl border" style={{ borderColor: VERT.bord }}>
                <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{ backgroundColor: VERT.clair, color: VERT.fonce }}
                  >
                    {NOM_TYPE_LECON[l.type]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLeconOuverte(leconOuverte === l.id ? null : l.id)}
                    className="min-w-0 flex-1 truncate text-left text-[15px] font-bold"
                    style={{ color: VERT.encre }}
                  >
                    {l.titre}
                  </button>
                  {l.apercu ? (
                    <span className="shrink-0 rounded-full bg-[#FEF3E2] px-2.5 py-0.5 text-xs font-bold text-[#7C3E06]">
                      Aperçu libre
                    </span>
                  ) : null}
                  <span className="shrink-0 text-sm" style={{ color: VERT.sourdine }}>
                    {l.dureeMinutes ? duree(l.dureeMinutes) : ''}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <BoutonIcone titre="Monter la leçon" onClick={() => deplacerLecon(ch, j, -1)} disabled={occupe || j === 0}>
                      ↑
                    </BoutonIcone>
                    <BoutonIcone
                      titre="Descendre la leçon"
                      onClick={() => deplacerLecon(ch, j, 1)}
                      disabled={occupe || j === ch.lecons.length - 1}
                    >
                      ↓
                    </BoutonIcone>
                    <BoutonIcone titre="Supprimer la leçon" onClick={() => supprimerLecon(l.id)} disabled={occupe} danger>
                      ✕
                    </BoutonIcone>
                  </div>
                </div>

                {leconOuverte === l.id ? (
                  <FormulaireLecon
                    lecon={l}
                    occupe={occupe}
                    enregistrer={(patch) => enregistrerLecon(l.id, patch)}
                    fermer={() => setLeconOuverte(null)}
                  />
                ) : null}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2">
            {(['TEXTE', 'VIDEO', 'DOCUMENT', 'QUIZ', 'DEVOIR', 'LIVE'] as TypeLecon[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => ajouterLecon(ch.id, t)}
                disabled={occupe}
                className="rounded-lg border-2 bg-white px-3 py-1.5 text-sm font-bold disabled:opacity-60"
                style={{ borderColor: VERT.bord, color: VERT.fonce }}
              >
                + {NOM_TYPE_LECON[t]}
              </button>
            ))}
          </div>
        </section>
      ))}

      <button
        type="button"
        onClick={ajouterChapitre}
        disabled={occupe}
        className="rounded-2xl border-2 border-dashed px-5 py-4 text-base font-bold disabled:opacity-60"
        style={{ borderColor: VERT.bord, color: VERT.fonce }}
      >
        + Ajouter un chapitre
      </button>
    </div>
  );
}

function BoutonIcone({
  children,
  onClick,
  disabled,
  titre,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  titre: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titre}
      aria-label={titre}
      className="h-8 w-8 rounded-lg border text-sm font-bold disabled:opacity-30"
      style={
        danger
          ? { borderColor: '#F3B0C2', color: '#8A1B3D', backgroundColor: '#FFFFFF' }
          : { borderColor: VERT.bord, color: VERT.texte, backgroundColor: '#FFFFFF' }
      }
    >
      {children}
    </button>
  );
}

/* --------------------------------------------------------- une leçon ----- */

function FormulaireLecon({
  lecon,
  occupe,
  enregistrer,
  fermer,
}: {
  lecon: Lecon;
  occupe: boolean;
  enregistrer: (patch: Record<string, unknown>) => void;
  fermer: () => void;
}) {
  const [titre, setTitre] = useState(lecon.titre);
  const [type, setType] = useState<TypeLecon>(lecon.type);
  const [contenu, setContenu] = useState(lecon.contenu ?? '');
  const [videoUrl, setVideoUrl] = useState(lecon.videoUrl ?? '');
  const [fichierUrl, setFichierUrl] = useState(lecon.fichierUrl ?? '');
  const [dureeMinutes, setDureeMinutes] = useState(lecon.dureeMinutes);
  const [apercu, setApercu] = useState(lecon.apercu);
  const [quiz, setQuiz] = useState<Quiz>(lecon.quiz ?? { noteMinimale: 70, questions: [] });

  function soumettre() {
    enregistrer({
      titre,
      type,
      contenu,
      videoUrl,
      fichierUrl,
      dureeMinutes,
      apercu,
      quiz: type === 'QUIZ' ? quiz : lecon.quiz ?? undefined,
    });
    fermer();
  }

  return (
    <div className="border-t px-4 py-4" style={{ borderColor: VERT.bord, backgroundColor: VERT.fond }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ libelle="Titre de la leçon">
          <input value={titre} onChange={(e) => setTitre(e.target.value)} className={CHAMP} />
        </Champ>
        <Champ libelle="Type de leçon">
          <select value={type} onChange={(e) => setType(e.target.value as TypeLecon)} className={CHAMP}>
            {(Object.keys(NOM_TYPE_LECON) as TypeLecon[]).map((t) => (
              <option key={t} value={t}>
                {NOM_TYPE_LECON[t]}
              </option>
            ))}
          </select>
        </Champ>
      </div>

      {type === 'VIDEO' || type === 'AUDIO' || type === 'LIVE' ? (
        <Champ libelle={type === 'LIVE' ? 'Lien de la classe en direct' : "Adresse de la vidéo ou de l'audio"}>
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={CHAMP} placeholder="https://…" />
        </Champ>
      ) : null}

      {type === 'DOCUMENT' || type === 'DEVOIR' ? (
        <Champ libelle="Adresse du document">
          <input value={fichierUrl} onChange={(e) => setFichierUrl(e.target.value)} className={CHAMP} placeholder="https://…" />
        </Champ>
      ) : null}

      {type === 'QUIZ' ? (
        <EditeurQuiz quiz={quiz} setQuiz={setQuiz} />
      ) : (
        <Champ libelle="Le texte de la leçon">
          <textarea rows={8} value={contenu} onChange={(e) => setContenu(e.target.value)} className={CHAMP} />
        </Champ>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Champ libelle="Durée (en minutes)">
          <input
            type="number"
            min={0}
            value={dureeMinutes}
            onChange={(e) => setDureeMinutes(Number(e.target.value) || 0)}
            className={CHAMP}
          />
        </Champ>
        <label className="flex items-center gap-3 self-end rounded-xl border bg-white px-4 py-3" style={{ borderColor: VERT.bord }}>
          <input type="checkbox" checked={apercu} onChange={(e) => setApercu(e.target.checked)} className="h-4 w-4 accent-[#0F5F3E]" />
          <span className="text-[15px] font-bold" style={{ color: VERT.encre }}>
            Lisible sans être inscrit
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={soumettre}
          disabled={occupe}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          style={{ backgroundColor: VERT.fonce }}
        >
          Enregistrer la leçon
        </button>
        <button
          type="button"
          onClick={fermer}
          className="rounded-xl border-2 bg-white px-5 py-2.5 text-sm font-bold"
          style={{ borderColor: VERT.bord, color: VERT.encre }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- le quiz --- */

function EditeurQuiz({ quiz, setQuiz }: { quiz: Quiz; setQuiz: (q: Quiz) => void }) {
  function changer(i: number, patch: Partial<QuestionQuiz>) {
    setQuiz({ ...quiz, questions: quiz.questions.map((q, k) => (k === i ? { ...q, ...patch } : q)) });
  }

  function ajouter() {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          id: nouvelIdentifiant(),
          enonce: '',
          type: 'CHOIX_UNIQUE',
          options: ['', ''],
          bonnes: [0],
          points: 1,
        },
      ],
    });
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-extrabold" style={{ color: VERT.encre }}>
          Les questions
        </p>
        <label className="flex items-center gap-2 text-sm font-bold" style={{ color: VERT.texte }}>
          Note minimale pour valider
          <input
            type="number"
            min={0}
            max={100}
            value={quiz.noteMinimale}
            onChange={(e) => setQuiz({ ...quiz, noteMinimale: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            className="w-20 rounded-lg border px-2 py-1.5"
            style={{ borderColor: VERT.bord }}
          />
          %
        </label>
      </div>

      <div className="mt-3 grid gap-3">
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border bg-white p-4" style={{ borderColor: VERT.bord }}>
            <div className="flex flex-wrap items-start gap-2">
              <input
                value={q.enonce}
                onChange={(e) => changer(i, { enonce: e.target.value })}
                placeholder={`Question ${i + 1}`}
                className={`${CHAMP} min-w-0 flex-1`}
              />
              <select
                value={q.type}
                onChange={(e) => {
                  const type = e.target.value as QuestionQuiz['type'];
                  changer(i, {
                    type,
                    options: type === 'VRAI_FAUX' ? ['Vrai', 'Faux'] : q.options,
                    bonnes: type === 'CHOIX_MULTIPLE' ? q.bonnes : q.bonnes.slice(0, 1),
                  });
                }}
                className={`${CHAMP} w-auto`}
              >
                <option value="CHOIX_UNIQUE">Une seule bonne réponse</option>
                <option value="CHOIX_MULTIPLE">Plusieurs bonnes réponses</option>
                <option value="VRAI_FAUX">Vrai ou faux</option>
              </select>
              <button
                type="button"
                onClick={() => setQuiz({ ...quiz, questions: quiz.questions.filter((_, k) => k !== i) })}
                className="h-10 w-10 rounded-lg border border-[#F3B0C2] text-sm font-bold text-[#8A1B3D]"
                aria-label="Supprimer la question"
              >
                ✕
              </button>
            </div>

            <ul className="mt-3 grid gap-2">
              {q.options.map((o, k) => (
                <li key={k} className="flex items-center gap-2">
                  <input
                    type={q.type === 'CHOIX_MULTIPLE' ? 'checkbox' : 'radio'}
                    name={`bonne-${q.id}`}
                    checked={q.bonnes.includes(k)}
                    onChange={() =>
                      changer(i, {
                        bonnes:
                          q.type === 'CHOIX_MULTIPLE'
                            ? q.bonnes.includes(k)
                              ? q.bonnes.filter((b) => b !== k)
                              : [...q.bonnes, k]
                            : [k],
                      })
                    }
                    className="h-4 w-4 accent-[#0F5F3E]"
                    aria-label={`Bonne réponse ${k + 1}`}
                  />
                  <input
                    value={o}
                    onChange={(e) => changer(i, { options: q.options.map((x, m) => (m === k ? e.target.value : x)) })}
                    disabled={q.type === 'VRAI_FAUX'}
                    placeholder={`Réponse ${k + 1}`}
                    className={`${CHAMP} min-w-0 flex-1`}
                  />
                  {q.type !== 'VRAI_FAUX' && q.options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() =>
                        changer(i, {
                          options: q.options.filter((_, m) => m !== k),
                          bonnes: q.bonnes.filter((b) => b !== k).map((b) => (b > k ? b - 1 : b)),
                        })
                      }
                      className="h-9 w-9 rounded-lg border text-sm"
                      style={{ borderColor: VERT.bord, color: VERT.sourdine }}
                      aria-label="Retirer cette réponse"
                    >
                      −
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>

            {q.type !== 'VRAI_FAUX' ? (
              <button
                type="button"
                onClick={() => changer(i, { options: [...q.options, ''] })}
                className="mt-2 text-sm font-bold"
                style={{ color: VERT.fonce }}
              >
                + Une réponse de plus
              </button>
            ) : null}

            <input
              value={q.explication ?? ''}
              onChange={(e) => changer(i, { explication: e.target.value })}
              placeholder="Explication montrée après la réponse (facultatif)"
              className={`${CHAMP} mt-3`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={ajouter}
        className="mt-3 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-bold"
        style={{ borderColor: VERT.bord, color: VERT.fonce }}
      >
        + Ajouter une question
      </button>
    </div>
  );
}

/* ============================================================ LA FICHE ==== */

function Fiche({
  cours: c,
  setCours,
  occupe,
  enregistrer,
}: {
  cours: CoursComplet;
  setCours: (f: (p: CoursComplet) => CoursComplet) => void;
  occupe: boolean;
  enregistrer: () => void;
}) {
  const set = (patch: Partial<CoursComplet>) => setCours((p) => ({ ...p, ...patch }));

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: VERT.bord }}>
        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: VERT.encre }}>
          Ce que les gens lisent avant de s&apos;inscrire
        </h2>
        <div className="mt-4 grid gap-3">
          <Champ libelle="Titre">
            <input value={c.titre} onChange={(e) => set({ titre: e.target.value })} className={CHAMP} />
          </Champ>
          <Champ libelle="Sous-titre">
            <input value={c.sousTitre ?? ''} onChange={(e) => set({ sousTitre: e.target.value })} className={CHAMP} />
          </Champ>
          <Champ libelle="Description">
            <textarea rows={6} value={c.description ?? ''} onChange={(e) => set({ description: e.target.value })} className={CHAMP} />
          </Champ>
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ libelle="Image de couverture (adresse)">
              <input value={c.imageUrl ?? ''} onChange={(e) => set({ imageUrl: e.target.value })} className={CHAMP} placeholder="https://…" />
            </Champ>
            <Champ libelle="Bande-annonce (adresse)">
              <input
                value={c.bandeAnnonceUrl ?? ''}
                onChange={(e) => set({ bandeAnnonceUrl: e.target.value })}
                className={CHAMP}
                placeholder="https://…"
              />
            </Champ>
          </div>
          <Champ libelle="Ce qu'on saura faire à la fin (une ligne par objectif)">
            <textarea
              rows={4}
              value={c.objectifs.join('\n')}
              onChange={(e) => set({ objectifs: e.target.value.split('\n') })}
              className={CHAMP}
            />
          </Champ>
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ libelle="Pour qui">
              <textarea rows={3} value={c.pourQui ?? ''} onChange={(e) => set({ pourQui: e.target.value })} className={CHAMP} />
            </Champ>
            <Champ libelle="Prérequis">
              <textarea rows={3} value={c.prerequis ?? ''} onChange={(e) => set({ prerequis: e.target.value })} className={CHAMP} />
            </Champ>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: VERT.bord }}>
        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: VERT.encre }}>
          Le prix, la durée, l&apos;adresse
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Champ libelle="Niveau">
            <select value={c.niveau} onChange={(e) => set({ niveau: e.target.value as NiveauCours })} className={CHAMP}>
              {(Object.keys(NOM_NIVEAU) as NiveauCours[]).map((n) => (
                <option key={n} value={n}>
                  {NOM_NIVEAU[n]}
                </option>
              ))}
            </select>
          </Champ>
          <Champ libelle="Catégorie">
            <input value={c.categorie ?? ''} onChange={(e) => set({ categorie: e.target.value })} className={CHAMP} />
          </Champ>
          <Champ libelle="Durée annoncée (minutes) — 0 pour additionner les leçons">
            <input
              type="number"
              min={0}
              value={c.dureeMinutes}
              onChange={(e) => set({ dureeMinutes: Number(e.target.value) || 0 })}
              className={CHAMP}
            />
          </Champ>
          <Champ libelle="Adresse publique">
            <div className="flex items-center gap-1">
              <span className="text-sm" style={{ color: VERT.sourdine }}>
                /cours/
              </span>
              <input value={c.slug} onChange={(e) => set({ slug: e.target.value })} className={CHAMP} />
            </div>
          </Champ>
          <Champ libelle="Prix (en euros)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={(c.prixCents / 100).toString()}
              onChange={(e) => set({ prixCents: Math.round((Number(e.target.value) || 0) * 100) })}
              className={CHAMP}
              disabled={c.gratuit}
            />
          </Champ>
          <Champ libelle="Prix barré (en euros, facultatif)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={((c.prixBarreCents ?? 0) / 100).toString()}
              onChange={(e) => set({ prixBarreCents: Math.round((Number(e.target.value) || 0) * 100) })}
              className={CHAMP}
              disabled={c.gratuit}
            />
          </Champ>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: VERT.bord }}>
            <input type="checkbox" checked={c.gratuit} onChange={(e) => set({ gratuit: e.target.checked })} className="h-4 w-4 accent-[#0F5F3E]" />
            <span className="text-[15px] font-bold" style={{ color: VERT.encre }}>
              Cours gratuit — l&apos;inscription se fait en ligne, tout de suite
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: VERT.bord }}>
            <input
              type="checkbox"
              checked={c.certificat}
              onChange={(e) => set({ certificat: e.target.checked })}
              className="h-4 w-4 accent-[#0F5F3E]"
            />
            <span className="text-[15px] font-bold" style={{ color: VERT.encre }}>
              Attestation de fin quand toutes les leçons sont faites
            </span>
          </label>
        </div>
      </section>

      <div>
        <button
          type="button"
          onClick={enregistrer}
          disabled={occupe}
          className="rounded-xl px-6 py-3 text-base font-extrabold text-white disabled:opacity-60"
          style={{ backgroundColor: VERT.fonce }}
        >
          Enregistrer la fiche
        </button>
      </div>
    </div>
  );
}

/* ======================================================= LES APPRENANTS === */

function Apprenants({
  apprenants,
  occupe,
  inscrire,
  retirer,
  origine,
}: {
  apprenants: Apprenant[];
  occupe: boolean;
  inscrire: (email: string, prenom: string, nom: string) => void;
  retirer: (id: string) => void;
  origine: string;
}) {
  const [email, setEmail] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border bg-white p-5" style={{ borderColor: VERT.bord }}>
        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: VERT.encre }}>
          Inscrire quelqu&apos;un
        </h2>
        <p className="mt-1 text-[15px]" style={{ color: VERT.texte }}>
          Utile après un paiement encaissé ailleurs, ou pour une personne financée par son employeur. Chacun reçoit un
          lien personnel : c&apos;est lui qui ouvre le cours.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" className={CHAMP} />
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className={CHAMP} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Adresse e-mail" type="email" className={CHAMP} />
          <button
            type="button"
            onClick={() => {
              inscrire(email, prenom, nom);
              setEmail('');
              setPrenom('');
              setNom('');
            }}
            disabled={occupe || !email.trim()}
            className="rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: VERT.fonce }}
          >
            Inscrire
          </button>
        </div>
      </section>

      {apprenants.length === 0 ? (
        <p className="rounded-2xl border bg-white px-5 py-6 text-center" style={{ borderColor: VERT.bord, color: VERT.texte }}>
          Personne n&apos;est encore inscrit à ce cours.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white" style={{ borderColor: VERT.bord }}>
          <table className="w-full min-w-[720px] text-left text-[15px]">
            <thead>
              <tr style={{ backgroundColor: VERT.fond, color: VERT.sourdine }}>
                <th className="px-4 py-3 font-bold">Personne</th>
                <th className="px-4 py-3 font-bold">Avancement</th>
                <th className="px-4 py-3 font-bold">Dernière visite</th>
                <th className="px-4 py-3 font-bold">Lien personnel</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {apprenants.map((a) => (
                <tr key={a.id} className="border-t" style={{ borderColor: VERT.bord }}>
                  <td className="px-4 py-3" style={{ color: VERT.encre }}>
                    <span className="font-bold">{a.nom ?? '—'}</span>
                    <br />
                    <span className="text-sm" style={{ color: VERT.sourdine }}>
                      {a.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full" style={{ backgroundColor: VERT.clair }}>
                        <div className="h-full rounded-full" style={{ width: `${a.progression}%`, backgroundColor: VERT.plein }} />
                      </div>
                      <span className="tabular-nums text-sm font-bold" style={{ color: VERT.texte }}>
                        {a.progression} %
                      </span>
                    </div>
                    {a.termineLe ? (
                      <span className="text-sm" style={{ color: VERT.fonce }}>
                        Terminé le {dateCourte(a.termineLe)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: VERT.texte }}>
                    {dateCourte(a.derniereVisite)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard?.writeText(`${origine}${a.lien}`)}
                      className="rounded-lg border-2 bg-white px-3 py-1.5 text-sm font-bold"
                      style={{ borderColor: VERT.bord, color: VERT.encre }}
                    >
                      Copier le lien
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => retirer(a.id)}
                      disabled={occupe}
                      className="rounded-lg border border-[#F3B0C2] px-3 py-1.5 text-sm font-bold text-[#8A1B3D] disabled:opacity-60"
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- petits -- */

const CHAMP =
  'w-full rounded-xl border border-[#CFE4D9] bg-white px-4 py-2.5 text-[15px] text-[#12312A] placeholder:text-[#8FA79B] focus:border-[#1E9E6A] focus:outline-none focus:ring-4 focus:ring-[#E3F5EC] disabled:bg-[#F2F7F5]';

function Champ({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
        {libelle}
      </span>
      {children}
    </label>
  );
}
