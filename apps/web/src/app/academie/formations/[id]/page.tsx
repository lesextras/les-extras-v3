import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../../_session';
import { Encart, ORIGINE_SITE } from '../../_ui';
import { AtelierCours } from '../../_ecole/AtelierCours';
import type { Apprenant, Commentaire, CoursComplet, Programme, Vente } from '../../_ecole/types';

export const metadata: Metadata = { title: 'Ma formation', robots: { index: false, follow: false } };

/**
 * `/academie/formations/<id>` — UNE FORMATION, EN ENTIER.
 *
 * Le contenu, les paramètres, le prix, les descriptions, les sessions, les
 * apprenants, les commentaires, les statistiques. La modalité — en ligne, en
 * présentiel, en visio, mixte — se règle dans « Paramètres » : ce n'est pas un
 * autre écran, c'est une option de cette formation-là.
 *
 * La fiche programme (au sens Qualiopi) et ses sessions datées vivent sur la
 * même page : on les lit ici avec la formation, pour qu'elle s'ouvre entière.
 */
export default async function FormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessionAcademie(`/academie/formations/${id}`);

  const [c, a, k, v] = await Promise.all([
    apiAcademie<CoursComplet>(s, `/ecole/cours/${id}`),
    apiAcademie<Apprenant[]>(s, `/ecole/apprenants?cours=${id}`),
    apiAcademie<Commentaire[]>(s, `/ecole/commentaires?cours=${id}`),
    apiAcademie<Vente[]>(s, '/ecole/ventes'),
  ]);

  const programme = c.data?.formationId
    ? await apiAcademie<Programme>(s, `/formations/${c.data.formationId}`)
    : null;

  if (!c.data) {
    return (
      <>
        <Encart ton="attention">{c.error ?? "Cette formation n'existe pas, ou elle ne t'appartient pas."}</Encart>
        <p className="mt-4">
          <Link href="/academie/formations" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            Revenir à mes formations
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="mb-5">
        <Link href="/academie/formations" className="text-sm font-bold text-[#0F5F3E] no-underline hover:underline">
          ← Mes formations
        </Link>
      </p>
      <AtelierCours
        cours={c.data}
        apprenants={Array.isArray(a.data) ? a.data : []}
        commentaires={Array.isArray(k.data) ? k.data : []}
        ventes={Array.isArray(v.data) ? v.data : []}
        programme={programme?.data && programme.data.id ? programme.data : null}
        origine={ORIGINE_SITE}
      />
    </>
  );
}
