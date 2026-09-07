import Link from 'next/link';
import { academieConnectee, apiAcademie, sessionAcademie } from './_session';
import { chargerChemin, tempsDe, TEINTES } from './_chemin';
import { Accent, Barre, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CARTE_VIVE, Carte, Encart, Pastille, SousTitre, Titre, Tuile, formaterDate } from './_ui';
import { LIBELLES_QUALIOPI, type EspaceAcademie } from './_types';

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
        sousTitre="Déclarer ton organisme, réunir tes preuves Qualiopi, ouvrir tes financements. Le chemin est balisé, les pièces sont listées, et l'espace tient tes preuves pour le jour de l'audit."
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
              "Douze étapes dans l'ordre où elles se posent vraiment — y compris celle que personne ne voit venir : il faut une première convention signée AVANT de pouvoir déclarer son activité.",
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

async function TableauDeBord() {
  const s = await sessionAcademie('/academie');
  const { data, error } = await apiAcademie<EspaceAcademie>(s, '/academie/espace');
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
  if (reclamations.ouvertes > 0) {
    aFaire.push({
      titre: `${reclamations.ouvertes} réclamation${reclamations.ouvertes > 1 ? 's' : ''} en attente`,
      detail: 'Le critère 7 demande la trace du traitement, pas seulement celle de la réclamation.',
      href: '/academie/reclamations',
    });
  }

  return (
    <>
      <Titre
        surtitre={LIBELLES_QUALIOPI[academie.qualiopi]}
        sousTitre={
          etapeCourante
            ? `Prochaine étape du chemin : ${etapeCourante.titre.toLowerCase()}.`
            : 'Toutes les étapes du chemin sont faites. Il reste à tenir les preuves à jour.'
        }
      >
        {academie.nom}
      </Titre>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile
          libelle="Couverture Qualiopi"
          valeur={`${qualiopi.couverture} %`}
          detail={`${qualiopi.validees} validés · ${qualiopi.deposees} déposés`}
          ton={qualiopi.couverture >= 100 ? 'ok' : qualiopi.couverture >= 60 ? 'neutre' : 'attention'}
          href="/academie/certification"
        />
        <Tuile libelle="Au catalogue" valeur={catalogue.total} detail={`${catalogue.publiees} publiée${catalogue.publiees > 1 ? 's' : ''}`} href="/academie/catalogue" />
        <Tuile libelle="Sessions à venir" valeur={sessions.length} detail={prochaine ? formaterDate(prochaine.debut) ?? undefined : 'Aucune programmée'} href="/academie/sessions" />
        <Tuile libelle="Apprenants" valeur={apprenants.total} detail={`${apprenants.certifies} certifié${apprenants.certifies > 1 ? 's' : ''}`} href="/academie/apprenants" />
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <SousTitre>Ce qui presse</SousTitre>
          {aFaire.length ? (
            <ul className="space-y-3">
              {aFaire.map((a) => (
                <li key={a.titre}>
                  <Link href={a.href} className={`${CARTE_VIVE} block p-4 no-underline`}>
                    <span className="block font-extrabold text-[#12312A]">{a.titre}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-[#334A42]">{a.detail}</span>
                    <span className="mt-2 block text-sm font-bold text-[#0F5F3E]">Y aller →</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Encart ton="ok">Rien d&apos;urgent aujourd&apos;hui. C&apos;est le bon moment pour préparer la prochaine session.</Encart>
          )}
        </div>

        <div className="space-y-4">
          <Carte>
            <p className="text-sm font-bold text-[#5E7A6E]">Le chemin</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#12312A]">
              {chemin.faites} / {chemin.total}
            </p>
            <div className="mt-3">
              <Barre pourcentage={Math.round((chemin.faites / chemin.total) * 100)} />
            </div>
            <Link href="/academie/chemin" className="mt-3 inline-block text-sm font-bold text-[#0F5F3E] underline underline-offset-4">
              Reprendre le chemin →
            </Link>
          </Carte>

          {qualiopi.auditPrevuLe ? (
            <Carte>
              <p className="text-sm font-bold text-[#5E7A6E]">Audit prévu</p>
              <p className="mt-1 font-extrabold text-[#12312A]">{formaterDate(qualiopi.auditPrevuLe)}</p>
              {academie.certificateur ? <p className="mt-1 text-sm text-[#5E7A6E]">avec {academie.certificateur}</p> : null}
            </Carte>
          ) : null}

          {qualiopi.certifieAu ? (
            <Carte>
              <p className="text-sm font-bold text-[#5E7A6E]">Certificat valable jusqu&apos;au</p>
              <p className="mt-1 font-extrabold text-[#12312A]">{formaterDate(qualiopi.certifieAu)}</p>
            </Carte>
          ) : null}
        </div>
      </section>

      {sessions.length ? (
        <section>
          <SousTitre>Les prochaines sessions</SousTitre>
          <ul className="space-y-3">
            {sessions.slice(0, 5).map((sess) => (
              <li key={sess.id} className={`${CARTE} flex flex-wrap items-center justify-between gap-3 p-4`}>
                <div className="min-w-0">
                  <p className="font-extrabold text-[#12312A]">{sess.titre}</p>
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
    </>
  );
}
