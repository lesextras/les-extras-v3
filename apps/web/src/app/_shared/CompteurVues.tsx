'use client';

// L'AUDIENCE, SANS TRACEUR — 4/09/2026.
//
// Une requête par page vue, qui ne porte que le chemin, l'origine de la visite
// (celle de `lib/source.ts`, la même que sur l'inscription) et un drapeau
// « première page de la session ». Aucun identifiant de visiteur, aucun
// cookie : c'est ce qui garde cette mesure dans l'exemption de consentement de
// la CNIL, et c'est pour ça qu'elle ne passe PAS par `MesureAudience` (Google,
// soumis au consentement). Deux mesures, deux régimes, et celle-ci tourne
// toujours.
//
// Le drapeau de session vit en sessionStorage : il dit « cet onglet a déjà
// compté une visite », rien d'autre, et il ne quitte jamais le navigateur.
//
// Ce qui n'est PAS compté, et c'est délibéré : l'espace connecté et
// l'administration. On mesure ce que le public voit, pas ce que l'équipe fait.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sourceComplete } from '@/lib/source';

const CLE_VISITE = 'lx.visite.v1';
const HORS_MESURE = ['/dashboard', '/admin', '/marketplace', '/api', '/login', '/register', '/welcome'];

export function CompteurVues() {
  const chemin = usePathname();

  useEffect(() => {
    if (!chemin) return;
    if (HORS_MESURE.some((p) => chemin === p || chemin.startsWith(p + '/'))) return;
    // Les robots d'indexation n'exécutent pas ce code ; les aperçus (Lighthouse,
    // outils d'audit) le font, et ils se déclarent.
    if (typeof navigator !== 'undefined' && /bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)) return;

    let visite = false;
    try {
      if (!window.sessionStorage.getItem(CLE_VISITE)) {
        window.sessionStorage.setItem(CLE_VISITE, '1');
        visite = true;
      }
    } catch {
      /* stockage refusé : on compte la vue, pas la visite */
    }

    const origine = sourceComplete();
    const corps = JSON.stringify({
      chemin: chemin.slice(0, 200),
      source: origine.source,
      medium: origine.medium,
      campagne: origine.campaign,
      visite,
    });

    // `keepalive` : la requête survit à une navigation immédiate. Pas de
    // `apiRequest` ici — on ne veut ni jeton ni en-tête de compte sur une
    // mesure anonyme.
    fetch('/api/proxy/public/trafic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: corps,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => undefined);
  }, [chemin]);

  return null;
}
