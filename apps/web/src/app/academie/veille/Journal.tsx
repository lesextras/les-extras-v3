'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille, formaterDate } from '../_ui';
import { LIBELLES_VEILLE, type TypeVeille } from '../_types';

/**
 * LE JOURNAL DE VEILLE — critère 6 du référentiel national qualité.
 *
 * Ce que l'auditeur regarde n'est pas la liste des articles lus : c'est la
 * colonne « ce que ça change chez nous ». Une veille sans conséquence écrite
 * est un des deux motifs de non-conformité les plus fréquents. Le formulaire
 * la demande donc à chaque entrée, et l'écran signale celles qui n'en ont pas.
 */

export interface Entree {
  id: string;
  type: TypeVeille;
  date: string;
  titre: string;
  source: string | null;
  lien: string | null;
  resume: string | null;
  consequence: string | null;
}

const TYPES: TypeVeille[] = ['LEGALE', 'METIER', 'HANDICAP', 'INNOVATION', 'EMPLOI'];

/** Une teinte par type : on retrouve d'un coup d'œil ce qui manque. */
const TEINTES: Record<TypeVeille, { pastille: string; fond: string; encre: string }> = {
  LEGALE: { pastille: 'bg-[#4F46E5]', fond: 'bg-[#ECEBFC]', encre: 'text-[#4338CA]' },
  METIER: { pastille: 'bg-[#1E9E6A]', fond: 'bg-[#E3F5EC]', encre: 'text-[#0F5F3E]' },
  HANDICAP: { pastille: 'bg-[#C42B57]', fond: 'bg-[#FDE7EC]', encre: 'text-[#8A1B3D]' },
  INNOVATION: { pastille: 'bg-[#F5B400]', fond: 'bg-[#FEF3E2]', encre: 'text-[#7C3E06]' },
  EMPLOI: { pastille: 'bg-[#0F5F3E]', fond: 'bg-[#E3F5EC]', encre: 'text-[#0F5F3E]' },
};

/** Ce qu'on attend de chaque type, en une phrase — pour ne pas remplir au hasard. */
const ATTENDU: Record<TypeVeille, string> = {
  LEGALE: "Ce qui change dans la loi et la réglementation de la formation : décrets, Qualiopi, financements.",
  METIER: "Ce qui bouge dans ton domaine d'expertise : pratiques, outils, référentiels, certifications.",
  HANDICAP: "Ce qui aide à accueillir un apprenant en situation de handicap : ressources, aides, adaptations.",
  INNOVATION: "Les façons d'enseigner qui apparaissent : formats, outils, évaluation.",
  EMPLOI: "Ce que devient l'emploi sur tes métiers : tensions, compétences demandées, débouchés.",
};

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function Journal({ entrees: initiales }: { entrees: Entree[] }) {
  const [entrees, setEntrees] = useState(initiales);
  const [filtre, setFiltre] = useState<TypeVeille | 'TOUT'>('TOUT');
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [type, setType] = useState<TypeVeille>('LEGALE');
  const [date, setDate] = useState(aujourdhui());
  const [titre, setTitre] = useState('');
  const [source, setSource] = useState('');
  const [lien, setLien] = useState('');
  const [resume, setResume] = useState('');
  const [consequence, setConsequence] = useState('');

  const visibles = useMemo(
    () => (filtre === 'TOUT' ? entrees : entrees.filter((e) => e.type === filtre)),
    [entrees, filtre],
  );

  /** Les types jamais alimentés : c'est là que l'audit accroche. */
  const manquants = TYPES.filter((t) => !entrees.some((e) => e.type === t));
  const sansConsequence = entrees.filter((e) => !e.consequence?.trim()).length;

  function vider() {
    setType('LEGALE');
    setDate(aujourdhui());
    setTitre('');
    setSource('');
    setLien('');
    setResume('');
    setConsequence('');
  }

  async function ajouter(e: FormEvent) {
    e.preventDefault();
    if (titre.trim().length < 2) {
      setErreur('Donne un titre à cette entrée.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const creee = await appel<Entree>('/academie/veille', {
        method: 'POST',
        body: {
          type,
          date,
          titre: titre.trim(),
          ...(source.trim() ? { source: source.trim() } : {}),
          ...(lien.trim() ? { lien: lien.trim() } : {}),
          ...(resume.trim() ? { resume: resume.trim() } : {}),
          ...(consequence.trim() ? { consequence: consequence.trim() } : {}),
        },
      });
      setEntrees((l) => [creee, ...l]);
      vider();
      setOuvert(false);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'entrée n'a pas pu être ajoutée.");
    } finally {
      setEnCours(false);
    }
  }

  async function noterConsequence(id: string, texte: string) {
    const propre = texte.trim();
    if (!propre) return;
    try {
      const maj = await appel<Entree>(`/academie/veille/${id}`, { method: 'PATCH', body: { consequence: propre } });
      setEntrees((l) => l.map((e) => (e.id === id ? maj : e)));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La conséquence n'a pas pu être enregistrée.");
    }
  }

  async function supprimer(id: string) {
    try {
      await appel(`/academie/veille/${id}`, { method: 'DELETE' });
      setEntrees((l) => l.filter((e) => e.id !== id));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'entrée n'a pas pu être retirée.");
    }
  }

  return (
    <>
      {/* ------------------------------------------------------ ce qui manque */}
      {manquants.length ? (
        <div className="mb-6">
          <Encart ton="attention">
            <span className="font-extrabold">Aucune entrée</span> en{' '}
            {manquants.map((t) => LIBELLES_VEILLE[t].toLowerCase()).join(', ')}. L&apos;auditeur attend les cinq types :
            une veille absente vaut non-conformité.
          </Encart>
        </div>
      ) : sansConsequence ? (
        <div className="mb-6">
          <Encart ton="attention">
            {sansConsequence} entrée{sansConsequence > 1 ? 's' : ''} sans conséquence écrite. C&apos;est cette colonne
            que l&apos;auditeur lit en premier : dis en une phrase ce que ça a changé chez toi.
          </Encart>
        </div>
      ) : entrees.length ? (
        <div className="mb-6">
          <Encart ton="ok">Les cinq veilles sont alimentées et chaque entrée dit ce qu&apos;elle a changé. Rien à rattraper.</Encart>
        </div>
      ) : null}

      {/* -------------------------------------------------------- les filtres */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltre('TOUT')}
          className={`rounded-full border-2 px-3.5 py-1.5 text-[14px] font-bold transition ${
            filtre === 'TOUT' ? 'border-[#0F5F3E] bg-[#0F5F3E] text-white' : 'border-[#DDEBE4] bg-white text-[#334A42] hover:border-[#1E9E6A]'
          }`}
        >
          Tout ({entrees.length})
        </button>
        {TYPES.map((t) => {
          const n = entrees.filter((e) => e.type === t).length;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setFiltre(t)}
              className={`rounded-full border-2 px-3.5 py-1.5 text-[14px] font-bold transition ${
                filtre === t
                  ? 'border-[#0F5F3E] bg-[#0F5F3E] text-white'
                  : n === 0
                    ? 'border-[#F5D6A8] bg-[#FEF3E2] text-[#7C3E06]'
                    : 'border-[#DDEBE4] bg-white text-[#334A42] hover:border-[#1E9E6A]'
              }`}
            >
              {LIBELLES_VEILLE[t]} ({n})
            </button>
          );
        })}
        <button type="button" onClick={() => setOuvert((o) => !o)} className={`${BTN_PRIMAIRE} ml-auto`}>
          {ouvert ? 'Fermer' : 'Noter une veille'}
        </button>
      </div>

      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {/* ------------------------------------------------------ le formulaire */}
      {ouvert ? (
        <form onSubmit={ajouter} className={`${CARTE} mb-6 space-y-4 p-5 sm:p-6`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Quel type de veille</span>
              <select value={type} onChange={(e) => setType(e.target.value as TypeVeille)} className={CHAMP}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LIBELLES_VEILLE[t]}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs leading-relaxed text-[#5E7A6E]">{ATTENDU[type]}</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Le jour où tu l&apos;as lue</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={CHAMP} required />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">De quoi il s&apos;agit</span>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              maxLength={200}
              required
              placeholder="Le titre de l'article, du décret, de la note"
              className={CHAMP}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">La source</span>
              <input type="text" value={source} onChange={(e) => setSource(e.target.value)} maxLength={200} placeholder="Légifrance, Centre Inffo, un OPCO…" className={CHAMP} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Le lien</span>
              <input type="url" value={lien} onChange={(e) => setLien(e.target.value)} maxLength={500} placeholder="https://…" className={CHAMP} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Ce que ça dit</span>
            <textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={3} maxLength={4000} placeholder="Deux ou trois lignes suffisent." className={CHAMP} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">
              Ce que ça change chez nous <span className="font-normal text-[#5E7A6E]">· la ligne que l&apos;auditeur lit</span>
            </span>
            <textarea
              value={consequence}
              onChange={(e) => setConsequence(e.target.value)}
              rows={2}
              maxLength={4000}
              placeholder="« On a ajouté la mention au programme », « rien à changer », « à revoir à la prochaine session »…"
              className={CHAMP}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
              {enCours ? 'Enregistrement…' : 'Noter cette veille'}
            </button>
            <button type="button" onClick={() => { vider(); setOuvert(false); }} className={BTN_SECONDAIRE}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      {/* ---------------------------------------------------------- le journal */}
      {visibles.length ? (
        <ul className="space-y-3">
          {visibles.map((e) => (
            <li key={e.id} className={`${CARTE} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-extrabold ${TEINTES[e.type].fond} ${TEINTES[e.type].encre}`}>
                      {LIBELLES_VEILLE[e.type]}
                    </span>
                    <span className="text-[13px] text-[#5E7A6E]">{formaterDate(e.date)}</span>
                    {e.source ? <span className="text-[13px] text-[#5E7A6E]">· {e.source}</span> : null}
                  </div>
                  <p className="mt-1.5 text-[17px] font-extrabold leading-snug text-[#12312A]">{e.titre}</p>
                  {e.resume ? <p className="mt-1 max-w-[75ch] text-[15px] leading-relaxed text-[#334A42]">{e.resume}</p> : null}
                  {e.lien ? (
                    <a href={e.lien} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-[14px] font-bold text-[#0F5F3E] underline underline-offset-4">
                      Ouvrir la source ↗
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => supprimer(e.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-bold text-[#8A1B3D] hover:bg-[#FDE7EC]"
                >
                  Retirer
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-[#DDEBE4] bg-[#F2F7F5] p-3">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">Ce que ça change chez nous</p>
                {e.consequence ? (
                  <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">{e.consequence}</p>
                ) : (
                  <ChampConsequence onValider={(t) => noterConsequence(e.id, t)} />
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={`${CARTE} p-8 text-center`}>
          <p className="text-[15px] text-[#334A42]">
            {entrees.length
              ? 'Aucune entrée de ce type pour le moment.'
              : "Le journal est vide. Une entrée par trimestre et par type suffit à tenir le critère 6, ce n'est pas une revue de presse."}
          </p>
        </div>
      )}
    </>
  );
}

/** Le champ qui apparaît quand la conséquence manque : on la note sans quitter la page. */
function ChampConsequence({ onValider }: { onValider: (texte: string) => void }) {
  const [texte, setTexte] = useState('');
  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="En une phrase : ce que vous avez changé, ou pourquoi rien ne change."
        className={`flex-1 ${CHAMP}`}
      />
      <button type="button" onClick={() => onValider(texte)} disabled={!texte.trim()} className={BTN_SECONDAIRE}>
        Noter
      </button>
    </div>
  );
}
