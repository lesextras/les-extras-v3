'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/**
 * LA BOUSSOLE — le petit guide en bas à droite.
 *
 * Ce n'est pas un robot qui invente des réponses : c'est un guide écrit, qui
 * répond aux questions qu'on nous pose vraiment et qui emmène au bon endroit.
 * Il ne demande rien, il n'enregistre rien, et quand il ne sait pas, il le dit
 * et propose d'écrire à quelqu'un.
 *
 * Une bulle fermée par défaut : elle ne s'ouvre que si on la touche.
 */

type Espace = 'association' | 'academie';

interface Reponse {
  cle: string;
  question: string;
  reponse: string;
  lien?: { libelle: string; href: string };
  suite?: string[];
}

/* ---------------------------------------------------------- ce qu'il sait */

const COMMUNES: Reponse[] = [
  {
    cle: 'commencer',
    question: 'Par où je commence ?',
    reponse:
      "Par le chemin. Il montre les deux parcours en entier, étape par étape : celui d'une association et celui d'un organisme de formation. Tu peux tout lire avant d'ouvrir quoi que ce soit.",
    lien: { libelle: 'Voir le chemin', href: '/chemin' },
    suite: ['gratuit', 'difference', 'espace'],
  },
  {
    cle: 'gratuit',
    question: "C'est vraiment gratuit ?",
    reponse:
      "Oui. Pas d'essai limité, pas de compteur, pas de carte bancaire. L'outil est porté par ADéPA, association éducative de Melun, avec Toulali, centre de formation. Un don la soutient et ouvre droit à un reçu fiscal, mais rien n'est demandé pour se servir de l'outil.",
    suite: ['espace', 'donnees'],
  },
  {
    cle: 'difference',
    question: "Association ou académie, quelle différence ?",
    reponse:
      "Une association loi 1901 est une forme juridique. Un organisme de formation, lui, est défini par sa déclaration d'activité à la DREETS : une association qui forme reste une association et devient aussi organisme de formation. Les deux parcours existent, et un même compte peut porter les deux espaces sans rien mélanger.",
    lien: { libelle: 'Comparer les deux chemins', href: '/chemin' },
    suite: ['espace', 'qualiopi'],
  },
  {
    cle: 'espace',
    question: 'Comment j’ouvre mon espace ?',
    reponse:
      "En haut à droite, « Créer un espace » ouvre trois portes : particulier si tu n'as encore rien créé, association si elle existe déjà, académie si tu formes ou vas former. Le petit « i » à côté de chacune explique à qui elle s'adresse.",
    lien: { libelle: 'Créer mon espace', href: '/inscription?type=particulier' },
    suite: ['trouver', 'donnees'],
  },
  {
    cle: 'trouver',
    question: 'Je ne trouve pas ma structure',
    reponse:
      "La recherche interroge les répertoires publics (RNA pour les associations, SIRENE pour les SIRET, la liste publique des organismes de formation pour les NDA). Une structure très récente peut ne pas encore y figurer : dans ce cas, saisis son nom à la main, tu compléteras les numéros plus tard.",
    suite: ['humain'],
  },
  {
    cle: 'donnees',
    question: 'Que devient ce que je dépose ?',
    reponse:
      "Tes pièces restent dans ton espace, elles ne servent à rien d'autre et ne sont jamais revendues. Tu peux les retirer. Les informations publiques (nom, RNA, SIRET) viennent des répertoires de l'État, pas de toi.",
    suite: ['humain'],
  },
  {
    cle: 'humain',
    question: 'Je préfère parler à quelqu’un',
    reponse:
      "C'est la bonne idée quand une situation sort du cadre. Écris-nous : on répond nous-mêmes, il n'y a pas de service client automatique derrière.",
    lien: { libelle: 'Nous écrire', href: '/nous-contacter' },
  },
];

const ASSOCIATION: Reponse[] = [
  {
    cle: 'subvention',
    question: 'Comment demander une subvention ?',
    reponse:
      "C'est la fin du chemin, pas le début : il faut d'abord le récépissé, le SIRET, un compte, des comptes tenus et une assemblée générale. Ensuite viennent le projet en une page, le budget équilibré, le bon financeur, puis le CERFA 12156.",
    lien: { libelle: 'Les étapes de la subvention', href: '/association/chemin' },
    suite: ['papiers', 'humain'],
  },
  {
    cle: 'papiers',
    question: 'Quels papiers on me demandera ?',
    reponse:
      "Toujours les mêmes cinq : les statuts, le récépissé de déclaration, la parution au Journal officiel, l'avis SIRENE (SIRET) et la liste des dirigeants. Le classeur les range une bonne fois pour toutes.",
    lien: { libelle: 'Le chemin de l’association', href: '/association/chemin' },
    suite: ['subvention', 'humain'],
  },
];

const ACADEMIE: Reponse[] = [
  {
    cle: 'qualiopi',
    question: 'Qualiopi, c’est quoi ?',
    reponse:
      "Une certification qualité obligatoire pour accéder aux financements publics et mutualisés (OPCO, France Travail, CPF). Elle vient après la déclaration d'activité, pas avant : sept critères, un audit, un certificateur accrédité.",
    lien: { libelle: 'Le chemin de l’académie', href: '/academie/chemin' },
    suite: ['nda', 'humain'],
  },
  {
    cle: 'nda',
    question: 'Le numéro de déclaration d’activité ?',
    reponse:
      "Le NDA s'obtient auprès de la DREETS dans les trois mois qui suivent la première convention ou le premier contrat de formation. Il ne s'agit pas d'un agrément : c'est une déclaration, et elle devient caduque si aucun bilan pédagogique et financier n'est déposé.",
    lien: { libelle: 'Le chemin de l’académie', href: '/academie/chemin' },
    suite: ['qualiopi', 'humain'],
  },
];

/* ------------------------------------------------------------- apparence */

const TEINTES = {
  association: {
    bulle: 'bg-[#4F46E5] hover:bg-[#4338CA]',
    bord: 'border-[#E6E4F3]',
    entete: 'bg-[#1D1B5C]',
    encre: 'text-[#1D1B5C]',
    texte: 'text-[#3B3A66]',
    fondReponse: 'bg-[#F5F4FC]',
    proposition: 'border-[#C7C4F2] text-[#4338CA] hover:bg-[#ECEBFC]',
    lien: 'bg-[#4F46E5] hover:bg-[#4338CA]',
    bulleQuestion: 'bg-[#4F46E5]',
  },
  academie: {
    bulle: 'bg-[#0F5F3E] hover:bg-[#0B4A30]',
    bord: 'border-[#DDEBE4]',
    entete: 'bg-[#12312A]',
    encre: 'text-[#12312A]',
    texte: 'text-[#334A42]',
    fondReponse: 'bg-[#F2F7F5]',
    proposition: 'border-[#B7E4CE] text-[#0F5F3E] hover:bg-[#E3F5EC]',
    lien: 'bg-[#1E9E6A] hover:bg-[#17845A]',
    bulleQuestion: 'bg-[#1E9E6A]',
  },
} as const;

/* ------------------------------------------------------------------ le bot */

export function BotAide({ espace = 'association' }: { espace?: Espace }) {
  const [ouvert, setOuvert] = useState(false);
  const [fil, setFil] = useState<{ cle: string; question: string; reponse: Reponse }[]>([]);
  const bas = useRef<HTMLDivElement | null>(null);

  const t = TEINTES[espace];
  const toutes = [...COMMUNES, ...(espace === 'academie' ? ACADEMIE : ASSOCIATION)];
  const parCle = new Map(toutes.map((r) => [r.cle, r] as const));

  const depart = espace === 'academie' ? ['commencer', 'qualiopi', 'nda', 'gratuit', 'espace'] : ['commencer', 'gratuit', 'subvention', 'difference', 'espace'];
  const derniere = fil.length ? fil[fil.length - 1].reponse : null;
  const propositions = (derniere?.suite ?? depart).map((c) => parCle.get(c)).filter(Boolean) as Reponse[];

  useEffect(() => {
    if (ouvert) bas.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [fil, ouvert]);

  function demander(r: Reponse) {
    setFil((f) => [...f, { cle: `${r.cle}-${f.length}`, question: r.question, reponse: r }]);
  }

  return (
    <>
      {/* la bulle : fermée par défaut, toujours au même endroit */}
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label={ouvert ? "Fermer l'aide" : 'Ouvrir l’aide'}
        className={`fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition ${t.bulle}`}
      >
        {ouvert ? (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M15.5 8.5l-2 5-5 2 2-5z" />
          </svg>
        )}
      </button>

      {ouvert ? (
        <div
          role="dialog"
          aria-label="La boussole, aide de Piloter"
          className={`fixed bottom-20 right-4 z-40 flex max-h-[min(560px,72vh)] w-[min(94vw,380px)] flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_18px_50px_rgba(0,0,0,0.22)] ${t.bord}`}
        >
          <div className={`flex items-center gap-3 px-4 py-3 text-white ${t.entete}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M15.5 8.5l-2 5-5 2 2-5z" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-extrabold leading-tight">La boussole</span>
              <span className="block text-[12px] leading-tight text-white/70">Des réponses écrites, pas devinées</span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className={`rounded-2xl rounded-tl-sm px-3 py-2.5 text-[14px] leading-relaxed ${t.fondReponse} ${t.texte}`}>
              Bonjour. Je réponds aux questions les plus fréquentes et je t&apos;emmène au bon endroit. Choisis une question
              ci-dessous, et si la tienne n&apos;y est pas, on te répond par écrit.
            </p>

            {fil.map((m) => (
              <div key={m.cle} className="mt-4">
                <p className={`ml-auto max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-right text-[14px] font-bold text-white ${t.bulleQuestion}`}>
                  {m.question}
                </p>
                <p className={`mt-2 rounded-2xl rounded-tl-sm px-3 py-2.5 text-[14px] leading-relaxed ${t.fondReponse} ${t.texte}`}>
                  {m.reponse.reponse}
                </p>
                {m.reponse.lien ? (
                  <Link
                    href={m.reponse.lien.href}
                    onClick={() => setOuvert(false)}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-extrabold text-white no-underline transition ${t.lien}`}
                  >
                    {m.reponse.lien.libelle}
                    <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </div>
            ))}
            <div ref={bas} />
          </div>

          <div className={`border-t px-3 py-3 ${t.bord}`}>
            <div className="flex flex-wrap gap-1.5">
              {propositions.map((r) => (
                <button
                  key={r.cle}
                  type="button"
                  onClick={() => demander(r)}
                  className={`rounded-full border-2 bg-white px-3 py-1.5 text-[13px] font-bold transition ${t.proposition}`}
                >
                  {r.question}
                </button>
              ))}
            </div>
            {fil.length ? (
              <button
                type="button"
                onClick={() => setFil([])}
                className={`mt-2 text-[12px] font-bold underline underline-offset-4 ${t.texte}`}
              >
                Repartir du début
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
