import Link from 'next/link';
import { academieConnectee, apiAcademie, sessionAcademie } from './_session';
import { chargerChemin, tempsDe, TEINTES } from './_chemin';
import { Accent, Barre, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CARTE_VIVE, Carte, Encart, Pastille, SousTitre, Titre, Tuile, formaterDate } from './_ui';
import { LIBELLES_QUALIOPI, type EspaceAcademie } from './_types';
import { BlocStatistiques } from './_stats';
import { BlocInstaller } from '../_shared/BlocInstaller';
import type { Apprenant, CoursResume, Vente } from './_ecole/types';
import type { Demarrage } from './_ecole/suite-types';

/**
 * L'ACCUEIL DE « PILOTER MON ACADÉMIE ».
 *
 * Sans compte : ce que l'espace fait, et le chemin en douze étapes.
 * Avec un compte : ce qui presse cette semaine, et où en est la certification.
 */
export default async function AccueilAcademiePage() {
  const academie = await academieConnectee();
  if (academie) return <TableauDeBord />;
  return <Presentation />;
}

/* ------------------------------------------------------------------ public */

async function Presentation() {
  const chemin = await chargerChemin();

  return (
    <>
      <Titre
        surtitre="Par Toulali, centre de formation"
        sousTitre="Ton organisme, tes preuves Qualiopi, tes financements : le chemin est balisé."
      >
        Piloter mon <Accent>académie</Accent>
      </Titre>

      <div className="mb-10 flex flex-wrap gap-3">
        <Link href="/academie/inscription" className={BTN_PRIMAIRE}>
          Ouvrir mon espace, gratuit
        </Link>
        <Link href="/academie/chemin" className={BTN_SECONDAIRE}>
          Voir le chemin
        </Link>
      </div>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        {[
          {
            titre: 'Le chemin, pas la paperasse',
            detail:
              "Douze étapes dans l'ordre où elles se posent vraiment, y compris celle que personne ne voit venir : il faut une première convention signée AVANT de pouvoir déclarer son activité.",
          },
          {
            titre: 'Qualiopi tenu à jour',
            detail:
              "Sept critères, trente-deux indicateurs, une preuve pour chacun. L'espace montre ce qui manque, garde les fichiers, et te dit où tu en es en un pourcentage.",
          },
          {
            titre: 'Ce que l\'auditeur oublie de te dire',
            detail:
              "Le journal de veille et le registre des réclamations sont les deux motifs de non-conformité les plus fréquents. Ils ont chacun leur écran, daté, prêt à montrer.",
          },
        ].map((c) => (
          <div key={c.titre} className={`${CARTE} p-5`}>
            <h2 className="text-lg font-extrabold text-[#12312A]">{c.titre}</h2>
            <p className="mt-2 text-sm leading-relaxed">{c.detail}</p>
          </div>
        ))}
      </section>

      {chemin ? (
        <section>
          <SousTitre>Les douze étapes</SousTitre>
          <ol className="grid gap-3 sm:grid-cols-2">
            {chemin.etapes.map((e) => {
              const t = TEINTES[tempsDe(e.numero).titre];
              return (
                <li key={e.slug}>
                  <Link href={`/academie/chemin/${e.slug}`} className={`${CARTE_VIVE} flex h-full items-start gap-3 p-4 no-underline`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.pastille} text-sm font-extrabold text-white`}>
                      {e.numero}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-extrabold text-[#12312A]">{e.titre}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-[#5E7A6E]">{e.pourPasser}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <Encart ton="attention">Le chemin ne se charge pas pour le moment. Réessaie dans un instant.</Encart>
      )}
    </>
  );
}

/* --------------------------------------------------------------- connectée */

/** Les cinq gestes du quotidien, comme sur l'accueil de l'espace association. */
const RACCOURCIS: { href: string; libelle: string; icone: string }[] = [
  { href: '/academie/formations', libelle: 'Créer une formation', icone: 'M12 5v14M5 12h14' },
  { href: '/academie/apprenants', libelle: 'Inscrire un apprenant', icone: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6' },
  { href: '/academie/devoirs', libelle: 'Corriger les devoirs', icone: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
  { href: '/academie/certification', libelle: 'Déposer une preuve', icone: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href: '@chemin', libelle: 'Continuer le chemin', icone: 'M4 20V9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5M4 20h16M12 10v10' },
];

/** L'anneau de progression, le même que celui de l'espace association. */
function Anneau({ pourcentage }: { pourcentage: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pourcentage));
  return (
    <div className="relative h-[72px] w-[72px]">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#E3F5EC" strokeWidth="7" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="#1E9E6A" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-[#12312A]">{p} %</span>
    </div>
  );
}

async function TableauDeBord() {
  const s = await sessionAcademie('/academie');
  // L'espace d'un côté, l'école de l'autre : les chiffres de vente et de suivi
  // vivent dans le module école, et ils ont leur place ici, pas sur un écran
  // séparé où personne ne va.
  const [espace, ventesR, apprenantsR, coursR, demarrageR, devoirsR] = await Promise.all([
    apiAcademie<EspaceAcademie>(s, '/academie/espace'),
    apiAcademie<Vente[]>(s, '/ecole/ventes'),
    apiAcademie<Apprenant[]>(s, '/ecole/apprenants'),
    apiAcademie<CoursResume[]>(s, '/ecole/cours'),
    apiAcademie<Demarrage>(s, '/ecole/demarrage'),
    apiAcademie<{ compteurs: { aCorriger: number } }>(s, '/ecole/devoirs?statut=A_CORRIGER'),
  ]);
  const demarrage = demarrageR.data ?? null;
  const aCorriger = devoirsR.data?.compteurs.aCorriger ?? 0;
  const { data, error } = espace;
  if (!data) return <Encart ton="attention">{error ?? 'Ton espace ne se charge pas pour le moment.'}</Encart>;

  const { academie, chemin, qualiopi, sessions, apprenants, catalogue, reclamations, veille } = data;
  const prochaine = sessions[0] ?? null;
  const etapeCourante = chemin.etapes.find((e) => e.slug === chemin.courante) ?? null;

  /** Ce qui presse : on ne liste que ce sur quoi il y a vraiment quelque chose à faire. */
  const aFaire: { titre: string; detail: string; href: string }[] = [];
  if (!academie.nda) {
    aFaire.push({
      titre: "Ton numéro de déclaration d'activité manque",
      detail: "Sans NDA, aucune convention ne peut être facturée en formation professionnelle. Renseigne-le dès que la DREETS te l'a délivré.",
      href: '/academie/mon-academie',
    });
  }
  if (!academie.referentHandicap) {
    aFaire.push({
      titre: 'Aucun référent handicap désigné',
      detail: "C'est une obligation, et c'est vérifié en audit. Une personne nommée et joignable suffit.",
      href: '/academie/mon-academie',
    });
  }
  if (qualiopi.couverture < 100 && qualiopi.indicateurs > 0) {
    aFaire.push({
      titre: `Il reste des preuves Qualiopi à déposer`,
      detail: `${qualiopi.validees} indicateur${qualiopi.validees > 1 ? 's' : ''} validé${qualiopi.validees > 1 ? 's' : ''} sur ${qualiopi.indicateurs}. L'auditeur échantillonne : mieux vaut des preuves réelles que des modèles vides.`,
      href: '/academie/certification',
    });
  }
  if (veille.total === 0) {
    aFaire.push({
      titre: 'Ton journal de veille est vide',
      detail: "Trois indicateurs en dépendent. C'est le motif de non-conformité le plus fréquent en audit initial.",
      href: '/academie/veille',
    });
  }
  if (aCorriger > 0) {
    aFaire.push({
      titre: `${aCorriger} devoir${aCorriger > 1 ? 's' : ''} à corriger`,
      detail: 'Tant que le devoir n’est pas validé, la formation de l’apprenant n’avance pas.',
      href: '/academie/devoirs',
    });
  }
  if (reclamations.ouvertes > 0) {
    aFaire.push({
      titre: `${reclamations.ouvertes} réclamation${reclamations.ouvertes > 1 ? 's' : ''} en attente`,
      detail: 'Le critère 7 demande la trace du traitement, pas seulement celle de la réclamation.',
      href: '/academie/reclamations',
    });
  }

  const prenom = s.session.user.firstName ?? '';
  const configuration = demarrage ?? { faites: 0, total: 0, etapes: [] };
  const pctConfig = configuration.total ? Math.round((configuration.faites / configuration.total) * 100) : 100;
  const prochaineConfig = configuration.etapes.find((e) => !e.fait) ?? null;

  /*
   * ⚠ ALIGNÉ SUR L'ACCUEIL DE L'ESPACE ASSOCIATION (24/09/2026, demande de
   * Siham : « trop de texte, pas intuitif »). Même grammaire : un bonjour avec
   * cinq raccourcis, la configuration avec son anneau, trois cartes courtes à
   * droite. Chaque ligne tient en un titre : le détail est sur l'écran visé.
   */
  return (
    <>
      <section className="rounded-2xl bg-[#E3F5EC] px-6 py-8 text-center sm:py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#12312A] sm:text-4xl">
          {prenom ? `Bonjour ${prenom},` : 'Bonjour !'}
        </h1>
        <p className="mt-2 text-lg text-[#334A42]">
          Que fait-on pour <Accent>{academie.nom}</Accent> cette semaine ?
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {RACCOURCIS.map((r) => (
            <Link
              key={r.libelle}
              href={r.href === '@chemin' ? (etapeCourante ? `/academie/chemin/${etapeCourante.slug}` : '/academie/chemin') : r.href}
              className={`${BTN_SECONDAIRE} gap-2`}
            >
              <span className="text-[#1E9E6A]" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={r.icone} />
                </svg>
              </span>
              {r.libelle}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Carte>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#12312A]">Termine la configuration de ton école</h2>
              <p className="mt-1 text-sm text-[#5E7A6E]">
                {configuration.faites} sur {configuration.total}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Anneau pourcentage={pctConfig} />
              <Pastille ton={academie.qualiopi === 'CERTIFIE' ? 'ok' : 'neutre'}>
                {LIBELLES_QUALIOPI[academie.qualiopi]}
              </Pastille>
            </div>
          </div>
          <ol className="mt-5 space-y-1">
            {configuration.etapes.map((e, i) => {
              const courante = prochaineConfig?.cle === e.cle;
              return (
                <li key={e.cle} className="flex items-center gap-3 py-1.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold ${
                      e.fait ? 'border-[#0F5F3E] bg-[#0F5F3E] text-white' : courante ? 'border-[#1E9E6A] text-[#1E9E6A]' : 'border-[#CFE4D9] text-[#8FA79B]'
                    }`}
                  >
                    {e.fait ? '✓' : courante ? '→' : i + 1}
                  </span>
                  {courante ? (
                    <Link href={e.lien} className={`${BTN_PRIMAIRE} !py-2 text-sm`}>
                      {e.titre} →
                    </Link>
                  ) : (
                    <Link href={e.lien} className={`text-[15px] no-underline ${e.fait ? 'text-[#5E7A6E] line-through' : 'font-bold text-[#12312A] underline underline-offset-4'}`}>
                      {e.titre}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </Carte>

        <div className="flex flex-col gap-4">
          <Carte>
            <h2 className="text-xl font-extrabold text-[#12312A]">Qualiopi</h2>
            <p className="mt-1 text-sm text-[#5E7A6E]">
              {qualiopi.validees} indicateur{qualiopi.validees > 1 ? 's' : ''} validé{qualiopi.validees > 1 ? 's' : ''} sur {qualiopi.indicateurs}
            </p>
            <div className="mt-2">
              <Barre pourcentage={qualiopi.couverture} />
            </div>
            {qualiopi.auditPrevuLe ? <p className="mt-2 text-sm text-[#334A42]">Audit le {formaterDate(qualiopi.auditPrevuLe)}</p> : null}
            <Link href="/academie/certification" className="mt-3 inline-flex text-sm font-bold text-[#0F5F3E] underline underline-offset-4">
              Mes preuves →
            </Link>
          </Carte>
          <Carte>
            <h2 className="text-xl font-extrabold text-[#12312A]">Le chemin</h2>
            <p className="mt-1 text-sm text-[#5E7A6E]">
              {chemin.faites} étape{chemin.faites > 1 ? 's' : ''} sur {chemin.total}
            </p>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#E3F5EC]">
              <div className="h-full rounded-full bg-[#F5B400]" style={{ width: `${Math.round((chemin.faites / Math.max(1, chemin.total)) * 100)}%` }} />
            </div>
            {etapeCourante ? (
              <Link href={`/academie/chemin/${etapeCourante.slug}`} className="mt-3 inline-flex text-sm font-bold text-[#0F5F3E] underline underline-offset-4">
                {etapeCourante.titre} →
              </Link>
            ) : (
              <p className="mt-3 text-sm font-bold text-[#1E9E6A]">Le chemin est fini. Bravo !</p>
            )}
          </Carte>
          <BlocInstaller carte={CARTE} espace="academie" />
        </div>
      </section>

      <section className="mt-8">
        <SousTitre>Ce qui presse</SousTitre>
        {aFaire.length ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {aFaire.map((a) => (
              <li key={a.titre}>
                <Link href={a.href} className={`${CARTE_VIVE} flex items-center justify-between gap-3 px-4 py-3 no-underline`}>
                  <span className="font-bold text-[#12312A]">{a.titre}</span>
                  <span className="shrink-0 text-[#0F5F3E]" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Encart ton="ok">Rien ne presse cette semaine.</Encart>
        )}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Formations" valeur={catalogue.total} detail={`${catalogue.publiees} en ligne`} href="/academie/formations" />
        <Tuile libelle="Sessions à venir" valeur={sessions.length} detail={prochaine ? formaterDate(prochaine.debut) ?? undefined : undefined} href="/academie/formations?onglet=sessions" />
        <Tuile libelle="Apprenants" valeur={apprenants.total} href="/academie/apprenants" />
        <Tuile libelle="Devoirs à corriger" valeur={aCorriger} href="/academie/devoirs" ton={aCorriger > 0 ? 'attention' : 'neutre'} />
      </section>

      {sessions.length ? (
        <section className="mt-8">
          <SousTitre>Prochaines sessions</SousTitre>
          <ul className="space-y-2">
            {sessions.slice(0, 5).map((sess) => (
              <li key={sess.id} className={`${CARTE} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
                <div className="min-w-0">
                  <p className="font-bold text-[#12312A]">{sess.titre}</p>
                  <p className="text-sm text-[#5E7A6E]">
                    {formaterDate(sess.debut)}
                    {sess.lieu ? ` · ${sess.lieu}` : ''}
                  </p>
                </div>
                <Pastille ton={sess.places && sess.inscrits >= sess.places ? 'attention' : 'ok'}>
                  {sess.inscrits} inscrit{sess.inscrits > 1 ? 's' : ''}
                  {sess.places ? ` / ${sess.places}` : ''}
                </Pastille>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <BlocStatistiques
        ventes={Array.isArray(ventesR.data) ? ventesR.data : []}
        inscriptions={Array.isArray(apprenantsR.data) ? apprenantsR.data : []}
        cours={Array.isArray(coursR.data) ? coursR.data : []}
      />
    </>
  );
}
