import Link from 'next/link';
import type { Metadata } from 'next';
import { descriptionSeo } from '@/lib/meta';
import { titrePilote } from '../../../_pilote-seo';
import { notFound } from 'next/navigation';
import { chargerChemin, chargerEtape, tempsDe, TEINTES } from '../../_chemin';
import { InfosObligation } from '../../../_shared/chemin-obligations';
import { academieConnectee, apiAcademie, sessionAcademie } from '../../_session';
import { Accent, CARTE, Encart, Pastille, Titre } from '../../_ui';
import type { EspaceAcademie } from '../../_types';
import { BoutonEtape } from './BoutonEtape';

interface Params {
  params: Promise<{ etape: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { etape: slug } = await params;
  const d = await chargerEtape(slug);
  if (!d) return { title: 'Étape introuvable' };
  return {
    title: titrePilote(d.etape.titre, 'Piloter mon académie'),
    description: descriptionSeo(d.etape.resume),
    alternates: { canonical: `/academie/chemin/${d.etape.slug}` },
  };
}

/** UNE ÉTAPE DU CHEMIN : ce qu'elle est, ce qu'il faut pour passer à la suivante. */
export default async function EtapePage({ params }: Params) {
  const { etape: slug } = await params;
  const [d, chemin] = await Promise.all([chargerEtape(slug), chargerChemin()]);
  if (!d) notFound();

  const { etape, precedente, suivante, total } = d;
  const teinte = TEINTES[tempsDe(etape.numero).titre];

  let faite = false;
  let automatique = false;
  let pasConcerne = false;
  let connectee = false;
  let faites = new Set<string>();
  if (await academieConnectee()) {
    connectee = true;
    const s = await sessionAcademie(`/academie/chemin/${slug}`);
    const { data } = await apiAcademie<EspaceAcademie>(s, '/academie/espace');
    const trouvee = data?.chemin.etapes.find((e) => e.slug === slug);
    faites = new Set((data?.chemin.etapes ?? []).filter((e) => e.faite).map((e) => e.slug));
    faite = Boolean(trouvee?.faite);
    automatique = Boolean(trouvee?.automatique);
    pasConcerne = Boolean(trouvee?.faite && trouvee?.pasConcerne);
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <p className="mb-4 text-sm font-bold text-[#5E7A6E]">
        <Link href="/academie/chemin" className="text-[#0F5F3E] underline underline-offset-4">
          Le chemin
        </Link>{' '}
        · étape {etape.numero} sur {total}
      </p>

      <Titre surtitre={tempsDe(etape.numero).titre} sousTitre={etape.resume}>
        <span className={`mr-3 inline-flex h-11 w-11 items-center justify-center rounded-full align-middle text-lg ${teinte.pastille} font-extrabold text-white`}>
          {etape.numero}
        </span>
        {etape.titre}
      </Titre>

      {/* Obligatoire ? Quand ? Quelle échéance ? Que faire avant ? */}
      <InfosObligation etape={etape} etapes={chemin?.etapes ?? []} faites={connectee ? faites : undefined} theme="academie" />

      <div className={`${CARTE} mb-6 p-5 sm:p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#5E7A6E]">Pour passer à la suivante</h2>
        <p className="mt-2 text-lg font-extrabold leading-snug text-[#12312A]">{etape.pourPasser}</p>
        {faite || etape.chaqueAnnee ? (
          <p className="mt-3 flex flex-wrap gap-2">
            {faite ? <Pastille ton="ok">{automatique ? "cochée d'elle-même" : pasConcerne ? 'pas concerné' : 'faite'}</Pastille> : null}
            {etape.chaqueAnnee ? (
              <span className="inline-flex items-center rounded-full bg-[#E0F4F3] px-2.5 py-0.5 text-xs font-bold text-[#115E59]">Chaque année</span>
            ) : null}
          </p>
        ) : null}
      </div>

      {etape.liens?.length ? (
        <div className={`${CARTE} mb-6 p-5 sm:p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#5E7A6E]">Les pages officielles</h2>
          <ul className="mt-2 space-y-1.5">
            {etape.liens.map((l) => (
              <li key={l.lien}>
                <a href={l.lien} target="_blank" rel="noopener" className="font-bold text-[#0F5F3E] underline underline-offset-4">
                  {l.nom} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {connectee ? (
        automatique ? (
          <Encart ton="ok">
            Cette étape s&apos;est cochée toute seule : la donnée est arrivée dans ta fiche. Rien à faire de plus.
          </Encart>
        ) : (
          <BoutonEtape
            slug={slug}
            faite={faite}
            pasConcerne={pasConcerne}
            peutNePasConcerner={Boolean(etape.peutNePasConcerner)}
            chaqueAnnee={Boolean(etape.chaqueAnnee)}
          />
        )
      ) : (
        <Encart ton="info">
          Avec un espace, cette étape se coche, et plusieurs se cochent toutes seules dès que la donnée arrive.{' '}
          <Link href="/academie/inscription" className="font-bold underline underline-offset-4">
            Ouvrir mon espace
          </Link>
          , c&apos;est gratuit.
        </Encart>
      )}

      <nav className="mt-10 flex flex-wrap justify-between gap-3 border-t border-[#DDEBE4] pt-6">
        {precedente ? (
          <Link href={`/academie/chemin/${precedente.slug}`} className="text-sm font-bold text-[#0F5F3E] no-underline hover:underline">
            ← {precedente.numero}. {precedente.titre}
          </Link>
        ) : (
          <span />
        )}
        {suivante ? (
          <Link href={`/academie/chemin/${suivante.slug}`} className="text-sm font-bold text-[#0F5F3E] no-underline hover:underline">
            {suivante.numero}. {suivante.titre} →
          </Link>
        ) : (
          <Link href="/academie/certification" className="text-sm font-bold text-[#0F5F3E] no-underline hover:underline">
            Ma certification →
          </Link>
        )}
      </nav>

      <p className="mt-8 text-xs leading-relaxed text-[#5E7A6E]">
        Ces repères sont une aide à la préparation, pas un avis juridique. La déclaration d&apos;activité s&apos;instruit auprès
        de la <Accent>DREETS</Accent> de ta région, et la certification auprès d&apos;un organisme accrédité.
      </p>
    </div>
  );
}
