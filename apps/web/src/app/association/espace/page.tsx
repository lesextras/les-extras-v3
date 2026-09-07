import Link from 'next/link';
import { apiEspace, formaterEuros, sessionAssociation } from '../_session';
import { Encart, Pastille } from '../_ui';
import { Rattacher } from './association/Rattacher';
import { dateCourte, type Espace } from './_types';

/**
 * L'ÉCRAN DU LUNDI. Quatre blocs, rien d'autre au-dessus de la ligne de
 * flottaison : ce qui périme, ce qui est dû, ce qui est en cours, ce qui
 * manque. Puis le chiffre de l'année, celui qu'on montre au conseil.
 */
export default async function LundiPage() {
  const s = await sessionAssociation('/espace');
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');
  if (!data) {
    return <Encart ton="attention">{error ?? "L'espace ne se charge pas pour le moment."}</Encart>;
  }
  const { organisation: o, lundi, chemin } = data;
  const sansIdentite = !o.rna && !o.siret;
  const debut = chemin.faites < 3;

  return (
    <>
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">
          {o.nom} · exercice {lundi.cetteAnnee.annee} · {o.niveau === 'PETITE' ? 'petite association' : o.niveau === 'GESTIONNAIRE' ? 'association gestionnaire' : 'tête de réseau'}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ce lundi</h1>
      </header>

      {sansIdentite ? (
        <div className="mb-8">
          <Encart ton="attention">
            <p className="font-semibold">Votre association n&apos;est pas encore rattachée aux répertoires publics.</p>
            <p className="mt-1 text-sm text-[#3E4A44]">
              Retrouvez-la par son nom : son numéro RNA et son SIRET rempliront le classeur tout seuls.
            </p>
            <div className="mt-3">
              <Rattacher />
            </div>
          </Encart>
        </div>
      ) : null}

      {debut ? (
        <div className="mb-8">
          <Encart>
            <p className="font-semibold">Vous démarrez : le chemin vous guide, une étape à la fois.</p>
            <p className="mt-1 text-sm text-[#3E4A44]">
              {chemin.faites} étape{chemin.faites > 1 ? 's' : ''} sur {chemin.total} déjà faite{chemin.faites > 1 ? 's' : ''}. L&apos;écran
              du lundi prendra tout son sens quand le classeur aura ses cinq pièces d&apos;identité.
            </p>
            <Link href="/espace/chemin" className="mt-3 inline-block text-sm font-medium text-[#1F6A4E] underline underline-offset-4">
              Reprendre le chemin →
            </Link>
          </Encart>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Bloc titre="Ce qui périme" vide="Rien à signaler.">
          {lundi.perime.map((l) => (
            <Ligne key={l.typeCode} href="/espace/classeur" gravite={l.gravite}>
              <span className="font-medium">{l.libelle}</span>
              <span className="text-sm text-[#5C6B63]">
                {l.jours < 0 ? `expirée depuis ${-l.jours} j` : `dans ${l.jours} j`} · {dateCourte(l.dateExpiration)} → {l.action}
              </span>
            </Ligne>
          ))}
        </Bloc>

        <Bloc titre="Ce qui est dû" vide="Aucune échéance dans les 60 jours.">
          {lundi.du.map((l) => (
            <Ligne key={`${l.dossierId}-${l.nature}`} href={`/espace/dossiers/${l.dossierId}`} gravite={l.gravite}>
              <span className="font-medium">
                {l.nature === 'DEPOT' ? 'Dépôt' : 'Compte rendu'} · {l.intitule}
              </span>
              <span className="text-sm text-[#5C6B63]">
                {l.financeur} · {l.jours < 0 ? `dépassé de ${-l.jours} j` : `dans ${l.jours} j`} · {dateCourte(l.echeance)}
              </span>
            </Ligne>
          ))}
        </Bloc>

        <Bloc titre="Ce qui est en cours" vide="Aucun dossier pour l'instant.">
          {lundi.enCours.enEcriture + lundi.enCours.deposes + lundi.enCours.accordesAJustifier + lundi.enCours.refuses + lundi.enCours.reperes > 0 ? (
            <Link href="/espace/dossiers" className="flex flex-wrap gap-2 no-underline">
              {lundi.enCours.reperes ? <Pastille ton="neutre">{lundi.enCours.reperes} repéré{lundi.enCours.reperes > 1 ? 's' : ''}</Pastille> : null}
              {lundi.enCours.enEcriture ? <Pastille ton="neutre">{lundi.enCours.enEcriture} en écriture</Pastille> : null}
              {lundi.enCours.deposes ? <Pastille ton="neutre">{lundi.enCours.deposes} déposé{lundi.enCours.deposes > 1 ? 's' : ''}</Pastille> : null}
              {lundi.enCours.accordesAJustifier ? (
                <Pastille ton="ok">{lundi.enCours.accordesAJustifier} accordé{lundi.enCours.accordesAJustifier > 1 ? 's' : ''} à justifier</Pastille>
              ) : null}
              {lundi.enCours.refuses ? <Pastille ton="attention">{lundi.enCours.refuses} refusé{lundi.enCours.refuses > 1 ? 's' : ''}</Pastille> : null}
            </Link>
          ) : null}
        </Bloc>

        <Bloc titre="Ce qui manque" vide="Rien ne manque aux dossiers en cours.">
          {lundi.manque.map((l) => (
            <Ligne key={l.typeCode} href="/espace/classeur" gravite="AMBRE">
              <span className="font-medium">{l.libelle}</span>
              <span className="text-sm text-[#5C6B63]">
                {l.dossiers} dossier{l.dossiers > 1 ? 's' : ''} {l.dossiers > 1 ? 'la demandent' : 'la demande'} → la ranger au classeur
              </span>
            </Ligne>
          ))}
        </Bloc>
      </div>

      <section className="mt-8 rounded-md border border-[#B9D6C6] bg-[#E4EFE8] px-5 py-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Cette année</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {formaterEuros(lundi.cetteAnnee.obtenu)} obtenus
          <span className="text-base font-normal text-[#3E4A44]">
            {' '}
            sur {lundi.cetteAnnee.dossiersAccordes} dossier{lundi.cetteAnnee.dossiersAccordes > 1 ? 's' : ''}
            {lundi.cetteAnnee.tauxReussite !== null ? ` · ${lundi.cetteAnnee.tauxReussite} % de réussite` : ''} · {lundi.cetteAnnee.piecesPerimees} pièce
            {lundi.cetteAnnee.piecesPerimees > 1 ? 's' : ''} périmée{lundi.cetteAnnee.piecesPerimees > 1 ? 's' : ''} · chemin fait à {chemin.pourcentage} %
          </span>
        </p>
      </section>
    </>
  );
}

function Bloc({ titre, vide, children }: { titre: string; vide: string; children: React.ReactNode }) {
  const contenu = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  const vidé = contenu.length === 0;
  return (
    <section className="rounded-md border border-[#DDD8CC] bg-white p-5">
      <h2 className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">{titre}</h2>
      {vidé ? <p className="mt-2 text-sm text-[#5C6B63]">{vide}</p> : <ul className="mt-3 space-y-2">{children}</ul>}
    </section>
  );
}

function Ligne({ href, gravite, children }: { href: string; gravite: 'ROUGE' | 'AMBRE'; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className={`flex flex-col gap-0.5 rounded-md border-l-4 bg-[#F6F4EE] px-3 py-2 no-underline hover:bg-[#EFEBE2] ${
          gravite === 'ROUGE' ? 'border-[#B23A3A]' : 'border-[#D4A24C]'
        }`}
      >
        {children}
      </Link>
    </li>
  );
}
