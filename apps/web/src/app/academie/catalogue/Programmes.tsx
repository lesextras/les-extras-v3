'use client';

import { useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart } from '../_ui';

/**
 * LE CATALOGUE — LES FICHES PROGRAMME.
 *
 * L'indicateur 1 du référentiel demande, pour CHAQUE formation publiée : des
 * objectifs évaluables, le public visé, les prérequis, la durée et les
 * modalités. C'est le premier point regardé en audit, et le plus souvent
 * incomplet. Le formulaire pose donc ces cinq questions dans cet ordre, et
 * l'écran signale les fiches auxquelles il manque quelque chose.
 */

export interface Programme {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  summary?: string | null;
  objectives?: string | null;
  prerequisites?: string | null;
  targetAudience?: string | null;
  program?: string | null;
  durationHours?: number | null;
  certifying?: boolean;
  certificationName?: string | null;
  cpfEligible?: boolean;
  _count?: { sessions: number };
}

const NOM_STATUT: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publiée',
  ARCHIVED: 'Archivée',
};

const TEINTE_STATUT: Record<string, string> = {
  DRAFT: 'bg-[#FEF3E2] text-[#7C3E06]',
  PUBLISHED: 'bg-[#E3F5EC] text-[#0F5F3E]',
  ARCHIVED: 'bg-[#F2F7F5] text-[#5E7A6E]',
};

/** Les cinq mentions que l'indicateur 1 exige sur une fiche programme. */
function manques(p: Programme) {
  const m: string[] = [];
  if (!p.objectives?.trim()) m.push('les objectifs');
  if (!p.targetAudience?.trim()) m.push('le public visé');
  if (!p.prerequisites?.trim()) m.push('les prérequis');
  if (!p.durationHours) m.push('la durée');
  if (!p.program?.trim()) m.push('le déroulé');
  return m;
}

export function Programmes({ initiaux }: { initiaux: Programme[] }) {
  const [liste, setListe] = useState(initiaux);
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [objectives, setObjectives] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [program, setProgram] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [certifying, setCertifying] = useState(false);
  const [certificationName, setCertificationName] = useState('');

  const incompletes = liste.filter((p) => manques(p).length).length;

  async function creer(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      setErreur('Donne un titre à la formation (au moins trois lettres).');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const heures = Number.parseInt(durationHours, 10);
      const creee = await appel<Programme>('/formations', {
        method: 'POST',
        body: {
          title: title.trim(),
          ...(summary.trim() ? { summary: summary.trim() } : {}),
          ...(objectives.trim() ? { objectives: objectives.trim() } : {}),
          ...(targetAudience.trim() ? { targetAudience: targetAudience.trim() } : {}),
          ...(prerequisites.trim() ? { prerequisites: prerequisites.trim() } : {}),
          ...(program.trim() ? { program: program.trim() } : {}),
          ...(Number.isFinite(heures) && heures > 0 ? { durationHours: heures } : {}),
          certifying,
          ...(certifying && certificationName.trim() ? { certificationName: certificationName.trim() } : {}),
        },
      });
      setListe((l) => [creee, ...l]);
      setTitle('');
      setSummary('');
      setObjectives('');
      setTargetAudience('');
      setPrerequisites('');
      setProgram('');
      setDurationHours('');
      setCertifying(false);
      setCertificationName('');
      setOuvert(false);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La formation n'a pas pu être créée.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        {liste.length === 0 ? (
          <Encart ton="info">
            Le catalogue est vide. Une fiche programme complète est le premier document qu&apos;un auditeur demande, et
            celui qu&apos;un financeur lit avant de dire oui. Commence par une seule, celle que tu vends déjà.
          </Encart>
        ) : incompletes ? (
          <Encart ton="attention">
            {incompletes} fiche{incompletes > 1 ? 's' : ''} incomplète{incompletes > 1 ? 's' : ''} au regard de
            l&apos;indicateur 1 : objectifs, public, prérequis, durée et déroulé sont attendus sur chacune.
          </Encart>
        ) : (
          <Encart ton="ok">Toutes tes fiches portent les cinq mentions attendues par l&apos;indicateur 1.</Encart>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-bold text-[#334A42]">
          {liste.length} formation{liste.length > 1 ? 's' : ''} · {liste.filter((p) => p.status === 'PUBLISHED').length} publiée
          {liste.filter((p) => p.status === 'PUBLISHED').length > 1 ? 's' : ''}
        </p>
        <button type="button" onClick={() => setOuvert((o) => !o)} className={BTN_PRIMAIRE}>
          {ouvert ? 'Fermer' : 'Écrire une fiche programme'}
        </button>
      </div>

      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {ouvert ? (
        <form onSubmit={creer} className={`${CARTE} mb-6 space-y-4 p-5 sm:p-6`}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Le titre de la formation</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={160} required className={CHAMP} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">En une phrase</span>
            <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={400} placeholder="Ce que la personne saura faire à la fin." className={CHAMP} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">
              Les objectifs <span className="font-normal text-[#5E7A6E]">· indicateur 1 : ils doivent être évaluables</span>
            </span>
            <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={3} placeholder="« À l'issue, le participant sait rédiger… », « … sait paramétrer… »" className={CHAMP} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Le public visé</span>
              <textarea value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} rows={2} maxLength={200} placeholder="Qui vient à cette formation." className={CHAMP} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Les prérequis</span>
              <textarea value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} rows={2} placeholder="« Aucun » est une réponse valable, mais il faut l'écrire." className={CHAMP} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Le déroulé</span>
            <textarea value={program} onChange={(e) => setProgram(e.target.value)} rows={4} placeholder="Les séquences, dans l'ordre, avec les modalités (présentiel, distanciel, mixte)." className={CHAMP} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">La durée, en heures</span>
              <input type="number" min={1} value={durationHours} onChange={(e) => setDurationHours(e.target.value)} className={CHAMP} />
            </label>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-sm font-bold text-[#12312A]">
                <input type="checkbox" checked={certifying} onChange={(e) => setCertifying(e.target.checked)} className="h-4 w-4" />
                Cette formation est certifiante
              </label>
              {certifying ? (
                <input
                  type="text"
                  value={certificationName}
                  onChange={(e) => setCertificationName(e.target.value)}
                  maxLength={160}
                  placeholder="Le nom de la certification visée"
                  className={CHAMP}
                />
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
              {enCours ? 'Création…' : 'Créer la fiche'}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className={BTN_SECONDAIRE}>
              Annuler
            </button>
          </div>
          <p className="text-[13px] leading-relaxed text-[#5E7A6E]">
            La fiche naît en brouillon. Tu la complètes et la publies quand elle est prête : une fiche publiée est
            visible et opposable.
          </p>
        </form>
      ) : null}

      {liste.length ? (
        <ul className="space-y-3">
          {liste.map((p) => {
            const m = manques(p);
            return (
              <li key={p.id} className={`${CARTE} p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[12px] font-extrabold ${TEINTE_STATUT[p.status] ?? TEINTE_STATUT.DRAFT}`}>
                        {NOM_STATUT[p.status] ?? p.status}
                      </span>
                      {p.durationHours ? <span className="text-[13px] text-[#5E7A6E]">{p.durationHours} h</span> : null}
                      {p._count?.sessions ? (
                        <span className="text-[13px] text-[#5E7A6E]">· {p._count.sessions} session{p._count.sessions > 1 ? 's' : ''}</span>
                      ) : null}
                      {p.certifying ? (
                        <span className="rounded-full bg-[#ECEBFC] px-2.5 py-1 text-[12px] font-extrabold text-[#4338CA]">Certifiante</span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[17px] font-extrabold leading-snug text-[#12312A]">{p.title}</p>
                    {p.summary ? <p className="mt-1 max-w-[75ch] text-[15px] leading-relaxed text-[#334A42]">{p.summary}</p> : null}
                  </div>
                </div>

                {m.length ? (
                  <p className="mt-3 rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-3 py-2 text-[14px] text-[#7C3E06]">
                    Il manque {m.join(', ')} pour que la fiche tienne devant l&apos;indicateur 1.
                  </p>
                ) : (
                  <p className="mt-3 rounded-xl border border-[#B7E4CE] bg-[#E3F5EC] px-3 py-2 text-[14px] text-[#0F5F3E]">
                    Fiche complète : objectifs, public, prérequis, durée et déroulé y sont.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}
