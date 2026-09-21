'use client';

import * as React from 'react';
import {
  CalendarClock,
  Check,
  Copy,
  Link2,
  TriangleAlert,
  Video,
  XCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Visio {
  id: string;
  debutPrevu: string;
  dureeMinutes: number;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  intitule: string | null;
  demandeur: string | null;
  etatFenetre: 'TROP_TOT' | 'OUVERTE' | 'TERMINEE';
  lienDemandeur: string;
  lienIntervenant: string;
}

interface Intervention {
  id: string;
  status: string;
  scheduledAt?: string | null;
  service?: { title?: string | null } | null;
  account?: { name?: string | null } | null;
}

const ETATS_OUVERTS = ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'];

const quand = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * LES RENDEZ-VOUS À DISTANCE, CÔTÉ INTERVENANT.
 *
 * ⚠⚠ ON NE PLANIFIE QUE SUR UNE INTERVENTION DÉJÀ ACCEPTÉE, et l'écran ne
 * propose que celles-là. Le serveur le refuse aussi, mais un menu déroulant
 * qui listerait les demandes en attente inviterait à envoyer un lien de
 * rendez-vous avant tout accord — c'est-à-dire à faire croire à un accord.
 *
 * ⚠ LE FORMULAIRE NE DEMANDE NI MOTIF NI NOTE, et il ne faut pas en ajouter.
 * Ce que ces séances traitent relève de la rééducation et de l'éducation
 * spécialisée : un champ libre sur cet écran finirait par porter des
 * informations de santé, dans une base qui n'est pas prévue pour.
 *
 * ⚠ LE LIEN DU DEMANDEUR EST COPIABLE ICI, et c'est volontaire : quand un
 * courriel se perd — et il s'en perd —, la seule alternative serait de
 * reprogrammer le rendez-vous.
 */
export function MesVisios({
  visios: initiales,
  interventions,
}: {
  visios: Visio[];
  interventions: Intervention[];
}) {
  const [visios, setVisios] = React.useState(initiales);
  const [bookingId, setBookingId] = React.useState('');
  const [debut, setDebut] = React.useState('');
  const [duree, setDuree] = React.useState(45);
  const [envoi, setEnvoi] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [copie, setCopie] = React.useState<string | null>(null);

  const planifiables = interventions.filter((i) => ETATS_OUVERTS.includes(i.status));

  async function recharger() {
    try {
      setVisios(await apiRequest<Visio[]>('/visio/mes-rendez-vous'));
    } catch {
      /* Une liste qui ne se rafraîchit pas ne doit pas effacer celle à l'écran. */
    }
  }

  async function planifier() {
    setEnvoi(true);
    setErreur(null);
    try {
      await apiRequest('/visio', {
        method: 'POST',
        body: {
          bookingId,
          // L'entrée date-heure du navigateur rend une heure LOCALE sans fuseau.
          // `new Date(...)` l'interprète dans le fuseau du navigateur, ce qui est
          // exactement ce qu'on veut : l'intervenant saisit son heure à lui.
          debutPrevu: new Date(debut).toISOString(),
          dureeMinutes: duree,
        },
      });
      setBookingId('');
      setDebut('');
      await recharger();
    } catch (e) {
      setErreur(
        e instanceof Error ? e.message : "Le rendez-vous n'a pas pu être posé. Réessayez.",
      );
    } finally {
      setEnvoi(false);
    }
  }

  async function annuler(id: string) {
    const motif = window.prompt(
      "Motif de l'annulation, tel qu'il sera affiché à la personne (facultatif) :",
      '',
    );
    // `null` = la personne a fermé la fenêtre : on n'annule rien.
    if (motif === null) return;
    await apiRequest(`/visio/${id}/annuler`, { method: 'POST', body: { motif } });
    await recharger();
  }

  async function copier(chemin: string, id: string) {
    const url = `${window.location.origin}${chemin}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopie(id);
      setTimeout(() => setCopie(null), 2500);
    } catch {
      window.prompt('Copiez ce lien :', url);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Proposer un rendez-vous à distance</h2>
        <p className="mt-1 text-sm text-muted-foreground" lang="fr">
          Sur une intervention déjà acceptée. La personne reçoit un lien par courriel ; elle n’a
          ni compte à créer, ni logiciel à installer.
        </p>

        {planifiables.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground" lang="fr">
            Aucune intervention acceptée pour le moment. Un rendez-vous à distance se pose sur une
            prestation convenue — sinon le lien arriverait avant l’accord.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-foreground">L’intervention</span>
              <select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Choisir…</option>
                {planifiables.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.service?.title ?? 'Intervention'}
                    {i.account?.name ? ` — ${i.account.name}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-foreground">Date et heure</span>
              <Input
                type="datetime-local"
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
                className="mt-1.5"
              />
            </label>
            <label>
              <span className="text-sm font-medium text-foreground">Durée</span>
              <select
                value={duree}
                onChange={(e) => setDuree(Number(e.target.value))}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {[15, 30, 45, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {erreur && (
          <p className="mt-3 flex items-start gap-2 text-sm font-medium text-secondary" lang="fr">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {erreur}
          </p>
        )}

        {planifiables.length > 0 && (
          <Button
            className="mt-5"
            loading={envoi}
            disabled={!bookingId || !debut}
            onClick={() => void planifier()}
          >
            <CalendarClock className="size-4" />
            Poser le rendez-vous
          </Button>
        )}

        {/* ⚠ Cette phrase est la même que celle affichée à la famille. Les deux
            écrans doivent dire la même chose : c'est ce qui évite qu'un
            intervenant promette autre chose que ce que la page annonce. */}
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground" lang="fr">
          Séance de rééducation ou d’éducation spécialisée, en complément du parcours de la
          personne. Rien n’est enregistré, et le lien ne vaut que pour ce rendez-vous.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Mes rendez-vous</h2>
        {visios.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Aucun rendez-vous à distance pour l’instant.
          </p>
        ) : (
          visios.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-[240px] flex-1">
                <p className="text-sm font-medium text-foreground">
                  {v.intitule ?? 'Intervention'}
                  {v.demandeur ? ` — ${v.demandeur}` : ''}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {quand(v.debutPrevu)} · {v.dureeMinutes} min
                </p>
              </div>

              <Etiquette statut={v.statut} etat={v.etatFenetre} />

              <div className="flex flex-wrap items-center gap-2">
                {v.statut !== 'ANNULEE' && v.etatFenetre !== 'TERMINEE' && (
                  <>
                    <Button asChild size="sm" variant={v.etatFenetre === 'OUVERTE' ? 'primary' : 'outline'}>
                      <a href={v.lienIntervenant} target="_blank" rel="noopener noreferrer">
                        <Video className="size-4" />
                        Entrer
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void copier(v.lienDemandeur, v.id)}>
                      {copie === v.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copie === v.id ? 'Copié' : 'Lien de la personne'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void annuler(v.id)}>
                      <XCircle className="size-4" />
                      Annuler
                    </Button>
                  </>
                )}
                {v.statut === 'ANNULEE' && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Link2 className="size-3.5" aria-hidden />
                    Le lien ne fonctionne plus
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Etiquette({ statut, etat }: { statut: Visio['statut']; etat: Visio['etatFenetre'] }) {
  const [texte, classe] =
    statut === 'ANNULEE'
      ? ['Annulé', 'bg-muted text-muted-foreground']
      : statut === 'TERMINEE' || etat === 'TERMINEE'
        ? ['Terminé', 'bg-muted text-muted-foreground']
        : etat === 'OUVERTE'
          ? ['Salle ouverte', 'bg-success/15 text-success']
          : ['À venir', 'bg-primary/10 text-primary'];
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', classe)}>{texte}</span>
  );
}
