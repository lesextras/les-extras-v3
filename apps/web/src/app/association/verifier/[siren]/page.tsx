import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../../_shared/server';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, Barre, CARTE, Carte, Encart, Pastille, SousTitre, Titre, formaterDate } from '../../_ui';

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
  IDENTITE: "Papiers d'identité",
  GOUVERNANCE: "Vie de l'association",
  FINANCIER: "Papiers sur l'argent",
  ASSURANCE: 'Assurance',
  AGREMENT: 'Agréments',
  RH: 'Employeur',
};

async function charger(siren: string) {
  if (!/^\d{9}$/.test(siren)) return null;
  const { data } = await fetchPublic<Fiche>(`/public/association/fiche/${siren}`, { revalidate: 0 });
  return data && (data as Fiche).association ? (data as Fiche) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ siren: string }> }): Promise<Metadata> {
  const { siren } = await params;
  const fiche = await charger(siren);
  if (!fiche) return { title: 'Association introuvable' };
  return {
    title: `${fiche.association.nom} : où en est-elle ?`,
    description: `Papiers prouvés par les répertoires publics et papiers à réunir pour une demande de subvention de ${fiche.association.nom}.`,
    robots: { index: false, follow: true },
  };
}

export default async function FichePage({ params }: { params: Promise<{ siren: string }> }) {
  const { siren } = await params;
  const fiche = await charger(siren);
  if (!fiche) notFound();

  const { association: a, classeur, completude, etapesVerifiees, versionReferentiel } = fiche;
  const localite = [a.codePostal, a.commune].filter(Boolean).join(' ');
  const siege = a.adresse && (!a.codePostal || a.adresse.includes(a.codePostal)) ? a.adresse : [a.adresse, localite].filter(Boolean).join(', ') || 'Non renseigné';
  const deduites = classeur.filter((p) => p.etat === 'DEDUITE');
  const parCategorie = classeur.reduce<Record<string, typeof classeur>>((acc, p) => {
    (acc[p.type.categorie] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <nav className="mb-4 text-sm text-[#6B6A8A]" aria-label="Fil d'Ariane">
        <Link href="/verifier" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Vérifier mon association
        </Link>
        <span className="mx-2">›</span>
        <span>{a.nom}</span>
      </nav>

      <Titre surtitre="D'après les répertoires publics">{a.nom}</Titre>

      <section className="grid gap-4 md:grid-cols-2">
        <Carte>
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6B6A8A]">Identité</p>
          <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm [&_dt]:font-bold [&_dt]:text-[#6B6A8A]">
            <dt>Forme</dt>
            <dd>
              {a.natureLibelle}
              {a.ess ? ' · économie sociale et solidaire' : ''}
            </dd>
            <dt>Siège</dt>
            <dd>{siege}</dd>
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
            <p className="mt-3 text-sm text-[#7C3E06]">Le répertoire indique cette association comme fermée. Si elle est toujours active, la mise à jour se fait auprès de l&apos;INSEE.</p>
          ) : null}
        </Carte>

        <div className={`rounded-2xl border p-5 sm:p-6 ${deduites.length >= 3 ? 'border-[#BFE6D2] bg-[#E3F5EC]' : 'border-[#F5D6A8] bg-[#FEF3E2]'}`}>
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6B6A8A]">Déjà prouvé par les répertoires</p>
          <p className="text-3xl font-extrabold tabular-nums text-[#1D1B5C]">
            {deduites.length} papier{deduites.length > 1 ? 's' : ''} sur {classeur.length}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {classeur
              .filter((p) => p.type.categorie === 'IDENTITE')
              .map((p) => (
                <li key={p.type.code} className="flex items-start gap-2">
                  <Pastille ton={p.etat === 'DEDUITE' ? 'ok' : 'neutre'}>{p.etat === 'DEDUITE' ? 'Prouvé' : 'À fournir'}</Pastille>
                  <span className="text-[#1D1B5C]">
                    {p.type.libelle}
                    {p.preuve ? <span className="text-[#6B6A8A]"> · {p.preuve}</span> : null}
                  </span>
                </li>
              ))}
          </ul>
          {etapesVerifiees.length ? (
            <p className="mt-3 text-sm text-[#1D1B5C]">
              Sur le chemin, {etapesVerifiees.length === 1 ? "l'étape" : 'les étapes'} {etapesVerifiees.map((e) => e.numero).join(' et ')}{' '}
              {etapesVerifiees.length === 1 ? 'est' : 'sont'} déjà faite{etapesVerifiees.length > 1 ? 's' : ''}.
            </p>
          ) : null}
          {!a.siret ? (
            <p className="mt-3 text-sm text-[#7C3E06]">
              Sans SIRET, aucune subvention ne peut être versée.{' '}
              <Link href="/chemin/obtenir-le-siret" className="font-bold underline underline-offset-4">
                Comment l&apos;obtenir
              </Link>
              .
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <SousTitre>Face aux premiers financeurs</SousTitre>
        <p className="mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Pour chaque dossier, la part des papiers exigés déjà prouvée par les répertoires. Le reste est à réunir : la liste du bas
          dit où trouver chacun.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {completude.map((c) => (
            <div key={c.dispositif.code} className={`${CARTE} flex flex-col p-5`}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">{c.dispositif.financeur}</p>
              <h3 className="mt-1 font-extrabold leading-snug text-[#1D1B5C]">{c.dispositif.nom}</h3>
              <p className="mt-3 text-sm tabular-nums">
                {c.deduites} papier{c.deduites > 1 ? 's' : ''} prouvé{c.deduites > 1 ? 's' : ''} sur {c.exigees} exigés
              </p>
              <div className="mt-2">
                <Barre pourcentage={c.pourcentage} ton="ok" />
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed">{c.dispositif.description}</p>
              <p className="mt-3 text-sm text-[#6B6A8A]">Il manque : {c.manquantes.map((m) => m.libelle.toLowerCase()).join(', ')}.</p>
              {c.dispositif.lien ? (
                <a href={c.dispositif.lien} rel="noopener" target="_blank" className="mt-3 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                  Où déposer ↗
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SousTitre>Chaque papier, et où le trouver</SousTitre>
        <div className="space-y-8">
          {Object.entries(parCategorie).map(([cat, pieces]) => (
            <div key={cat}>
              <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6B6A8A]">{CATEGORIES[cat] ?? cat}</h3>
              <ul className={`${CARTE} divide-y divide-[#E6E4F3] overflow-hidden`}>
                {pieces.map((p) => (
                  <li key={p.type.code} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pastille ton={p.etat === 'DEDUITE' ? 'ok' : 'neutre'}>{p.etat === 'DEDUITE' ? 'Prouvé' : 'À fournir'}</Pastille>
                      <span className="font-extrabold text-[#1D1B5C]">{p.type.libelle}</span>
                      {p.type.dureeValiditeMois ? <span className="text-xs text-[#6B6A8A]">valable {p.type.dureeValiditeMois} mois</span> : null}
                      {p.type.parExercice ? <span className="text-xs text-[#6B6A8A]">à refaire chaque année</span> : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{p.type.pourquoi}</p>
                    {p.etat === 'A_DEPOSER' ? (
                      <p className="mt-1 text-sm leading-relaxed">
                        <span className="font-bold text-[#6B6A8A]">Où le trouver : </span>
                        {p.type.ouLaTrouver}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-[#6B6A8A]">Prouvé par : {p.preuve}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#6B6A8A]">
          Référentiel vérifié le {formaterDate(versionReferentiel)}. Les listes exigées varient d&apos;un financeur à l&apos;autre : la sienne fait foi.
        </p>
      </section>

      <section className="mt-10">
        <Encart ton="info">
          <p className="text-lg font-extrabold">Et ensuite ?</p>
          <p className="mt-1 leading-relaxed">
            Le chemin reprend là où tu en es. Et si tu ouvres l&apos;espace de ton association, ces papiers sont déjà rangés dans ton
            classeur : il te prévient avant qu&apos;ils expirent.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/chemin/${a.siret ? 'les-cinq-pieces-d-identite' : 'obtenir-le-siret'}`} className={BTN_PRIMAIRE}>
              {a.siret ? 'Étape 3 : les cinq papiers' : 'Étape 2 : obtenir le SIRET'} →
            </Link>
            <Link href="/inscription" className={BTN_SECONDAIRE}>
              Créer l&apos;espace de mon association
            </Link>
          </div>
        </Encart>
      </section>
    </>
  );
}
