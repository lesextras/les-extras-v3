'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { SignatureTrace } from '../../_shared/pilote/SignatureTrace';

export interface Espace {
  stagiaire: { nom: string | null; email: string | null; annulee: boolean };
  organisme: { nom: string; couleur: string | null; courriel?: string | null; telephone?: string | null; referentHandicap?: string | null; referentPedagogique?: string | null; reglementInterieurUrl?: string | null };
  session: {
    intitule: string;
    debut: string;
    fin: string | null;
    lieu: string | null;
    modalite: 'PRESENTIEL' | 'DISTANCIEL' | 'MIXTE';
    dureeHeures: number | null;
    infosPratiques: string | null;
    formateurs: string[];
    creneaux: { debut: string; fin: string; distanciel: boolean; salle: string | null; formateur: string | null }[];
    objectifs: string[];
    prerequis: string | null;
    terminee: boolean;
  };
  emargement: {
    seanceOuverte: boolean;
    slot: { date: string; moment: 'MORNING' | 'AFTERNOON' } | null;
    dejaSigne: boolean;
    signatures: { date: string; moment: string; signe: boolean }[];
    heuresRealisees: number;
  };
  documents: { convocation: boolean; programme: boolean; attestation: boolean; certificatRealisation: boolean };
  evaluations: { chaud: { ouverte: boolean; faite: boolean }; froid: { ouverte: boolean; ouvreLe: string; faite: boolean } };
  positionnement: { objectifs: string[]; entree: { ouvert: boolean; fait: boolean }; sortie: { ouvert: boolean; fait: boolean } };
}

const VERT = '#0F5F3E';
const champ = 'w-full rounded-xl border border-[#CFE4D9] bg-white px-4 py-3 text-base text-[#12312A] focus:border-[#1E9E6A] focus:outline-none focus:ring-4 focus:ring-[#E3F5EC]';
const bouton = 'inline-flex items-center justify-center rounded-xl px-5 py-3 text-base font-bold text-white shadow-sm disabled:opacity-60';
const jour = (d: string) => new Date(d).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' });
const heure = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
const MOMENT = { MORNING: 'matin', AFTERNOON: 'après-midi' } as const;

async function poster(url: string, corps: unknown): Promise<void> {
  const r = await fetch(`/api/proxy${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(corps) });
  if (!r.ok) {
    let m = "L'envoi n'a pas abouti. Réessayez dans un instant.";
    try {
      const j = (await r.json()) as { message?: string | string[] };
      const t = Array.isArray(j.message) ? j.message.join(' · ') : j.message;
      if (t && !/^(Bad Request|Not Found|Forbidden|ThrottlerException.*)$/.test(t)) m = t;
      if (r.status === 429) m = 'Trop de tentatives : patientez quelques minutes.';
    } catch {
      /* rien */
    }
    throw new Error(m);
  }
}

function Carte({ titre, id, children }: { titre: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 rounded-3xl border border-[#DDEBE4] bg-white p-5 shadow-[0_1px_2px_rgba(15,95,62,0.05)] sm:p-7">
      <h2 className="mb-4 text-[21px] font-extrabold tracking-tight text-[#12312A]">{titre}</h2>
      {children}
    </section>
  );
}

function Etoiles({ valeur, changer, libelle }: { valeur: number; changer: (n: number) => void; libelle: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[15px] font-bold text-[#12312A]">{libelle}</legend>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-2 text-lg font-extrabold ${valeur === n ? 'border-[#1E9E6A] bg-[#E3F5EC] text-[#0F5F3E]' : 'border-[#CFE4D9] text-[#5E7A6E]'}`}>
            <input type="radio" className="sr-only" name={libelle} checked={valeur === n} onChange={() => changer(n)} />
            {n}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function EspaceStagiaire({ jeton, initial }: { jeton: string; initial: Espace }) {
  const [e, setE] = useState(initial);
  const couleur = e.organisme.couleur || VERT;
  const base = `/public/academie/stagiaire/${encodeURIComponent(jeton)}`;
  const recharger = async () => {
    const r = await fetch(`/api/proxy${base}`, { headers: { Accept: 'application/json' } });
    if (r.ok) setE((await r.json()) as Espace);
  };

  /* --------------------------------------------------------------- émargement */
  const [code, setCode] = useState('');
  const [trace, setTrace] = useState<string | null>(null);
  const [etatSignature, setEtatSignature] = useState<{ ok?: string; erreur?: string; occupe?: boolean }>({});
  const signer = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!trace) return setEtatSignature({ erreur: 'Signez dans le cadre avant de valider.' });
    setEtatSignature({ occupe: true });
    try {
      await poster(`${base}/emargement`, { code: code.replace(/\D/g, ''), trace });
      setEtatSignature({ ok: 'Votre présence est signée. Merci !' });
      setCode('');
      setTrace(null);
      await recharger();
    } catch (err) {
      setEtatSignature({ erreur: (err as Error).message });
    }
  };

  /* --------------------------------------------------------------- évaluations */
  const typeEval: 'chaud' | 'froid' | null = e.evaluations.froid.ouverte && !e.evaluations.froid.faite ? 'froid' : e.evaluations.chaud.ouverte && !e.evaluations.chaud.faite ? 'chaud' : null;
  const [ev, setEv] = useState({ note: 0, objectifs: 0, pedagogie: 0, organisation: 0, recommande: '' as '' | 'oui' | 'non', miseEnOeuvre: '' as '' | 'OUI' | 'PARTIELLEMENT' | 'NON', commentaire: '' });
  const [etatEval, setEtatEval] = useState<{ ok?: string; erreur?: string; occupe?: boolean }>({});
  const evaluer = async (x: FormEvent) => {
    x.preventDefault();
    if (!typeEval) return;
    if (!ev.note) return setEtatEval({ erreur: 'Donnez au moins votre note générale.' });
    setEtatEval({ occupe: true });
    try {
      await poster(`${base}/evaluation`, {
        type: typeEval,
        note: ev.note,
        ...(typeEval === 'chaud' && ev.objectifs ? { objectifs: ev.objectifs } : {}),
        ...(typeEval === 'chaud' && ev.pedagogie ? { pedagogie: ev.pedagogie } : {}),
        ...(typeEval === 'chaud' && ev.organisation ? { organisation: ev.organisation } : {}),
        ...(typeEval === 'chaud' && ev.recommande ? { recommande: ev.recommande === 'oui' } : {}),
        ...(typeEval === 'froid' && ev.miseEnOeuvre ? { miseEnOeuvre: ev.miseEnOeuvre } : {}),
        ...(ev.commentaire.trim() ? { commentaire: ev.commentaire.trim() } : {}),
      });
      setEtatEval({ ok: 'Merci : votre avis est enregistré.' });
      await recharger();
    } catch (err) {
      setEtatEval({ erreur: (err as Error).message });
    }
  };

  /* --------------------------------------------------------------- positionnement */
  const momentPos: 'entree' | 'sortie' | null =
    e.positionnement.objectifs.length && e.positionnement.entree.ouvert && !e.positionnement.entree.fait
      ? 'entree'
      : e.positionnement.objectifs.length && e.positionnement.sortie.ouvert && !e.positionnement.sortie.fait && e.session.terminee
        ? 'sortie'
        : null;
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [etatPos, setEtatPos] = useState<{ ok?: string; erreur?: string; occupe?: boolean }>({});
  const positionner = async (x: FormEvent) => {
    x.preventDefault();
    if (!momentPos) return;
    if (Object.keys(notes).length < e.positionnement.objectifs.length) return setEtatPos({ erreur: 'Répondez pour chaque objectif.' });
    setEtatPos({ occupe: true });
    try {
      await poster(`${base}/positionnement`, { moment: momentPos, notes });
      setEtatPos({ ok: 'Enregistré, merci.' });
      setNotes({});
      await recharger();
    } catch (err) {
      setEtatPos({ erreur: (err as Error).message });
    }
  };

  const s = e.session;
  const periode = s.fin && new Date(s.fin).toDateString() !== new Date(s.debut).toDateString() ? `Du ${jour(s.debut)} au ${jour(s.fin)}` : `Le ${jour(s.debut)}`;

  return (
    <main className="min-h-screen bg-[#F2F7F5] px-4 py-8 text-[#334A42] sm:py-12" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="mx-auto grid max-w-[760px] gap-5">
        <header className="rounded-3xl p-6 text-white sm:p-8" style={{ backgroundColor: couleur }}>
          <p className="text-sm font-bold uppercase tracking-[0.14em] opacity-80">{e.organisme.nom}</p>
          <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight sm:text-[34px]">{s.intitule}</h1>
          <p className="mt-2 text-[17px] opacity-95">
            {periode}
            {s.dureeHeures ? ` · ${String(s.dureeHeures).replace('.', ',')} heures` : ''}
          </p>
          {e.stagiaire.nom ? <p className="mt-3 text-[16px]">Espace de {e.stagiaire.nom}</p> : null}
        </header>

        {e.stagiaire.annulee ? (
          <p className="rounded-2xl border border-[#F3B0C2] bg-[#FDE7EC] px-5 py-4 text-[#8A1B3D]">Cette inscription a été annulée. Pour toute question, écrivez à l&apos;organisme.</p>
        ) : null}

        {!e.stagiaire.annulee ? (
          <Carte titre="Émargement" id="emargement">
            {e.emargement.seanceOuverte && e.emargement.slot ? (
              e.emargement.dejaSigne ? (
                <p className="rounded-2xl bg-[#E3F5EC] px-5 py-4 text-[17px] font-bold text-[#0F5F3E]">
                  ✓ Vous avez signé pour ce {MOMENT[e.emargement.slot.moment]}.
                </p>
              ) : (
                <form onSubmit={signer} className="grid gap-4">
                  <p className="text-[16px]">
                    Signature du <strong>{jour(e.emargement.slot.date)}, {MOMENT[e.emargement.slot.moment]}</strong>. Recopiez le code affiché en salle, puis signez.
                  </p>
                  <label className="block">
                    <span className="mb-1.5 block text-[15px] font-bold text-[#12312A]">Code de la séance</span>
                    <input
                      className={`${champ} max-w-[220px] text-center font-mono text-2xl tracking-[0.3em]`}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={7}
                      value={code}
                      onChange={(x) => setCode(x.target.value.replace(/[^\d ]/g, ''))}
                      required
                    />
                  </label>
                  <SignatureTrace onChange={setTrace} />
                  <button type="submit" disabled={etatSignature.occupe || code.replace(/\D/g, '').length !== 6 || !trace} className={bouton} style={{ backgroundColor: couleur }}>
                    {etatSignature.occupe ? 'Envoi…' : 'Signer ma présence'}
                  </button>
                  <p className="text-[13px] text-[#5E7A6E]">Votre signature est enregistrée avec son heure et l&apos;empreinte de ce qui a été signé. Elle ne se modifie pas ensuite.</p>
                </form>
              )
            ) : (
              <p className="text-[16px] leading-relaxed">
                Aucune signature en cours. Au début de chaque demi-journée, le formateur ouvre l&apos;émargement et affiche un code : revenez sur cette page, depuis ce même lien.
              </p>
            )}
            {etatSignature.ok ? <p className="mt-3 rounded-xl bg-[#E3F5EC] px-4 py-3 font-bold text-[#0F5F3E]" role="status">{etatSignature.ok}</p> : null}
            {etatSignature.erreur ? <p className="mt-3 rounded-xl bg-[#FDE7EC] px-4 py-3 text-[#8A1B3D]" role="alert">{etatSignature.erreur}</p> : null}
            {e.emargement.signatures.length ? (
              <p className="mt-4 text-[14px] text-[#5E7A6E]">
                {e.emargement.signatures.length} demi-journée{e.emargement.signatures.length > 1 ? 's' : ''} enregistrée{e.emargement.signatures.length > 1 ? 's' : ''}
                {e.emargement.heuresRealisees ? `, soit ${String(e.emargement.heuresRealisees).replace('.', ',')} heures` : ''}.
              </p>
            ) : null}
          </Carte>
        ) : null}

        {momentPos ? (
          <Carte titre={momentPos === 'entree' ? 'Avant de commencer : où en êtes-vous ?' : 'À la fin : où en êtes-vous maintenant ?'} id="positionnement">
            <p className="mb-4 text-[15px] leading-relaxed">
              Pour chaque objectif de la formation, situez-vous de 0 (je ne sais pas faire) à 4 (je sais le faire seul et l&apos;expliquer). {momentPos === 'sortie' ? "Votre réponse figurera sur votre attestation, à côté de celle d'entrée." : "C'est ce qui permet au formateur d'adapter la formation."}
            </p>
            <form onSubmit={positionner} className="grid gap-4">
              {e.positionnement.objectifs.map((o) => (
                <fieldset key={o}>
                  <legend className="mb-1.5 text-[15px] font-bold text-[#12312A]">{o}</legend>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <label key={n} className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-2 text-lg font-extrabold ${notes[o] === n ? 'border-[#1E9E6A] bg-[#E3F5EC] text-[#0F5F3E]' : 'border-[#CFE4D9] text-[#5E7A6E]'}`}>
                        <input type="radio" className="sr-only" name={o} checked={notes[o] === n} onChange={() => setNotes((x) => ({ ...x, [o]: n }))} />
                        {n}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <button type="submit" disabled={etatPos.occupe} className={bouton} style={{ backgroundColor: couleur }}>
                Enregistrer
              </button>
            </form>
            {etatPos.erreur ? <p className="mt-3 rounded-xl bg-[#FDE7EC] px-4 py-3 text-[#8A1B3D]" role="alert">{etatPos.erreur}</p> : null}
          </Carte>
        ) : etatPos.ok ? (
          <p className="rounded-2xl bg-[#E3F5EC] px-5 py-4 font-bold text-[#0F5F3E]" role="status">{etatPos.ok}</p>
        ) : null}

        {typeEval ? (
          <Carte titre={typeEval === 'chaud' ? 'Votre avis sur la formation' : 'Quelques semaines après'} id="evaluation">
            <form onSubmit={evaluer} className="grid gap-5">
              <Etoiles libelle={typeEval === 'chaud' ? 'Dans l’ensemble, sur 5' : 'Avec le recul, la formation vous a été utile ? (sur 5)'} valeur={ev.note} changer={(n) => setEv((x) => ({ ...x, note: n }))} />
              {typeEval === 'chaud' ? (
                <>
                  <Etoiles libelle="Les objectifs ont été atteints" valeur={ev.objectifs} changer={(n) => setEv((x) => ({ ...x, objectifs: n }))} />
                  <Etoiles libelle="La pédagogie du formateur" valeur={ev.pedagogie} changer={(n) => setEv((x) => ({ ...x, pedagogie: n }))} />
                  <Etoiles libelle="L’organisation (accueil, horaires, lieu)" valeur={ev.organisation} changer={(n) => setEv((x) => ({ ...x, organisation: n }))} />
                  <fieldset>
                    <legend className="mb-1.5 text-[15px] font-bold text-[#12312A]">La recommanderiez-vous ?</legend>
                    <div className="flex gap-2">
                      {(['oui', 'non'] as const).map((r) => (
                        <label key={r} className={`cursor-pointer rounded-xl border-2 px-5 py-2 font-bold ${ev.recommande === r ? 'border-[#1E9E6A] bg-[#E3F5EC] text-[#0F5F3E]' : 'border-[#CFE4D9] text-[#5E7A6E]'}`}>
                          <input type="radio" className="sr-only" name="recommande" checked={ev.recommande === r} onChange={() => setEv((x) => ({ ...x, recommande: r }))} />
                          {r === 'oui' ? 'Oui' : 'Non'}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              ) : (
                <fieldset>
                  <legend className="mb-1.5 text-[15px] font-bold text-[#12312A]">Mettez-vous en œuvre ce que vous avez appris ?</legend>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['OUI', 'Oui'],
                      ['PARTIELLEMENT', 'En partie'],
                      ['NON', 'Non'],
                    ] as const).map(([k, l]) => (
                      <label key={k} className={`cursor-pointer rounded-xl border-2 px-5 py-2 font-bold ${ev.miseEnOeuvre === k ? 'border-[#1E9E6A] bg-[#E3F5EC] text-[#0F5F3E]' : 'border-[#CFE4D9] text-[#5E7A6E]'}`}>
                        <input type="radio" className="sr-only" name="mise" checked={ev.miseEnOeuvre === k} onChange={() => setEv((x) => ({ ...x, miseEnOeuvre: k }))} />
                        {l}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <label className="block">
                <span className="mb-1.5 block text-[15px] font-bold text-[#12312A]">Un commentaire, une suggestion ?</span>
                <textarea className={`${champ} min-h-[100px]`} maxLength={3000} value={ev.commentaire} onChange={(x) => setEv((y) => ({ ...y, commentaire: x.target.value }))} />
              </label>
              <button type="submit" disabled={etatEval.occupe} className={bouton} style={{ backgroundColor: couleur }}>
                Envoyer mon avis
              </button>
            </form>
            {etatEval.erreur ? <p className="mt-3 rounded-xl bg-[#FDE7EC] px-4 py-3 text-[#8A1B3D]" role="alert">{etatEval.erreur}</p> : null}
          </Carte>
        ) : etatEval.ok ? (
          <p className="rounded-2xl bg-[#E3F5EC] px-5 py-4 font-bold text-[#0F5F3E]" role="status">{etatEval.ok}</p>
        ) : null}

        <Carte titre="Mes documents">
          <ul className="grid gap-2">
            {(
              [
                ['CONVOCATION', 'Ma convocation', e.documents.convocation],
                ['PROGRAMME', 'Le programme', e.documents.programme],
                ['ATTESTATION', 'Mon attestation de fin de formation', e.documents.attestation],
                ['CERTIFICAT_REALISATION', 'Le certificat de réalisation (pour votre employeur ou financeur)', e.documents.certificatRealisation],
              ] as const
            ).map(([t, libelle, dispo]) => (
              <li key={t}>
                {dispo && !e.stagiaire.annulee ? (
                  <a href={`/api/proxy${base}/documents/${t.toLowerCase()}`} target="_blank" rel="noopener" className="flex items-center justify-between rounded-xl border border-[#DDEBE4] px-4 py-3 font-bold text-[#12312A] no-underline hover:border-[#1E9E6A]">
                    {libelle}
                    <span className="text-sm" style={{ color: couleur }}>
                      Ouvrir (PDF)
                    </span>
                  </a>
                ) : (
                  <span className="flex items-center justify-between rounded-xl border border-dashed border-[#DDEBE4] px-4 py-3 text-[#8FA79B]">
                    {libelle}
                    <span className="text-sm">À la fin de la formation</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Carte>

        <Carte titre="Le programme">
          {s.objectifs.length ? (
            <>
              <p className="mb-2 font-bold text-[#12312A]">Objectifs</p>
              <ul className="mb-4 list-disc space-y-1 pl-5">
                {s.objectifs.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </>
          ) : null}
          {s.prerequis ? <p className="mb-4"><strong className="text-[#12312A]">Prérequis :</strong> {s.prerequis}</p> : null}
          {s.creneaux.length ? (
            <>
              <p className="mb-2 font-bold text-[#12312A]">Horaires</p>
              <ul className="mb-4 grid gap-1">
                {s.creneaux.map((c) => (
                  <li key={c.debut}>
                    {jour(c.debut)}, de {heure(c.debut)} à {heure(c.fin)} · {c.distanciel ? 'à distance' : c.salle || s.lieu || 'lieu communiqué'}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {s.lieu && s.modalite !== 'DISTANCIEL' ? <p className="mb-2"><strong className="text-[#12312A]">Lieu :</strong> {s.lieu}</p> : null}
          {s.formateurs.length ? <p className="mb-2"><strong className="text-[#12312A]">Avec :</strong> {s.formateurs.join(', ')}</p> : null}
          {s.infosPratiques ? <p className="mb-2 whitespace-pre-line"><strong className="text-[#12312A]">Informations pratiques :</strong> {s.infosPratiques}</p> : null}
        </Carte>

        <Carte titre="Contacts">
          <ul className="grid gap-2 text-[15px]">
            <li>
              <strong className="text-[#12312A]">{e.organisme.nom}</strong>
              {e.organisme.courriel ? ` · ${e.organisme.courriel}` : ''}
              {e.organisme.telephone ? ` · ${e.organisme.telephone}` : ''}
            </li>
            {e.organisme.referentPedagogique ? <li>Référent pédagogique : {e.organisme.referentPedagogique}</li> : null}
            <li>Référent handicap : {e.organisme.referentHandicap || "contactez l'organisme"}. Un aménagement est possible : signalez-le avant la formation.</li>
            {e.organisme.reglementInterieurUrl ? (
              <li>
                <a href={e.organisme.reglementInterieurUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline" style={{ color: couleur }}>
                  Le règlement intérieur
                </a>
              </li>
            ) : null}
          </ul>
        </Carte>
        <p className="text-center text-[13px] text-[#8FA79B]">Ce lien vous est personnel : ne le transmettez pas.</p>
      </div>
    </main>
  );
}
