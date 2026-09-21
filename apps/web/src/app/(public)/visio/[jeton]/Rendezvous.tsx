'use client';

import * as React from 'react';
import { CalendarClock, ShieldCheck, TriangleAlert, Video } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SalleVisio } from './SalleVisio';

interface Etat {
  role: 'intervenant' | 'demandeur';
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  debutPrevu: string;
  dureeMinutes: number;
  ouvertureLe: string;
  fermetureLe: string;
  etat: 'TROP_TOT' | 'OUVERTE' | 'TERMINEE';
  annulationMotif: string | null;
  enFace: string | null;
  salleOuverte: boolean;
  nature: string;
}

interface Acces {
  url: string;
  jeton: string;
  salle: string;
  identite: string;
}

const heure = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * LA SALLE D'ATTENTE, PUIS LA SALLE.
 *
 * ⚠⚠ CETTE PAGE S'OUVRE SANS COMPTE, ET C'EST DÉLIBÉRÉ. Une famille qui reçoit
 * un lien de rendez-vous n'a aucune raison de créer un compte pour parler
 * vingt minutes à une psychomotricienne. Ce qui tient la porte, ce n'est pas
 * une session : c'est un jeton tiré au hasard, une fenêtre d'ouverture bornée
 * autour du rendez-vous, et un plafond de débit côté serveur.
 *
 * ⚠ ON NE DEMANDE RIEN D'AUTRE QU'UN PRÉNOM. Pas de nom de famille, pas de
 * date de naissance, pas de motif. Le prénom sert uniquement à ce que
 * l'intervenant sache qui vient d'entrer, et il est affiché tel quel dans la
 * salle — c'est la seule donnée que cette page collecte.
 *
 * ⚠ LA PAGE RÉPÈTE CE QUE CE RENDEZ-VOUS N'EST PAS. C'est le moment où l'on
 * croit le plus facilement qu'on va voir un médecin, et le dire ici coûte
 * trois lignes.
 */
export function Rendezvous({ jeton }: { jeton: string }) {
  const [etat, setEtat] = React.useState<Etat | null>(null);
  const [introuvable, setIntrouvable] = React.useState(false);
  const [prenom, setPrenom] = React.useState('');
  const [acces, setAcces] = React.useState<Acces | null>(null);
  const [envoi, setEnvoi] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  const charger = React.useCallback(async () => {
    try {
      const r = await apiRequest<Etat>(`/public/visio/${encodeURIComponent(jeton)}`);
      setEtat(r);
    } catch {
      setIntrouvable(true);
    }
  }, [jeton]);

  React.useEffect(() => {
    void charger();
  }, [charger]);

  /*
   * ⚠ LE RAFRAÎCHISSEMENT S'ARRÊTE DÈS QU'ON EST DANS LA SALLE. Continuer à
   * interroger le serveur pendant la séance ne sert à rien et ferait tourner
   * une requête toutes les quinze secondes pendant quarante-cinq minutes, sur
   * la connexion mobile d'une famille.
   */
  React.useEffect(() => {
    if (acces || introuvable) return;
    const t = setInterval(() => void charger(), 15_000);
    return () => clearInterval(t);
  }, [acces, introuvable, charger]);

  async function entrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await apiRequest<Acces>(`/public/visio/${encodeURIComponent(jeton)}/rejoindre`, {
        method: 'POST',
        body: { prenom: prenom.trim() || undefined },
      });
      setAcces(r);
    } catch (e) {
      setErreur(
        e instanceof Error
          ? e.message
          : "Nous n'avons pas pu ouvrir la salle. Réessayez dans un instant.",
      );
    } finally {
      setEnvoi(false);
    }
  }

  if (introuvable) {
    return (
      <Encart ton="alerte" titre="Ce lien n’est pas valide">
        Il a peut-être été recopié en partie, ou il appartient à un rendez-vous qui n’existe plus.
        Demandez un nouveau lien à votre intervenant.
      </Encart>
    );
  }

  if (!etat) {
    return <p className="text-sm text-muted-foreground">Chargement du rendez-vous…</p>;
  }

  if (acces) {
    return <SalleVisio acces={acces} onQuitter={() => setAcces(null)} />;
  }

  if (etat.statut === 'ANNULEE') {
    return (
      <Encart ton="alerte" titre="Ce rendez-vous a été annulé">
        {etat.annulationMotif ?? 'Votre intervenant vous proposera un autre créneau.'}
      </Encart>
    );
  }

  if (etat.etat === 'TERMINEE' || etat.statut === 'TERMINEE') {
    return (
      <Encart titre="Ce rendez-vous est terminé">
        Le lien ne fonctionne plus, et c’est voulu : il ne vaut que pour ce rendez-vous. Pour un
        nouveau créneau, écrivez à votre intervenant.
      </Encart>
    );
  }

  const ouverte = etat.etat === 'OUVERTE';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden />
          {heure(etat.debutPrevu)} · {etat.dureeMinutes} minutes
        </p>
        {etat.enFace && (
          <p className="mt-3 text-xl font-medium text-foreground">
            {etat.role === 'demandeur' ? 'Avec ' : 'Rendez-vous avec '}
            {etat.enFace}
          </p>
        )}

        {ouverte ? (
          <div className="mt-5 space-y-4">
            <div className="max-w-xs">
              <label htmlFor="prenom" className="text-sm font-medium text-foreground">
                Votre prénom
              </label>
              <Input
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Camille"
                maxLength={40}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground" lang="fr">
                Il s’affiche à l’écran de votre interlocuteur. Rien d’autre ne vous est demandé.
              </p>
            </div>
            {erreur && (
              <p className="text-sm font-medium text-secondary" lang="fr">
                {erreur}
              </p>
            )}
            <Button size="lg" loading={envoi} onClick={() => void entrer()}>
              <Video className="size-4" />
              Rejoindre le rendez-vous
            </Button>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium text-foreground">La salle n’est pas encore ouverte</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground" lang="fr">
              Elle ouvre quinze minutes avant l’heure prévue, soit à{' '}
              <strong className="font-semibold text-foreground">
                {new Date(etat.ouvertureLe).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
              . Vous pouvez laisser cette page ouverte : elle se mettra à jour toute seule.
            </p>
          </div>
        )}
      </div>

      {/*
        ⚠ CES DEUX ENCARTS NE SONT PAS DE LA DÉCORATION JURIDIQUE. Le premier
        dit ce que la séance n'est pas, au moment exact où l'on pourrait le
        croire. Le second dit ce qui se passe techniquement, parce que « est-ce
        que c'est enregistré ? » est la première question que pose un parent.
      */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Encart titre="Ce que cette séance est">
          {etat.nature}
        </Encart>
        <Encart titre="Rien n’est enregistré" icone={ShieldCheck}>
          Ni l’image, ni le son, ni leur transcription. Le lien vous est personnel et ne vaut que
          pour ce rendez-vous.
        </Encart>
      </div>
    </div>
  );
}

function Encart({
  titre,
  children,
  ton = 'neutre',
  icone: Icone,
}: {
  titre: string;
  children: React.ReactNode;
  ton?: 'neutre' | 'alerte';
  icone?: React.ElementType;
}) {
  const Icon = Icone ?? (ton === 'alerte' ? TriangleAlert : undefined);
  return (
    <div
      className={
        ton === 'alerte'
          ? 'rounded-2xl border border-secondary/35 bg-secondary/10 p-5'
          : 'rounded-2xl border border-border bg-card p-5'
      }
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {Icon && <Icon className="size-4 shrink-0 text-primary" aria-hidden />}
        {titre}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground" lang="fr">
        {children}
      </p>
    </div>
  );
}
