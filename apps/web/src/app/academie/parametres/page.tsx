import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_DISCRET, CARTE, Encart, Pastille, Titre, formaterDate } from '../_ui';
import { LIBELLES_QUALIOPI, type FicheAcademie } from '../_types';
import { OngletsParametres } from './_onglets';

export const metadata: Metadata = { title: 'Paramètres', robots: { index: false, follow: false } };

/**
 * `/academie/parametres` — CE QUI RÈGLE L'ESPACE.
 *
 * Pas un deuxième formulaire : la fiche complète se remplit dans « Mon
 * académie ». Ici on voit d'un coup ce qui commande le reste — l'identité
 * administrative, les deux référents que le référentiel exige, l'adresse de
 * contact, qui a accès — et ce qui manque saute aux yeux.
 */
export default async function ParametresPage() {
  const s = await sessionAcademie('/academie/parametres');
  const { data, error } = await apiAcademie<FicheAcademie>(s, '/academie/fiche');

  if (!data) {
    return (
      <>
        <Titre surtitre="Mon compte">Paramètres</Titre>
        <Encart ton="attention">{error ?? 'Les paramètres ne se chargent pas pour le moment.'}</Encart>
      </>
    );
  }

  const a = data;
  const identite = [
    { libelle: 'Numéro de déclaration (NDA)', valeur: a.nda, indispensable: true },
    { libelle: 'SIREN', valeur: a.siren, indispensable: true },
    { libelle: 'SIRET', valeur: a.siret, indispensable: true },
    { libelle: 'Code APE', valeur: a.ape, indispensable: false },
    { libelle: 'DREETS de rattachement', valeur: a.dreets, indispensable: false },
  ];
  const contact = [
    { libelle: 'Adresse', valeur: [a.adresse, [a.codePostal, a.commune].filter(Boolean).join(' ')].filter(Boolean).join(', ') },
    { libelle: 'Téléphone', valeur: a.telephone },
    { libelle: 'Courriel', valeur: a.courriel },
    { libelle: 'Site web', valeur: a.siteWeb },
  ];

  const manquants = identite.filter((l) => l.indispensable && !l.valeur).length;

  return (
    <>
      <Titre
        surtitre="Mon compte"
        sousTitre="Ce qui commande le fonctionnement de ton espace. La fiche complète se remplit dans « Mon académie »."
      >
        Paramètres
      </Titre>
      <OngletsParametres actif="/academie/parametres" />

      <div className="grid gap-4">
        {/* -------------------------------------------------- l'identité */}
        <section className={`${CARTE} p-5`}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[240px] flex-1">
              <h2 className="text-[18px] font-extrabold text-[#12312A]">
                {a.nom}
                {a.sigle ? <span className="text-[#5E7A6E]"> ({a.sigle})</span> : null}
              </h2>
              <p className="mt-1 text-[14px] text-[#5E7A6E]">Identité administrative de l&apos;organisme de formation</p>
            </div>
            <Link href="/academie/mon-academie" className={BTN_DISCRET}>
              Modifier
            </Link>
          </div>

          <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {identite.map((l) => (
              <div key={l.libelle} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#EDF4F1] py-1.5">
                <dt className="text-[14px] text-[#5E7A6E]">{l.libelle}</dt>
                <dd className={`text-[15px] font-bold ${l.valeur ? 'text-[#12312A]' : 'text-[#C42B57]'}`}>
                  {l.valeur || (l.indispensable ? 'à renseigner' : 'Non renseigné')}
                </dd>
              </div>
            ))}
          </dl>

          {manquants ? (
            <p className="mt-3 rounded-xl bg-[#FDE7EC] px-4 py-3 text-[14px] leading-relaxed text-[#8A1B3D]">
              {manquants} information{manquants > 1 ? 's' : ''} administrative{manquants > 1 ? 's' : ''} manque
              {manquants > 1 ? 'nt' : ''}. Sans NDA ni SIRET, aucun financeur ne peut instruire un dossier.
            </p>
          ) : null}
        </section>

        {/* ------------------------------------------------- les référents */}
        <section className={`${CARTE} p-5`}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[240px] flex-1">
              <h2 className="text-[18px] font-extrabold text-[#12312A]">Les deux référents</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">
                Le référentiel national qualité demande de savoir qui, chez toi, accueille un apprenant en situation
                de handicap, et qui répond de la pédagogie. Ce peut être la même personne, mais il faut un nom.
              </p>
            </div>
            <Link href="/academie/mon-academie" className={BTN_DISCRET}>
              Modifier
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { t: 'Référent handicap', v: a.referentHandicap },
              { t: 'Référent pédagogique', v: a.referentPedagogique },
            ].map((r) => (
              <div key={r.t} className={`rounded-xl px-4 py-3 ${r.v ? 'bg-[#E3F5EC]' : 'bg-[#FDE7EC]'}`}>
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">{r.t}</p>
                <p className={`text-[16px] font-extrabold ${r.v ? 'text-[#0F5F3E]' : 'text-[#8A1B3D]'}`}>
                  {r.v || 'personne désignée'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ Qualiopi */}
        <section className={`${CARTE} p-5`}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[240px] flex-1">
              <h2 className="text-[18px] font-extrabold text-[#12312A]">La certification</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pastille ton={a.qualiopi === 'CERTIFIE' ? 'ok' : a.qualiopi === 'SUSPENDU' ? 'alerte' : 'attention'}>
                  {LIBELLES_QUALIOPI[a.qualiopi]}
                </Pastille>
                {a.certificateur ? <Pastille ton="neutre">{a.certificateur}</Pastille> : null}
                {a.auditPrevuLe ? <Pastille ton="neutre">Audit le {formaterDate(a.auditPrevuLe)}</Pastille> : null}
                {a.certifieAu ? <Pastille ton="neutre">Valable jusqu&apos;au {formaterDate(a.certifieAu)}</Pastille> : null}
              </div>
            </div>
            <Link href="/academie/certification" className={BTN_DISCRET}>
              Mes preuves
            </Link>
          </div>
        </section>

        {/* -------------------------------------------------- le contact */}
        <section className={`${CARTE} p-5`}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[240px] flex-1">
              <h2 className="text-[18px] font-extrabold text-[#12312A]">Comment on te joint</h2>
              <p className="mt-1 text-[14px] text-[#5E7A6E]">
                Ces coordonnées apparaissent sur les conventions et les attestations.
              </p>
            </div>
            <Link href="/academie/mon-academie" className={BTN_DISCRET}>
              Modifier
            </Link>
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {contact.map((l) => (
              <div key={l.libelle} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#EDF4F1] py-1.5">
                <dt className="text-[14px] text-[#5E7A6E]">{l.libelle}</dt>
                <dd className="break-all text-[15px] font-bold text-[#12312A]">{l.valeur || 'Non renseigné'}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ------------------------------------------------------- l'accès */}
        <section className={`${CARTE} p-5`}>
          <h2 className="text-[18px] font-extrabold text-[#12312A]">Qui a accès à cet espace</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">
            Chaque personne entre avec son propre compte : tu invites par l&apos;adresse e-mail, elle s&apos;inscrit
            elle-même et tu choisis jusqu&apos;où elle peut aller. Aucun compte n&apos;est créé à la place de
            quelqu&apos;un.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/academie/droits-acces" className={BTN_DISCRET}>
              Droits d&apos;accès
            </Link>
            <Link href="/academie/formateurs" className={BTN_DISCRET}>
              Mes formateurs
            </Link>
            <Link href="/academie/mon-profil" className={BTN_DISCRET}>
              Mon profil
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------- tes données */}
        <section className={`${CARTE} p-5`}>
          <h2 className="text-[18px] font-extrabold text-[#12312A]">Tes données</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">
            Tes formations, tes sessions, tes preuves et tes apprenants t&apos;appartiennent. Tu peux les ressortir
            quand tu veux, et demander la fermeture de l&apos;espace à tout moment.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/academie/nous-contacter" className={BTN_DISCRET}>
              Demander la fermeture
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
