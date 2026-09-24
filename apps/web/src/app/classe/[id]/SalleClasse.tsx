'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteTrack,
  type TrackPublication,
} from 'livekit-client';
import { useFlouArrierePlan } from '@/app/_shared/flou-arriere-plan';

/**
 * LA SALLE D'UNE CLASSE VIRTUELLE, À PLUSIEURS.
 *
 * La visio en tête à tête de Les Extras (`/visio/:jeton`) ne connaît que deux
 * personnes. Une classe en réunit un groupe : une mosaïque, le partage d'écran
 * pour le formateur, et un fil de discussion qui passe par le même canal que
 * l'image.
 *
 * ⚠ RIEN N'EST ENREGISTRÉ. Aucun MediaRecorder ici, et le jeton signé par
 * l'API interdit l'enregistrement (`roomRecord: false`). Les messages du fil
 * ne sont gardés nulle part : ils vivent le temps de la classe, dans les
 * navigateurs des présents.
 *
 * ⚠ LES PISTES SE COUPENT AU DÉMONTAGE, TOUJOURS : `room.disconnect()` éteint
 * la caméra, y compris quand on ferme l'onglet.
 */
export interface AccesSalle {
  url: string;
  jeton: string;
  salle: string;
  identite: string;
  animateur: boolean;
}

interface Message {
  id: string;
  auteur: string;
  texte: string;
  moi: boolean;
}

const encodeur = new TextEncoder();
const decodeur = new TextDecoder();

export function SalleClasse({ acces, couleur, onQuitter }: { acces: AccesSalle; couleur: string; onQuitter: () => void }) {
  const [room] = useState(() => new Room({ adaptiveStream: true, dynacast: true }));
  const [version, setVersion] = useState(0);
  const [connecte, setConnecte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [micro, setMicro] = useState(true);
  const [camera, setCamera] = useState(true);
  const flou = useFlouArrierePlan(room);
  const [ecran, setEcran] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [saisie, setSaisie] = useState('');
  const [filOuvert, setFilOuvert] = useState(false);
  const audios = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let vivant = true;
    const rafraichir = () => vivant && setVersion((v) => v + 1);

    const brancherAudio = (piste: RemoteTrack) => {
      if (piste.kind === Track.Kind.Audio && audios.current) {
        const el = piste.attach();
        audios.current.appendChild(el);
      }
      rafraichir();
    };
    const debrancher = (piste: RemoteTrack) => {
      piste.detach().forEach((el) => el.remove());
      rafraichir();
    };

    room
      .on(RoomEvent.TrackSubscribed, brancherAudio)
      .on(RoomEvent.TrackUnsubscribed, debrancher)
      .on(RoomEvent.ParticipantConnected, rafraichir)
      .on(RoomEvent.ParticipantDisconnected, rafraichir)
      .on(RoomEvent.TrackMuted, rafraichir)
      .on(RoomEvent.TrackUnmuted, rafraichir)
      .on(RoomEvent.LocalTrackPublished, rafraichir)
      .on(RoomEvent.LocalTrackUnpublished, rafraichir)
      .on(RoomEvent.ActiveSpeakersChanged, rafraichir)
      .on(RoomEvent.Disconnected, () => vivant && setConnecte(false))
      .on(RoomEvent.DataReceived, (charge: Uint8Array, participant?: Participant) => {
        try {
          const m = JSON.parse(decodeur.decode(charge)) as { t?: string; texte?: string };
          if (m.t === 'fil' && typeof m.texte === 'string' && vivant) {
            setMessages((l) => [...l.slice(-199), { id: `${Date.now()}-${Math.random()}`, auteur: nomDe(participant), texte: m.texte!.slice(0, 1000), moi: false }]);
          }
        } catch {
          // Une donnée qui n'est pas un message du fil : on l'ignore.
        }
      });

    (async () => {
      try {
        await room.connect(acces.url, acces.jeton);
        if (!vivant) return;
        // L'autorisation de la caméra se demande APRÈS le clic sur « Entrer ».
        await room.localParticipant.enableCameraAndMicrophone();
        if (!vivant) return;
        setConnecte(true);
        rafraichir();
      } catch (e) {
        if (!vivant) return;
        const nom = e instanceof Error ? e.name : '';
        setErreur(
          nom === 'NotAllowedError'
            ? "Votre navigateur n'a pas autorisé la caméra ou le micro. Cliquez sur le cadenas à gauche de l'adresse, autorisez-les, puis rechargez la page."
            : "La connexion à la salle n'a pas abouti. Vérifiez votre connexion et réessayez ; sur le réseau d'un établissement, un partage de connexion mobile règle souvent le problème.",
        );
      }
    })();

    return () => {
      vivant = false;
      void room.disconnect();
    };
  }, [room, acces.url, acces.jeton]);

  async function basculerMicro() {
    await room.localParticipant.setMicrophoneEnabled(!micro);
    setMicro(!micro);
  }
  async function basculerCamera() {
    await room.localParticipant.setCameraEnabled(!camera);
    setCamera(!camera);
  }
  async function basculerEcran() {
    try {
      await room.localParticipant.setScreenShareEnabled(!ecran);
      setEcran(!ecran);
    } catch {
      // La personne a refermé la fenêtre de choix : rien à signaler.
    }
  }
  function quitter() {
    void room.disconnect();
    onQuitter();
  }
  async function envoyer(e: FormEvent) {
    e.preventDefault();
    const texte = saisie.trim();
    if (!texte) return;
    await room.localParticipant.publishData(encodeur.encode(JSON.stringify({ t: 'fil', texte })), { reliable: true });
    setMessages((l) => [...l.slice(-199), { id: `${Date.now()}`, auteur: 'Moi', texte, moi: true }]);
    setSaisie('');
  }

  if (erreur) {
    return (
      <div className="rounded-2xl border border-[#F3B0C2] bg-[#FDE7EC] p-6 text-[#8A1B3D]">
        <p className="font-extrabold">La classe n&apos;a pas pu démarrer</p>
        <p className="mt-2 leading-relaxed">{erreur}</p>
        <button type="button" onClick={onQuitter} className="mt-4 rounded-xl border-2 border-current px-4 py-2 font-bold">
          Revenir
        </button>
      </div>
    );
  }

  // Tout le monde, soi compris ; un écran partagé passe en grand au-dessus.
  const participants: Participant[] = [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
  const partage = participants.find((p) => p.getTrackPublication(Track.Source.ScreenShare)?.track);
  void version;

  return (
    <div className="flex min-h-[70vh] flex-col gap-3 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {!connecte ? <p className="rounded-xl bg-white/10 px-4 py-3 text-white">Connexion à la salle…</p> : null}
        {partage ? (
          <Video
            publication={partage.getTrackPublication(Track.Source.ScreenShare)}
            nom={`Écran de ${partage === room.localParticipant ? 'vous' : nomDe(partage)}`}
            grand
            version={version}
          />
        ) : null}
        <div className={`grid gap-3 ${participants.length <= 1 ? 'grid-cols-1' : participants.length <= 4 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
          {participants.map((p) => (
            <Video
              key={p.identity}
              publication={p.getTrackPublication(Track.Source.Camera)}
              nom={p === room.localParticipant ? `${acces.identite} (vous)` : nomDe(p)}
              parle={p.isSpeaking}
              coupe={!p.isMicrophoneEnabled}
              miroir={p === room.localParticipant}
              version={version}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#0B1F1A] p-3">
          <Bouton actif={micro} onClick={basculerMicro}>{micro ? 'Couper le micro' : 'Activer le micro'}</Bouton>
          <Bouton actif={camera} onClick={basculerCamera}>{camera ? 'Couper la caméra' : 'Activer la caméra'}</Bouton>
          {flou.supporte && camera ? (
            <Bouton actif onClick={() => void flou.basculer()}>
              {flou.enCours ? '…' : flou.actif ? 'Arrière-plan flouté' : 'Flouter l’arrière-plan'}
            </Bouton>
          ) : null}
          {acces.animateur ? <Bouton actif={!ecran} onClick={basculerEcran}>{ecran ? "Arrêter le partage" : "Partager l'écran"}</Bouton> : null}
          <Bouton actif onClick={() => setFilOuvert((o) => !o)}>
            Discussion{messages.length ? ` (${messages.length})` : ''}
          </Bouton>
          <button type="button" onClick={quitter} className="rounded-xl bg-[#C42B57] px-4 py-2.5 text-sm font-extrabold text-white">
            Quitter
          </button>
        </div>
      </div>

      {filOuvert ? (
        <aside className="flex w-full flex-col rounded-2xl bg-white lg:w-[320px]">
          <p className="border-b border-[#DDEBE4] px-4 py-3 font-extrabold text-[#12312A]">Discussion</p>
          <p className="px-4 pt-2 text-xs text-[#5E7A6E]">Les messages ne sont conservés nulle part : ils disparaissent à la fin de la classe.</p>
          <ul className="flex-1 space-y-2 overflow-y-auto px-4 py-3" style={{ maxHeight: '50vh' }}>
            {messages.map((m) => (
              <li key={m.id} className={m.moi ? 'text-right' : ''}>
                <p className="text-xs font-bold text-[#5E7A6E]">{m.auteur}</p>
                <p className="inline-block rounded-xl px-3 py-1.5 text-[15px]" style={m.moi ? { backgroundColor: couleur, color: '#fff' } : { backgroundColor: '#F1F5F3' }}>
                  {m.texte}
                </p>
              </li>
            ))}
          </ul>
          <form onSubmit={envoyer} className="flex gap-2 border-t border-[#DDEBE4] p-3">
            <input value={saisie} onChange={(e) => setSaisie(e.target.value)} maxLength={1000} placeholder="Écrire un message…" className="min-w-0 flex-1 rounded-xl border-2 border-[#DDEBE4] px-3 py-2 text-[15px] focus:outline-none" />
            <button type="submit" className="rounded-xl px-3 py-2 text-sm font-extrabold text-white" style={{ backgroundColor: couleur }}>
              Envoyer
            </button>
          </form>
        </aside>
      ) : null}
      <div ref={audios} className="hidden" aria-hidden="true" />
    </div>
  );
}

function nomDe(p?: Participant | null) {
  if (!p) return 'Participant';
  // Le serveur ajoute « · abcd » pour distinguer deux homonymes : on le garde discret.
  return (p.name || p.identity || 'Participant').replace(/ · [a-z0-9]{4}$/i, '');
}

function Bouton({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-bold ${actif ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-[#12312A]'}`}
    >
      {children}
    </button>
  );
}

function Video({
  publication,
  nom,
  grand,
  parle,
  coupe,
  miroir,
  version,
}: {
  publication?: TrackPublication;
  nom: string;
  grand?: boolean;
  parle?: boolean;
  coupe?: boolean;
  miroir?: boolean;
  version: number;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const piste = publication && !publication.isMuted ? publication.track : undefined;
  useEffect(() => {
    const el = ref.current;
    if (!piste || !el) return;
    piste.attach(el);
    return () => {
      piste.detach(el);
    };
  }, [piste, version]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#0B1F1A] ${grand ? 'aspect-video' : 'aspect-video'} ${parle ? 'ring-4 ring-[#1E9E6A]' : ''}`}
    >
      {piste ? (
        <video ref={ref} autoPlay playsInline muted className={`h-full w-full ${grand ? 'object-contain' : 'object-cover'} ${miroir ? '-scale-x-100' : ''}`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-extrabold text-white">
            {(nom.trim()[0] ?? '?').toUpperCase()}
          </span>
        </div>
      )}
      <span className="absolute bottom-2 left-2 rounded-lg bg-black/55 px-2 py-1 text-xs font-bold text-white">
        {coupe ? '🔇 ' : ''}
        {nom}
      </span>
    </div>
  );
}
