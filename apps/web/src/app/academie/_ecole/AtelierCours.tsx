'use client';

import { useMemo, useState } from 'react';
import { appel, messageDe } from './api';
import { EditeurLecon } from './EditeurLecon';
import {
  MODALITE_COURTE,
  NOM_MODALITE,
  NOM_NIVEAU,
  NOM_TYPE_LECON,
  VERT,
  dateCourte,
  duree,
  euros,
  nouvelIdentifiant,
  type Apprenant,
  type Chapitre,
  type Commentaire,
  type CoursComplet,
  type Lecon,
  type ModaliteCours,
  type NiveauCours,
  type Programme,
  type QuestionQuiz,
  type Quiz,
  type SessionProgramme,
  type TypeLecon,
  type Vente,
  NOM_STATUT_SESSION,
} from './types';

/** Ce qu'on peut poser dans une formation. */
type GenreContenu = 'chapitre' | 'lecon' | 'quiz' | 'devoir' | 'live' | 'taches' | 'scorm';

/**
 * L'ATELIER D'UNE FORMATION.
 *
 * Sept onglets — huit quand on se retrouve quelque part — comme on lit une
 * formation : le contenu qu'on enseigne, les
 * paramètres qui la règlent, le prix qu'elle coûte, les descriptions qu'on
 * lit avant de s'inscrire, les apprenants qui la suivent, ce qu'ils écrivent,
 * et ce que les chiffres en disent.
 *
 * Le présentiel, la classe virtuelle et le mixte ne sont pas des formations
 * d'un autre genre : c'est une option, choisie dans « Paramètres ».
 *
 * Rien n'est envoyé tant qu'on n'a pas cliqué sur « Enregistrer » — sauf ce
 * qui change la structure (ajouter un chapitre, monter une leçon), qui s'écrit
 * tout de suite et renvoie la formation entière : c'est le serveur qui tient
 * l'ordre, jamais le navigateur.
 */

type Onglet = 'contenu' | 'parametres' | 'prix' | 'descriptions' | 'sessions' | 'apprenants' | 'commentaires' | 'statistiques';

/** Ce que chaque modalité veut dire, en une ligne. */
const QUOI_MODALITE: Record<ModaliteCours, string> = {
  EN_LIGNE: 'Chacun avance quand il veut.',
  PRESENTIEL: 'On se retrouve dans une salle.',
  VIRTUEL: 'On se retrouve en visio.',
  MIXTE: 'Des leçons en ligne, des rendez-vous en vrai.',
};

export function AtelierCours({
  cours: initial,
  apprenants: apprenantsInitiaux,
  commentaires: commentairesInitiaux = [],
  ventes = [],
  programme: programmeInitial = null,
  origine,
}: {
  cours: CoursComplet;
  apprenants: Apprenant[];
  commentaires?: Commentaire[];
  ventes?: Vente[];
  /** La fiche programme portée par cette formation, déjà lue par le serveur. */
  programme?: Programme | null;
  origine: string;
}) {
  const [c, setC] = useState<CoursComplet>(initial);
  const [programme, setProgramme] = useState<Programme | null>(programmeInitial);
  const [apprenants, setApprenants] = useState(apprenantsInitiaux);
  const [commentaires, setCommentaires] = useState(commentairesInitiaux);
  const [onglet, setOnglet] = useState<Onglet>('contenu');
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [leconOuverte, setLeconOuverte] = useState<Lecon | null>(null);

  const lien = `${origine}/cours/${c.slug}`;
  const nbLecons = useMemo(
    () => (c.contenu ?? []).reduce((n, e) => n + (e.genre === 'chapitre' ? e.lecons.length : 1), 0),
    [c],
  );

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

  /** Un seul geste pour tout ce qui se pose : chapitre, leçon, quiz, devoir, classe. */
  const ajouterContenu = (genre: GenreContenu, chapitreId?: string) =>
    agir(`/ecole/cours/${c.id}/contenu`, { methode: 'POST', corps: { genre, ...(chapitreId ? { chapitreId } : {}) } });

  const supprimerChapitre = (id: string) => agir(`/ecole/cours/${c.id}/chapitres/${id}`, { methode: 'DELETE' });
  const renommerChapitre = (id: string, titre: string) =>
    agir(`/ecole/cours/${c.id}/chapitres/${id}`, { methode: 'PATCH', corps: { titre } });
  const supprimerLecon = (id: string) => agir(`/ecole/cours/${c.id}/lecons/${id}`, { methode: 'DELETE' });

  /** Ranger le premier niveau : chapitres et leçons se suivent dans la même liste. */
  function reordonnerContenu(index: number, sens: -1 | 1) {
    const ids = (c.contenu ?? []).map((e) => `${e.genre}:${e.id}`);
    const cible = index + sens;
    if (cible < 0 || cible >= ids.length) return;
    [ids[index], ids[cible]] = [ids[cible], ids[index]];
    void agir(`/ecole/cours/${c.id}/contenu/ordre`, { methode: 'POST', corps: { ids } });
  }

  /** Le même rangement, mais dicté par la souris : la liste arrive déjà triée. */
  const reordonnerListe = (ids: string[]) =>
    agir(`/ecole/cours/${c.id}/contenu/ordre`, { methode: 'POST', corps: { ids } });

  const reglerChapitre = (id: string, corps: Record<string, unknown>) =>
    agir(`/ecole/cours/${c.id}/chapitres/${id}`, { methode: 'PATCH', corps });

  /**
   * UN PLAN PROPOSÉ PAR L'IA.
   *
   * On montre d'abord ce qui est proposé, on ne pose rien sans un « oui » :
   * un plan qui s'écrit tout seul dans une formation existante est plus long
   * à défaire qu'à écrire.
   */
  async function genererStructure() {
    const consigne = window.prompt(
      'Que doit couvrir cette formation ? (facultatif — laisse vide pour partir du titre)',
      '',
    );
    if (consigne === null) return;
    setOccupe(true);
    try {
      const d = await appel<{ chapitres: { titre: string; lecons: { titre: string; resume?: string }[] }[] }>(
        `/ecole/cours/${c.id}/ia/structure`,
        { methode: 'POST', corps: { consigne: consigne.trim() || undefined } },
      );
      const apercu = d.chapitres
        .map((ch, i) => `${i + 1}. ${ch.titre}\n${ch.lecons.map((l) => `   · ${l.titre}`).join('\n')}`)
        .join('\n');
      if (!window.confirm(`Ajouter ce plan à la suite du contenu ?\n\n${apercu}`)) {
        setOccupe(false);
        return;
      }
      const maj = await appel<CoursComplet>(`/ecole/cours/${c.id}/ia/structure/poser`, {
        methode: 'POST',
        corps: { chapitres: d.chapitres },
      });
      setC(maj);
      setMessage('Le plan est posé.');
    } catch (err) {
      setMessage(messageDe(err));
    } finally {
      setOccupe(false);
    }
  }

  /* ------------------------------------------------- enregistrer un onglet */

  /** N'envoie que ce que l'onglet ouvert a modifié : le reste ne bouge pas. */
  async function enregistrer(corps: Record<string, unknown>, quoi: string) {
    await agir(`/ecole/cours/${c.id}`, { methode: 'PATCH', corps });
    setMessage(`${quoi} : c'est enregistré.`);
  }

  const enregistrerParametres = () =>
    enregistrer(
      {
        titre: c.titre,
        slug: c.slug,
        imageUrl: c.imageUrl ?? '',
        niveau: c.niveau,
        categorie: c.categorie ?? '',
        dureeMinutes: c.dureeMinutes,
        modalite: c.modalite,
        lieu: c.lieu ?? '',
        lienVisio: c.lienVisio ?? '',
        accesHandicap: c.accesHandicap ?? '',
        lectureOrdonnee: c.lectureOrdonnee,
        placesMax: c.placesMax ?? 0,
        certificat: c.certificat,
        commentairesActifs: c.commentairesActifs,
        seoTitre: c.seoTitre ?? '',
        seoDescription: c.seoDescription ?? '',
      },
      'Les paramètres',
    );

  const enregistrerPrix = () =>
    enregistrer(
      {
        gratuit: c.gratuit,
        prixCents: c.prixCents,
        prixBarreCents: c.prixBarreCents ?? 0,
        tvaPourcent: c.tvaPourcent,
        echeances: c.echeances,
      },
      'Le prix',
    );

  /**
   * Les descriptions vivent à deux endroits — la formation (ce que lit un
   * apprenant) et sa fiche programme (ce que lit un financeur). On les écrit
   * en une fois : les objectifs, le public et les prérequis sont les mêmes.
   */
  async function enregistrerDescriptions() {
    await enregistrer(
      {
        sousTitre: c.sousTitre ?? '',
        description: c.description ?? '',
        bandeAnnonceUrl: c.bandeAnnonceUrl ?? '',
        objectifs: c.objectifs,
        pourQui: c.pourQui ?? '',
        prerequis: c.prerequis ?? '',
      },
      'Les descriptions',
    );
    if (!programme) return;
    const objectifs = c.objectifs.map((o) => o.trim()).filter(Boolean);
    await agir<Programme>(
      `/formations/${programme.id}`,
      {
        methode: 'PATCH',
        corps: {
          title: c.titre.trim() || programme.title,
          summary: (c.sousTitre ?? '').trim().slice(0, 400),
          objectives: objectifs.join('\n'),
          targetAudience: (c.pourQui ?? '').trim().slice(0, 200),
          prerequisites: (c.prerequis ?? '').trim(),
          program: (programme.program ?? '').trim(),
          ...(programme.durationHours && programme.durationHours > 0 ? { durationHours: programme.durationHours } : {}),
        },
      },
      (p) => setProgramme((prev) => ({ ...(prev ?? p), ...p, sessions: prev?.sessions ?? p.sessions })),
    );
  }

  /** Ouvre la fiche programme de cette formation, à partir de ce qu'on sait déjà. */
  const ecrireProgramme = () =>
    agir<Programme>(`/ecole/cours/${c.id}/programme`, { methode: 'POST' }, (p) => {
      setProgramme({ ...p, sessions: p.sessions ?? [] });
      setC((prev) => ({ ...prev, formationId: p.id }));
      setMessage('La fiche programme est ouverte : complète le déroulé et la durée, puis enregistre.');
    });

  /* -------------------------------------------------------------- sessions */

  const poserSession = (s: SessionProgramme) =>
    setProgramme((p) => {
      if (!p) return p;
      const liste = p.sessions ?? [];
      const existe = liste.some((x) => x.id === s.id);
      const sessions = existe ? liste.map((x) => (x.id === s.id ? { ...x, ...s } : x)) : [...liste, s];
      sessions.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      return { ...p, sessions };
    });

  const creerSession = (corps: Record<string, unknown>) =>
    programme
      ? agir<SessionProgramme>(`/formations/${programme.id}/sessions`, { methode: 'POST', corps }, (s) => {
          poserSession(s);
          setMessage('La session est programmée.');
        })
      : Promise.resolve();

  const modifierSession = (id: string, corps: Record<string, unknown>) =>
    agir<SessionProgramme>(`/formations/sessions/${id}`, { methode: 'PATCH', corps }, (s) => {
      poserSession(s);
      setMessage('La session est enregistrée.');
    });

  async function changerStatut(statut: CoursComplet['statut']) {
    await agir(`/ecole/cours/${c.id}`, { methode: 'PATCH', corps: { statut } });
    setMessage(
      statut === 'PUBLIE'
        ? 'La formation est publiée.'
        : statut === 'ARCHIVE'
          ? 'La formation est archivée.'
          : 'La formation est repassée en brouillon.',
    );
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

  /* --------------------------------------------------------- commentaires */

  const modifierCommentaire = (id: string, corps: Record<string, unknown>) =>
    agir<Commentaire[]>(`/ecole/commentaires/${id}`, { methode: 'PATCH', corps }, (d) => setCommentaires(d));

  async function supprimerCommentaire(id: string) {
    setOccupe(true);
    setErreur(null);
    try {
      await appel(`/ecole/commentaires/${id}`, { methode: 'DELETE' });
      setCommentaires((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  /* ------------------------------------------------------------------ vue */

  const visibles = commentaires.filter((x) => !x.masque);
  const sansReponse = visibles.filter((x) => !x.reponse).length;

  // Les sessions n'ont de sens que quand on se retrouve quelque part, à une
  // date : en salle, en visio, ou les deux. En ligne pur, l'onglet n'existe pas.
  const avecSessions = c.modalite !== 'EN_LIGNE';
  const nbSessions = programme?.sessions?.filter((s) => s.status !== 'CANCELLED').length ?? 0;

  const ONGLETS: [Onglet, string][] = [
    ['contenu', 'Contenu'],
    ['parametres', 'Paramètres'],
    ['prix', 'Prix'],
    ['descriptions', 'Descriptions'],
    ...(avecSessions ? ([['sessions', nbSessions ? `Sessions (${nbSessions})` : 'Sessions']] as [Onglet, string][]) : []),
    ['apprenants', `Apprenants (${apprenants.length})`],
    ['commentaires', sansReponse ? `Commentaires (${sansReponse})` : 'Commentaires'],
    ['statistiques', 'Statistiques'],
  ];

  return (
    <div>
      {/* ------------------------------------------------------------ l'en-tête */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight" style={{ color: VERT.encre }}>
              {c.titre}
            </h1>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={
                c.statut === 'PUBLIE'
                  ? { backgroundColor: VERT.clair, color: VERT.fonce }
                  : c.statut === 'ARCHIVE'
                    ? { backgroundColor: '#EFEFF4', color: '#5A5A6E' }
                    : { backgroundColor: '#FEF3E2', color: '#7C3E06' }
              }
            >
              {c.statut === 'PUBLIE' ? 'Publiée' : c.statut === 'ARCHIVE' ? 'Archivée' : 'Brouillon'}
            </span>
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: '#ECEBFC', color: '#4338CA' }}>
              {MODALITE_COURTE[c.modalite]}
            </span>
          </div>
          <p className="mt-1.5 text-[15px]" style={{ color: VERT.sourdine }}>
            {c.chapitres.length} chapitre{c.chapitres.length > 1 ? 's' : ''} · {nbLecons} leçon{nbLecons > 1 ? 's' : ''} ·{' '}
            {duree(c.dureeMinutes || c.dureeCalculee)} · {c.gratuit || c.prixCents === 0 ? 'Gratuite' : euros(c.prixCents)}
            {c.lieu ? ` · ${c.lieu}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/cours/${c.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-bold no-underline"
            style={{ borderColor: VERT.bord, color: VERT.encre }}
          >
            Aperçu de la page
          </a>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(lien);
              setMessage('Le lien est copié.');
            }}
            className="rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-bold"
            style={{ borderColor: VERT.bord, color: VERT.encre }}
          >
            Partager
          </button>
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
              Publier la formation
            </button>
          )}
        </div>
      </div>

      {c.statut === 'PUBLIE' ? (
        <div
          className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4"
          style={{ borderColor: VERT.bord, backgroundColor: VERT.clair }}
        >
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

      {/* -------------------------------------------------------- les onglets */}
      <div className="mb-5 overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b" style={{ borderColor: VERT.bord }}>
          {ONGLETS.map(([cle, libelle]) => (
            <button
              key={cle}
              type="button"
              onClick={() => setOnglet(cle)}
              aria-current={onglet === cle ? 'page' : undefined}
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
      </div>

      {erreur ? (
        <p className="mb-4 rounded-2xl border border-[#F3B0C2] bg-[#FDE7EC] px-5 py-4 text-[15px] font-bold text-[#8A1B3D]">
          {erreur}
        </p>
      ) : null}
      {message ? (
        <p
          className="mb-4 rounded-2xl border px-5 py-4 text-[15px] font-bold"
          style={{ borderColor: VERT.bord, backgroundColor: VERT.clair, color: VERT.fonce }}
        >
          {message}
        </p>
      ) : null}

      {onglet === 'contenu' ? (
        <Contenu
          cours={c}
          occupe={occupe}
          ajouter={ajouterContenu}
          supprimerChapitre={supprimerChapitre}
          renommerChapitre={renommerChapitre}
          basculerPublicationChapitre={(id, publie) =>
            agir(`/ecole/cours/${c.id}/chapitres/${id}`, { methode: 'PATCH', corps: { publie } })
          }
          dupliquerChapitre={(id) => agir(`/ecole/cours/${c.id}/chapitres/${id}/dupliquer`, { methode: 'POST', corps: {} })}
          supprimerLecon={supprimerLecon}
          dupliquerLecon={(id) => agir(`/ecole/cours/${c.id}/lecons/${id}/dupliquer`, { methode: 'POST', corps: {} })}
          basculerPublicationLecon={(id, publie) =>
            agir(`/ecole/cours/${c.id}/lecons/${id}`, { methode: 'PATCH', corps: { publie } })
          }
          deplacerVers={(leconId, chapitreId) =>
            agir(`/ecole/cours/${c.id}/lecons/${leconId}/deplacer`, { methode: 'POST', corps: { chapitreId } })
          }
          reordonner={reordonnerContenu}
          reordonnerListe={reordonnerListe}
          reglerChapitre={reglerChapitre}
          genererStructure={genererStructure}
          ouvrirLecon={setLeconOuverte}
          lectureOrdonnee={c.lectureOrdonnee}
          basculerLecture={(v) => void enregistrer({ lectureOrdonnee: v }, 'La lecture ordonnée')}
          lien={lien}
        />
      ) : null}

      {onglet === 'parametres' ? (
        <Parametres cours={c} setCours={setC} occupe={occupe} enregistrer={enregistrerParametres} />
      ) : null}

      {onglet === 'prix' ? <Prix cours={c} setCours={setC} occupe={occupe} enregistrer={enregistrerPrix} /> : null}

      {onglet === 'descriptions' ? (
        <Descriptions
          cours={c}
          setCours={setC}
          programme={programme}
          setProgramme={setProgramme}
          ecrireProgramme={ecrireProgramme}
          occupe={occupe}
          enregistrer={enregistrerDescriptions}
        />
      ) : null}

      {onglet === 'sessions' && avecSessions ? (
        <Sessions
          cours={c}
          programme={programme}
          ecrireProgramme={ecrireProgramme}
          occupe={occupe}
          creer={creerSession}
          modifier={modifierSession}
        />
      ) : null}

      {onglet === 'apprenants' ? (
        <Apprenants
          apprenants={apprenants}
          occupe={occupe}
          inscrire={inscrire}
          retirer={retirer}
          origine={origine}
          placesMax={c.placesMax}
        />
      ) : null}

      {onglet === 'commentaires' ? (
        <Commentaires
          commentaires={commentaires}
          actifs={c.commentairesActifs}
          occupe={occupe}
          modifier={modifierCommentaire}
          supprimer={supprimerCommentaire}
        />
      ) : null}

      {onglet === 'statistiques' ? <StatsFormation cours={c} apprenants={apprenants} ventes={ventes} /> : null}

      {/* L'éditeur d'une leçon prend tout l'écran : on n'écrit qu'une chose à la fois. */}
      {leconOuverte && leconOuverte.type !== 'QUIZ' && leconOuverte.type !== 'DEVOIR' ? (
        <EditeurLecon
          lecon={leconOuverte}
          coursId={c.id}
          titreFormation={c.titre}
          adressePublique={c.statut === 'PUBLIE' ? lien : null}
          lecons={(c.contenu ?? []).flatMap((e) =>
            e.genre === 'chapitre'
              ? e.lecons.map((l) => ({ id: l.id, titre: l.titre }))
              : [{ id: e.id, titre: e.titre }],
          )}
          fermer={() => setLeconOuverte(null)}
          enregistrer={async (patch) => {
            try {
              const d = await appel<CoursComplet>(`/ecole/cours/${c.id}/lecons/${leconOuverte.id}`, {
                methode: 'PATCH',
                corps: patch,
              });
              setC(d);
              const trouvee = (d.contenu ?? [])
                .flatMap((e) => (e.genre === 'chapitre' ? e.lecons : [e]))
                .find((l) => l.id === leconOuverte.id);
              if (trouvee) setLeconOuverte(trouvee as Lecon);
              setMessage('La leçon est enregistrée.');
              return true;
            } catch (e) {
              setErreur(messageDe(e));
              return false;
            }
          }}
        />
      ) : null}

      {/* Un quiz et un devoir s'écrivent avec leurs propres champs. */}
      {leconOuverte && (leconOuverte.type === 'QUIZ' || leconOuverte.type === 'DEVOIR') ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold tracking-tight" style={{ color: VERT.encre }}>
                {NOM_TYPE_LECON[leconOuverte.type]}
              </h2>
              <button
                type="button"
                onClick={() => setLeconOuverte(null)}
                className="rounded-xl border-2 bg-white px-3 py-2 text-sm font-extrabold"
                style={{ borderColor: VERT.bord, color: VERT.texte }}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <FormulaireLecon
              lecon={leconOuverte}
              occupe={occupe}
              enregistrer={(patch) => {
                void agir(`/ecole/cours/${c.id}/lecons/${leconOuverte.id}`, { methode: 'PATCH', corps: patch });
                setLeconOuverte(null);
              }}
              fermer={() => setLeconOuverte(null)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ========================================================== LE CONTENU ==== */

function Contenu({
  cours,
  occupe,
  ajouter,
  supprimerChapitre,
  renommerChapitre,
  basculerPublicationChapitre,
  dupliquerChapitre,
  supprimerLecon,
  dupliquerLecon,
  basculerPublicationLecon,
  deplacerVers,
  reordonner,
  reordonnerListe,
  reglerChapitre,
  genererStructure,
  ouvrirLecon,
  lectureOrdonnee,
  basculerLecture,
  lien,
}: {
  cours: CoursComplet;
  occupe: boolean;
  ajouter: (genre: GenreContenu, chapitreId?: string) => void;
  supprimerChapitre: (id: string) => void;
  renommerChapitre: (id: string, titre: string) => void;
  basculerPublicationChapitre: (id: string, publie: boolean) => void;
  dupliquerChapitre: (id: string) => void;
  supprimerLecon: (id: string) => void;
  dupliquerLecon: (id: string) => void;
  basculerPublicationLecon: (id: string, publie: boolean) => void;
  deplacerVers: (leconId: string, chapitreId: string) => void;
  reordonner: (index: number, sens: -1 | 1) => void;
  reordonnerListe: (ids: string[]) => void;
  reglerChapitre: (id: string, corps: Record<string, unknown>) => void;
  genererStructure: () => void;
  ouvrirLecon: (l: Lecon) => void;
  lectureOrdonnee: boolean;
  basculerLecture: (v: boolean) => void;
  lien: string;
}) {
  const elements = cours.contenu ?? [];
  const chapitres = elements.filter((e) => e.genre === 'chapitre') as ({ genre: 'chapitre' } & Chapitre)[];
  // Un chapitre se replie : avec huit modules, la table des matières doit
  // tenir dans l'écran, comme chez Teachizy.
  const [plies, setPlies] = useState<Record<string, boolean>>({});
  // Ce qu'on tient à la souris : « chapitre:<id> » ou « lecon:<id> ».
  const [glisse, setGlisse] = useState<string | null>(null);

  /** Déposer un élément sur un autre : celui qu'on tient prend sa place. */
  const deposerSur = (cible: string) => {
    if (!glisse || glisse === cible) return;
    const cles = elements.map((e) => `${e.genre}:${e.id}`);
    const de = cles.indexOf(glisse);
    const vers = cles.indexOf(cible);
    setGlisse(null);
    if (de < 0 || vers < 0) return;
    const copie = [...cles];
    const [pris] = copie.splice(de, 1);
    copie.splice(vers, 0, pris);
    reordonnerListe(copie);
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Interrupteur
          coche={lectureOrdonnee}
          changer={basculerLecture}
          titre="Imposer la lecture ordonnée"
          quoi="On n'ouvre une leçon qu'après avoir terminé la précédente."
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={genererStructure}
            disabled={occupe}
            className="rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-extrabold disabled:opacity-60"
            style={{ borderColor: VERT.bord, color: VERT.fonce }}
          >
            Générer une structure
          </button>
          <MenuAjouter occupe={occupe} avecChapitre ajouter={(g) => ajouter(g)} />
        </div>
      </div>

      {elements.length === 0 ? (
        <p
          className="rounded-2xl border-2 border-dashed bg-white px-5 py-10 text-center text-[15px]"
          style={{ borderColor: VERT.bord, color: VERT.sourdine }}
        >
          Cette formation n&apos;a encore aucun contenu. Clique sur « Ajouter un contenu pédagogique » :
          une leçon suffit pour commencer, le chapitre n&apos;est utile que si tu en as plusieurs.
        </p>
      ) : null}

      {elements.map((e, i) =>
        e.genre === 'chapitre' ? (
          <section
            key={`ch-${e.id}`}
            draggable={glisse === `chapitre:${e.id}`}
            onDragStart={(ev) => ev.dataTransfer.setData('text/plain', e.id)}
            onDragEnd={() => setGlisse(null)}
            onDragOver={(ev) => {
              if (glisse) ev.preventDefault();
            }}
            onDrop={(ev) => {
              ev.preventDefault();
              deposerSur(`chapitre:${e.id}`);
            }}
            className="rounded-2xl border bg-white p-5"
            style={{ borderColor: VERT.bord, opacity: glisse === `chapitre:${e.id}` ? 0.5 : 1 }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                title="Déplacer ce chapitre"
                aria-label="Déplacer ce chapitre"
                onMouseDown={() => setGlisse(`chapitre:${e.id}`)}
                onMouseUp={() => setGlisse(null)}
                className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg border-2 bg-white text-sm font-extrabold active:cursor-grabbing"
                style={{ borderColor: VERT.bord, color: VERT.texte }}
              >
                ⠿
              </button>
              <BoutonIcone
                titre={plies[e.id] ? 'Déplier ce chapitre' : 'Replier ce chapitre'}
                onClick={() => setPlies((p) => ({ ...p, [e.id]: !p[e.id] }))}
              >
                {plies[e.id] ? '⌄' : '⌃'}
              </BoutonIcone>
              <input
                defaultValue={e.titre}
                onBlur={(ev) => {
                  const v = ev.target.value.trim();
                  if (v && v !== e.titre) renommerChapitre(e.id, v);
                }}
                className="min-w-0 flex-1 rounded-lg border-2 border-transparent px-2 py-1.5 text-lg font-extrabold tracking-tight focus:border-[#B7E4CE] focus:outline-none"
                style={{ color: VERT.encre }}
                aria-label="Titre du chapitre"
              />
              <span className="shrink-0 text-sm" style={{ color: VERT.sourdine }}>
                {e.lecons.length} contenu{e.lecons.length > 1 ? 's' : ''} pédagogique{e.lecons.length > 1 ? 's' : ''}
              </span>
              {e.publie === false ? <Pastille ton="attention">Brouillon</Pastille> : null}
              <label className="flex shrink-0 items-center gap-1.5 text-sm" style={{ color: VERT.sourdine }}>
                S’ouvre après
                <input
                  type="number"
                  min={0}
                  defaultValue={e.ouvertureJours ?? 0}
                  onBlur={(ev) => {
                    const v = Math.max(0, Number(ev.target.value) || 0);
                    if (v !== (e.ouvertureJours ?? 0)) reglerChapitre(e.id, { ouvertureJours: v });
                  }}
                  className="w-16 rounded-lg border-2 bg-white px-2 py-1 text-sm font-bold"
                  style={{ borderColor: VERT.bord, color: VERT.texte }}
                  aria-label="Jours avant l’ouverture de ce chapitre"
                />
                jours
              </label>
              <div className="flex shrink-0 items-center gap-1">
                <BoutonIcone titre="Monter" onClick={() => reordonner(i, -1)} disabled={occupe || i === 0}>
                  ↑
                </BoutonIcone>
                <BoutonIcone titre="Descendre" onClick={() => reordonner(i, 1)} disabled={occupe || i === elements.length - 1}>
                  ↓
                </BoutonIcone>
                <BoutonIcone titre="Dupliquer le chapitre" onClick={() => dupliquerChapitre(e.id)} disabled={occupe}>
                  ⧉
                </BoutonIcone>
                <MenuTrois
                  occupe={occupe}
                  publie={e.publie !== false}
                  basculer={() => basculerPublicationChapitre(e.id, e.publie === false)}
                  supprimer={() => supprimerChapitre(e.id)}
                />
                <MenuAjouter occupe={occupe} compact ajouter={(g) => ajouter(g, e.id)} />
              </div>
            </div>

            {plies[e.id] ? null : e.lecons.length ? (
              <ul className="mt-3 grid gap-2">
                {e.lecons.map((l) => (
                  <LigneLecon
                    key={l.id}
                    lecon={l}
                    occupe={occupe}
                    chapitres={chapitres}
                    chapitreActuel={e.id}
                    ouvrir={() => ouvrirLecon(l)}
                    dupliquer={() => dupliquerLecon(l.id)}
                    supprimer={() => supprimerLecon(l.id)}
                    basculer={() => basculerPublicationLecon(l.id, l.publie === false)}
                    deplacerVers={(vers) => deplacerVers(l.id, vers)}
                    lien={lien}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm" style={{ color: VERT.sourdine }}>
                Ce chapitre est vide. Ajoute-lui une leçon.
              </p>
            )}
          </section>
        ) : (
          <section
            key={`le-${e.id}`}
            draggable={glisse === `lecon:${e.id}`}
            onDragStart={(ev) => ev.dataTransfer.setData('text/plain', e.id)}
            onDragEnd={() => setGlisse(null)}
            onDragOver={(ev) => {
              if (glisse) ev.preventDefault();
            }}
            onDrop={(ev) => {
              ev.preventDefault();
              deposerSur(`lecon:${e.id}`);
            }}
            className="rounded-2xl border bg-white p-2"
            style={{ borderColor: VERT.bord, opacity: glisse === `lecon:${e.id}` ? 0.5 : 1 }}
          >
            <ul>
              <LigneLecon
                lecon={e}
                occupe={occupe}
                chapitres={chapitres}
                chapitreActuel=""
                ouvrir={() => ouvrirLecon(e)}
                dupliquer={() => dupliquerLecon(e.id)}
                supprimer={() => supprimerLecon(e.id)}
                basculer={() => basculerPublicationLecon(e.id, e.publie === false)}
                deplacerVers={(vers) => deplacerVers(e.id, vers)}
                monter={() => reordonner(i, -1)}
                descendre={() => reordonner(i, 1)}
                premier={i === 0}
                dernier={i === elements.length - 1}
                lien={lien}
              />
            </ul>
          </section>
        ),
      )}

      {elements.length ? <MenuAjouter occupe={occupe} avecChapitre large ajouter={(g) => ajouter(g)} /> : null}
    </div>
  );
}

/** Une leçon, un quiz, un devoir : la même ligne, avec ses gestes. */
function LigneLecon({
  lecon,
  occupe,
  chapitres,
  chapitreActuel,
  ouvrir,
  dupliquer,
  supprimer,
  basculer,
  deplacerVers,
  monter,
  descendre,
  premier,
  dernier,
  lien,
}: {
  lecon: Lecon;
  occupe: boolean;
  chapitres: ({ genre: 'chapitre' } & Chapitre)[];
  chapitreActuel: string;
  ouvrir: () => void;
  dupliquer: () => void;
  supprimer: () => void;
  basculer: () => void;
  deplacerVers: (chapitreId: string) => void;
  monter?: () => void;
  descendre?: () => void;
  premier?: boolean;
  dernier?: boolean;
  lien: string;
}) {
  const nbBlocs = lecon.blocs?.length ?? 0;

  return (
    <li className="rounded-xl border" style={{ borderColor: VERT.bord }}>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
          style={{ backgroundColor: VERT.clair, color: VERT.fonce }}
        >
          {NOM_TYPE_LECON[lecon.type]}
        </span>
        <button
          type="button"
          onClick={ouvrir}
          className="min-w-0 flex-1 truncate text-left text-[15px] font-bold"
          style={{ color: VERT.encre }}
        >
          {lecon.titre}
        </button>
        {lecon.publie === false ? <Pastille ton="attention">Brouillon</Pastille> : null}
        {lecon.apercu ? <Pastille ton="attention">Aperçu libre</Pastille> : null}
        <span className="shrink-0 text-sm" style={{ color: VERT.sourdine }}>
          {lecon.dureeMinutes ? duree(lecon.dureeMinutes) : ''}
          {nbBlocs ? ` · ${nbBlocs} bloc${nbBlocs > 1 ? 's' : ''}` : ''}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {monter ? (
            <BoutonIcone titre="Monter" onClick={monter} disabled={occupe || premier}>
              ↑
            </BoutonIcone>
          ) : null}
          {descendre ? (
            <BoutonIcone titre="Descendre" onClick={descendre} disabled={occupe || dernier}>
              ↓
            </BoutonIcone>
          ) : null}
          <BoutonIcone titre="Modifier" onClick={ouvrir} disabled={occupe}>
            ✎
          </BoutonIcone>
          <a
            href={lien}
            target="_blank"
            rel="noreferrer"
            title="Voir la page publique"
            aria-label="Voir la page publique"
            className="grid size-8 place-items-center rounded-lg border-2 bg-white text-sm font-extrabold no-underline"
            style={{ borderColor: VERT.bord, color: VERT.texte }}
          >
            ◉
          </a>
          <BoutonIcone titre="Dupliquer" onClick={dupliquer} disabled={occupe}>
            ⧉
          </BoutonIcone>
          <MenuTrois occupe={occupe} publie={lecon.publie !== false} basculer={basculer} supprimer={supprimer} />
        </div>
      </div>

      {chapitres.length ? (
        <div className="border-t px-4 py-2" style={{ borderColor: VERT.bord }}>
          <label className="flex flex-wrap items-center gap-2 text-sm" style={{ color: VERT.sourdine }}>
            Déplacer vers…
            <select
              value={chapitreActuel}
              onChange={(e) => deplacerVers(e.target.value)}
              disabled={occupe}
              className="rounded-lg border-2 bg-white px-2 py-1 text-sm font-bold"
              style={{ borderColor: VERT.bord, color: VERT.texte }}
            >
              <option value="">Aucun chapitre</option>
              {chapitres.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.titre}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </li>
  );
}

/** Le bouton « Ajouter un contenu pédagogique » et son menu. */
function MenuAjouter({
  ajouter,
  occupe,
  avecChapitre,
  compact,
  large,
}: {
  ajouter: (genre: GenreContenu) => void;
  occupe: boolean;
  avecChapitre?: boolean;
  compact?: boolean;
  large?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);

  const choix: { genre: GenreContenu; nom: string; quoi: string }[] = [
    ...(avecChapitre
      ? [{ genre: 'chapitre' as const, nom: 'Chapitre (facultatif)', quoi: 'Pour regrouper des leçons.' }]
      : []),
    { genre: 'lecon', nom: 'Leçon', quoi: 'Du texte, des vidéos, des images.' },
    { genre: 'quiz', nom: 'Quiz', quoi: 'Des questions, une note minimale.' },
    { genre: 'devoir', nom: 'Devoir', quoi: 'Un travail à rendre.' },
    { genre: 'taches', nom: 'Tâches & missions', quoi: 'Une liste que l’apprenant coche.' },
    { genre: 'live', nom: 'Classe en direct', quoi: 'Un rendez-vous en visio.' },
    { genre: 'scorm', nom: 'Contenu SCORM', quoi: 'Un paquet déjà déposé ailleurs.' },
  ];

  return (
    <div className={`relative ${large ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        disabled={occupe}
        className={
          compact
            ? 'rounded-xl px-3 py-1.5 text-sm font-extrabold text-white disabled:opacity-60'
            : large
              ? 'w-full rounded-2xl border-2 border-dashed px-5 py-4 text-base font-extrabold disabled:opacity-60'
              : 'rounded-xl px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60'
        }
        style={
          large
            ? { borderColor: VERT.bord, color: VERT.fonce }
            : { backgroundColor: VERT.fonce }
        }
      >
        {compact ? 'Ajouter +' : 'Ajouter un contenu pédagogique +'}
      </button>

      {ouvert ? (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOuvert(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            className="absolute right-0 z-20 mt-1 w-72 overflow-hidden rounded-2xl border-2 bg-white shadow-lg"
            style={{ borderColor: VERT.bord }}
          >
            {choix.map((c) => (
              <button
                key={c.genre}
                type="button"
                onClick={() => {
                  setOuvert(false);
                  ajouter(c.genre);
                }}
                className="block w-full border-b px-4 py-3 text-left last:border-b-0"
                style={{ borderColor: VERT.bord }}
              >
                <span className="block text-[15px] font-extrabold" style={{ color: VERT.encre }}>
                  {c.nom}
                </span>
                <span className="block text-sm" style={{ color: VERT.sourdine }}>
                  {c.quoi}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Le menu « … » : mettre en brouillon, supprimer. */
function MenuTrois({
  occupe,
  publie,
  basculer,
  supprimer,
}: {
  occupe: boolean;
  publie: boolean;
  basculer: () => void;
  supprimer: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="relative">
      <BoutonIcone titre="Autres gestes" onClick={() => setOuvert((v) => !v)} disabled={occupe}>
        ⋯
      </BoutonIcone>
      {ouvert ? (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOuvert(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border-2 bg-white shadow-lg"
            style={{ borderColor: VERT.bord }}
          >
            <button
              type="button"
              onClick={() => {
                setOuvert(false);
                basculer();
              }}
              className="block w-full border-b px-4 py-2.5 text-left text-sm font-bold"
              style={{ borderColor: VERT.bord, color: VERT.texte }}
            >
              {publie ? 'Mettre en brouillon' : 'Publier'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOuvert(false);
                supprimer();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm font-bold text-[#8A1B3D]"
            >
              Supprimer
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Pastille({ children, ton }: { children: React.ReactNode; ton: 'attention' }) {
  return (
    <span className="shrink-0 rounded-full bg-[#FEF3E2] px-2.5 py-0.5 text-xs font-bold text-[#7C3E06]">{children}</span>
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

/* ========================================================= LES PARAMÈTRES == */

/**
 * LE TITRE, L'ADRESSE, ET SURTOUT LA MODALITÉ.
 *
 * Le présentiel, la classe virtuelle et le mixte ne sont pas des formations
 * d'un autre genre : c'est la même formation, suivie autrement. On la choisit
 * ici, et l'écran demande alors ce que cette modalité réclame — un lieu, un
 * lien de visio, une façon d'y accéder quand on est en situation de handicap.
 */
function Parametres({
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
  const enSalle = c.modalite === 'PRESENTIEL' || c.modalite === 'MIXTE';
  const enVisio = c.modalite === 'VIRTUEL' || c.modalite === 'MIXTE';

  return (
    <div className="grid gap-4">
      <Bloc titre="L'identité de la formation">
        <div className="grid gap-3">
          <Champ libelle="Titre">
            <input value={c.titre} onChange={(e) => set({ titre: e.target.value })} className={CHAMP} />
          </Champ>
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ libelle="Adresse publique">
              <div className="flex items-center gap-1">
                <span className="shrink-0 text-sm" style={{ color: VERT.sourdine }}>
                  /cours/
                </span>
                <input value={c.slug} onChange={(e) => set({ slug: e.target.value })} className={CHAMP} />
              </div>
            </Champ>
            <Champ libelle="Image de couverture (adresse)">
              <input
                value={c.imageUrl ?? ''}
                onChange={(e) => set({ imageUrl: e.target.value })}
                className={CHAMP}
                placeholder="https://…"
              />
            </Champ>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
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
            <Champ libelle="Durée annoncée (min) — 0 pour additionner les leçons">
              <input
                type="number"
                min={0}
                value={c.dureeMinutes}
                onChange={(e) => set({ dureeMinutes: Number(e.target.value) || 0 })}
                className={CHAMP}
              />
            </Champ>
          </div>
        </div>
      </Bloc>

      <Bloc titre="Comment on la suit">
        <p className="mb-4 text-[15px]" style={{ color: VERT.texte }}>
          Une seule formation, une seule fiche. Le présentiel, la visio et le mixte se choisissent ici : la formation ne
          change pas de nature, elle change de façon d&apos;être suivie.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(NOM_MODALITE) as ModaliteCours[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => set({ modalite: m })}
              aria-pressed={c.modalite === m}
              className="rounded-xl border-2 px-4 py-3 text-left text-[15px] font-bold transition"
              style={
                c.modalite === m
                  ? { borderColor: VERT.plein, backgroundColor: VERT.clair, color: VERT.fonce }
                  : { borderColor: VERT.bord, backgroundColor: '#FFFFFF', color: VERT.texte }
              }
            >
              {NOM_MODALITE[m]}
              <span className="mt-0.5 block text-[13px] font-normal" style={{ color: VERT.sourdine }}>
                {QUOI_MODALITE[m]}
              </span>
            </button>
          ))}
        </div>

        {enSalle || enVisio ? (
          <div className="mt-4 grid gap-3">
            {enSalle ? (
              <>
                <Champ libelle="Le lieu (adresse complète)">
                  <input
                    value={c.lieu ?? ''}
                    onChange={(e) => set({ lieu: e.target.value })}
                    className={CHAMP}
                    placeholder="12 rue…, 77000 Melun"
                  />
                </Champ>
                <Champ libelle="L'accès en situation de handicap">
                  <textarea
                    rows={2}
                    value={c.accesHandicap ?? ''}
                    onChange={(e) => set({ accesHandicap: e.target.value })}
                    className={CHAMP}
                    placeholder="Plain-pied, ascenseur, place réservée…"
                  />
                </Champ>
              </>
            ) : null}
            {enVisio ? (
              <Champ libelle="Le lien de la visio">
                <input
                  value={c.lienVisio ?? ''}
                  onChange={(e) => set({ lienVisio: e.target.value })}
                  className={CHAMP}
                  placeholder="https://…"
                />
              </Champ>
            ) : null}
            <p className="text-[14px]" style={{ color: VERT.sourdine }}>
              {enSalle
                ? "Sans lieu écrit, ni la convention ni l'émargement ne tiennent : la publication est refusée tant qu'il manque."
                : 'Sans lien, personne ne peut rejoindre : la publication est refusée tant qu’il manque.'}
            </p>
          </div>
        ) : null}
      </Bloc>

      <Bloc titre="Ce que la formation impose">
        <div className="grid gap-2">
          <Interrupteur
            coche={c.lectureOrdonnee}
            changer={(v) => set({ lectureOrdonnee: v })}
            titre="Imposer la lecture ordonnée"
            quoi="On n'ouvre une leçon qu'après avoir terminé la précédente."
          />
          <Interrupteur
            coche={c.certificat}
            changer={(v) => set({ certificat: v })}
            titre="Attestation de fin de formation"
            quoi="Émise dès que toutes les leçons sont faites."
          />
          <Interrupteur
            coche={c.commentairesActifs}
            changer={(v) => set({ commentairesActifs: v })}
            titre="Les apprenants peuvent commenter"
            quoi="Leurs questions arrivent dans l'onglet « Commentaires »."
          />
        </div>
        <div className="mt-3 sm:max-w-xs">
          <Champ libelle="Limiter le nombre d'inscriptions (0 : pas de limite)">
            <input
              type="number"
              min={0}
              value={c.placesMax ?? 0}
              onChange={(e) => set({ placesMax: Number(e.target.value) || 0 })}
              className={CHAMP}
            />
          </Champ>
        </div>
      </Bloc>

      <Bloc titre="Le référencement">
        <p className="mb-4 text-[15px]" style={{ color: VERT.texte }}>
          Ce que lisent les moteurs de recherche. Vide, ils reprennent le titre et le sous-titre.
        </p>
        <div className="grid gap-3">
          <Champ libelle="Titre pour les moteurs de recherche">
            <input value={c.seoTitre ?? ''} onChange={(e) => set({ seoTitre: e.target.value })} className={CHAMP} />
          </Champ>
          <Champ libelle="Description pour les moteurs de recherche">
            <textarea
              rows={3}
              value={c.seoDescription ?? ''}
              onChange={(e) => set({ seoDescription: e.target.value })}
              className={CHAMP}
            />
          </Champ>
        </div>
      </Bloc>

      <Enregistrer occupe={occupe} onClick={enregistrer}>
        Enregistrer les paramètres
      </Enregistrer>
    </div>
  );
}

/* =============================================================== LE PRIX == */

function Prix({
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
  const gratuite = c.gratuit || c.prixCents === 0;
  const echeance = c.echeances > 1 ? Math.round(c.prixCents / c.echeances) : c.prixCents;

  return (
    <div className="grid gap-4">
      <Bloc titre="Ce que la formation coûte">
        <div className="grid gap-2">
          <Interrupteur
            coche={c.gratuit}
            changer={(v) => set({ gratuit: v })}
            titre="Formation gratuite"
            quoi="L'inscription se fait en ligne, tout de suite, sans paiement."
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Champ libelle="Prix TTC (en euros)">
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
          <Champ libelle="Prix barré (le prix d'avant, facultatif)">
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
          <Champ libelle="TVA (en %) — 0 si l'organisme en est exonéré">
            <input
              type="number"
              min={0}
              max={100}
              value={c.tvaPourcent}
              onChange={(e) => set({ tvaPourcent: Number(e.target.value) || 0 })}
              className={CHAMP}
              disabled={c.gratuit}
            />
          </Champ>
          <Champ libelle="Facilités de paiement (nombre de fois)">
            <select
              value={String(c.echeances)}
              onChange={(e) => set({ echeances: Number(e.target.value) || 1 })}
              className={CHAMP}
              disabled={c.gratuit}
            >
              {[1, 2, 3, 4, 6, 10, 12].map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? 'En une fois' : `En ${n} fois`}
                </option>
              ))}
            </select>
          </Champ>
        </div>
      </Bloc>

      <Bloc titre="Ce que la personne voit">
        {gratuite ? (
          <p className="text-[17px] font-extrabold" style={{ color: VERT.fonce }}>
            Gratuite
          </p>
        ) : (
          <>
            <p className="text-[26px] font-black leading-none" style={{ color: VERT.fonce }}>
              {euros(c.prixCents)}
              {c.prixBarreCents ? (
                <span className="ml-3 align-middle text-[17px] font-bold line-through" style={{ color: VERT.sourdine }}>
                  {euros(c.prixBarreCents)}
                </span>
              ) : null}
            </p>
            <p className="mt-2 text-[15px]" style={{ color: VERT.texte }}>
              {c.echeances > 1 ? `Réglable en ${c.echeances} fois ${euros(echeance)}. ` : 'Réglable en une fois. '}
              {c.tvaPourcent ? `TVA ${c.tvaPourcent} %.` : 'Exonérée de TVA (article 261-4-4°a du CGI).'}
            </p>
          </>
        )}
        <p className="mt-4 rounded-xl px-4 py-3 text-[14px]" style={{ backgroundColor: '#FEF3E2', color: '#7C3E06' }}>
          Le paiement en ligne n&apos;est pas encore branché : ce prix s&apos;affiche, et l&apos;encaissement se fait
          ailleurs. Une fois payé, tu inscris la personne depuis l&apos;onglet « Apprenants » et tu enregistres la vente.
        </p>
      </Bloc>

      <Enregistrer occupe={occupe} onClick={enregistrer}>
        Enregistrer le prix
      </Enregistrer>
    </div>
  );
}

/* ======================================================= LES DESCRIPTIONS == */

function Descriptions({
  cours: c,
  setCours,
  programme,
  setProgramme,
  ecrireProgramme,
  occupe,
  enregistrer,
}: {
  cours: CoursComplet;
  setCours: (f: (p: CoursComplet) => CoursComplet) => void;
  programme: Programme | null;
  setProgramme: (f: (p: Programme | null) => Programme | null) => void;
  ecrireProgramme: () => void;
  occupe: boolean;
  enregistrer: () => void;
}) {
  const set = (patch: Partial<CoursComplet>) => setCours((p) => ({ ...p, ...patch }));
  const setP = (patch: Partial<Programme>) => setProgramme((p) => (p ? { ...p, ...patch } : p));

  // Les cinq mentions que l'indicateur 1 attend sur une fiche programme.
  const manques: string[] = [];
  if (programme) {
    if (!c.objectifs.some((o) => o.trim())) manques.push('les objectifs');
    if (!(c.pourQui ?? '').trim()) manques.push('le public visé');
    if (!(c.prerequis ?? '').trim()) manques.push('les prérequis');
    if (!programme.durationHours) manques.push('la durée en heures');
    if (!(programme.program ?? '').trim()) manques.push('le déroulé');
  }

  return (
    <div className="grid gap-4">
      <Bloc titre="La vidéo de présentation">
        <Champ libelle="Adresse de la vidéo">
          <input
            value={c.bandeAnnonceUrl ?? ''}
            onChange={(e) => set({ bandeAnnonceUrl: e.target.value })}
            className={CHAMP}
            placeholder="https://…"
          />
        </Champ>
        <p className="mt-2 text-[14px]" style={{ color: VERT.sourdine }}>
          Trente secondes suffisent : qui parle, ce qu&apos;on apprend, à qui ça s&apos;adresse.
        </p>
      </Bloc>

      <Bloc titre="Ce qu'on lit avant de s'inscrire">
        <div className="grid gap-3">
          <Champ libelle="Description courte — la phrase sous le titre">
            <input value={c.sousTitre ?? ''} onChange={(e) => set({ sousTitre: e.target.value })} className={CHAMP} />
          </Champ>
          <Champ libelle="Description longue">
            <textarea
              rows={8}
              value={c.description ?? ''}
              onChange={(e) => set({ description: e.target.value })}
              className={CHAMP}
            />
          </Champ>
        </div>
      </Bloc>

      <Bloc titre="Les objectifs, le public, les prérequis">
        <div className="grid gap-3">
          <Champ libelle="Ce qu'on saura faire à la fin (une ligne par objectif)">
            <textarea
              rows={5}
              value={c.objectifs.join('\n')}
              onChange={(e) => set({ objectifs: e.target.value.split('\n') })}
              className={CHAMP}
            />
          </Champ>
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ libelle="Public cible">
              <textarea rows={4} value={c.pourQui ?? ''} onChange={(e) => set({ pourQui: e.target.value })} className={CHAMP} />
            </Champ>
            <Champ libelle="Prérequis">
              <textarea
                rows={4}
                value={c.prerequis ?? ''}
                onChange={(e) => set({ prerequis: e.target.value })}
                className={CHAMP}
              />
            </Champ>
          </div>
        </div>
      </Bloc>

      <Bloc titre="La fiche programme — ce que lisent un financeur et un auditeur">
        {programme ? (
          <div className="grid gap-3">
            <p className="max-w-[70ch] text-[14px] leading-relaxed" style={{ color: VERT.sourdine }}>
              Les objectifs, le public et les prérequis ci-dessus sont ceux de la fiche : ils s&apos;écrivent une fois.
              Il reste le déroulé et la durée en heures — les deux mentions que l&apos;indicateur 1 exige en plus.
            </p>
            <Champ libelle="Le déroulé — les séquences, dans l'ordre, avec leur modalité">
              <textarea rows={6} value={programme.program ?? ''} onChange={(e) => setP({ program: e.target.value })} className={CHAMP} />
            </Champ>
            <div className="grid gap-3 sm:grid-cols-2">
              <Champ libelle="La durée, en heures">
                <input
                  type="number"
                  min={1}
                  value={programme.durationHours ?? ''}
                  onChange={(e) => setP({ durationHours: e.target.value ? Number(e.target.value) : null })}
                  className={CHAMP}
                />
              </Champ>
              <div className="self-end text-[14px]" style={{ color: VERT.sourdine }}>
                {programme.certifying ? (
                  <span>
                    Certifiante{programme.certificationName ? ` — ${programme.certificationName}` : ''}.
                  </span>
                ) : (
                  <span>Non certifiante. Cette mention se pose à la validation du programme.</span>
                )}
              </div>
            </div>
            {manques.length ? (
              <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-3 py-2 text-[14px] text-[#7C3E06]">
                Il manque {manques.join(', ')} pour que la fiche tienne devant l&apos;indicateur 1.
              </p>
            ) : (
              <p className="rounded-xl border border-[#B7E4CE] bg-[#E3F5EC] px-3 py-2 text-[14px] text-[#0F5F3E]">
                Fiche complète : objectifs, public, prérequis, durée et déroulé y sont.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="max-w-[70ch] text-[14px] leading-relaxed" style={{ color: VERT.sourdine }}>
              Cette formation n&apos;a pas encore de fiche programme. C&apos;est le premier document qu&apos;un auditeur
              demande et celui qu&apos;un financeur lit avant de dire oui ; c&apos;est aussi ce qui porte les sessions
              datées, la convention et l&apos;émargement. Elle s&apos;ouvre à partir de ce qui est déjà écrit ici.
            </p>
            <div>
              <button
                type="button"
                onClick={ecrireProgramme}
                disabled={occupe}
                className="rounded-xl border-2 bg-white px-4 py-2.5 text-[15px] font-bold disabled:opacity-60"
                style={{ borderColor: VERT.bord, color: VERT.encre }}
              >
                Écrire la fiche programme
              </button>
            </div>
          </div>
        )}
      </Bloc>

      <Enregistrer occupe={occupe} onClick={enregistrer}>
        Enregistrer les descriptions
      </Enregistrer>
    </div>
  );
}

/* ========================================================== LES SESSIONS == */

/** Une date d'entrée `datetime-local` depuis un ISO, dans le fuseau du navigateur. */
function versLocal(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function dateLongue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Les sessions d'une formation en salle, en visio ou mixte : quand on se
 * retrouve, où, pour combien. C'est la session qui porte les preuves d'un
 * audit — convention, émargement, évaluations — et elle s'accroche à la fiche
 * programme : sans fiche, pas de session.
 */
function Sessions({
  cours: c,
  programme,
  ecrireProgramme,
  occupe,
  creer,
  modifier,
}: {
  cours: CoursComplet;
  programme: Programme | null;
  ecrireProgramme: () => void;
  occupe: boolean;
  creer: (corps: Record<string, unknown>) => Promise<void>;
  modifier: (id: string, corps: Record<string, unknown>) => Promise<void>;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<string | null>(null);

  if (!programme) {
    return (
      <Bloc titre="Les sessions">
        <p className="max-w-[70ch] text-[15px] leading-relaxed" style={{ color: VERT.texte }}>
          Une session est toujours la session d&apos;une fiche programme : c&apos;est elle que reprennent la convention,
          la feuille d&apos;émargement et les évaluations. Cette formation n&apos;en a pas encore.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={ecrireProgramme}
            disabled={occupe}
            className="rounded-xl px-5 py-3 text-base font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: VERT.fonce }}
          >
            Écrire la fiche programme
          </button>
        </div>
      </Bloc>
    );
  }

  const liste = programme.sessions ?? [];
  const maintenant = Date.now();
  const aVenir = liste.filter((s) => new Date(s.endDate ?? s.startDate).getTime() >= maintenant);
  const passees = liste.filter((s) => new Date(s.endDate ?? s.startDate).getTime() < maintenant);
  const lieuParDefaut = c.modalite === 'VIRTUEL' ? c.lienVisio ?? '' : c.lieu ?? '';

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px]" style={{ color: VERT.sourdine }}>
          {liste.length === 0
            ? 'Aucune session programmée.'
            : `${aVenir.length} à venir · ${passees.length} passée${passees.length > 1 ? 's' : ''}.`}
        </p>
        <button
          type="button"
          onClick={() => {
            setEnEdition(null);
            setOuvert((o) => !o);
          }}
          className="rounded-xl px-5 py-3 text-base font-bold text-white disabled:opacity-60"
          style={{ backgroundColor: VERT.fonce }}
        >
          {ouvert ? 'Fermer' : 'Programmer une session'}
        </button>
      </div>

      {ouvert ? (
        <FormulaireSession
          initiale={null}
          lieuParDefaut={lieuParDefaut}
          placesParDefaut={c.placesMax}
          occupe={occupe}
          enVisio={c.modalite === 'VIRTUEL'}
          valider={async (corps) => {
            await creer(corps);
            setOuvert(false);
          }}
          annuler={() => setOuvert(false)}
        />
      ) : null}

      {[
        ['À venir', aVenir],
        ['Déjà passées', passees],
      ].map(([titre, groupe]) =>
        (groupe as SessionProgramme[]).length ? (
          <Bloc key={titre as string} titre={titre as string}>
            <ul className="grid gap-3">
              {(groupe as SessionProgramme[]).map((s) => {
                const annulee = s.status === 'CANCELLED';
                const manque: string[] = [];
                if (!s.endDate) manque.push('la date de fin');
                if (!s.location?.trim()) manque.push(c.modalite === 'VIRTUEL' ? 'le lien de la visio' : 'le lieu');
                return (
                  <li key={s.id} className="rounded-xl border bg-white p-4" style={{ borderColor: VERT.bord }}>
                    {enEdition === s.id ? (
                      <FormulaireSession
                        initiale={s}
                        lieuParDefaut={lieuParDefaut}
                        placesParDefaut={c.placesMax}
                        occupe={occupe}
                        enVisio={c.modalite === 'VIRTUEL'}
                        valider={async (corps) => {
                          await modifier(s.id, corps);
                          setEnEdition(null);
                        }}
                        annuler={() => setEnEdition(null)}
                      />
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
                            style={
                              annulee
                                ? { backgroundColor: '#FDE7EC', color: '#8A1B3D' }
                                : s.status === 'DONE'
                                  ? { backgroundColor: '#EDF3F0', color: VERT.sourdine }
                                  : { backgroundColor: VERT.clair, color: VERT.fonce }
                            }
                          >
                            {NOM_STATUT_SESSION[s.status ?? 'SCHEDULED'] ?? s.status}
                          </span>
                          <span className="text-[14px]" style={{ color: VERT.sourdine }}>
                            {dateLongue(s.startDate)}
                            {s.endDate ? ` → ${dateLongue(s.endDate)}` : ''}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[16px] font-extrabold" style={{ color: VERT.encre }}>
                          {s.title || c.titre}
                        </p>
                        <p className="mt-1 text-[14px]" style={{ color: VERT.texte }}>
                          {s.location ? `${s.location} · ` : ''}
                          {s._count?.inscriptions ?? 0} inscrit{(s._count?.inscriptions ?? 0) > 1 ? 's' : ''}
                          {s.maxSeats ? ` sur ${s.maxSeats} places` : ''}
                        </p>
                        {manque.length && !annulee ? (
                          <p className="mt-2 rounded-lg border border-[#F5D6A8] bg-[#FEF3E2] px-3 py-1.5 text-[13px] text-[#7C3E06]">
                            Il manque {manque.join(' et ')} : une convention se défend mal sans.
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setOuvert(false);
                              setEnEdition(s.id);
                            }}
                            disabled={occupe}
                            className="rounded-lg border-2 bg-white px-3 py-1.5 text-sm font-bold disabled:opacity-60"
                            style={{ borderColor: VERT.bord, color: VERT.encre }}
                          >
                            Modifier
                          </button>
                          {annulee ? (
                            <button
                              type="button"
                              onClick={() => modifier(s.id, { status: 'SCHEDULED' })}
                              disabled={occupe}
                              className="rounded-lg border-2 bg-white px-3 py-1.5 text-sm font-bold disabled:opacity-60"
                              style={{ borderColor: VERT.bord, color: VERT.encre }}
                            >
                              Remettre au calendrier
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => modifier(s.id, { status: 'CANCELLED' })}
                              disabled={occupe}
                              className="rounded-lg border-2 border-[#F3B0C2] bg-white px-3 py-1.5 text-sm font-bold text-[#8A1B3D] disabled:opacity-60"
                            >
                              Annuler la session
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </Bloc>
        ) : null,
      )}
    </div>
  );
}

function FormulaireSession({
  initiale,
  lieuParDefaut,
  placesParDefaut,
  occupe,
  enVisio,
  valider,
  annuler,
}: {
  initiale: SessionProgramme | null;
  lieuParDefaut: string;
  placesParDefaut: number | null;
  occupe: boolean;
  enVisio: boolean;
  valider: (corps: Record<string, unknown>) => Promise<void>;
  annuler: () => void;
}) {
  const [debut, setDebut] = useState(versLocal(initiale?.startDate));
  const [fin, setFin] = useState(versLocal(initiale?.endDate));
  const [lieu, setLieu] = useState(initiale ? initiale.location ?? '' : lieuParDefaut);
  const [places, setPlaces] = useState(initiale ? String(initiale.maxSeats ?? '') : placesParDefaut ? String(placesParDefaut) : '');
  const [nom, setNom] = useState(initiale?.title ?? '');
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer() {
    if (!debut) {
      setErreur('Donne la date de début.');
      return;
    }
    const d = new Date(debut);
    const f = fin ? new Date(fin) : null;
    if (f && f.getTime() < d.getTime()) {
      setErreur('La fin est avant le début.');
      return;
    }
    setErreur(null);
    const p = Number.parseInt(places, 10);
    await valider({
      startDate: d.toISOString(),
      ...(f ? { endDate: f.toISOString() } : {}),
      ...(nom.trim() ? { title: nom.trim().slice(0, 160) } : {}),
      ...(lieu.trim() ? { location: lieu.trim().slice(0, 200) } : {}),
      ...(Number.isFinite(p) && p > 0 ? { maxSeats: p } : {}),
    });
  }

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: VERT.bord, backgroundColor: VERT.clair }}>
      {erreur ? <p className="mb-3 text-[14px] font-bold text-[#8A1B3D]">{erreur}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ libelle="Début">
          <input type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} className={CHAMP} required />
        </Champ>
        <Champ libelle="Fin — une date de fin rend la convention défendable">
          <input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} className={CHAMP} />
        </Champ>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Champ libelle={enVisio ? 'Le lien de la visio' : 'Où'}>
            <input value={lieu} onChange={(e) => setLieu(e.target.value)} className={CHAMP} maxLength={200} placeholder={enVisio ? 'https://…' : 'Adresse de la salle'} />
          </Champ>
        </div>
        <Champ libelle="Places">
          <input type="number" min={1} value={places} onChange={(e) => setPlaces(e.target.value)} className={CHAMP} />
        </Champ>
      </div>
      <div className="mt-3">
        <Champ libelle="Un nom pour cette session — facultatif, sinon c'est le titre de la formation">
          <input value={nom} onChange={(e) => setNom(e.target.value)} className={CHAMP} maxLength={160} />
        </Champ>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={envoyer}
          disabled={occupe}
          className="rounded-xl px-5 py-2.5 text-[15px] font-bold text-white disabled:opacity-60"
          style={{ backgroundColor: VERT.fonce }}
        >
          {initiale ? 'Enregistrer la session' : 'Programmer'}
        </button>
        <button
          type="button"
          onClick={annuler}
          className="rounded-xl border-2 bg-white px-4 py-2.5 text-[15px] font-bold"
          style={{ borderColor: VERT.bord, color: VERT.encre }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

/* ======================================================= LES COMMENTAIRES == */

function Commentaires({
  commentaires,
  actifs,
  occupe,
  modifier,
  supprimer,
}: {
  commentaires: Commentaire[];
  actifs: boolean;
  occupe: boolean;
  modifier: (id: string, corps: Record<string, unknown>) => void;
  supprimer: (id: string) => void;
}) {
  const [brouillons, setBrouillons] = useState<Record<string, string>>({});

  if (!commentaires.length) {
    return (
      <div className="grid gap-4">
        {!actifs ? (
          <p className="rounded-2xl px-5 py-4 text-[15px] font-bold" style={{ backgroundColor: '#FEF3E2', color: '#7C3E06' }}>
            Les commentaires sont fermés sur cette formation. Rouvre-les depuis l&apos;onglet « Paramètres ».
          </p>
        ) : null}
        <p className="rounded-2xl border bg-white px-5 py-6 text-center" style={{ borderColor: VERT.bord, color: VERT.texte }}>
          Personne n&apos;a encore écrit. Les questions posées sous une leçon arrivent ici, et ta réponse s&apos;affiche
          juste en dessous, pour tout le monde.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {commentaires.map((x) => (
        <section
          key={x.id}
          className="rounded-2xl border bg-white p-5"
          style={{ borderColor: VERT.bord, opacity: x.masque ? 0.6 : 1 }}
        >
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[15px] font-extrabold" style={{ color: VERT.encre }}>
              {x.auteur}
            </span>
            <span className="text-sm" style={{ color: VERT.sourdine }}>
              {dateCourte(x.le)}
              {x.lecon ? ` · ${x.lecon.titre}` : ''}
            </span>
            {x.masque ? (
              <span className="rounded-full bg-[#EFEFF4] px-2.5 py-0.5 text-xs font-bold text-[#5A5A6E]">Masqué</span>
            ) : null}
          </div>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: VERT.texte }}>
            {x.message}
          </p>

          {x.reponse ? (
            <div className="mt-3 rounded-xl px-4 py-3" style={{ backgroundColor: VERT.clair }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: VERT.fonce }}>
                Ta réponse · {dateCourte(x.reponduLe)}
              </p>
              <p className="mt-1 whitespace-pre-line text-[15px]" style={{ color: VERT.texte }}>
                {x.reponse}
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <textarea
                rows={2}
                value={brouillons[x.id] ?? ''}
                onChange={(e) => setBrouillons((p) => ({ ...p, [x.id]: e.target.value }))}
                placeholder="Répondre…"
                className={CHAMP}
              />
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {x.reponse ? (
              <button
                type="button"
                onClick={() => modifier(x.id, { reponse: '' })}
                disabled={occupe}
                className="rounded-lg border-2 bg-white px-3 py-1.5 text-sm font-bold disabled:opacity-60"
                style={{ borderColor: VERT.bord, color: VERT.encre }}
              >
                Retirer la réponse
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  modifier(x.id, { reponse: brouillons[x.id] ?? '' });
                  setBrouillons((p) => ({ ...p, [x.id]: '' }));
                }}
                disabled={occupe || !(brouillons[x.id] ?? '').trim()}
                className="rounded-lg px-4 py-1.5 text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: VERT.fonce }}
              >
                Répondre
              </button>
            )}
            <button
              type="button"
              onClick={() => modifier(x.id, { masque: !x.masque })}
              disabled={occupe}
              className="rounded-lg border-2 bg-white px-3 py-1.5 text-sm font-bold disabled:opacity-60"
              style={{ borderColor: VERT.bord, color: VERT.encre }}
            >
              {x.masque ? 'Réafficher' : 'Masquer'}
            </button>
            <button
              type="button"
              onClick={() => supprimer(x.id)}
              disabled={occupe}
              className="rounded-lg border border-[#F3B0C2] px-3 py-1.5 text-sm font-bold text-[#8A1B3D] disabled:opacity-60"
            >
              Supprimer
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}

/* ====================================================== LES STATISTIQUES == */

function StatsFormation({
  cours: c,
  apprenants,
  ventes,
}: {
  cours: CoursComplet;
  apprenants: Apprenant[];
  ventes: Vente[];
}) {
  const nbLecons = c.chapitres.reduce((n, ch) => n + ch.lecons.length, 0);
  const termines = apprenants.filter((a) => a.statut === 'TERMINEE' || a.progression >= 100).length;
  const moyenne = apprenants.length
    ? Math.round(apprenants.reduce((t, a) => t + a.progression, 0) / apprenants.length)
    : 0;
  const payees = ventes.filter((v) => v.statut === 'PAYEE' && v.cours?.id === c.id);
  const caCents = payees.reduce((t, v) => t + (v.montantCents ?? 0), 0);

  const inactifs = apprenants.filter((a) => {
    if (a.progression >= 100) return false;
    if (!a.derniereVisite) return true;
    const d = new Date(a.derniereVisite).getTime();
    return Number.isNaN(d) ? true : Date.now() - d >= 30 * 86400000;
  });

  const tranches = [
    { nom: 'Pas commencé', n: apprenants.filter((a) => a.progression === 0).length },
    { nom: 'Moins de la moitié', n: apprenants.filter((a) => a.progression > 0 && a.progression < 50).length },
    { nom: 'Plus de la moitié', n: apprenants.filter((a) => a.progression >= 50 && a.progression < 100).length },
    { nom: 'Terminé', n: apprenants.filter((a) => a.progression >= 100).length },
  ];
  const plafond = Math.max(1, ...tranches.map((t) => t.n));

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { t: 'Inscrits', v: String(apprenants.length), d: c.placesMax ? `sur ${c.placesMax} places` : 'sans limite de places' },
          { t: 'Terminé la formation', v: String(termines), d: `${nbLecons} leçon${nbLecons > 1 ? 's' : ''} à faire` },
          { t: 'Avancement moyen', v: `${moyenne} %`, d: moyenne >= 50 ? 'la formation avance' : 'à relancer' },
          { t: 'Encaissé', v: euros(caCents), d: `${payees.length} vente${payees.length > 1 ? 's' : ''} payée${payees.length > 1 ? 's' : ''}` },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border bg-white p-5" style={{ borderColor: VERT.bord }}>
            <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: VERT.sourdine }}>
              {x.t}
            </p>
            <p className="mt-1 text-[28px] font-black leading-none" style={{ color: VERT.fonce }}>
              {x.v}
            </p>
            <p className="mt-1 text-[14px]" style={{ color: VERT.sourdine }}>
              {x.d}
            </p>
          </div>
        ))}
      </div>

      <Bloc titre="Où en sont les inscrits">
        {apprenants.length ? (
          <ul className="grid gap-2">
            {tranches.map((t) => (
              <li key={t.nom} className="flex items-center gap-3">
                <span className="w-[170px] shrink-0 text-[15px] font-bold" style={{ color: VERT.texte }}>
                  {t.nom}
                </span>
                <span className="h-3 overflow-hidden rounded-full" style={{ width: `${Math.round((t.n / plafond) * 100)}%`, minWidth: t.n ? 8 : 0, backgroundColor: VERT.plein }} />
                <span className="tabular-nums text-[15px] font-bold" style={{ color: VERT.encre }}>
                  {t.n}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px]" style={{ color: VERT.texte }}>
            Personne n&apos;est encore inscrit : rien à mesurer pour l&apos;instant.
          </p>
        )}
      </Bloc>

      {inactifs.length ? (
        <Bloc titre={`À relancer (${inactifs.length})`}>
          <p className="mb-3 text-[15px]" style={{ color: VERT.texte }}>
            Ces personnes n&apos;ont pas ouvert la formation depuis un mois, et ne l&apos;ont pas terminée.
          </p>
          <ul className="grid gap-2">
            {inactifs.slice(0, 12).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5" style={{ borderColor: VERT.bord }}>
                <span className="min-w-[200px] flex-1 text-[15px] font-bold" style={{ color: VERT.encre }}>
                  {a.nom ?? a.email}
                </span>
                <span className="text-sm" style={{ color: VERT.sourdine }}>
                  {a.progression} % · vu {dateCourte(a.derniereVisite)}
                </span>
                <a
                  href={`mailto:${a.email}`}
                  className="rounded-lg border-2 bg-white px-3 py-1.5 text-sm font-bold no-underline"
                  style={{ borderColor: VERT.bord, color: VERT.encre }}
                >
                  Écrire
                </a>
              </li>
            ))}
          </ul>
        </Bloc>
      ) : null}

      <Bloc titre="Le contenu, chapitre par chapitre">
        <ul className="grid gap-2">
          {c.chapitres.map((ch) => (
            <li key={ch.id} className="flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5" style={{ borderColor: VERT.bord }}>
              <span className="min-w-[200px] flex-1 text-[15px] font-bold" style={{ color: VERT.encre }}>
                {ch.titre}
              </span>
              <span className="text-sm" style={{ color: VERT.sourdine }}>
                {ch.lecons.length} leçon{ch.lecons.length > 1 ? 's' : ''} ·{' '}
                {duree(ch.lecons.reduce((n, l) => n + l.dureeMinutes, 0))}
              </span>
            </li>
          ))}
        </ul>
      </Bloc>
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
  placesMax,
}: {
  apprenants: Apprenant[];
  occupe: boolean;
  inscrire: (email: string, prenom: string, nom: string) => void;
  retirer: (id: string) => void;
  origine: string;
  placesMax?: number | null;
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
          lien personnel : c&apos;est lui qui ouvre la formation. Aucun compte n&apos;est créé à sa place.
        </p>
        {placesMax ? (
          <p className="mt-2 text-[14px] font-bold" style={{ color: apprenants.length >= placesMax ? '#8A1B3D' : VERT.sourdine }}>
            {apprenants.length} inscrit{apprenants.length > 1 ? 's' : ''} sur {placesMax} place{placesMax > 1 ? 's' : ''}
            {apprenants.length >= placesMax ? ' — la formation est complète.' : ''}
          </p>
        ) : null}
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
          Personne n&apos;est encore inscrit à cette formation.
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

/** Une section de réglages : un titre, et ce qu'il y a dessous. */
function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: VERT.bord }}>
      <h2 className="mb-4 text-lg font-extrabold tracking-tight" style={{ color: VERT.encre }}>
        {titre}
      </h2>
      {children}
    </section>
  );
}

/** Une case à cocher qui dit ce qu'elle fait. */
function Interrupteur({
  coche,
  changer,
  titre,
  quoi,
}: {
  coche: boolean;
  changer: (v: boolean) => void;
  titre: string;
  quoi: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border px-4 py-3" style={{ borderColor: VERT.bord }}>
      <input
        type="checkbox"
        checked={coche}
        onChange={(e) => changer(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#0F5F3E]"
      />
      <span>
        <span className="block text-[15px] font-bold" style={{ color: VERT.encre }}>
          {titre}
        </span>
        <span className="block text-[14px]" style={{ color: VERT.sourdine }}>
          {quoi}
        </span>
      </span>
    </label>
  );
}

function Enregistrer({ occupe, onClick, children }: { occupe: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={occupe}
        className="rounded-xl px-6 py-3 text-base font-extrabold text-white disabled:opacity-60"
        style={{ backgroundColor: VERT.fonce }}
      >
        {children}
      </button>
    </div>
  );
}
