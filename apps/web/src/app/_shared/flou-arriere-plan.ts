'use client';

/**
 * LE FLOU D'ARRIÈRE-PLAN DES SALLES DE VISIO (24/09/2026, demande de Siham).
 *
 * Comme dans Teams : l'image de la personne reste nette, ce qu'il y a derrière
 * elle est flouté. Pour une famille qui se connecte depuis sa cuisine, ou un
 * professionnel depuis chez lui, c'est ce qui permet d'allumer la caméra sans
 * gêne.
 *
 * ⚠ TOUT SE PASSE DANS LE NAVIGATEUR. Le découpage personne / fond est fait
 * sur l'appareil (MediaPipe, WebAssembly), avant l'envoi : le serveur média ne
 * reçoit JAMAIS l'image non floutée, et rien n'est enregistré. Le moteur et le
 * modèle sont servis depuis notre domaine (`public/mediapipe/`) : aucune
 * requête vers un tiers pendant une séance.
 *
 * ⚠ ACTIVÉ PAR DÉFAUT QUAND L'APPAREIL LE PERMET, et le choix de la personne
 * est retenu sur cet appareil. Sur un navigateur trop ancien, le bouton ne
 * s'affiche pas : un bouton qui ne fait rien se lit comme une panne.
 *
 * ⚠ LE MODULE EST CHARGÉ À LA DEMANDE (`import()`), jamais au rendu serveur :
 * il touche à des API qui n'existent que dans un navigateur.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { RoomEvent, Track, type LocalVideoTrack, type Room } from 'livekit-client';

const CLE = 'lesextras_visio_flou';
const ACTIFS = {
  tasksVisionFileSet: '/mediapipe/wasm',
  modelAssetPath: '/mediapipe/selfie_segmenter.tflite',
};

function lirePreference(): boolean {
  try {
    return window.localStorage.getItem(CLE) !== 'non';
  } catch {
    return true;
  }
}

function ecrirePreference(actif: boolean) {
  try {
    window.localStorage.setItem(CLE, actif ? 'oui' : 'non');
  } catch {
    /* navigation privée : le choix vaut pour la séance */
  }
}

export function useFlouArrierePlan(room: Room) {
  const [supporte, setSupporte] = useState(false);
  const [actif, setActif] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const voulu = useRef(true);

  const pisteCamera = useCallback(
    () => room.localParticipant.getTrackPublication(Track.Source.Camera)?.track as LocalVideoTrack | undefined,
    [room],
  );

  const appliquer = useCallback(
    async (flou: boolean) => {
      const piste = pisteCamera();
      if (!piste) return;
      setEnCours(true);
      try {
        if (flou) {
          if (piste.getProcessor()) return setActif(true);
          const { BackgroundProcessor } = await import('@livekit/track-processors');
          await piste.setProcessor(BackgroundProcessor({ mode: 'background-blur', blurRadius: 14, assetPaths: ACTIFS }));
          setActif(true);
        } else {
          await piste.stopProcessor();
          setActif(false);
        }
      } catch (e) {
        // Un appareil qui n'y arrive pas garde son image telle quelle : la
        // séance passe avant le flou.
        console.warn('[visio] flou indisponible', e);
        setActif(false);
      } finally {
        setEnCours(false);
      }
    },
    [pisteCamera],
  );

  useEffect(() => {
    let vivant = true;
    voulu.current = lirePreference();
    import('@livekit/track-processors')
      .then(({ supportsBackgroundProcessors }) => vivant && setSupporte(supportsBackgroundProcessors()))
      .catch(() => undefined);
    // La caméra se publie après la connexion : on floute dès qu'elle arrive.
    const surPublication = (pub: { source?: Track.Source }) => {
      if (pub.source === Track.Source.Camera && voulu.current) void appliquer(true);
    };
    room.on(RoomEvent.LocalTrackPublished, surPublication);
    return () => {
      vivant = false;
      room.off(RoomEvent.LocalTrackPublished, surPublication);
    };
  }, [room, appliquer]);

  const basculer = useCallback(async () => {
    const suivant = !actif;
    voulu.current = suivant;
    ecrirePreference(suivant);
    await appliquer(suivant);
  }, [actif, appliquer]);

  return { supporte, actif, enCours, basculer };
}
