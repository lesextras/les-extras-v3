import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Pastille } from '../../_ui';
import { chargerEtape, chargerModeles, TEINTES_PARTIE } from '../../_chemin';
import { contexteChemin } from '../../_session';
import { preremplissageDeBase } from '../../_fabrique';
import { BoutonEtapeFaite } from '../../BoutonEtapeFaite';
import { ActionsEtape, type LienEspace } from './ActionsEtape';

export async function generateMetadata({ params }: { params: Promise<{ etape: string }> }): Promise<Metadata> {
  const { etape } = await params;
  const d = await chargerEtape(etape);
  if (!d) return { title: 'Étape introuvable' };
  return {
    title: `Étape ${d.etape.numero} : ${d.etape.titre}`,
    description: `${d.etape.enUnMot} ${d.etape.pourquoi}`,
    alternates: { canonical: `/chemin/${d.etape.slug}` },
  };
}

/** Les actions qui se font dans l'espace, pour les étapes sans papier à produire. */
const LIENS_ESPACE: Record<string, LienEspace[]> = {
  'les-adherents-et-les-cotisations': [
    { titre: 'Mon équipe et mes membres', detail: 'Ajoute tes membres et note qui est à jour de cotisation.', href: '/espace/repertoire', bouton: 'Ajouter un membre' },
  ],
  'la-premiere-assemblee-generale': [
    { titre: 'La date de l’assemblée', detail: 'Note la date : on te rappelle la prochaine un an après.', href: '/espace/association', bouton: 'Noter la date' },
  ],
  'le-projet-en-une-page': [
    { titre: 'Mes projets', detail: 'Note ici ce que tu veux faire : le texte se recopie dans tes demandes de subvention.', href: '/espace/projets', bouton: 'Ouvrir mes projets' },
  ],
  'le-premier-budget': [
    { titre: 'Ma gestion budgétaire', detail: 'Ce qui entre et ce qui sort, ligne par ligne : le budget part de là.', href: '/espace/secretariat#comptes', bouton: 'Ouvrir le cahier de comptes' },
  ],
  'trouver-le-premier-financeur': [
    { titre: 'Repérer une demande', detail: 'Note le financeur, ce qu’il demande, la date limite et le montant max : elle remonte sur l’accueil.', href: '/espace/dossiers', bouton: 'Créer la demande' },
    { titre: 'Trouver des financeurs', detail: 'Des pistes publiques, des fondations et des mécènes à partir de ton projet.', href: '/espace/financeurs', bouton: 'Chercher' },
    { titre: 'Mes projets', detail: 'L’idée que tu vas proposer se prépare dans mes projets.', href: '/espace/projets', bouton: 'Ouvrir mes projets' },
  ],
  'constituer-et-deposer-le-dossier': [
    { titre: 'Ma demande', detail: 'Les papiers à joindre sont cochés depuis ton classeur.', href: '/espace/dossiers', bouton: 'Ouvrir mes demandes' },
  ],
  'rendre-compte': [
    { titre: 'Le compte rendu', detail: 'Le budget réalisé et le bilan se remplissent dans la demande accordée.', href: '/espace/dossiers', bouton: 'Ouvrir mes demandes' },
    { titre: 'Le bilan du projet', detail: 'Ce que le projet a donné, noté une fois pour toutes.', href: '/espace/projets', bouton: 'Ouvrir mes projets' },
  ],
};

const premierePhrase = (texte: string) => {
  const m = /^(.+?[.!?])(\s|$)/.exec(texte.trim());
  return m ? m[1] : texte;
};

function Repli({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <details className={`${CARTE} group px-5 py-3`}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-[#1D1B5C] [&::-webkit-details-marker]:hidden">
        {titre}
        <span className="text-[#4F46E5] transition-transform duration-300 group-open:rotate-180" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

export default async function EtapePage({ params }: { params: Promise<{ etape: string }> }) {
  const { etape: slug } = await params;
  const [d, modelesTous, connecte] = await Promise.all([chargerEtape(slug), chargerModeles(), contexteChemin()]);
  if (!d) notFound();
  const { etape, partie, pieces, total, precedente, suivante } = d;
  const teinte = TEINTES_PARTIE[etape.partie];
  const faite = connecte?.faites.has(etape.slug) ?? false;
  const verifiee = connecte?.verifiees.has(etape.slug) ?? false;
  const modeles = modelesTous.filter((m) => m.etapes.includes(etape.slug));
  const prerempli = { ...preremplissageDeBase(), ...(connecte?.prerempli ?? {}) };

  return (
    <>
      <Link href="/chemin" className="mb-4 inline-flex items-center gap-2 rounded-xl border border-[#D9D6EE] bg-white px-3 py-1.5 text-sm font-bold text-[#1D1B5C] no-underline hover:border-[#4F46E5]">
        ‹ Le chemin
      </Link>

      {/* ------------------------------------------------------------ titre */}
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-extrabold text-white ${teinte.pastille}`}>{etape.numero}</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1D1B5C] sm:text-4xl">{etape.titre}</h1>
          {faite ? <Pastille ton="ok">Fait</Pastille> : <Pastille ton="attention">À faire</Pastille>}
        </div>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B6A8A]">
          <span>
            Étape {etape.numero} sur {total} · {partie.titre}
          </span>
          <span>{etape.dureeEstimee.split('.')[0]}</span>
          <span>{etape.cout}</span>
        </p>
      </header>

      {/* ---------------------------------------------- comment faire */}
      <section className={`${CARTE} mb-6 grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]`}>
        <div>
          <h2 className="text-xl font-extrabold text-[#1D1B5C]">Comment faire ?</h2>
          <div className="mt-3 rounded-xl bg-[#F5F4FC] p-4 leading-relaxed text-[#1D1B5C]">
            <p className="font-bold">{etape.enUnMot}</p>
            <p className="mt-2 text-sm text-[#3B3A66]">{premierePhrase(etape.pourquoi)}</p>
          </div>
        </div>
        <ol>
          {etape.commentFaire.map((p, i) => {
            const dernier = i === etape.commentFaire.length - 1;
            return (
              <li key={p.titre} className="relative flex gap-4 pb-4">
                {!dernier ? <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px border-l border-dashed border-[#C7C4F2]" aria-hidden="true" /> : null}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${i === 0 ? 'bg-[#ECEBFC] text-[#4F46E5] ring-2 ring-[#4F46E5]' : 'border border-[#C7C4F2] bg-white text-[#1D1B5C]'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-extrabold leading-snug text-[#1D1B5C]">{p.titre}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-[#3B3A66]">{p.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ------------------------------------------------------ actions */}
      <ActionsEtape
        slug={etape.slug}
        pieces={pieces}
        classeur={connecte ? connecte.classeur : null}
        modeles={modeles}
        documents={etape.documents}
        connecte={Boolean(connecte)}
        prerempli={prerempli}
        liens={LIENS_ESPACE[etape.slug] ?? []}
      />

      {/* ------------------------------------------------- c'est fait */}
      <section className="mt-8 flex flex-col items-center gap-3 text-center">
        <p className="max-w-[60ch] text-sm text-[#6B6A8A]">
          <span className="font-bold text-[#1D1B5C]">Quand c&apos;est fini : </span>
          {etape.quandCestFini}
        </p>
        {connecte ? (
          <div className="w-full max-w-sm">
            <BoutonEtapeFaite slug={etape.slug} faite={faite} verifiee={verifiee} />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/inscription" className={BTN_PRIMAIRE}>
              Créer mon espace pour cocher
            </Link>
            <Link href={`/connexion?next=${encodeURIComponent(`/chemin/${etape.slug}`)}`} className={BTN_SECONDAIRE}>
              Se connecter
            </Link>
          </div>
        )}
      </section>

      {/* ------------------------------------------------ en savoir plus */}
      <section className="mt-8 space-y-2">
        {etape.ilTeFaut.length ? (
          <Repli titre="Il te faut">
            <ul className="space-y-1.5 text-sm">
              {etape.ilTeFaut.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5B400]" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Repli>
        ) : null}
        <Repli titre="Pourquoi c’est important">
          <p className="text-sm leading-relaxed">{etape.pourquoi}</p>
          {etape.debloque ? (
            <p className="mt-2 text-sm leading-relaxed">
              <span className="font-bold text-[#6B6A8A]">Ça débloque : </span>
              {etape.debloque}
            </p>
          ) : null}
        </Repli>
        {etape.lexique.length ? (
          <Repli titre="Les mots compliqués">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {etape.lexique.map((m) => (
                <div key={m.mot} className="rounded-xl bg-[#F5F4FC] p-3">
                  <dt className="font-extrabold text-[#1D1B5C]">{m.mot}</dt>
                  <dd className="mt-0.5 leading-relaxed">{m.explication}</dd>
                </div>
              ))}
            </dl>
          </Repli>
        ) : null}
        {etape.renvois.length ? (
          <Repli titre="Pour aller plus loin">
            <ul className="space-y-1 text-sm">
              {etape.renvois.map((r) => (
                <li key={r.lien}>
                  <a href={r.lien} target="_blank" rel="noopener" className="font-bold text-[#4F46E5] underline underline-offset-4">
                    {r.nom} ↗
                  </a>{' '}
                  <span className="text-[#6B6A8A]">— {r.pourQuoi}</span>
                </li>
              ))}
            </ul>
          </Repli>
        ) : null}
      </section>

      {/* ------------------------------------------ précédente / suivante */}
      <nav className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between" aria-label="Étape précédente et suivante">
        {precedente ? (
          <Link href={`/chemin/${precedente.slug}`} className={BTN_SECONDAIRE}>
            ← Étape {precedente.numero}
          </Link>
        ) : (
          <span />
        )}
        {suivante ? (
          <Link href={`/chemin/${suivante.slug}`} className={BTN_PRIMAIRE}>
            Étape {suivante.numero} : {suivante.titre} →
          </Link>
        ) : (
          <Link href="/espace" className={BTN_PRIMAIRE}>
            Aller à mon espace →
          </Link>
        )}
      </nav>
    </>
  );
}
