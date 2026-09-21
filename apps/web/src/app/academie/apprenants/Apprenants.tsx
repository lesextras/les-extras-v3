'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { appel, messageDe } from '../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille } from '../_ui';
import { dateCourte, euros, type Apprenant, type CoursResume, type Vente } from '../_ecole/types';

const ORIGINE = 'https://pilote.toulali.fr';

/** Ce que l'API rend quand on invite : la personne n'a pas de compte, elle a un lien. */
interface Invitation {
  id: string;
  email: string;
  lien: string;
}

/**
 * MES APPRENANTS — LA LISTE DES PERSONNES.
 *
 * Trois idées, et rien d'autre : qui, depuis quand, où elle en est. Le tri par
 * « dernière visite » est celui qui sert vraiment — c'est lui qui montre les
 * personnes qui décrochent, pendant qu'on peut encore les rattraper.
 */

type Tri = 'inscription' | 'visite' | 'nom' | 'progression' | 'revenus' | 'formations';
type Filtre = 'tous' | 'en-cours' | 'termines' | 'inactifs' | 'bloques';

interface Personne {
  cle: string;
  nom: string;
  email: string;
  inscritLe: string;
  derniereVisite: string | null;
  cours: Apprenant[];
  progression: number;
  termines: number;
  revenusCents: number;
  bloquee: boolean;
}

/** « il y a 22 jours », « il y a 2 mois » — la même façon de dire que partout. */
function ilYA(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const jours = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'hier';
  if (jours < 31) return `il y a ${jours} jours`;
  const mois = Math.floor(jours / 30);
  if (mois < 12) return `il y a ${mois} mois`;
  const ans = Math.floor(mois / 12);
  return `il y a ${ans} an${ans > 1 ? 's' : ''}`;
}

function joursDepuis(iso: string | null | undefined) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

/** Une inscription par cours devient une personne, avec son détail. */
function regrouper(inscriptions: Apprenant[], ventes: Vente[]): Personne[] {
  const paye = new Map<string, number>();
  for (const v of ventes) {
    if (v.statut !== 'PAYEE') continue;
    const c = v.email.trim().toLowerCase();
    paye.set(c, (paye.get(c) ?? 0) + (v.montantCents ?? 0));
  }

  const par = new Map<string, Personne>();
  for (const i of inscriptions) {
    const cle = i.email.trim().toLowerCase();
    const p = par.get(cle);
    if (p) {
      p.cours.push(i);
      if (i.inscritLe < p.inscritLe) p.inscritLe = i.inscritLe;
      if (i.derniereVisite && (!p.derniereVisite || i.derniereVisite > p.derniereVisite)) {
        p.derniereVisite = i.derniereVisite;
      }
      if (!p.nom && i.nom) p.nom = i.nom;
    } else {
      par.set(cle, {
        cle,
        nom: i.nom ?? '',
        email: i.email,
        inscritLe: i.inscritLe,
        derniereVisite: i.derniereVisite,
        cours: [i],
        progression: 0,
        termines: 0,
        revenusCents: paye.get(cle) ?? 0,
        bloquee: false,
      });
    }
  }

  for (const p of par.values()) {
    p.progression = Math.round(p.cours.reduce((t, c) => t + (c.progression ?? 0), 0) / p.cours.length);
    p.termines = p.cours.filter((c) => c.statut === 'TERMINEE').length;
    // Bloquée dès qu'un de ses accès l'est : c'est la personne qu'on bloque.
    p.bloquee = p.cours.some((c) => c.statut === 'SUSPENDUE');
  }
  return [...par.values()];
}

function versCsv(personnes: Personne[]) {
  const entetes = ['Nom', 'E-mail', 'Inscrit le', 'Dernière visite', 'Formations', 'Terminées', 'Progression %', 'Payé (€)'];
  const echapper = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lignes = personnes.map((p) =>
    [
      p.nom || '',
      p.email,
      p.inscritLe.slice(0, 10),
      p.derniereVisite ? p.derniereVisite.slice(0, 10) : '',
      String(p.cours.length),
      String(p.termines),
      String(p.progression),
      (p.revenusCents / 100).toFixed(2).replace('.', ','),
    ]
      .map(echapper)
      .join(';'),
  );
  return [entetes.map(echapper).join(';'), ...lignes].join('\r\n');
}

export function Apprenants({
  inscriptions,
  ventes,
  cours,
}: {
  inscriptions: Apprenant[];
  ventes: Vente[];
  cours: CoursResume[];
}) {
  const [ajoutees, setAjoutees] = useState<Apprenant[]>([]);
  const toutes = useMemo(() => [...inscriptions, ...ajoutees], [inscriptions, ajoutees]);
  const personnes = useMemo(() => regrouper(toutes, ventes), [toutes, ventes]);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [tri, setTri] = useState<Tri>('inscription');
  const [ouvert, setOuvert] = useState<string | null>(null);

  // L'invitation : un cours, une adresse, et le lien personnel qui en sort.
  const [inviter, setInviter] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [lienCopie, setLienCopie] = useState(false);
  const [coursId, setCoursId] = useState(cours[0]?.id ?? '');
  const [importe, setImporte] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement | null>(null);
  const [courriel, setCourriel] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nomFamille, setNomFamille] = useState('');

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    let l = personnes.filter((p) => !q || p.email.toLowerCase().includes(q) || p.nom.toLowerCase().includes(q));
    if (filtre === 'en-cours') l = l.filter((p) => p.termines < p.cours.length);
    if (filtre === 'termines') l = l.filter((p) => p.termines === p.cours.length && p.cours.length > 0);
    if (filtre === 'inactifs') l = l.filter((p) => joursDepuis(p.derniereVisite) >= 30);
    if (filtre === 'bloques') l = l.filter((p) => p.bloquee);
    const trie = [...l];
    if (tri === 'inscription') trie.sort((a, b) => (a.inscritLe < b.inscritLe ? 1 : -1));
    if (tri === 'visite') trie.sort((a, b) => joursDepuis(a.derniereVisite) - joursDepuis(b.derniereVisite));
    if (tri === 'nom') trie.sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email, 'fr'));
    if (tri === 'progression') trie.sort((a, b) => b.progression - a.progression);
    if (tri === 'revenus') trie.sort((a, b) => b.revenusCents - a.revenusCents);
    if (tri === 'formations') trie.sort((a, b) => b.cours.length - a.cours.length);
    return trie;
  }, [personnes, recherche, filtre, tri]);

  const inactifs = personnes.filter((p) => joursDepuis(p.derniereVisite) >= 30).length;

  /**
   * IMPORTER UNE LISTE D'APPRENANTS.
   *
   * Un fichier CSV, une adresse par ligne — avec éventuellement le prénom et
   * le nom. On inscrit au cours choisi juste au-dessus. Une ligne qui échoue
   * (adresse invalide, personne déjà inscrite) n'arrête pas les autres : le
   * compte rendu dit combien sont passées.
   */
  async function importerCsv(texte: string) {
    if (!coursId) {
      setErreur("Choisis d'abord le cours dans lequel importer ces personnes.");
      return;
    }
    const lignes = texte
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    setEnCours(true);
    setErreur(null);
    setImporte(null);

    let faites = 0;
    let ratees = 0;
    const neuves: Apprenant[] = [];
    const c = cours.find((x) => x.id === coursId);

    for (const ligne of lignes.slice(0, 500)) {
      const cases = ligne.split(/[;,\t]/).map((x) => x.trim().replace(/^"|"$/g, ''));
      const email = cases.find((x) => x.includes('@'))?.toLowerCase();
      if (!email) continue;
      // Une ligne d'en-têtes ne contient pas d'arobase : elle est ignorée d'elle-même.
      const autres = cases.filter((x) => x !== email && x && !x.includes('@'));
      try {
        const creee = await appel<Invitation>(`/ecole/cours/${coursId}/apprenants`, {
          methode: 'POST',
          corps: {
            email,
            ...(autres[0] ? { prenom: autres[0].slice(0, 120) } : {}),
            ...(autres[1] ? { nom: autres[1].slice(0, 120) } : {}),
          },
        });
        faites += 1;
        neuves.push({
          id: creee.id,
          email: creee.email,
          nom: autres.slice(0, 2).join(' ') || null,
          cours: { id: coursId, titre: c?.titre ?? 'Cours' },
          statut: 'ACTIVE',
          progression: 0,
          termineLe: null,
          certificatEmisLe: null,
          derniereVisite: null,
          inscritLe: new Date().toISOString(),
          lien: creee.lien,
        });
      } catch {
        ratees += 1;
      }
    }

    setAjoutees((l) => [...neuves, ...l]);
    setEnCours(false);
    setImporte(
      faites
        ? `${faites} personne${faites > 1 ? 's' : ''} inscrite${faites > 1 ? 's' : ''}${ratees ? ` · ${ratees} ligne${ratees > 1 ? 's' : ''} écartée${ratees > 1 ? 's' : ''} (adresse invalide ou déjà inscrite)` : '.'}`
        : "Aucune ligne n'a pu être importée : vérifie que le fichier contient une adresse e-mail par ligne.",
    );
  }

  /** Bloquer, c'est fermer l'accès sans rien effacer. */
  async function basculerBlocage(p: Personne) {
    setEnCours(true);
    setErreur(null);
    try {
      for (const inscription of p.cours) {
        await appel(`/ecole/apprenants/${inscription.id}/bloquer`, {
          methode: 'POST',
          corps: { bloquer: !p.bloquee },
        });
      }
      setAjoutees((l) =>
        l.map((a) =>
          a.email.trim().toLowerCase() === p.cle ? { ...a, statut: p.bloquee ? 'ACTIVE' : 'SUSPENDUE' } : a,
        ),
      );
      // Les inscriptions venues du serveur ne se rafraîchissent qu'au rechargement.
      window.location.reload();
    } catch (err) {
      setErreur(messageDe(err));
      setEnCours(false);
    }
  }

  async function envoyerInvitation(e: FormEvent) {
    e.preventDefault();
    if (!coursId) {
      setErreur('Choisis le cours auquel tu invites cette personne.');
      return;
    }
    if (!courriel.includes('@')) {
      setErreur('Indique une adresse e-mail valide.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    setInvitation(null);
    try {
      const creee = await appel<Invitation>(`/ecole/cours/${coursId}/apprenants`, {
        methode: 'POST',
        corps: {
          email: courriel.trim().toLowerCase(),
          ...(prenom.trim() ? { prenom: prenom.trim() } : {}),
          ...(nomFamille.trim() ? { nom: nomFamille.trim() } : {}),
        },
      });
      setInvitation(creee);
      const c = cours.find((x) => x.id === coursId);
      // La liste se met à jour tout de suite : la personne apparaît, sans visite.
      setAjoutees((l) => [
        {
          id: creee.id,
          email: creee.email,
          nom: [prenom.trim(), nomFamille.trim()].filter(Boolean).join(' ') || null,
          cours: { id: coursId, titre: c?.titre ?? 'Cours' },
          statut: 'ACTIVE',
          progression: 0,
          termineLe: null,
          certificatEmisLe: null,
          derniereVisite: null,
          inscritLe: new Date().toISOString(),
          lien: creee.lien,
        },
        ...l,
      ]);
      setCourriel('');
      setPrenom('');
      setNomFamille('');
    } catch (err) {
      setErreur(messageDe(err));
    } finally {
      setEnCours(false);
    }
  }

  async function copierLien(lien: string) {
    try {
      await navigator.clipboard.writeText(lien.startsWith('http') ? lien : `${ORIGINE}${lien}`);
      setLienCopie(true);
      window.setTimeout(() => setLienCopie(false), 2500);
    } catch {
      setLienCopie(false);
    }
  }

  function exporter() {
    const contenu = '﻿' + versCsv(visibles);
    const url = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `apprenants-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {inactifs ? (
        <div className="mb-6">
          <Encart ton="attention">
            {inactifs} personne{inactifs > 1 ? 's' : ''} n&apos;{inactifs > 1 ? 'ont' : 'a'} pas ouvert son cours
            depuis plus d&apos;un mois. C&apos;est le moment de relancer, pas dans trois mois.
          </Encart>
        </div>
      ) : null}

      {/* ------------------------------------------------------- les filtres */}
      <div className={`${CARTE} mb-5 p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Filtrer</span>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className={CHAMP}
              placeholder="Un nom, une adresse e-mail"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Qui</span>
            <select value={filtre} onChange={(e) => setFiltre(e.target.value as Filtre)} className={CHAMP}>
              <option value="tous">Tout le monde</option>
              <option value="en-cours">En cours</option>
              <option value="termines">Ont terminé</option>
              <option value="inactifs">Sans visite depuis un mois</option>
              <option value="bloques">Bloqués</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Trier par</span>
            <select value={tri} onChange={(e) => setTri(e.target.value as Tri)} className={CHAMP}>
              <option value="inscription">Date d&apos;inscription</option>
              <option value="visite">Dernière visite</option>
              <option value="nom">Nom</option>
              <option value="progression">Progression</option>
              <option value="revenus">Revenus</option>
              <option value="formations">Nombre de formations</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-[15px] text-[#334A42]">
            <span className="font-extrabold text-[#12312A]">
              {visibles.length} apprenant{visibles.length > 1 ? 's' : ''}
            </span>
            {visibles.length === personnes.length ? '' : ` sur ${personnes.length}`}
          </p>
          <button type="button" onClick={exporter} className={`${BTN_SECONDAIRE} ml-auto`}>
            Exporter en CSV
          </button>
          <input
            ref={fichier}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              await importerCsv(await f.text());
            }}
          />
          <button
            type="button"
            onClick={() => fichier.current?.click()}
            disabled={enCours}
            className={BTN_SECONDAIRE}
          >
            Importer un CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setInviter((o) => !o);
              setInvitation(null);
              setErreur(null);
            }}
            className={BTN_PRIMAIRE}
          >
            {inviter ? 'Fermer' : 'Inviter un apprenant'}
          </button>
        </div>
      </div>

      {importe ? (
        <div className="mb-5">
          <Encart ton="info">{importe}</Encart>
        </div>
      ) : null}

      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {/* --------------------------------------------------- inviter quelqu'un */}
      {inviter ? (
        <form onSubmit={envoyerInvitation} className={`${CARTE} mb-6 p-5`}>
          <h2 className="mb-1 text-[18px] font-extrabold text-[#12312A]">Inviter un apprenant</h2>
          <p className="mb-4 max-w-[70ch] text-[14px] leading-relaxed text-[#5E7A6E]">
            Aucun compte n&apos;est créé à sa place et aucun mot de passe n&apos;est choisi pour elle : l&apos;invitation
            produit un <span className="font-bold">lien personnel</span> qui lui ouvre son cours. Tu le lui envoies par
            le moyen que tu veux.
          </p>

          {cours.length ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">À quel cours</span>
                  <select value={coursId} onChange={(e) => setCoursId(e.target.value)} className={CHAMP} required>
                    {cours.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.titre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Adresse e-mail</span>
                  <input
                    type="email"
                    value={courriel}
                    onChange={(e) => setCourriel(e.target.value)}
                    className={CHAMP}
                    maxLength={200}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Prénom</span>
                  <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className={CHAMP} maxLength={120} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Nom</span>
                  <input
                    value={nomFamille}
                    onChange={(e) => setNomFamille(e.target.value)}
                    className={CHAMP}
                    maxLength={120}
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
                  {enCours ? 'Création du lien…' : 'Créer son lien'}
                </button>
                <button type="button" onClick={() => setInviter(false)} className={BTN_DISCRET}>
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <p className="text-[15px] leading-relaxed text-[#5E7A6E]">
              Aucun cours à proposer pour l&apos;instant. Crée d&apos;abord un cours en ligne.
            </p>
          )}

          {invitation ? (
            <div className="mt-5 rounded-xl bg-[#E3F5EC] p-4">
              <p className="text-[15px] font-bold text-[#0F5F3E]">
                Le lien de {invitation.email} est prêt.
              </p>
              <p className="mt-1 break-all font-mono text-[13px] text-[#334A42]">
                {invitation.lien.startsWith('http') ? invitation.lien : `${ORIGINE}${invitation.lien}`}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={() => copierLien(invitation.lien)} className={BTN_SECONDAIRE}>
                  {lienCopie ? 'Lien copié' : 'Copier le lien'}
                </button>
                <a
                  href={`mailto:${invitation.email}?subject=${encodeURIComponent('Ton accès à la formation')}&body=${encodeURIComponent(
                    `Bonjour,\n\nVoici ton accès personnel à la formation :\n${invitation.lien.startsWith('http') ? invitation.lien : `${ORIGINE}${invitation.lien}`}\n\nCe lien n'est qu'à toi : garde-le.\n\nÀ bientôt.`,
                  )}`}
                  className={BTN_DISCRET}
                >
                  Le lui envoyer par e-mail
                </a>
              </div>
            </div>
          ) : null}
        </form>
      ) : null}

      {/* ------------------------------------------------------ les personnes */}
      {personnes.length === 0 ? (
        <Encart ton="info">
          Personne n&apos;est encore inscrit. Publie un cours et partage son adresse, ou invite quelqu&apos;un
          directement : dans les deux cas, la personne ouvre son cours avec son propre lien.
        </Encart>
      ) : null}

      <ul className="grid gap-2">
        {visibles.map((p) => {
          const deplie = ouvert === p.cle;
          return (
            <li key={p.cle} className={CARTE}>
              <button
                type="button"
                onClick={() => setOuvert(deplie ? null : p.cle)}
                aria-expanded={deplie}
                className="flex w-full flex-wrap items-center gap-3 rounded-2xl p-4 text-left transition hover:bg-[#F2F7F5] sm:p-5"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E3F5EC] text-[#0F5F3E] transition-transform ${deplie ? 'rotate-90' : ''}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>

                <span className="min-w-[180px] flex-1">
                  <span className="block text-[16px] font-extrabold text-[#12312A]">{p.nom || 'Sans nom'}</span>
                  <span className="block break-all text-[14px] text-[#5E7A6E]">{p.email}</span>
                </span>

                <span className="min-w-[190px] text-[14px] leading-relaxed text-[#334A42]">
                  <span className="block">
                    <span className="font-bold">Inscrit</span> {ilYA(p.inscritLe) ?? dateCourte(p.inscritLe)}
                  </span>
                  <span className="block">
                    <span className="font-bold">Connecté</span> {ilYA(p.derniereVisite) ?? 'jamais'}
                  </span>
                </span>

                <span className="min-w-[110px] text-right">
                  <span className="block text-[16px] font-black text-[#12312A]">{euros(p.revenusCents)}</span>
                  <span className="block text-[13px] italic text-[#5E7A6E]">
                    {p.cours.length} formation{p.cours.length > 1 ? 's' : ''}
                  </span>
                </span>

                <span className="hidden sm:block">
                  {p.bloquee ? (
                    <Pastille ton="alerte">Bloqué</Pastille>
                  ) : p.termines === p.cours.length ? (
                    <Pastille ton="ok">Terminé</Pastille>
                  ) : joursDepuis(p.derniereVisite) >= 30 ? (
                    <Pastille ton="attention">À relancer</Pastille>
                  ) : (
                    <Pastille ton="neutre">{p.progression} %</Pastille>
                  )}
                </span>
              </button>

              {deplie ? (
                <div className="border-t border-[#EDF4F1] px-4 pb-4 pt-3 sm:px-5">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void basculerBlocage(p)}
                      disabled={enCours}
                      className={BTN_SECONDAIRE}
                    >
                      {p.bloquee ? "Rouvrir l'accès" : "Bloquer l'accès"}
                    </button>
                    <span className="text-[13px] text-[#5E7A6E]">
                      Bloquer n&apos;efface rien : la personne garde son inscription et sa progression,
                      elle ne peut simplement plus ouvrir ses formations.
                    </span>
                  </div>
                  <ul className="grid gap-2">
                    {p.cours.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#F2F7F5] px-4 py-3">
                        <span className="min-w-[180px] flex-1">
                          <span className="block text-[15px] font-bold text-[#12312A]">{c.cours.titre}</span>
                          <span className="block text-[13px] text-[#5E7A6E]">
                            Inscrit le {dateCourte(c.inscritLe)}
                            {c.termineLe ? ` · terminé le ${dateCourte(c.termineLe)}` : ''}
                            {c.certificatEmisLe ? ` · certificat le ${dateCourte(c.certificatEmisLe)}` : ''}
                          </span>
                        </span>
                        <span className="w-[160px]">
                          <span className="block h-2 w-full overflow-hidden rounded-full bg-[#DDEBE4]">
                            <span
                              className="block h-full rounded-full bg-[#1E9E6A]"
                              style={{ width: `${Math.min(100, Math.max(0, c.progression ?? 0))}%` }}
                            />
                          </span>
                          <span className="mt-1 block text-[13px] text-[#5E7A6E]">{c.progression ?? 0} % du cours</span>
                        </span>
                        {c.lien ? (
                          <a href={c.lien} target="_blank" rel="noreferrer" className={BTN_DISCRET}>
                            Ouvrir son cours
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-6 max-w-[75ch] text-[14px] leading-relaxed text-[#5E7A6E]">
        Personne n&apos;est inscrit à sa place : chacun crée son compte depuis l&apos;adresse du cours. L&apos;export
        CSV reprend exactement ce que la liste affiche, filtres compris.
      </p>
    </>
  );
}
