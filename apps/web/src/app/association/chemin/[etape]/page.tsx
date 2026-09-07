import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Carte, Encart, SousTitre } from '../../_ui';
import { chargerEtape, LIBELLES_GENRE, TEINTES_PARTIE, type DocumentEtape } from '../../_chemin';
import { etapesFaitesSiConnecte } from '../../_session';
import { BoutonEtapeFaite } from '../../BoutonEtapeFaite';

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

function IconeDocument({ genre }: { genre: DocumentEtape['genre'] }) {
  const commun = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold';
  if (genre === 'CERFA') return <span className={`${commun} bg-[#1D1B5C] text-white`}>CERFA</span>;
  if (genre === 'EXEMPLE') return <span className={`${commun} bg-[#F5B400] text-[#1D1B5C]`}>Ex.</span>;
  if (genre === 'MODELE') return <span className={`${commun} bg-[#ECEBFC] text-[#4338CA]`}>Mod.</span>;
  return <span className={`${commun} bg-[#E3F5EC] text-[#0F5F3E]`}>Site</span>;
}

export default async function EtapePage({ params }: { params: Promise<{ etape: string }> }) {
  const { etape: slug } = await params;
  const [d, connecte] = await Promise.all([chargerEtape(slug), etapesFaitesSiConnecte()]);
  if (!d) notFound();
  const { etape, partie, pieces, total, precedente, suivante } = d;
  const teinte = TEINTES_PARTIE[etape.partie];
  const faite = connecte?.faites.has(etape.slug) ?? false;
  const verifiee = connecte?.verifiees.has(etape.slug) ?? false;

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-[#6B6A8A]">
        <Link href="/chemin" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Le chemin
        </Link>
        <span className="mx-2">›</span>
        <Link href={`/chemin#partie-${partie.numero}`} className="underline underline-offset-4">
          {partie.numero}. {partie.titre}
        </Link>
        <span className="mx-2">›</span>
        <span>Étape {etape.numero}</span>
      </nav>

      <header className={`rounded-2xl border ${teinte.bord} ${teinte.fond} p-6 sm:p-8`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-extrabold text-white ${teinte.pastille}`}>
            {etape.numero}
          </span>
          <p className={`text-sm font-bold uppercase tracking-[0.12em] ${teinte.texte}`}>
            Étape {etape.numero} sur {total} · {partie.titre}
          </p>
          {faite ? <span className="rounded-full bg-[#1E9E6A] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">Fait</span> : null}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">{etape.titre}</h1>
        <p className="mt-3 max-w-[60ch] text-xl leading-relaxed text-[#1D1B5C]">{etape.enUnMot}</p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-8">
          <Carte>
            <SousTitre>Pourquoi c&apos;est important</SousTitre>
            <p className="text-lg leading-relaxed">{etape.pourquoi}</p>
          </Carte>

          <Carte>
            <SousTitre>Il te faut</SousTitre>
            <ul className="space-y-2">
              {etape.ilTeFaut.map((t) => (
                <li key={t} className="flex items-start gap-3 leading-relaxed">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#F5B400]" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Carte>

          <section>
            <SousTitre>Comment faire, pas à pas</SousTitre>
            <ol className="space-y-3">
              {etape.commentFaire.map((p, i) => (
                <li key={p.titre} className={`${CARTE} flex items-start gap-4 p-5`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4F46E5] text-lg font-extrabold text-white">{i + 1}</span>
                  <div>
                    <h3 className="text-lg font-extrabold leading-snug text-[#1D1B5C]">{p.titre}</h3>
                    <p className="mt-1 leading-relaxed">{p.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {etape.documents.length ? (
            <section>
              <SousTitre>Les documents</SousTitre>
              <p className="mb-4 -mt-2 text-sm text-[#6B6A8A]">
                Les formulaires officiels (CERFA) et les modèles viennent du service public. Les exemples sont à recopier : une
                association imaginaire les a remplis pour te montrer.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {etape.documents.map((doc) => {
                  const externe = doc.lien.startsWith('http');
                  return (
                    <li key={doc.lien}>
                      <a
                        href={doc.lien}
                        target={externe ? '_blank' : undefined}
                        rel={externe ? 'noopener' : undefined}
                        download={!externe ? true : undefined}
                        className={`${CARTE} flex h-full items-start gap-3 p-4 no-underline transition hover:border-[#4F46E5]`}
                      >
                        <IconeDocument genre={doc.genre} />
                        <span className="min-w-0">
                          <span className="block text-xs font-bold uppercase tracking-wide text-[#6B6A8A]">
                            {doc.numero ?? LIBELLES_GENRE[doc.genre]}
                          </span>
                          <span className="block font-extrabold leading-snug text-[#1D1B5C]">{doc.titre}</span>
                          <span className="mt-1 block text-sm leading-relaxed">{doc.aQuoiCaSert}</span>
                          <span className="mt-2 block text-sm font-bold text-[#4F46E5]">{externe ? 'Ouvrir ↗' : 'Télécharger ↓'}</span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <Encart ton="ok">
            <p className="text-sm font-bold uppercase tracking-[0.12em]">Quand c&apos;est fini</p>
            <p className="mt-1 text-lg font-bold leading-relaxed">{etape.quandCestFini}</p>
          </Encart>

          {etape.lexique.length ? (
            <Carte>
              <SousTitre>Les mots compliqués, expliqués</SousTitre>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {etape.lexique.map((m) => (
                  <div key={m.mot} className="rounded-xl bg-[#F5F4FC] p-3">
                    <dt className="font-extrabold text-[#1D1B5C]">{m.mot}</dt>
                    <dd className="mt-0.5 text-sm leading-relaxed">{m.explication}</dd>
                  </div>
                ))}
              </dl>
            </Carte>
          ) : null}

          {etape.renvois.length ? (
            <div className="text-sm text-[#6B6A8A]">
              <p className="font-bold">Pour aller plus loin</p>
              <ul className="mt-1 space-y-1">
                {etape.renvois.map((r) => (
                  <li key={r.lien}>
                    <a href={r.lien} target="_blank" rel="noopener" className="font-bold text-[#4F46E5] underline underline-offset-4">
                      {r.nom} ↗
                    </a>{' '}
                    — {r.pourQuoi}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <nav className="flex flex-col gap-3 sm:flex-row sm:justify-between" aria-label="Étape précédente et suivante">
            {precedente ? (
              <Link href={`/chemin/${precedente.slug}`} className={BTN_SECONDAIRE}>
                ← Étape {precedente.numero} : {precedente.titre}
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
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Carte>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-bold text-[#6B6A8A]">Combien de temps</dt>
                <dd className="mt-0.5 leading-relaxed text-[#1D1B5C]">{etape.dureeEstimee}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#6B6A8A]">Combien ça coûte</dt>
                <dd className="mt-0.5 leading-relaxed text-[#1D1B5C]">{etape.cout}</dd>
              </div>
              {pieces.length ? (
                <div>
                  <dt className="font-bold text-[#6B6A8A]">Ça ajoute au classeur</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {pieces.map((p) => (
                      <span key={p.code} className="rounded-full bg-[#ECEBFC] px-2.5 py-0.5 text-xs font-bold text-[#4338CA]">
                        {p.libelle}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Carte>

          <Carte>
            {connecte ? (
              <>
                <p className="mb-3 text-sm font-bold text-[#6B6A8A]">{connecte.nomAssociation}</p>
                <BoutonEtapeFaite slug={etape.slug} faite={faite} verifiee={verifiee} />
              </>
            ) : (
              <>
                <p className="font-extrabold text-[#1D1B5C]">Tu veux cocher cette étape ?</p>
                <p className="mt-1 text-sm leading-relaxed">Crée l&apos;espace de ton association : gratuit, et il retient où tu en es.</p>
                <Link href={`/connexion?next=${encodeURIComponent(`/chemin/${etape.slug}`)}`} className={`${BTN_PRIMAIRE} mt-3 w-full`}>
                  Se connecter
                </Link>
                <Link href="/inscription" className={`${BTN_SECONDAIRE} mt-2 w-full`}>
                  Créer mon espace
                </Link>
              </>
            )}
          </Carte>
        </aside>
      </div>
    </>
  );
}
