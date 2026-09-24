'use client';

import * as React from 'react';
import {
  Room,
  RoomEvent,
  Track,
  type LocalTrackPublication,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from 'livekit-client';
import { Mic, MicOff, PhoneOff, Video, VideoOff, TriangleAlert, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFlouArrierePlan } from '@/app/_shared/flou-arriere-plan';

/**
 * LA SALLE.
 *
 * ⚠⚠ RIEN N'EST ENREGISTRÉ, ET CE FICHIER EST L'UN DES DEUX ENDROITS OÙ CETTE
 * PROMESSE SE TIENT. L'autre est le jeton signé côté serveur
 * (`roomRecord: false`). Ici : aucun `MediaRecorder`, aucun envoi de piste
 * ailleurs que vers le serveur média. Le seul traitement d'image est le flou
 * d'arrière-plan (`_shared/flou-arriere-plan.ts`), fait sur l'appareil, image
 * par image, sans rien garder. Le jour où quelqu'un ajoute un bouton « enregistrer la séance », ce
 * n'est plus le même produit — c'est une décision d'association, pas une
 * fonctionnalité.
 *
 * ⚠ LE MÉDIA NE PASSE PAS PAR NOTRE API. Le navigateur se connecte directement
 * au serveur média avec le jeton que l'API a signé. Notre serveur ne voit ni
 * l'image ni le son, et ne pourrait pas les voir.
 *
 * ⚠ LES PISTES SE COUPENT À LA FERMETURE, TOUJOURS. Une caméra qui reste
 * allumée après la fin de la séance est le défaut le plus effrayant que puisse
 * avoir ce genre d'écran : `room.disconnect()` est appelé au démontage du
 * composant, y compris quand la personne ferme l'onglet.
 */
export function SalleVisio({
  acces,
  onQuitter,
}: {
  acces: { url: string; jeton: string; salle: string; identite: string };
  onQuitter: () => void;
}) {
  const [room] = React.useState(() => new Room({ adaptiveStream: true, dynacast: true }));
  const [connecte, setConnecte] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [micro, setMicro] = React.useState(true);
  const [camera, setCamera] = React.useState(true);
  const [enFace, setEnFace] = React.useState<string | null>(null);
  const flou = useFlouArrierePlan(room);

  const monFlux = React.useRef<HTMLVideoElement | null>(null);
  const fluxDistant = React.useRef<HTMLVideoElement | null>(null);
  const audioDistant = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    let vivant = true;

    function brancherDistant(
      piste: RemoteTrack,
      _pub: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) {
      if (!vivant) return;
      setEnFace(participant.name || participant.identity || 'Votre interlocuteur');
      if (piste.kind === Track.Kind.Video && fluxDistant.current) {
        piste.attach(fluxDistant.current);
      }
      if (piste.kind === Track.Kind.Audio && audioDistant.current) {
        piste.attach(audioDistant.current);
      }
    }

    function debrancherDistant(piste: RemoteTrack) {
      piste.detach();
    }

    room
      .on(RoomEvent.TrackSubscribed, brancherDistant)
      .on(RoomEvent.TrackUnsubscribed, debrancherDistant)
      .on(RoomEvent.ParticipantDisconnected, () => vivant && setEnFace(null))
      .on(RoomEvent.Disconnected, () => vivant && setConnecte(false))
      .on(RoomEvent.LocalTrackPublished, (pub: LocalTrackPublication) => {
        if (pub.kind === Track.Kind.Video && pub.track && monFlux.current) {
          pub.track.attach(monFlux.current);
        }
      });

    (async () => {
      try {
        await room.connect(acces.url, acces.jeton);
        if (!vivant) return;
        /*
         * ⚠ L'AUTORISATION DU MICRO ET DE LA CAMÉRA EST DEMANDÉE ICI, APRÈS la
         * connexion, et pas au chargement de la page. Un navigateur qui
         * réclame la caméra dès l'ouverture d'un lien reçu par courriel fait
         * fermer l'onglet — la demande doit arriver quand la personne vient
         * d'appuyer sur « Rejoindre », c'est-à-dire quand elle l'attend.
         */
        await room.localParticipant.enableCameraAndMicrophone();
        if (!vivant) return;
        setConnecte(true);
      } catch (e) {
        if (!vivant) return;
        /*
         * Le refus d'autorisation et l'échec de connexion ne se réparent pas
         * de la même façon : le premier se règle dans la barre d'adresse du
         * navigateur, le second en réessayant. Un message unique enverrait la
         * moitié des gens au mauvais endroit.
         */
        const nom = e instanceof Error ? e.name : '';
        setErreur(
          nom === 'NotAllowedError'
            ? "Votre navigateur n'a pas autorisé la caméra ou le micro. Cliquez sur l'icône de cadenas, à gauche de l'adresse, puis autorisez-les et rechargez la page."
            : "La connexion à la salle n'a pas abouti. Vérifiez votre connexion et réessayez ; si vous êtes sur le réseau d'un établissement, il arrive qu'il faille passer par un partage de connexion mobile.",
        );
      }
    })();

    return () => {
      vivant = false;
      // ⚠ TOUJOURS, y compris à la fermeture de l'onglet : c'est ce qui éteint
      // la caméra.
      void room.disconnect();
    };
  }, [room, acces.url, acces.jeton]);

  async function basculerMicro() {
    const actif = !micro;
    await room.localParticipant.setMicrophoneEnabled(actif);
    setMicro(actif);
  }

  async function basculerCamera() {
    const actif = !camera;
    await room.localParticipant.setCameraEnabled(actif);
    setCamera(actif);
  }

  function quitter() {
    void room.disconnect();
    onQuitter();
  }

  if (erreur) {
    return (
      <div className="rounded-2xl border border-secondary/35 bg-secondary/10 p-6">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <TriangleAlert className="size-4 shrink-0 text-secondary" aria-hidden />
          La séance n’a pas pu démarrer
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground" lang="fr">
          {erreur}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground/95 shadow-card">
        {/* Le flux d'en face, en grand. */}
        <video
          ref={fluxDistant}
          autoPlay
          playsInline
          className="aspect-video w-full bg-foreground object-cover"
        />
        <audio ref={audioDistant} autoPlay />

        {!enFace && (
          <div className="absolute inset-0 grid place-items-center bg-foreground/90 px-6 text-center">
            <div className="space-y-3">
              <Loader2 className="mx-auto size-6 animate-spin text-background/80" aria-hidden />
              <p className="text-sm text-background/90" lang="fr">
                {connecte
                  ? 'Vous êtes dans la salle. Nous attendons votre interlocuteur.'
                  : 'Connexion à la salle…'}
              </p>
            </div>
          </div>
        )}

        {/* Mon propre flux, en incrustation. Miroir : on se voit comme dans une
            glace, sinon on se trouve « à l'envers » et on bouge de travers. */}
        <video
          ref={monFlux}
          autoPlay
          playsInline
          muted
          className={cn(
            'absolute bottom-4 right-4 w-28 -scale-x-100 rounded-xl border border-background/30 object-cover shadow-lg sm:w-40',
            !camera && 'hidden',
          )}
        />

        {enFace && (
          <span className="absolute left-4 top-4 rounded-full bg-foreground/70 px-3 py-1 text-xs font-medium text-background">
            {enFace}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant={micro ? 'outline' : 'secondary'}
          onClick={() => void basculerMicro()}
          aria-pressed={!micro}
        >
          {micro ? <Mic className="size-4" /> : <MicOff className="size-4" />}
          {micro ? 'Micro activé' : 'Micro coupé'}
        </Button>
        <Button
          variant={camera ? 'outline' : 'secondary'}
          onClick={() => void basculerCamera()}
          aria-pressed={!camera}
        >
          {camera ? <Video className="size-4" /> : <VideoOff className="size-4" />}
          {camera ? 'Caméra activée' : 'Caméra coupée'}
        </Button>
        {flou.supporte && camera ? (
          <Button
            variant={flou.actif ? 'secondary' : 'outline'}
            onClick={() => void flou.basculer()}
            aria-pressed={flou.actif}
            loading={flou.enCours}
          >
            <Sparkles className="size-4" />
            {flou.actif ? 'Arrière-plan flouté' : 'Flouter l’arrière-plan'}
          </Button>
        ) : null}
        <Button variant="destructive" onClick={quitter}>
          <PhoneOff className="size-4" />
          Quitter
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground" lang="fr">
        Cette séance n’est pas enregistrée. Ni l’image, ni le son, ni leur transcription. Le flou de
        l’arrière-plan est fait sur votre appareil : l’image non floutée ne le quitte pas.
      </p>
    </div>
  );
}
