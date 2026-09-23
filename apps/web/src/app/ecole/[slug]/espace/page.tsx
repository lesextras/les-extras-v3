import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CoqueEcole, formaterDate } from '../../_espace/coque';
import { ecoleDuSlug, moiSurEcole } from '../../_espace/donnees';
import { Profil } from './Profil';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mes formations', robots: { index: false, follow: false } };

/**
 * `/ecole/<slug>/espace` : L'ESPACE APPRENANT.
 *
 * Toutes les formations de la personne dans cette école, avec leur
 * progression, leur date de fin d'accès et les devoirs en attente ; puis les
 * autres formations publiées, comme sous « Mes formations » chez Teachizy.
 */
export default async function PageEspace({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { slug } = await params;
  const { onglet } = await searchParams;
  const ecole = await ecoleDuSlug(slug);
  if (!ecole) notFound();
  const moi = await moiSurEcole(slug);
  if (!moi) redirect(`/ecole/${slug}/connexion`);
  const couleur = moi.ecole.couleur || '#0F5F3E';

  if (onglet === 'profil') {
    return (
      <CoqueEcole ecole={moi.ecole} actif="profil" connecte>
        <Profil apprenant={moi.apprenant} couleur={couleur} slug={slug} />
      </CoqueEcole>
    );
  }

  const enCours = moi.formations.filter((f) => !f.expire && f.statut !== 'SUSPENDUE');
  const fermees = moi.formations.filter((f) => f.expire || f.statut === 'SUSPENDUE');

  return (
    <CoqueEcole ecole={moi.ecole} actif="formations" connecte>
      <h1 className="text-3xl font-extrabold tracking-tight text-[#12312A] sm:text-4xl">
        Bonjour{moi.apprenant.prenom ? ` ${moi.apprenant.prenom}` : ''}
      </h1>
      <p className="mt-2 text-lg leading-relaxed">
        {enCours.length
          ? `Vous suivez ${enCours.length} formation${enCours.length > 1 ? 's' : ''}.`
          : 'Vous n’avez pas de formation en cours pour le moment.'}
      </p>

      {enCours.length ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enCours.map((f) => (
            <li key={f.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#DDEBE4] bg-white">
              {f.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.imageUrl} alt="" className="h-36 w-full object-cover" />
              ) : (
                <div className="h-36 w-full" style={{ backgroundColor: `${couleur}1A` }} />
              )}
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg font-extrabold leading-tight tracking-tight text-[#12312A]">{f.titre}</h2>
                {f.sousTitre ? <p className="mt-1 line-clamp-2 text-[15px] leading-relaxed">{f.sousTitre}</p> : null}
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E6EFEA]">
                    <div className="h-full rounded-full" style={{ width: `${f.progression}%`, backgroundColor: couleur }} />
                  </div>
                  <span className="tabular-nums text-sm font-bold">{f.progression} %</span>
                </div>
                <ul className="mt-3 grid gap-1 text-sm text-[#5E7A6E]">
                  {f.statut === 'TERMINEE' ? <li>Terminée le {formaterDate(f.termineLe)}</li> : null}
                  {f.expireLe ? <li>Accès jusqu’au {formaterDate(f.expireLe)}</li> : null}
                  {f.devoirs.aReprendre ? <li className="font-bold text-[#7C3E06]">{f.devoirs.aReprendre} devoir{f.devoirs.aReprendre > 1 ? 's' : ''} à reprendre</li> : null}
                  {f.devoirs.aCorriger ? <li>{f.devoirs.aCorriger} devoir{f.devoirs.aCorriger > 1 ? 's' : ''} en correction</li> : null}
                </ul>
                <Link href={f.lien} className="mt-auto inline-block rounded-xl px-4 py-2.5 text-center text-[15px] font-extrabold text-white no-underline" style={{ backgroundColor: couleur, marginTop: '1rem' }}>
                  {f.progression > 0 ? 'Reprendre' : 'Commencer'}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {fermees.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-extrabold tracking-tight text-[#12312A]">Accès terminés ou suspendus</h2>
          <ul className="mt-3 grid gap-2">
            {fermees.map((f) => (
              <li key={f.id} className="rounded-xl border border-[#DDEBE4] bg-white px-4 py-3 text-[15px]">
                <strong className="text-[#12312A]">{f.titre}</strong>
                <span className="text-[#5E7A6E]">
                  {' · '}
                  {f.statut === 'SUSPENDUE' ? 'accès suspendu' : `accès terminé le ${formaterDate(f.expireLe)}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {moi.catalogue.length ? (
        <section className="mt-12">
          <h2 className="text-xl font-extrabold tracking-tight text-[#12312A]">Les autres formations de {moi.ecole.nom}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moi.catalogue.map((c) => (
              <li key={c.slug} className="rounded-2xl border border-[#DDEBE4] bg-white p-5">
                <Link href={`/cours/${c.slug}`} className="no-underline">
                  <h3 className="text-lg font-extrabold leading-tight tracking-tight text-[#12312A]">{c.titre}</h3>
                  {c.sousTitre ? <p className="mt-1 line-clamp-2 text-[15px] leading-relaxed text-[#334A42]">{c.sousTitre}</p> : null}
                  <p className="mt-3 font-extrabold" style={{ color: couleur }}>
                    {c.gratuit || c.prixCents === 0 ? 'Gratuit' : `${(c.prixCents / 100).toLocaleString('fr-FR')} €`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </CoqueEcole>
  );
}
