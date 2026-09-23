import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../../_shared/server';
import { CoqueEcole } from '../../_espace/coque';
import { moiSurEcole } from '../../_espace/donnees';

export const dynamic = 'force-dynamic';

interface Infos {
  nom: string;
  couleur: string;
  logoUrl: string | null;
  contactEmail: string | null;
  organisme: {
    nom: string | null;
    siret: string | null;
    nda: string | null;
    adresse: string | null;
    codePostal: string | null;
    commune: string | null;
    courriel: string | null;
  } | null;
  cgv: string | null;
  mentions: string | null;
  cgu: string;
  confidentialite: string;
  communauteActive: boolean;
  calendrierVisible: boolean;
}

async function charger(slug: string) {
  const { data } = await fetchPublic<Infos>(`/public/ecole/ecoles/${encodeURIComponent(slug)}/infos`, { revalidate: 0 });
  return data && (data as Infos).nom ? (data as Infos) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await charger(slug);
  return {
    title: e ? `Conditions et confidentialité · ${e.nom}` : 'École introuvable',
    description: e ? `Conditions d'utilisation, conditions de vente, mentions légales et politique de confidentialité de ${e.nom}.` : undefined,
    alternates: { canonical: `/ecole/${slug}/legal` },
  };
}

/**
 * `/ecole/<slug>/legal` : LES TEXTES DE L'ÉCOLE.
 *
 * Chaque école a les siens : c'est elle qui vend et qui traite les données de
 * ses apprenants. Quand elle n'a rien écrit, un texte par défaut, honnête sur
 * le rôle de chacun, s'affiche à sa place (l'école responsable, ADéPA
 * sous-traitant pour l'hébergement de l'outil).
 */
export default async function PageLegal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await charger(slug);
  if (!e) notFound();
  const moi = await moiSurEcole(slug);
  const organisme = e.organisme?.nom || e.nom;
  const remplir = (t: string) => t.replaceAll('{organisme}', organisme);

  const identite = [
    e.organisme?.nom ? `Organisme : ${e.organisme.nom}` : null,
    e.organisme?.siret ? `SIRET : ${e.organisme.siret}` : null,
    e.organisme?.nda ? `Déclaration d'activité : ${e.organisme.nda}` : null,
    [e.organisme?.adresse, [e.organisme?.codePostal, e.organisme?.commune].filter(Boolean).join(' ')].filter(Boolean).join(', ') || null,
    e.contactEmail ? `Contact : ${e.contactEmail}` : null,
  ].filter(Boolean) as string[];

  const sections: { id: string; titre: string; texte: string | null }[] = [
    { id: 'mentions', titre: 'Mentions légales', texte: e.mentions },
    { id: 'cgu', titre: "Conditions générales d'utilisation", texte: remplir(e.cgu) },
    { id: 'cgv', titre: 'Conditions générales de vente', texte: e.cgv },
    { id: 'confidentialite', titre: 'Politique de confidentialité', texte: remplir(e.confidentialite) },
  ];

  return (
    <CoqueEcole
      ecole={{ nom: e.nom, slug, couleur: e.couleur, logoUrl: e.logoUrl, communauteActive: e.communauteActive, calendrierVisible: e.calendrierVisible }}
      actif="catalogue"
      connecte={Boolean(moi)}
    >
      <h1 className="text-3xl font-extrabold tracking-tight text-[#12312A] sm:text-4xl">Conditions et confidentialité</h1>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Sommaire">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-[#DDEBE4] bg-white px-3 py-1.5 text-sm font-bold no-underline" style={{ color: e.couleur }}>
            {s.titre}
          </a>
        ))}
      </nav>

      <div className="mt-8 grid gap-6">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-6 rounded-2xl border border-[#DDEBE4] bg-white p-6">
            <h2 className="text-xl font-extrabold tracking-tight text-[#12312A]">{s.titre}</h2>
            {s.id === 'mentions' && identite.length ? (
              <ul className="mt-3 grid gap-1 text-[15px]">
                {identite.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            ) : null}
            {s.texte ? (
              <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{s.texte}</div>
            ) : (
              <p className="mt-3 text-[15px] text-[#5E7A6E]">
                {s.id === 'cgv'
                  ? "L'école n'a pas encore publié ses conditions de vente. Elles vous sont communiquées avant tout paiement."
                  : "L'école n'a pas encore complété ce texte."}
              </p>
            )}
          </section>
        ))}
      </div>
    </CoqueEcole>
  );
}
