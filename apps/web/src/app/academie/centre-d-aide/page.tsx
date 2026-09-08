import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent } from '../_ui';

export const metadata: Metadata = {
  title: "Centre d'aide",
  description:
    "Comment se servir de Piloter : par où commencer, ce que contient un espace, ce que deviennent tes pièces, et comment nous joindre.",
  alternates: { canonical: '/academie/centre-d-aide' },
};

/**
 * `/centre-d-aide` — L'AIDE, ÉCRITE.
 *
 * Ce n'est pas un formulaire déguisé : ce sont les réponses aux questions
 * qu'on nous pose vraiment, lisibles sans compte. Écrire à quelqu'un reste
 * possible en bas, quand la situation sort du cadre.
 */
export default function CentreAide() {
  return (
    <>
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#5E7A6E]">Aide</p>
      <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#12312A] [text-wrap:balance] sm:text-5xl">
        Comment ça <Accent>marche</Accent>.
      </h1>
      <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-[#334A42]">
        Les réponses aux questions qu&apos;on nous pose le plus souvent. Si la tienne n&apos;y est pas, écris-nous : c&apos;est
        une vraie personne qui répond.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {RACCOURCIS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="rounded-2xl border border-[#DDEBE4] bg-white p-5 no-underline transition hover:border-[#1E9E6A]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E3F5EC] text-[#0F5F3E]" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={r.icone} />
              </svg>
            </span>
            <span className="mt-3 block text-[17px] font-extrabold text-[#12312A]">{r.titre}</span>
            <span className="mt-1 block text-[14px] leading-relaxed text-[#334A42]">{r.detail}</span>
          </Link>
        ))}
      </div>

      {SECTIONS.map((s) => (
        <section key={s.titre} className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#12312A] sm:text-3xl">{s.titre}</h2>
          <div className="mt-4 space-y-3">
            {s.questions.map((q) => (
              <details key={q.q} className="group rounded-2xl border border-[#DDEBE4] bg-white p-5 open:border-[#B7E4CE]">
                <summary className="cursor-pointer list-none text-[17px] font-extrabold text-[#12312A] marker:hidden">
                  {q.q}
                </summary>
                <p className="mt-2 max-w-[70ch] leading-relaxed text-[#334A42]">{q.r}</p>
                {q.lien ? (
                  <Link href={q.lien.href} className="mt-3 inline-block font-bold text-[#0F5F3E] underline underline-offset-4">
                    {q.lien.libelle}
                  </Link>
                ) : null}
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-10 rounded-[24px] border-2 border-[#B7E4CE] bg-[#E3F5EC] p-7 text-center sm:p-9">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-[#0F5F3E] sm:text-3xl">
          Ta question n&apos;est pas là ?
        </h2>
        <p className="mx-auto mt-3 max-w-[52ch] leading-relaxed text-[#0F5F3E]/85">
          Écris-nous en quelques lignes : on répond nous-mêmes, il n&apos;y a pas de service client automatique derrière.
        </p>
        <Link
          href="/academie/nous-contacter"
          className="mt-6 inline-flex rounded-xl bg-[#1E9E6A] px-6 py-3.5 text-base font-extrabold text-white no-underline transition hover:bg-[#17845A]"
        >
          Nous écrire
        </Link>
      </section>
    </>
  );
}

const RACCOURCIS = [
  {
    href: '/chemin',
    titre: 'Le chemin',
    detail: 'Les deux parcours en entier, étape par étape, sans rien ouvrir.',
    icone: 'M4 20V9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v0M4 20h16M8 4v4M16 16v4M12 10v10',
  },
  {
    href: '/academie/inscription',
    titre: 'Ouvrir un espace',
    detail: "Académie, association ou particulier : trois portes, une par situation.",
    icone: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  },
  {
    href: '/academie/nous-contacter',
    titre: 'Nous écrire',
    detail: 'Une vraie personne répond, en général sous deux jours ouvrés.',
    icone: 'M4 6h16v12H4zM4 7l8 6 8-6',
  },
];

const SECTIONS = [
  {
    titre: 'Commencer',
    questions: [
      {
        q: 'Par où je commence ?',
        r: "Par le chemin. Il montre les deux parcours en entier — celui d'une association, celui d'un organisme de formation — avec pour chaque étape ce qu'il te faut, comment faire, et comment savoir que c'est fini. Tu peux tout lire avant d'ouvrir quoi que ce soit.",
        lien: { libelle: 'Voir le chemin', href: '/chemin' },
      },
      {
        q: "Je n'ai pas encore d'organisme de formation. Je peux quand même m'en servir ?",
        r: "Oui : c'est l'espace particulier. Tu ouvres un compte à ton nom, tu suis le chemin, et tu déclareras l'activité en route. L'espace se transformera le jour où l'organisme existera.",
        lien: { libelle: 'Ouvrir un espace académie', href: '/academie/inscription' },
      },
      {
        q: 'Association ou académie, laquelle je choisis ?',
        r: "Une association loi 1901 est une forme juridique ; un organisme de formation est défini par sa déclaration d'activité à la DREETS. Une association qui forme est les deux à la fois : un même compte porte alors les deux espaces, sans rien mélanger.",
        lien: { libelle: 'Comparer les deux chemins', href: '/chemin' },
      },
      {
        q: 'Qualiopi, à quel moment ?',
        r: "Après la déclaration d'activité, jamais avant : la certification porte sur des pratiques qu'il faut avoir commencé à tenir. Sept critères, un certificateur accrédité, un audit initial puis un audit de surveillance. Elle conditionne l'accès aux financements publics et mutualisés.",
        lien: { libelle: "Le chemin de l'académie", href: '/academie/chemin' },
      },
      {
        q: "Le numéro de déclaration d'activité (NDA)",
        r: "Il se demande à la DREETS dans les trois mois qui suivent la première convention ou le premier contrat de formation. Ce n'est pas un agrément mais une déclaration — et elle devient caduque si le bilan pédagogique et financier n'est pas déposé chaque année.",
        lien: { libelle: "Le chemin de l'académie", href: '/academie/chemin' },
      },
    ],
  },
  {
    titre: "L'outil",
    questions: [
      {
        q: "C'est vraiment gratuit ?",
        r: "Oui. Pas d'essai limité, pas de compteur, pas de carte bancaire. L'outil est porté par ADéPA, association éducative de Melun, avec Toulali, centre de formation. Un don soutient l'association et ouvre droit à un reçu fiscal — rien n'est demandé pour se servir de l'outil.",
      },
      {
        q: 'Faut-il installer quelque chose ?',
        r: "Non. Le site s'ouvre dans un navigateur. Sur téléphone, tu peux l'ajouter à ton écran d'accueil : il s'ouvre alors comme une application, et ton chemin reste consultable même sans connexion. La proposition d'installation se réduit en une pastille si tu préfères le faire plus tard.",
      },
      {
        q: "Je ne trouve pas ma structure dans la recherche",
        r: "La recherche interroge les répertoires publics : le RNA pour les associations, SIRENE pour les SIRET, la liste publique des organismes de formation pour les numéros de déclaration d'activité. Une structure très récente peut ne pas encore y figurer — dans ce cas, saisis son nom à la main et complète les numéros plus tard.",
      },
    ],
  },
  {
    titre: 'Mes pièces et mes données',
    questions: [
      {
        q: 'Que deviennent les documents que je dépose ?',
        r: "Ils restent dans ton espace, ne servent à rien d'autre et ne sont jamais revendus. Tu peux les retirer quand tu veux. Les informations publiques affichées sur ta structure (nom, RNA, SIRET, NDA) viennent des répertoires de l'État, pas de ce que tu déposes.",
      },
      {
        q: 'Plusieurs personnes peuvent-elles travailler sur le même espace ?',
        r: "Oui. Depuis « Droits d'accès », tu invites les membres du bureau ou de l'équipe et tu choisis ce que chacun peut voir et modifier. Chacun garde son propre compte : on ne partage pas un mot de passe.",
        lien: { libelle: "Droits d'accès", href: '/academie/droits-acces' },
      },
      {
        q: 'Comment supprimer mon compte ?',
        r: "Écris-nous depuis l'adresse du compte : on te confirme ce qui sera effacé et ce que la loi nous oblige à conserver, puis on procède. Rien n'est supprimé sans ta demande explicite.",
        lien: { libelle: 'Nous écrire', href: '/academie/nous-contacter' },
      },
    ],
  },
];
