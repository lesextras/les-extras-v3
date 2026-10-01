/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_SECONDAIRE, CARTE, Encart, SousTitre, Titre, Tuile, formaterDate } from '../_ui';
import { BoutonCsv, CopierTexte } from './Boutons';

export const metadata: Metadata = { title: 'Qualité et enquêtes', robots: { index: false, follow: false } };

interface Indicateurs {
  annee: number;
  sessions: number;
  stagiaires: number;
  tauxAbandon: number | null;
  satisfaction: { valeur: number | null; reponses: number };
  satisfactionFroid: { valeur: number | null; reponses: number };
  recommandation: { valeur: number | null; reponses: number };
  commanditaire: { valeur: number | null; reponses: number };
  progression: { valeur: number | null; reponses: number };
  miseEnOeuvre: { taux: number | null; reponses: number };
  aPublier: string;
  parSession: { id: string; intitule: string; debut: string; actifs: number; satisfaction: number | null; reponses: number; assiduite: number | null }[];
}

const v = (n: number | null | undefined, suffixe = '') => (n === null || n === undefined ? 'Pas encore' : `${String(n).replace('.', ',')}${suffixe}`);

/**
 * `/academie/qualite` : LES INDICATEURS DE RÉSULTATS (Qualiopi, indicateur 2).
 *
 * Calculés sur les sessions terminées de l'année, à partir des enquêtes que les
 * stagiaires et les commanditaires remplissent par leur lien. Un taux se publie
 * toujours avec son nombre de réponses.
 */
export default async function QualitePage({ searchParams }: { searchParams: Promise<{ annee?: string }> }) {
  const s = await sessionAcademie('/academie/qualite');
  const { annee: brut } = await searchParams;
  const courante = new Date().getFullYear();
  const annee = Number(brut) > 2000 && Number(brut) <= courante ? Number(brut) : courante;
  const { data, error } = await apiAcademie<Indicateurs>(s, `/academie/gestion/qualite?annee=${annee}`);

  return (
    <>
      <Titre
        surtitre="Gestion de l’organisme · indicateur 2"
        sousTitre="Calculés depuis les enquêtes de tes sessions."
        actions={
          <nav className="flex gap-2" aria-label="Année">
            {[courante - 1, courante].map((a) => (
              <Link key={a} href={`/academie/qualite?annee=${a}`} className={`rounded-full px-4 py-2 text-sm font-bold no-underline ${a === annee ? 'bg-[#0F5F3E] text-white' : 'bg-[#E3F5EC] text-[#0F5F3E]'}`}>
                {a}
              </Link>
            ))}
          </nav>
        }
      >
        Qualité et enquêtes
      </Titre>
      {!data ? (
        <Encart ton="attention">{error ?? 'Les indicateurs ne se chargent pas pour le moment.'}</Encart>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tuile libelle="Satisfaction en fin" valeur={v(data.satisfaction.valeur, ' / 5')} detail={`${data.satisfaction.reponses} réponse${data.satisfaction.reponses > 1 ? 's' : ''}`} ton={data.satisfaction.valeur && data.satisfaction.valeur >= 4 ? 'ok' : 'neutre'} />
            <Tuile libelle="Recommanderaient" valeur={data.recommandation.valeur === null ? 'Pas encore' : `${Math.round(data.recommandation.valeur)} %`} detail={`${data.recommandation.reponses} réponses`} />
            <Tuile libelle="Mettent en œuvre les acquis" valeur={data.miseEnOeuvre.taux === null ? 'Pas encore' : `${data.miseEnOeuvre.taux} %`} detail={`${data.miseEnOeuvre.reponses} réponses à froid`} />
            <Tuile libelle="Taux d'abandon" valeur={data.tauxAbandon === null ? 'Pas encore' : `${data.tauxAbandon} %`} detail={`${data.stagiaires} stagiaires, ${data.sessions} sessions`} />
          </div>

          <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
            <SousTitre>Le texte à publier</SousTitre>
            {data.sessions ? (
              <>
                <p className="rounded-xl bg-[#F7FBF9] px-4 py-3 text-[16px] leading-relaxed text-[#12312A]">{data.aPublier}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <CopierTexte texte={data.aPublier} />
                  <BoutonCsv annee={annee} />
                  <Link href="/academie/certification" className={BTN_SECONDAIRE}>
                    Ma certification
                  </Link>
                </div>
                <p className="mt-3 text-sm text-[#5E7A6E]">À afficher sur ta page publique et ta page « informations réglementaires ». Mets-le à jour à chaque fin de session.</p>
              </>
            ) : (
              <Encart ton="info">Aucune session terminée en {annee}. Les indicateurs apparaîtront à la fin de la première, avec le nombre de réponses : aucun chiffre n&apos;est publié avant.</Encart>
            )}
          </section>

          {data.parSession.length ? (
            <section className={`${CARTE} p-5 sm:p-6`}>
              <SousTitre>Session par session</SousTitre>
              <ul className="grid gap-2">
                {data.parSession.map((x) => (
                  <li key={x.id}>
                    <Link href={`/academie/sessions/${x.id}?onglet=qualite`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-[#DDEBE4] bg-white px-4 py-3 text-[15px] no-underline hover:border-[#B7E4CE]">
                      <span className="font-bold text-[#12312A]">{x.intitule}</span>
                      <span className="text-[#5E7A6E]">{formaterDate(x.debut)}</span>
                      <span className="text-[#334A42]">{x.actifs} stagiaires</span>
                      <span className="text-[#334A42]">
                        {v(x.satisfaction, ' / 5')} ({x.reponses} rép.)
                      </span>
                      <span className="text-[#334A42]">Assiduité {x.assiduite === null ? 'non mesurée' : `${x.assiduite} %`}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
