'use client';

/**
 * LES PARTAGES D'AGENDA, COMME DANS OUTLOOK (24/09/2026).
 *
 * Deux gestes, et ils ne se confondent pas :
 *  - INVITER : j'ouvre MON agenda à quelqu'un, au niveau que je choisis ;
 *  - DEMANDER : je demande à voir l'agenda de quelqu'un ; c'est LUI qui
 *    décide, et il peut accorder moins que ce que je demande.
 *
 * ⚠ Le niveau se choisit toujours du côté de celui qui partage. Une demande
 * propose un niveau, elle ne l'impose pas.
 */

import { useEffect, useRef, useState } from 'react';
import { Check, Eye, Mail, Send, Share2, Trash2, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { LIBELLE_NIVEAU, NIVEAUX, type Niveau } from './outils';

export interface VuePartage {
  id: string;
  sens: 'INVITATION' | 'DEMANDE';
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE' | 'RETIRE';
  niveau: Niveau;
  inclutReservations: boolean;
  message: string | null;
  couleur: string;
  visible: boolean;
  jeSuisTitulaire: boolean;
  jeSuisDestinataire: boolean;
  compte: { id: string; nom: string; type: string; slug: string | null } | null;
  titulaire: { nom: string; email: string } | null;
  destinataire: { nom: string | null; email: string; inscrit: boolean };
  creeLe: string;
  reponduLe: string | null;
}

export interface ListePartages {
  compteActif: string;
  accordes: VuePartage[];
  recus: VuePartage[];
  invitationsRecues: VuePartage[];
  demandesRecues: VuePartage[];
  demandesEnvoyees: VuePartage[];
}

const F_DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

export function PanneauPartages({
  liste,
  focus,
  onChange,
  onVoirOffres,
}: {
  liste: ListePartages | null;
  focus: 'inviter' | 'demander' | null;
  onChange: () => Promise<void> | void;
  onVoirOffres: (p: VuePartage) => void;
}) {
  const { toast } = useToast();
  const [occupe, setOccupe] = useState<string | null>(null);

  const agir = async (cle: string, fn: () => Promise<unknown>, succes: string) => {
    setOccupe(cle);
    try {
      await fn();
      toast({ title: succes, variant: 'success' });
      await onChange();
    } catch (e) {
      toast({ title: e instanceof ApiError ? e.message : 'Action impossible pour le moment.', variant: 'error' });
    } finally {
      setOccupe(null);
    }
  };

  if (!liste) {
    return <p className="text-sm text-muted-foreground">Chargement des partages…</p>;
  }

  const enAttente = [...liste.invitationsRecues, ...liste.demandesRecues];

  return (
    <div className="space-y-6">
      {enAttente.length > 0 ? (
        <Section titre="À traiter" sousTitre="Ces personnes attendent votre réponse.">
          <ul className="space-y-3">
            {liste.invitationsRecues.map((p) => (
              <CarteInvitationRecue key={p.id} p={p} occupe={occupe === p.id} onAccepter={() => agir(p.id, () => apiRequest(`/partages/${p.id}/accepter`, { method: 'POST', body: {} }), 'Agenda ajouté au vôtre')} onRefuser={() => agir(p.id, () => apiRequest(`/partages/${p.id}/refuser`, { method: 'POST' }), 'Invitation refusée')} />
            ))}
            {liste.demandesRecues.map((p) => (
              <CarteDemandeRecue
                key={p.id}
                p={p}
                occupe={occupe === p.id}
                onAccepter={(niveau, inclutReservations) =>
                  agir(p.id, () => apiRequest(`/partages/${p.id}/accepter`, { method: 'POST', body: { niveau, inclutReservations } }), 'Accès accordé')
                }
                onRefuser={() => agir(p.id, () => apiRequest(`/partages/${p.id}/refuser`, { method: 'POST' }), 'Demande refusée')}
              />
            ))}
          </ul>
        </Section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <FormulaireInviter
          ouvert={focus === 'inviter'}
          occupe={occupe === 'inviter'}
          onEnvoyer={(corps) => agir('inviter', () => apiRequest('/partages/inviter', { method: 'POST', body: corps }), 'Invitation envoyée')}
        />
        <FormulaireDemander
          ouvert={focus === 'demander'}
          occupe={occupe === 'demander'}
          onEnvoyer={(corps) => agir('demander', () => apiRequest('/partages/demander', { method: 'POST', body: corps }), 'Demande envoyée')}
        />
      </div>

      <Section titre="Qui voit mon agenda" sousTitre="Changez le niveau à tout moment, ou retirez l’accès.">
        {liste.accordes.length === 0 ? (
          <Vide>Vous n’avez encore partagé votre agenda avec personne.</Vide>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {liste.accordes.map((p) => (
              <LigneAccorde
                key={p.id}
                p={p}
                occupe={occupe === p.id}
                onNiveau={(niveau) => agir(p.id, () => apiRequest(`/partages/${p.id}`, { method: 'PATCH', body: { niveau } }), 'Niveau modifié')}
                onReservations={(inclutReservations) =>
                  agir(p.id, () => apiRequest(`/partages/${p.id}`, { method: 'PATCH', body: { inclutReservations } }), inclutReservations ? 'Réservations partagées' : 'Réservations masquées')
                }
                onRetirer={() => {
                  if (!window.confirm('Retirer cet accès ? La personne ne verra plus votre agenda.')) return;
                  void agir(p.id, () => apiRequest(`/partages/${p.id}`, { method: 'DELETE' }), 'Accès retiré');
                }}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section titre="Les agendas que je vois" sousTitre="Ils s’affichent en couleur dans votre calendrier.">
        {liste.recus.length === 0 && liste.demandesEnvoyees.length === 0 ? (
          <Vide>Aucun agenda partagé avec vous pour l’instant. Demandez à une personne avec qui vous travaillez de vous ouvrir le sien.</Vide>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {liste.recus.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: p.couleur }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.compte?.nom ?? p.titulaire?.nom}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.titulaire?.nom} · {LIBELLE_NIVEAU[p.niveau]}
                    {p.inclutReservations ? ' · réservations incluses' : ''}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onVoirOffres(p)}>
                  <Eye aria-hidden /> Ses services
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={occupe === p.id}
                  onClick={() => {
                    if (!window.confirm('Ne plus afficher cet agenda ? Il faudra une nouvelle invitation pour le revoir.')) return;
                    void agir(p.id, () => apiRequest(`/partages/${p.id}`, { method: 'DELETE' }), 'Agenda retiré');
                  }}
                >
                  <Trash2 aria-hidden /> Retirer
                </Button>
              </li>
            ))}
            {liste.demandesEnvoyees.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.titulaire?.nom ?? p.titulaire?.email ?? 'Demande envoyée'}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Demande envoyée le {F_DATE.format(new Date(p.creeLe))} · {LIBELLE_NIVEAU[p.niveau]} · en attente
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={occupe === p.id}
                  onClick={() => void agir(p.id, () => apiRequest(`/partages/${p.id}`, { method: 'DELETE' }), 'Demande annulée')}
                >
                  <X aria-hidden /> Annuler
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/* ================================================================ blocs */

function Section({ titre, sousTitre, children }: { titre: string; sousTitre?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">{titre}</h2>
        {sousTitre ? <p className="text-sm text-muted-foreground">{sousTitre}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Vide({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

function ChoixNiveau({ valeur, onChange, nom }: { valeur: Niveau; onChange: (n: Niveau) => void; nom: string }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Ce que la personne verra</legend>
      {NIVEAUX.map((n) => (
        <label
          key={n.valeur}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition',
            valeur === n.valeur ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/60',
          )}
        >
          <input type="radio" name={nom} value={n.valeur} checked={valeur === n.valeur} onChange={() => onChange(n.valeur)} className="mt-1" />
          <span>
            <span className="block text-sm font-semibold text-foreground">{n.titre}</span>
            <span className="block text-xs text-muted-foreground">{n.aide}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function FormulaireInviter({
  ouvert,
  occupe,
  onEnvoyer,
}: {
  ouvert: boolean;
  occupe: boolean;
  onEnvoyer: (corps: { email: string; niveau: Niveau; inclutReservations: boolean; message?: string }) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [niveau, setNiveau] = useState<Niveau>('TITRES');
  const [inclutReservations, setInclut] = useState(true);
  const [message, setMessage] = useState('');
  const champ = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ouvert) champ.current?.focus();
  }, [ouvert]);
  return (
    <form
      className={cn('space-y-4 rounded-xl border bg-card p-4', ouvert ? 'border-primary' : 'border-border')}
      onSubmit={async (e) => {
        e.preventDefault();
        await onEnvoyer({ email: email.trim(), niveau, inclutReservations, message: message.trim() || undefined });
        setEmail('');
        setMessage('');
      }}
    >
      <div className="flex items-center gap-2">
        <Share2 className="size-4 text-primary" aria-hidden />
        <h2 className="text-base font-semibold">Partager mon agenda</h2>
      </div>
      <label className="block text-sm font-medium">
        Adresse e-mail de la personne
        <Input ref={champ} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@exemple.fr" className="mt-1" />
      </label>
      <ChoixNiveau valeur={niveau} onChange={setNiveau} nom="niveau-inviter" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={inclutReservations} onChange={(e) => setInclut(e.target.checked)} className="size-4" />
        Inclure mes réservations, visios et missions
      </label>
      <label className="block text-sm font-medium">
        Message (facultatif)
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} className="mt-1 min-h-16 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm" />
      </label>
      <p className="text-xs text-muted-foreground">Si la personne n’a pas encore de compte, elle reçoit un lien pour en créer un.</p>
      <Button type="submit" loading={occupe} className="w-full">
        <Send aria-hidden /> Envoyer l’invitation
      </Button>
    </form>
  );
}

function FormulaireDemander({
  ouvert,
  occupe,
  onEnvoyer,
}: {
  ouvert: boolean;
  occupe: boolean;
  onEnvoyer: (corps: { email: string; niveau: Niveau; message?: string }) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [niveau, setNiveau] = useState<Niveau>('TITRES');
  const [message, setMessage] = useState('');
  const champ = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ouvert) champ.current?.focus();
  }, [ouvert]);
  return (
    <form
      className={cn('space-y-4 rounded-xl border bg-card p-4', ouvert ? 'border-primary' : 'border-border')}
      onSubmit={async (e) => {
        e.preventDefault();
        await onEnvoyer({ email: email.trim(), niveau, message: message.trim() || undefined });
        setEmail('');
        setMessage('');
      }}
    >
      <div className="flex items-center gap-2">
        <UserPlus className="size-4 text-primary" aria-hidden />
        <h2 className="text-base font-semibold">Demander à voir un agenda</h2>
      </div>
      <label className="block text-sm font-medium">
        Adresse e-mail de son compte Les Extras
        <Input ref={champ} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@exemple.fr" className="mt-1" />
      </label>
      <ChoixNiveau valeur={niveau} onChange={setNiveau} nom="niveau-demander" />
      <label className="block text-sm font-medium">
        Message (facultatif)
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} className="mt-1 min-h-16 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm" />
      </label>
      <p className="text-xs text-muted-foreground">La personne choisit elle-même ce qu’elle vous ouvre, et peut accorder moins que ce que vous demandez.</p>
      <Button type="submit" variant="outline" loading={occupe} className="w-full">
        <Send aria-hidden /> Envoyer la demande
      </Button>
    </form>
  );
}

function CarteInvitationRecue({ p, occupe, onAccepter, onRefuser }: { p: VuePartage; occupe: boolean; onAccepter: () => void; onRefuser: () => void }) {
  return (
    <li className="rounded-xl border border-primary/30 bg-card p-4">
      <p className="text-sm">
        <strong>{p.titulaire?.nom ?? 'Quelqu’un'}</strong> vous ouvre l’agenda de <strong>{p.compte?.nom ?? 'son compte'}</strong> ·{' '}
        {LIBELLE_NIVEAU[p.niveau]}
      </p>
      {p.message ? <p className="mt-2 rounded-lg bg-muted/50 p-2 text-sm italic">« {p.message} »</p> : null}
      <div className="mt-3 flex gap-2">
        <Button size="sm" loading={occupe} onClick={onAccepter}>
          <Check aria-hidden /> Ajouter à mon agenda
        </Button>
        <Button size="sm" variant="ghost" disabled={occupe} onClick={onRefuser}>
          Refuser
        </Button>
      </div>
    </li>
  );
}

function CarteDemandeRecue({
  p,
  occupe,
  onAccepter,
  onRefuser,
}: {
  p: VuePartage;
  occupe: boolean;
  onAccepter: (niveau: Niveau, inclutReservations: boolean) => void;
  onRefuser: () => void;
}) {
  const [niveau, setNiveau] = useState<Niveau>(p.niveau);
  const [inclut, setInclut] = useState(true);
  return (
    <li className="space-y-3 rounded-xl border border-primary/30 bg-card p-4">
      <p className="text-sm">
        <strong>{p.destinataire.nom ?? p.destinataire.email}</strong> demande à voir votre agenda · niveau demandé :{' '}
        {LIBELLE_NIVEAU[p.niveau]}
      </p>
      {p.message ? <p className="rounded-lg bg-muted/50 p-2 text-sm italic">« {p.message} »</p> : null}
      <label className="block text-sm font-medium">
        Niveau accordé
        <select value={niveau} onChange={(e) => setNiveau(e.target.value as Niveau)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
          {NIVEAUX.map((n) => (
            <option key={n.valeur} value={n.valeur}>
              {n.titre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={inclut} onChange={(e) => setInclut(e.target.checked)} className="size-4" />
        Inclure mes réservations, visios et missions
      </label>
      <div className="flex gap-2">
        <Button size="sm" loading={occupe} onClick={() => onAccepter(niveau, inclut)}>
          <Check aria-hidden /> Accorder l’accès
        </Button>
        <Button size="sm" variant="ghost" disabled={occupe} onClick={onRefuser}>
          Refuser
        </Button>
      </div>
    </li>
  );
}

function LigneAccorde({
  p,
  occupe,
  onNiveau,
  onReservations,
  onRetirer,
}: {
  p: VuePartage;
  occupe: boolean;
  onNiveau: (n: Niveau) => void;
  onReservations: (v: boolean) => void;
  onRetirer: () => void;
}) {
  const qui = p.destinataire.nom ?? p.destinataire.email;
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{qui}</p>
        <p className="truncate text-xs text-muted-foreground">
          {p.destinataire.nom ? `${p.destinataire.email} · ` : ''}
          {p.statut === 'EN_ATTENTE' ? 'invitation en attente' : `depuis le ${F_DATE.format(new Date(p.reponduLe ?? p.creeLe))}`}
          {!p.destinataire.inscrit ? ' · pas encore inscrite' : ''}
        </p>
      </div>
      <select
        aria-label={`Niveau de ${qui}`}
        value={p.niveau}
        disabled={occupe}
        onChange={(e) => onNiveau(e.target.value as Niveau)}
        className="rounded-lg border border-input bg-card px-2 py-1.5 text-sm"
      >
        {NIVEAUX.map((n) => (
          <option key={n.valeur} value={n.valeur}>
            {n.titre}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input type="checkbox" checked={p.inclutReservations} disabled={occupe} onChange={(e) => onReservations(e.target.checked)} className="size-4" />
        Réservations
      </label>
      <Button size="sm" variant="ghost" disabled={occupe} onClick={onRetirer}>
        <Trash2 aria-hidden /> Retirer
      </Button>
    </li>
  );
}
