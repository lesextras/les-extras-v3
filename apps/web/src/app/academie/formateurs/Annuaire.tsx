'use client';
/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */

import { useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille } from '../_ui';
import type { FormateurOrg, SalleOrg } from '../_gestion/types';

function Champ({ libelle, aide, children }: { libelle: string; aide?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-[#12312A]">{libelle}</span>
      {children}
      {aide ? <span className="mt-1 block text-xs text-[#5E7A6E]">{aide}</span> : null}
    </label>
  );
}

function FormFormateur({ initial, valider, annuler }: { initial?: FormateurOrg; valider: (corps: Record<string, unknown>) => Promise<void>; annuler: () => void }) {
  const [v, setV] = useState({
    prenom: initial?.prenom ?? '',
    nom: initial?.nom ?? '',
    email: initial?.email ?? '',
    telephone: initial?.telephone ?? '',
    statut: initial?.statut ?? 'INTERNE',
    structure: initial?.structure ?? '',
    siret: initial?.siret ?? '',
    metier: initial?.metier ?? '',
    competences: initial?.competences.join(', ') ?? '',
    diplomes: initial?.diplomes ?? '',
  });
  const [occupe, setOccupe] = useState(false);
  const maj = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setOccupe(true);
    const t = (x: string) => x.trim() || undefined;
    await valider({
      prenom: v.prenom.trim(),
      nom: v.nom.trim(),
      email: t(v.email),
      telephone: t(v.telephone),
      statut: v.statut,
      structure: v.statut === 'EXTERNE' ? t(v.structure) : undefined,
      siret: v.statut === 'EXTERNE' ? t(v.siret.replace(/\s/g, '')) : undefined,
      metier: t(v.metier),
      competences: v.competences.split(',').map((c) => c.trim()).filter(Boolean).slice(0, 30),
      diplomes: t(v.diplomes),
    }).finally(() => setOccupe(false));
  };
  return (
    <form onSubmit={envoyer} className="space-y-4 rounded-2xl border border-[#DDEBE4] bg-[#F7FBF9] p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ libelle="Prénom">
          <input className={CHAMP} value={v.prenom} onChange={maj('prenom')} required maxLength={80} />
        </Champ>
        <Champ libelle="Nom">
          <input className={CHAMP} value={v.nom} onChange={maj('nom')} required maxLength={80} />
        </Champ>
        <Champ libelle="E-mail">
          <input className={CHAMP} type="email" value={v.email} onChange={maj('email')} maxLength={160} />
        </Champ>
        <Champ libelle="Téléphone">
          <input className={CHAMP} value={v.telephone} onChange={maj('telephone')} maxLength={30} />
        </Champ>
      </div>
      <Champ libelle="Statut (BPF, cadre E)" aide="De l'organisme : salarié, bénévole, dirigeant. Extérieur : sous contrat de prestation ou sur honoraires.">
        <select className={CHAMP} value={v.statut} onChange={(e) => setV((x) => ({ ...x, statut: e.target.value as 'INTERNE' | 'EXTERNE' }))}>
          <option value="INTERNE">Personne de l&apos;organisme</option>
          <option value="EXTERNE">Prestataire extérieur</option>
        </select>
      </Champ>
      {v.statut === 'EXTERNE' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ libelle="Sa structure">
            <input className={CHAMP} value={v.structure} onChange={maj('structure')} maxLength={160} />
          </Champ>
          <Champ libelle="SIRET">
            <input className={CHAMP} value={v.siret} onChange={maj('siret')} maxLength={17} inputMode="numeric" />
          </Champ>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ libelle="Métier">
          <input className={CHAMP} value={v.metier} onChange={maj('metier')} maxLength={120} placeholder="Éducatrice spécialisée, formateur en bureautique…" />
        </Champ>
        <Champ libelle="Compétences" aide="Séparées par des virgules.">
          <input className={CHAMP} value={v.competences} onChange={maj('competences')} />
        </Champ>
      </div>
      <Champ libelle="Diplômes, titres et références" aide="Ils figurent au contrat des particuliers (art. L6353-4) et prouvent l'indicateur 21.">
        <textarea className={`${CHAMP} min-h-[90px]`} value={v.diplomes} onChange={maj('diplomes')} maxLength={2000} />
      </Champ>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={occupe} className={BTN_PRIMAIRE}>
          Enregistrer
        </button>
        <button type="button" onClick={annuler} className={BTN_SECONDAIRE}>
          Annuler
        </button>
      </div>
    </form>
  );
}

function FormSalle({ initial, valider, annuler }: { initial?: SalleOrg; valider: (corps: Record<string, unknown>) => Promise<void>; annuler: () => void }) {
  const [v, setV] = useState({
    nom: initial?.nom ?? '',
    adresse: initial?.adresse ?? '',
    capacite: initial?.capacite ? String(initial.capacite) : '',
    accessiblePmr: initial?.accessiblePmr ?? false,
    equipements: initial?.equipements ?? '',
  });
  const [occupe, setOccupe] = useState(false);
  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setOccupe(true);
    await valider({
      nom: v.nom.trim(),
      adresse: v.adresse.trim() || undefined,
      ...(Number(v.capacite) > 0 ? { capacite: Number(v.capacite) } : {}),
      accessiblePmr: v.accessiblePmr,
      equipements: v.equipements.trim() || undefined,
    }).finally(() => setOccupe(false));
  };
  return (
    <form onSubmit={envoyer} className="space-y-4 rounded-2xl border border-[#DDEBE4] bg-[#F7FBF9] p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Champ libelle="Nom">
          <input className={CHAMP} value={v.nom} onChange={(e) => setV((x) => ({ ...x, nom: e.target.value }))} required maxLength={120} />
        </Champ>
        <Champ libelle="Adresse">
          <input className={CHAMP} value={v.adresse} onChange={(e) => setV((x) => ({ ...x, adresse: e.target.value }))} maxLength={300} />
        </Champ>
        <Champ libelle="Capacité">
          <input className={CHAMP} type="number" min={1} value={v.capacite} onChange={(e) => setV((x) => ({ ...x, capacite: e.target.value }))} />
        </Champ>
      </div>
      <label className="flex items-center gap-3 text-[15px]">
        <input type="checkbox" className="h-5 w-5 accent-[#1E9E6A]" checked={v.accessiblePmr} onChange={(e) => setV((x) => ({ ...x, accessiblePmr: e.target.checked }))} />
        Accessible aux personnes à mobilité réduite
      </label>
      <Champ libelle="Équipements">
        <input className={CHAMP} value={v.equipements} onChange={(e) => setV((x) => ({ ...x, equipements: e.target.value }))} maxLength={1000} placeholder="Vidéoprojecteur, tableau blanc, postes informatiques…" />
      </Champ>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={occupe} className={BTN_PRIMAIRE}>
          Enregistrer
        </button>
        <button type="button" onClick={annuler} className={BTN_SECONDAIRE}>
          Annuler
        </button>
      </div>
    </form>
  );
}

export function Annuaire({ formateurs: f0, salles: s0, ongletInitial, erreur: e0 }: { formateurs: FormateurOrg[]; salles: SalleOrg[]; ongletInitial: 'formateurs' | 'salles'; erreur: string | null }) {
  const [onglet, setOnglet] = useState(ongletInitial);
  const [formateurs, setFormateurs] = useState(f0);
  const [salles, setSalles] = useState(s0);
  const [edition, setEdition] = useState<string | 'nouveau' | null>(null);
  const [erreur, setErreur] = useState<string | null>(e0);

  const recharger = async () => {
    const [f, s] = await Promise.all([appel<FormateurOrg[]>('/academie/gestion/formateurs'), appel<SalleOrg[]>('/academie/gestion/salles')]);
    setFormateurs(f);
    setSalles(s);
  };
  const ecrire = async (fn: () => Promise<unknown>) => {
    setErreur(null);
    try {
      await fn();
      setEdition(null);
      await recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'enregistrement a échoué.");
    }
  };
  const incomplets = formateurs.filter((f) => f.actif && (!f.metier || !f.diplomes));

  return (
    <>
      <div className="mb-5 flex gap-2" role="tablist">
        {(['formateurs', 'salles'] as const).map((o) => (
          <button key={o} type="button" role="tab" aria-selected={onglet === o} onClick={() => { setOnglet(o); setEdition(null); }} className={`rounded-full px-4 py-2 text-sm font-bold ${onglet === o ? 'bg-[#0F5F3E] text-white' : 'bg-[#E3F5EC] text-[#0F5F3E]'}`}>
            {o === 'formateurs' ? `Formateurs (${formateurs.filter((x) => x.actif).length})` : `Salles (${salles.filter((x) => x.actif).length})`}
          </button>
        ))}
      </div>
      {erreur ? (
        <div className="mb-4">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {onglet === 'formateurs' ? (
        <>
          {incomplets.length ? (
            <div className="mb-4">
              <Encart ton="attention">
                {incomplets.length} formateur{incomplets.length > 1 ? 's' : ''} sans métier ou sans diplômes renseignés : c&apos;est ce qui manque en audit pour l&apos;indicateur 21.
              </Encart>
            </div>
          ) : null}
          <div className="mb-4">
            {edition === 'nouveau' ? (
              <FormFormateur annuler={() => setEdition(null)} valider={(c) => ecrire(() => appel('/academie/gestion/formateurs', { method: 'POST', body: c }))} />
            ) : (
              <button type="button" className={BTN_PRIMAIRE} onClick={() => setEdition('nouveau')}>
                Ajouter un formateur
              </button>
            )}
          </div>
          <ul className="grid gap-3">
            {formateurs.map((f) =>
              edition === f.id ? (
                <li key={f.id}>
                  <FormFormateur initial={f} annuler={() => setEdition(null)} valider={(c) => ecrire(() => appel(`/academie/gestion/formateurs/${f.id}`, { method: 'PATCH', body: c }))} />
                </li>
              ) : (
                <li key={f.id} className={`${CARTE} p-4 ${f.actif ? '' : 'opacity-60'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-extrabold text-[#12312A]">
                        {f.prenom} {f.nom}
                      </p>
                      <p className="text-[14px] text-[#5E7A6E]">{[f.metier, f.statut === 'EXTERNE' ? `Prestataire${f.structure ? `, ${f.structure}` : ''}` : "Personne de l'organisme", f.email].filter(Boolean).join(' · ')}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {f.competences.map((c) => (
                          <span key={c} className="rounded-full bg-[#E3F5EC] px-3 py-0.5 text-[13px] font-bold text-[#0F5F3E]">
                            {c}
                          </span>
                        ))}
                        {!f.diplomes ? <Pastille ton="attention">Diplômes à renseigner</Pastille> : null}
                        {!f.actif ? <Pastille ton="neutre">Inactif</Pastille> : null}
                        {f._count ? <Pastille ton="neutre">{f._count.sessions + f._count.creneaux ? `${f._count.creneaux} créneau${f._count.creneaux > 1 ? 'x' : ''} au planning` : 'Pas encore au planning'}</Pastille> : null}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" className={BTN_DISCRET} onClick={() => setEdition(f.id)}>
                        Modifier
                      </button>
                      {f.actif ? (
                        <button
                          type="button"
                          className={BTN_DISCRET}
                          onClick={() => {
                            if (!window.confirm(`Retirer ${f.prenom} ${f.nom} de l'annuaire ? S'il a déjà animé, il reste enregistré comme inactif.`)) return;
                            void ecrire(() => appel(`/academie/gestion/formateurs/${f.id}`, { method: 'DELETE' }));
                          }}
                        >
                          Retirer
                        </button>
                      ) : (
                        <button type="button" className={BTN_DISCRET} onClick={() => void ecrire(() => appel(`/academie/gestion/formateurs/${f.id}`, { method: 'PATCH', body: { actif: true } }))}>
                          Réactiver
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ),
            )}
          </ul>
          {!formateurs.length ? <Encart ton="info">Aucun formateur dans l&apos;annuaire. Ajoute-toi en premier si tu animes toi-même.</Encart> : null}
        </>
      ) : (
        <>
          <div className="mb-4">
            {edition === 'nouveau' ? (
              <FormSalle annuler={() => setEdition(null)} valider={(c) => ecrire(() => appel('/academie/gestion/salles', { method: 'POST', body: c }))} />
            ) : (
              <button type="button" className={BTN_PRIMAIRE} onClick={() => setEdition('nouveau')}>
                Ajouter une salle
              </button>
            )}
          </div>
          <ul className="grid gap-3">
            {salles.map((x) =>
              edition === x.id ? (
                <li key={x.id}>
                  <FormSalle initial={x} annuler={() => setEdition(null)} valider={(c) => ecrire(() => appel(`/academie/gestion/salles/${x.id}`, { method: 'PATCH', body: c }))} />
                </li>
              ) : (
                <li key={x.id} className={`${CARTE} flex flex-wrap items-start justify-between gap-3 p-4 ${x.actif ? '' : 'opacity-60'}`}>
                  <div>
                    <p className="text-[16px] font-extrabold text-[#12312A]">{x.nom}</p>
                    <p className="text-[14px] text-[#5E7A6E]">{[x.adresse, x.capacite ? `${x.capacite} places` : null, x.equipements].filter(Boolean).join(' · ')}</p>
                    <div className="mt-2 flex gap-2">
                      {x.accessiblePmr ? <Pastille ton="ok">Accessible PMR</Pastille> : <Pastille ton="attention">Accessibilité non précisée</Pastille>}
                      {!x.actif ? <Pastille ton="neutre">Inactive</Pastille> : null}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className={BTN_DISCRET} onClick={() => setEdition(x.id)}>
                      Modifier
                    </button>
                    {x.actif ? (
                      <button type="button" className={BTN_DISCRET} onClick={() => window.confirm(`Retirer la salle ${x.nom} ?`) && void ecrire(() => appel(`/academie/gestion/salles/${x.id}`, { method: 'DELETE' }))}>
                        Retirer
                      </button>
                    ) : (
                      <button type="button" className={BTN_DISCRET} onClick={() => void ecrire(() => appel(`/academie/gestion/salles/${x.id}`, { method: 'PATCH', body: { actif: true } }))}>
                        Réactiver
                      </button>
                    )}
                  </div>
                </li>
              ),
            )}
          </ul>
          {!salles.length ? <Encart ton="info">Aucune salle.</Encart> : null}
        </>
      )}
    </>
  );
}
