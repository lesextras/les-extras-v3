'use client';

/**
 * CHARGEMENT DU TAG GOOGLE ADS — ET DE LUI SEUL.
 *
 * Le script n'est injecté qu'après un « oui » explicite. Avant cela, la seule
 * chose posée dans la page est le mode consentement de Google, déclaré en
 * REFUS sur tous les usages : c'est ce que demande Consent Mode v2, et cela ne
 * charge rien ni ne contacte personne.
 *
 * Pourquoi déclarer un refus plutôt que ne rien déclarer : si le tag arrivait
 * un jour par un autre chemin (extension, balise oubliée), il trouverait un
 * refus déjà en place au lieu d'un consentement supposé.
 */

import { useEffect, useState } from 'react';
import {
  identifiantAds,
  lireConsentement,
  mesureConfiguree,
  surChangement,
  type Consentement,
} from '@/lib/consentement';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Crée la file `dataLayer` et la fonction `gtag` sans rien télécharger. */
function amorcer() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
}

function declarerRefusParDefaut() {
  amorcer();
  window.gtag!('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });
}

function accorder() {
  amorcer();
  window.gtag!('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  });
}

const ID_BALISE = 'lx-gtag';

export function MesureAudience() {
  const [etat, setEtat] = useState<Consentement>('inconnu');

  useEffect(() => {
    if (!mesureConfiguree()) return;
    declarerRefusParDefaut();
    setEtat(lireConsentement());
    return surChangement(setEtat);
  }, []);

  useEffect(() => {
    if (!mesureConfiguree() || etat !== 'accepte') return;
    accorder();
    if (document.getElementById(ID_BALISE)) return; // déjà chargé

    const id = identifiantAds();
    const s = document.createElement('script');
    s.id = ID_BALISE;
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);

    window.gtag!('js', new Date());
    // `anonymize_ip` n'a plus d'effet sur GA4 mais reste lu par les balises
    // Ads héritées ; le garder ne coûte rien et ne peut que réduire la donnée.
    window.gtag!('config', id, { anonymize_ip: true });
  }, [etat]);

  return null;
}
