import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../_session';
import { Accent, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Carte, Encart, Pastille, SousTitre } from '../_ui';
import { LIBELLES_ETAT, dateCourte, formaterEuros, type Espace } from './_types';

/** L'anneau de progression, comme un compteur de configuration. */
function Anneau({ pourcentage }: { pourcentage: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pourcentage));
  return (
    <div className="relative h-[72px] w-[72px]">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#ECEBFC" strokeWidth="7" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="#4F46E5" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-[#1D1B5C]">{p} %</span>
    </div>
  );
}

export default async function LundiPage({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const [{ bienvenue }, s] = await Promise.all([searchParams, sessionAssociation('/espace')]);
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');
  if (!data) return <Encart ton="attention">{error ?? "L'espace ne se charge pas pour le moment. Recharge la page dans un instant."}</Encart>;

  const { organisation, lundi, chemin, dossiers, configuration, vieStatutaire } = data;
  const prenom = s.session.user.firstName ?? '';
  const prochaineEtape = chemin.etapes.find((e) => !e.faite) ?? null;
  const prochaineConfig = configuration.etapes.find((e) => !e.faite) ?? null;
  const urgences = lundi.perime.length + lundi.du.length + (vieStatutaire.agEnRetard ? 1 : 0) + vieStatutaire.mandatsExpires.length;
  const demande = dossiers.reduce((t, d) => t + (d.montantDemande ?? 0), 0);
  const accorde = dossiers.filter((d) => d.etat === 'ACCORDE' || d.etat === 'SOLDE').reduce((t, d) => t + (d.montantAccorde ?? 0), 0);
  const recents = [...dossiers].sort((a, b) => (b.dateLimiteDepot ?? '').localeCompare(a.dateLimiteDepot ?? '')).slice(0, 5);

  return (
    <>
      {/* ------------------------------------------------------------ bonjour */}
      <section className="rounded-2xl bg-[#ECEBFC] px-6 py-8 text-center sm:py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1D1B5C] sm:text-4xl">
          {prenom ? `Bonjour ${prenom},` : 'Bonjour !'}
        </h1>
        <p className="mt-2 text-lg text-[#3B3A66]">
          {bienvenue ? (
            <>
              Bienvenue dans l&apos;espace de <Accent>{organisation.nom}</Accent>. Par quoi veux-tu commencer ?
            </>
          ) : (
            <>Que fait-on pour {organisation.nom} cette semaine ?</>
          )}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/chemin#partie-3" className={BTN_SECONDAIRE}>
            Demander une subvention
          </Link>
          <Link href="/espace/classeur" className={BTN_SECONDAIRE}>
            Déposer une pièce
          </Link>
          <Link href="/espace/repertoire" className={BTN_SECONDAIRE}>
            Ajouter un membre
          </Link>
          <Link href={prochaineEtape ? `/chemin/${prochaineEtape.slug}` : '/chemin'} className={BTN_SECONDAIRE}>
            Continuer le chemin
          </Link>
        </div>
      </section>

      {/* --------------------------------------------- configuration + argent */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Carte>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1B5C]">Termine la configuration de ton espace</h2>
              <p className="mt-1 text-sm text-[#6B6A8A]">
                {configuration.faites} sur {configuration.total} — {organisation.rna || organisation.siret ? 'association rattachée' : 'association pas encore rattachée'}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Anneau pourcentage={configuration.pourcentage} />
              <Pastille ton={organisation.rna || organisation.siret ? 'ok' : 'attention'}>{organisation.rna || organisation.siret ? 'Vérifiée' : 'Non vérifiée'}</Pastille>
            </div>
          </div>
          <ol className="mt-5 space-y-1">
            {configuration.etapes.map((e, i) => {
              const courante = prochaineConfig?.code === e.code;
              return (
                <li key={e.code} className="flex items-center gap-3 py-1.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold ${
                      e.faite ? 'border-[#1D1B5C] bg-[#1D1B5C] text-white' : courante ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-[#D9D6EE] text-[#9A99B5]'
                    }`}
                  >
                    {e.faite ? '✓' : courante ? '→' : i + 1}
                  </span>
                  {courante ? (
                    <Link href={e.href} className={`${BTN_PRIMAIRE} !py-2 text-sm`}>
                      {e.libelle} →
                    </Link>
                  ) : (
                    <Link href={e.href} className={`text-[15px] no-underline ${e.faite ? 'text-[#6B6A8A] line-through' : 'font-bold text-[#1D1B5C] underline underline-offset-4'}`}>
                      {e.libelle}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </Carte>

        <div className="flex flex-col gap-4">
          <Carte>
            <h2 className="text-xl font-extrabold text-[#1D1B5C]">Subventions</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-bold text-[#6B6A8A]">Demandé</p>
                <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(demande)}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-[#6B6A8A]">Accordé</p>
                <p className="text-2xl font-extrabold tabular-nums text-[#1E9E6A]">{formaterEuros(accorde)}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-[#6B6A8A]">
              {lundi.enCours.deposes} déposé{lundi.enCours.deposes > 1 ? 's' : ''} en attente de réponse · {lundi.enCours.accordesAJustifier} à justifier
            </p>
            <Link href="/espace/dossiers" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
              Créer un dossier →
            </Link>
          </Carte>
          <Carte>
            <h2 className="text-xl font-extrabold text-[#1D1B5C]">Le chemin</h2>
            <p className="mt-1 text-sm text-[#6B6A8A]">
              {chemin.faites} étape{chemin.faites > 1 ? 's' : ''} sur {chemin.total}
            </p>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#ECEBFC]">
              <div className="h-full rounded-full bg-[#F5B400]" style={{ width: `${chemin.pourcentage}%` }} />
            </div>
            {prochaineEtape ? (
              <Link href={`/chemin/${prochaineEtape.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                Étape {prochaineEtape.numero} : {prochaineEtape.titre} →
              </Link>
            ) : (
              <p className="mt-3 text-sm font-bold text-[#1E9E6A]">Le chemin est fini. Bravo !</p>
            )}
          </Carte>
        </div>
      </section>

      {/* ------------------------------------------------------------ ce lundi */}
      <section className="mt-8">
        <SousTitre>Ce lundi : ce qui presse</SousTitre>
        {urgences === 0 ? (
          <Encart ton="ok">
            <p className="font-extrabold">Rien ne presse cette semaine.</p>
            <p className="mt-1 text-sm">Aucune pièce qui expire dans les 60 jours, aucune date limite proche, aucun compte rendu en attente.</p>
          </Encart>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {lundi.perime.length ? (
              <Carte>
                <h3 className="font-extrabold text-[#1D1B5C]">Des pièces expirent</h3>
                <ul className="mt-2 space-y-2">
                  {lundi.perime.map((p) => (
                    <li key={p.typeCode} className="flex items-center justify-between gap-3 text-sm">
                      <Link href="/espace/classeur" className="font-bold text-[#1D1B5C] underline underline-offset-4">
                        {p.libelle}
                      </Link>
                      <Pastille ton={p.gravite === 'ROUGE' ? 'alerte' : 'attention'}>
                        {p.jours < 0 ? `périmée depuis ${-p.jours} j` : `dans ${p.jours} j`}
                      </Pastille>
                    </li>
                  ))}
                </ul>
              </Carte>
            ) : null}
            {lundi.du.length ? (
              <Carte>
                <h3 className="font-extrabold text-[#1D1B5C]">Des dates limites approchent</h3>
                <ul className="mt-2 space-y-2">
                  {lundi.du.map((d) => (
                    <li key={`${d.dossierId}-${d.nature}`} className="flex items-center justify-between gap-3 text-sm">
                      <Link href={`/espace/dossiers/${d.dossierId}`} className="font-bold text-[#1D1B5C] underline underline-offset-4">
                        {d.nature === 'DEPOT' ? 'Déposer' : 'Rendre compte'} : {d.intitule}
                      </Link>
                      <Pastille ton={d.gravite === 'ROUGE' ? 'alerte' : 'attention'}>{d.jours < 0 ? `en retard de ${-d.jours} j` : `dans ${d.jours} j`}</Pastille>
                    </li>
                  ))}
                </ul>
              </Carte>
            ) : null}
            {vieStatutaire.agEnRetard || vieStatutaire.mandatsExpires.length ? (
              <Carte>
                <h3 className="font-extrabold text-[#1D1B5C]">La vie de l&apos;association</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {vieStatutaire.agEnRetard ? (
                    <li className="flex items-center justify-between gap-3">
                      <Link href="/espace/association#vie" className="font-bold text-[#1D1B5C] underline underline-offset-4">
                        La dernière assemblée générale date de plus d&apos;un an
                      </Link>
                      <Pastille ton="attention">à organiser</Pastille>
                    </li>
                  ) : null}
                  {vieStatutaire.mandatsExpires.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3">
                      <Link href="/espace/repertoire" className="font-bold text-[#1D1B5C] underline underline-offset-4">
                        Le mandat de {m.nom} est fini
                      </Link>
                      <Pastille ton="alerte">depuis le {dateCourte(m.mandatFin)}</Pastille>
                    </li>
                  ))}
                </ul>
              </Carte>
            ) : null}
            {lundi.manque.length ? (
              <Carte>
                <h3 className="font-extrabold text-[#1D1B5C]">Il manque des pièces à des dossiers</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {lundi.manque.map((m) => (
                    <li key={m.typeCode} className="flex items-center justify-between gap-3">
                      <Link href="/espace/classeur" className="font-bold text-[#1D1B5C] underline underline-offset-4">
                        {m.libelle}
                      </Link>
                      <span className="text-[#6B6A8A]">
                        {m.dossiers} dossier{m.dossiers > 1 ? 's' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </Carte>
            ) : null}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------ dossiers */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <SousTitre>Dossiers récents</SousTitre>
          <Link href="/espace/dossiers" className="text-sm font-bold text-[#4F46E5] underline underline-offset-4">
            Tous les dossiers
          </Link>
        </div>
        <div className={`${CARTE} overflow-hidden`}>
          {recents.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-bold text-[#1D1B5C]">Aucun dossier pour l&apos;instant.</p>
              <p className="mt-1 text-sm text-[#6B6A8A]">Crée ton premier dossier de subvention : le financeur, la date limite, et les papiers à joindre.</p>
              <Link href="/espace/dossiers" className={`${BTN_PRIMAIRE} mt-4`}>
                Créer un dossier
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F5F4FC] text-left text-xs font-extrabold uppercase tracking-wide text-[#6B6A8A]">
                  <tr>
                    <th className="px-5 py-3">Dossier</th>
                    <th className="px-5 py-3">Financeur</th>
                    <th className="px-5 py-3">Date limite</th>
                    <th className="px-5 py-3">Montant</th>
                    <th className="px-5 py-3">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4F3]">
                  {recents.map((d) => (
                    <tr key={d.id} className="hover:bg-[#F5F4FC]">
                      <td className="px-5 py-3">
                        <Link href={`/espace/dossiers/${d.id}`} className="font-bold text-[#1D1B5C] underline underline-offset-4">
                          {d.intitule}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{d.financeur}</td>
                      <td className="px-5 py-3 tabular-nums">{dateCourte(d.dateLimiteDepot)}</td>
                      <td className="px-5 py-3 tabular-nums">{formaterEuros(d.montantAccorde ?? d.montantDemande)}</td>
                      <td className="px-5 py-3">
                        <Pastille ton={d.etat === 'ACCORDE' || d.etat === 'SOLDE' ? 'ok' : d.etat === 'REFUSE' ? 'alerte' : d.etat === 'DEPOSE' ? 'accent' : 'neutre'}>
                          {LIBELLES_ETAT[d.etat]}
                        </Pastille>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------- se former */}
      <section className="mt-8">
        <Carte>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1B5C]">Apprends, étape par étape</h2>
              <p className="mt-1 leading-relaxed">
                Chaque étape du chemin explique pourquoi, comment faire, et donne les papiers à remplir. Et pour aller plus loin,
                les formations de Toulali (centre de formation certifié Qualiopi) peuvent être financées par ton OPCO.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Link href="/chemin" className={BTN_SECONDAIRE}>
                Le chemin
              </Link>
              <Link href="/se-former" className={BTN_PRIMAIRE}>
                Se former
              </Link>
            </div>
          </div>
        </Carte>
      </section>
    </>
  );
}
