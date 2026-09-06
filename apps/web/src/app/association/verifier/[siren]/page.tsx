import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../../_shared/server';
import { Barre, Encart, Pastille, Titre, formaterDate } from '../../_ui';

export const dynamic = 'force-dynamic';

interface TypeDePiece {
  code: string;
  libelle: string;
  categorie: string;
  pourquoi: string;
  ouLaTrouver: string;
  dureeValiditeMois?: number;
  parExercice?: boolean;
  source: string;
  verifieLe: string;
}

interface Fiche {
  association: {
    nom: string;
    sigle: string | null;
    siren: string;
    siret: string | null;
    rna: string | null;
    natureLibelle: string;
    adresse: string | null;
    codePostal: string | null;
    commune: string | null;
    dateCreation: string | null;
    effectifLibelle: string | null;
    ess: boolean;
    active: boolean;
  };
  classeur: { type: TypeDePiece; etat: 'DEDUITE' | 'A_DEPOSER'; preuve?: string }[];
  completude: {
    dispositif: { code: string; nom: string; financeur: string; description: string; modeDepot: string; lien?: string };
    exigees: number;
    deduites: number;
    manquantes: TypeDePiece[];
    pourcentage: number;
  }[];
  versionReferentiel: string;
  etapesVerifiees: { numero: number; slug: string; titre: string }[];
}

const CATEGORIES: Record<string, string> = {
  IDENTITE: "Pièces d'identité",
  GOUVERNANCE: 'Vie de l\'association',
  FINANCIER: 'Pièces financières',
  ASSURANCE: 'Assurance',
  AGREMENT: 'Agréments',
  RH: 'Employeur',
};

async function charger(siren: string) {
  if (!/^\d{9}$/.test(siren)) return null;
  const { data } = await fetchPublic<Fiche>(`/public/association/fiche/${siren}`, { revalidate: 0 });
  return data && (data as Fiche).association ? (data as Fiche) : null;
}

export async function generateMetadata({ params }: { params: { siren: string } }): Promise<Metadata> {
  const fiche = await charger(params.siren);
  if (!fiche) return { title: 'Association introuvable' };
  return {
    title: `${fiche.association.nom} : le dossier est-il complet ?`,
    description: `Pièces prouvées par les répertoires publics et pièces à réunir pour une demande de subvention de ${fiche.association.nom}.`,
    robots: { index: false, follow: true },
  };
}

export default async function FichePage({ params }: { params: { siren: string } }) {
  const fiche = await charger(params.siren);
  if (!fiche) notFound();

  const { association: a, classeur, completude, etapesVerifiees, versionReferentiel } = fiche;
  const deduites = classeur.filter((p) => p.etat === 'DEDUITE');
  const parCategorie = classeur.reduce<Record<string, typeof classeur>>((acc, p) => {
    (acc[p.type.categorie] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <p className="mb-6 text-sm">
        <Link href="/verifier" className="underline underline-offset-4">
          ← Chercher une autre association
        </Link>
      </p>

      <Titre surtitre="Étape 2 sur 2 · d'après les répertoires publics">{a.nom}</Titre>

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Encart>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Identité</p>
          <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm [&_dt]:text-[#5C6B63]">
            <dt>Forme</dt>
            <dd>{a.natureLibelle}{a.ess ? ' · économie sociale et solidaire' : ''}</dd>
            <dt>Siège</dt>
            <dd>{[a.adresse, [a.codePostal, a.commune].filter(Boolean).join(' ')].filter(Boolean).join(', ') || 'Non renseigné'}</dd>
            <dt>Créée le</dt>
            <dd>{formaterDate(a.dateCreation) ?? 'Non renseigné'}</dd>
            <dt>SIREN</dt>
            <dd className="tabular-nums">{a.siren}</dd>
            <dt>SIRET</dt>
            <dd className="tabular-nums">{a.siret ?? 'Aucun'}</dd>
            <dt>RNA</dt>
            <dd className="tabular-nums">{a.rna ?? 'Non renseigné dans le répertoire'}</dd>
            {a.effectifLibelle ? (
              <>
                <dt>Salariés</dt>
                <dd>{a.effectifLibelle}</dd>
              </>
            ) : null}
          </dl>
          {!a.active ? (
            <p className="mt-3 text-sm text-[#7A4A0E]">
              Le répertoire indique cette association comme fermée. Si elle est toujours active, la mise à jour se fait
              auprès de l&apos;INSEE.
            </p>
          ) : null}
        </Encart>

        <Encart ton={deduites.length >= 3 ? 'ok' : 'attention'}>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Ce que les répertoires prouvent déjà</p>
          <p className="text-2xl font-semibold tabular-nums">
            {deduites.length} pièce{deduites.length > 1 ? 's' : ''} sur {classeur.length}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {classeur
              .filter((p) => p.type.categorie === 'IDENTITE')
              .map((p) => (
                <li key={p.type.code} className="flex items-start gap-2">
                  <Pastille ton={p.etat === 'DEDUITE' ? 'ok' : 'neutre'}>{p.etat === 'DEDUITE' ? 'Prouvée' : 'À fournir'}</Pastille>
                  <span>
                    {p.type.libelle}
                    {p.preuve ? <span className="text-[#5C6B63]"> · {p.preuve}</span> : null}
                  </span>
                </li>
              ))}
          </ul>
          {etapesVerifiees.length ? (
            <p className="mt-3 text-sm text-[#3E4A44]">
              Sur le chemin, {etapesVerifiees.length === 1 ? "l'étape" : 'les étapes'}{' '}
              {etapesVerifiees.map((e) => e.numero).join(' et ')} {etapesVerifiees.length === 1 ? 'est' : 'sont'} déjà
              faite{etapesVerifiees.length > 1 ? 's' : ''}.
            </p>
          ) : null}
          {!a.siret ? (
            <p className="mt-3 text-sm text-[#7A4A0E]">
              Sans SIRET, aucune subvention ne peut être versée.{' '}
              <Link href="/chemin/obtenir-le-siret" className="underline underline-offset-4">
                Comment l&apos;obtenir
              </Link>
              .
            </p>
          ) : null}
        </Encart>
      </section>

      <section className="mt-12">
        <h2 className="mb-1 text-xl font-semibold tracking-tight">Face aux premiers financeurs</h2>
        <p className="mb-5 max-w-[64ch] text-[#3E4A44]">
          Pour chaque dossier, la part des pièces exigées déjà prouvée par les répertoires. Le reste est à réunir : la
          liste du bas dit où trouver chacune.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {completude.map((c) => (
            <div key={c.dispositif.code} className="flex flex-col rounded-md border border-[#DDD8CC] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">{c.dispositif.financeur}</p>
              <h3 className="mt-1 font-semibold leading-snug">{c.dispositif.nom}</h3>
              <p className="mt-3 text-sm tabular-nums text-[#3E4A44]">
                {c.deduites} pièce{c.deduites > 1 ? 's' : ''} prouvée{c.deduites > 1 ? 's' : ''} sur {c.exigees} exigées
              </p>
              <div className="mt-2">
                <Barre pourcentage={c.pourcentage} />
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#3E4A44]">{c.dispositif.description}</p>
              <p className="mt-3 text-sm text-[#5C6B63]">
                Il manque : {c.manquantes.map((m) => m.libelle.toLowerCase()).join(', ')}.
              </p>
              {c.dispositif.lien ? (
                <a href={c.dispositif.lien} rel="noopener" target="_blank" className="mt-3 text-sm font-medium text-[#1F6A4E] underline underline-offset-4">
                  Où déposer →
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-1 text-xl font-semibold tracking-tight">Chaque pièce, et où la trouver</h2>
        <p className="mb-5 max-w-[64ch] text-[#3E4A44]">
          Les pièces prouvées n&apos;ont rien à faire de plus. Pour les autres, voici à quoi elles servent et où les
          récupérer.
        </p>
        <div className="space-y-8">
          {Object.entries(parCategorie).map(([cat, pieces]) => (
            <div key={cat}>
              <h3 className="mb-3 text-sm uppercase tracking-[0.14em] text-[#5C6B63]">{CATEGORIES[cat] ?? cat}</h3>
              <ul className="divide-y divide-[#DDD8CC] rounded-md border border-[#DDD8CC] bg-white">
                {pieces.map((p) => (
                  <li key={p.type.code} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pastille ton={p.etat === 'DEDUITE' ? 'ok' : 'neutre'}>{p.etat === 'DEDUITE' ? 'Prouvée' : 'À fournir'}</Pastille>
                      <span className="font-semibold">{p.type.libelle}</span>
                      {p.type.dureeValiditeMois ? (
                        <span className="text-xs text-[#5C6B63]">valable {p.type.dureeValiditeMois} mois</span>
                      ) : null}
                      {p.type.parExercice ? <span className="text-xs text-[#5C6B63]">à refaire chaque année</span> : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#3E4A44]">{p.type.pourquoi}</p>
                    {p.etat === 'A_DEPOSER' ? (
                      <p className="mt-1 text-sm leading-relaxed">
                        <span className="text-[#5C6B63]">Où la trouver : </span>
                        {p.type.ouLaTrouver}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-[#5C6B63]">Prouvée par : {p.preuve}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#5C6B63]">
          Référentiel des pièces vérifié le {formaterDate(versionReferentiel)}. Les listes exigées varient d&apos;un
          financeur à l&apos;autre : la sienne fait foi.
        </p>
      </section>

      <section className="mt-12 max-w-[64ch]">
        <Encart>
          <p className="font-semibold">Et ensuite ?</p>
          <p className="mt-2 leading-relaxed text-[#3E4A44]">
            Le chemin reprend là où vous en êtes :{' '}
            <Link href={`/chemin/${a.siret ? 'les-cinq-pieces-d-identite' : 'obtenir-le-siret'}`} className="underline underline-offset-4">
              {a.siret ? 'étape 3, les cinq pièces d’identité' : 'étape 2, obtenir le numéro SIRET'}
            </Link>
            . L&apos;espace qui garde ces pièces, prévient avant qu&apos;elles expirent et assemble chaque dossier arrive
            bientôt.
          </p>
        </Encart>
      </section>
    </>
  );
}
