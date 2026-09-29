'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { appel } from '../../_client';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CHAMP, Encart, Pastille } from '../../_ui';
import { heure, jourIso, jourLong } from '../../_gestion/outils';
import type { Creneau } from '../../_gestion/types';
import { Bloc, Champ } from './OngletApercu';
import type { ContexteFiche } from './Fiche';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Les jours entre deux dates (incluses) dont le jour de la semaine est coché. */
export function joursEntre(du: string, au: string, semaine: boolean[]): string[] {
  if (!du) return [];
  const fin = au || du;
  const r: string[] = [];
  const d = new Date(`${du}T12:00:00Z`);
  const f = new Date(`${fin}T12:00:00Z`);
  for (let i = 0; d <= f && i < 120; i++) {
    const js = d.getUTCDay(); // 0 = dimanche
    if (semaine[(js + 6) % 7]) r.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return r;
}

export function OngletPlanning({ ctx }: { ctx: ContexteFiche }) {
  const s = ctx.session;
  const [mode, setMode] = useState<'aucun' | 'serie' | 'un'>(s.creneaux.length ? 'aucun' : 'serie');
  const [serie, setSerie] = useState({
    du: jourIso(new Date(s.startDate)),
    au: s.endDate ? jourIso(new Date(s.endDate)) : jourIso(new Date(s.startDate)),
    semaine: [true, true, true, true, true, false, false],
    matin: true,
    matinDebut: '09:00',
    matinFin: '12:30',
    apresMidi: true,
    apresMidiDebut: '13:30',
    apresMidiFin: '17:00',
    formateurId: s.formateurOrganismeId ?? '',
    salleId: s.salleId ?? '',
    distanciel: s.modalite === 'DISTANCIEL',
  });
  const [un, setUn] = useState({ jour: jourIso(new Date(s.startDate)), debut: '09:00', fin: '12:30', formateurId: s.formateurOrganismeId ?? '', salleId: s.salleId ?? '', distanciel: s.modalite === 'DISTANCIEL' });
  const jours = useMemo(() => joursEntre(serie.du, serie.au, serie.semaine), [serie.du, serie.au, serie.semaine]);

  const parJour = useMemo(() => {
    const m = new Map<string, Creneau[]>();
    for (const c of s.creneaux) {
      const k = jourIso(new Date(c.debut));
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return [...m.entries()];
  }, [s.creneaux]);
  const enConflit = new Set(s.conflits.map((c) => c.creneauId));
  const heuresTotal = s.creneaux.reduce((t, c) => t + (new Date(c.fin).getTime() - new Date(c.debut).getTime()) / 3_600_000, 0);

  const ajouterSerie = (e: FormEvent) => {
    e.preventDefault();
    void ctx
      .agir(
        () =>
          appel(`/academie/gestion/sessions/${s.id}/creneaux/serie`, {
            method: 'POST',
            body: {
              jours,
              ...(serie.matin ? { matinDebut: serie.matinDebut, matinFin: serie.matinFin } : {}),
              ...(serie.apresMidi ? { apresMidiDebut: serie.apresMidiDebut, apresMidiFin: serie.apresMidiFin } : {}),
              formateurId: serie.formateurId || null,
              salleId: serie.salleId || null,
              distanciel: serie.distanciel,
            },
          }),
        `${jours.length} jour${jours.length > 1 ? 's' : ''} ajouté${jours.length > 1 ? 's' : ''} au planning. Les dates de la session suivent le planning.`,
      )
      .then((ok) => ok && setMode('aucun'));
  };

  const ajouterUn = (e: FormEvent) => {
    e.preventDefault();
    void ctx
      .agir(
        () =>
          appel(`/academie/gestion/sessions/${s.id}/creneaux/serie`, {
            method: 'POST',
            body: { jours: [un.jour], matinDebut: un.debut, matinFin: un.fin, formateurId: un.formateurId || null, salleId: un.salleId || null, distanciel: un.distanciel },
          }),
        'Créneau ajouté.',
      )
      .then((ok) => ok && setMode('aucun'));
  };

  const choixFormateurSalle = (valeur: { formateurId: string; salleId: string; distanciel: boolean }, maj: (p: Partial<typeof valeur>) => void) => (
    <div className="grid gap-4 sm:grid-cols-3">
      <Champ libelle="Formateur">
        <select className={CHAMP} value={valeur.formateurId} onChange={(e) => maj({ formateurId: e.target.value })}>
          <option value="">Non précisé</option>
          {ctx.formateurs.filter((f) => f.actif).map((f) => (
            <option key={f.id} value={f.id}>
              {f.prenom} {f.nom}
            </option>
          ))}
        </select>
      </Champ>
      <Champ libelle="Salle">
        <select className={CHAMP} value={valeur.salleId} onChange={(e) => maj({ salleId: e.target.value })} disabled={valeur.distanciel}>
          <option value="">Non précisée</option>
          {ctx.salles.filter((x) => x.actif).map((x) => (
            <option key={x.id} value={x.id}>
              {x.nom}
              {x.capacite ? ` (${x.capacite} places)` : ''}
            </option>
          ))}
        </select>
      </Champ>
      <label className="flex items-center gap-3 pt-7 text-[15px]">
        <input type="checkbox" className="h-5 w-5 accent-[#1E9E6A]" checked={valeur.distanciel} onChange={(e) => maj({ distanciel: e.target.checked })} />
        À distance
      </label>
    </div>
  );

  return (
    <>
      {s.conflits.length ? (
        <div className="mb-5">
          <Encart ton="alerte">
            <p className="font-extrabold">Conflits de planning</p>
            <ul className="mt-1 list-disc pl-5">
              {s.conflits.map((c, i) => (
                <li key={i}>
                  {c.quoi === 'formateur' ? `Le formateur ${c.nom}` : `La salle ${c.nom}`} est aussi pris{c.quoi === 'salle' ? 'e' : ''} par « {c.avec} », {jourLong(c.debut)} de {heure(c.debut)} à {heure(c.fin)}.
                </li>
              ))}
            </ul>
          </Encart>
        </div>
      ) : null}

      <Bloc
        titre={`Planning : ${s.creneaux.length} créneau${s.creneaux.length > 1 ? 'x' : ''}, ${String(Math.round(heuresTotal * 100) / 100).replace('.', ',')} h`}
        aide="Chaque créneau devient une demi-journée à émarger. Les heures réalisées des stagiaires se calculent sur ce planning."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" className={mode === 'serie' ? BTN_PRIMAIRE : BTN_SECONDAIRE} onClick={() => setMode(mode === 'serie' ? 'aucun' : 'serie')}>
            Ajouter plusieurs jours
          </button>
          <button type="button" className={mode === 'un' ? BTN_PRIMAIRE : BTN_SECONDAIRE} onClick={() => setMode(mode === 'un' ? 'aucun' : 'un')}>
            Ajouter un créneau
          </button>
        </div>

        {mode === 'serie' ? (
          <form onSubmit={ajouterSerie} className="mb-6 space-y-4 rounded-2xl border border-[#DDEBE4] bg-[#F7FBF9] p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Champ libelle="Du">
                <input type="date" className={CHAMP} value={serie.du} onChange={(e) => setSerie((x) => ({ ...x, du: e.target.value }))} required />
              </Champ>
              <Champ libelle="Au">
                <input type="date" className={CHAMP} value={serie.au} min={serie.du} onChange={(e) => setSerie((x) => ({ ...x, au: e.target.value }))} />
              </Champ>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-bold text-[#12312A]">Les jours de la semaine</legend>
              <div className="flex flex-wrap gap-2">
                {JOURS.map((j, i) => (
                  <label key={j} className={`cursor-pointer rounded-lg border-2 px-3 py-1.5 text-sm font-bold ${serie.semaine[i] ? 'border-[#1E9E6A] bg-[#E3F5EC] text-[#0F5F3E]' : 'border-[#CFE4D9] bg-white text-[#5E7A6E]'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={serie.semaine[i]}
                      onChange={(e) => setSerie((x) => ({ ...x, semaine: x.semaine.map((v, k) => (k === i ? e.target.checked : v)) }))}
                    />
                    {j}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="rounded-xl border border-[#DDEBE4] bg-white p-3">
                <label className="flex items-center gap-2 text-sm font-bold text-[#12312A]">
                  <input type="checkbox" className="h-5 w-5 accent-[#1E9E6A]" checked={serie.matin} onChange={(e) => setSerie((x) => ({ ...x, matin: e.target.checked }))} />
                  Le matin
                </label>
                {serie.matin ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input type="time" className={CHAMP} value={serie.matinDebut} onChange={(e) => setSerie((x) => ({ ...x, matinDebut: e.target.value }))} aria-label="Début du matin" />
                    <span>à</span>
                    <input type="time" className={CHAMP} value={serie.matinFin} onChange={(e) => setSerie((x) => ({ ...x, matinFin: e.target.value }))} aria-label="Fin du matin" />
                  </div>
                ) : null}
              </fieldset>
              <fieldset className="rounded-xl border border-[#DDEBE4] bg-white p-3">
                <label className="flex items-center gap-2 text-sm font-bold text-[#12312A]">
                  <input type="checkbox" className="h-5 w-5 accent-[#1E9E6A]" checked={serie.apresMidi} onChange={(e) => setSerie((x) => ({ ...x, apresMidi: e.target.checked }))} />
                  L&apos;après-midi
                </label>
                {serie.apresMidi ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input type="time" className={CHAMP} value={serie.apresMidiDebut} onChange={(e) => setSerie((x) => ({ ...x, apresMidiDebut: e.target.value }))} aria-label="Début de l'après-midi" />
                    <span>à</span>
                    <input type="time" className={CHAMP} value={serie.apresMidiFin} onChange={(e) => setSerie((x) => ({ ...x, apresMidiFin: e.target.value }))} aria-label="Fin de l'après-midi" />
                  </div>
                ) : null}
              </fieldset>
            </div>
            {choixFormateurSalle(serie, (p) => setSerie((x) => ({ ...x, ...p })))}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={ctx.occupe || !jours.length} className={BTN_PRIMAIRE}>
                Ajouter {jours.length} jour{jours.length > 1 ? 's' : ''}
              </button>
              <span className="text-sm text-[#5E7A6E]">Heure de Paris.</span>
            </div>
          </form>
        ) : null}

        {mode === 'un' ? (
          <form onSubmit={ajouterUn} className="mb-6 space-y-4 rounded-2xl border border-[#DDEBE4] bg-[#F7FBF9] p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Champ libelle="Jour">
                <input type="date" className={CHAMP} value={un.jour} onChange={(e) => setUn((x) => ({ ...x, jour: e.target.value }))} required />
              </Champ>
              <Champ libelle="De">
                <input type="time" className={CHAMP} value={un.debut} onChange={(e) => setUn((x) => ({ ...x, debut: e.target.value }))} required />
              </Champ>
              <Champ libelle="À">
                <input type="time" className={CHAMP} value={un.fin} onChange={(e) => setUn((x) => ({ ...x, fin: e.target.value }))} required />
              </Champ>
            </div>
            {choixFormateurSalle(un, (p) => setUn((x) => ({ ...x, ...p })))}
            <button type="submit" disabled={ctx.occupe} className={BTN_PRIMAIRE}>
              Ajouter le créneau
            </button>
          </form>
        ) : null}

        {!s.creneaux.length ? (
          <Encart ton="attention">Aucun créneau. Sans planning, les heures réalisées ne peuvent être qu&apos;estimées, et la convocation ne dit pas les horaires.</Encart>
        ) : (
          <ul className="grid gap-3">
            {parJour.map(([jour, liste]) => (
              <li key={jour} className="rounded-2xl border border-[#DDEBE4] bg-white p-4">
                <p className="mb-2 text-[15px] font-extrabold capitalize text-[#12312A]">{jourLong(liste[0].debut)}</p>
                <ul className="grid gap-2">
                  {liste.map((c) => (
                    <li key={c.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2 ${enConflit.has(c.id) ? 'bg-[#FDE7EC]' : 'bg-[#F7FBF9]'}`}>
                      <span className="font-bold tabular-nums text-[#12312A]">
                        {heure(c.debut)} à {heure(c.fin)}
                      </span>
                      <span className="text-[14px] text-[#334A42]">{c.formateur ? `${c.formateur.prenom} ${c.formateur.nom}` : 'Formateur à préciser'}</span>
                      <span className="text-[14px] text-[#334A42]">{c.distanciel ? 'À distance' : c.salle?.nom ?? 'Salle à préciser'}</span>
                      {enConflit.has(c.id) ? <Pastille ton="alerte">Conflit</Pastille> : null}
                      <button
                        type="button"
                        className={`${BTN_DISCRET} ml-auto`}
                        disabled={ctx.occupe}
                        onClick={() => {
                          if (!window.confirm('Retirer ce créneau du planning ?')) return;
                          void ctx.agir(() => appel(`/academie/gestion/sessions/${s.id}/creneaux/${c.id}`, { method: 'DELETE' }), 'Créneau retiré.');
                        }}
                      >
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Bloc>
    </>
  );
}
