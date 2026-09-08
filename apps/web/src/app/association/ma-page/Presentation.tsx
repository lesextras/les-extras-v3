'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Encart, Pastille, formaterDate } from '../_ui';
import { LIBELLES_ROLE, type Espace } from '../espace/_types';

/**
 * LA PAGE DE PRÉSENTATION, COMPOSÉE.
 *
 * Rien n'est saisi ici : tout vient de l'espace. La page se lit, s'imprime,
 * et se copie en texte brut pour être collée dans un formulaire de subvention
 * — c'est la demande qui revient le plus souvent, et c'est toujours le même
 * paragraphe qu'on réécrit à la main.
 */

/** Ce qui manque pour que la page tienne debout devant un financeur. */
function manques(e: Espace) {
  const m: { quoi: string; ou: string; href: string }[] = [];
  const o = e.organisation;
  if (!e.projet.pourQui?.trim()) m.push({ quoi: 'pour qui vous agissez', ou: 'Mes projets', href: '/espace/projets' });
  if (!e.projet.quoi?.trim()) m.push({ quoi: 'ce que vous faites', ou: 'Mes projets', href: '/espace/projets' });
  if (!e.projet.comment?.trim()) m.push({ quoi: 'comment vous le faites', ou: 'Mes projets', href: '/espace/projets' });
  if (!e.projet.apres?.trim()) m.push({ quoi: 'ce que ça change', ou: 'Mes projets', href: '/espace/projets' });
  if (!o.rna && !o.siret) m.push({ quoi: 'le numéro RNA ou le SIRET', ou: 'Mon association', href: '/espace/association' });
  if (!o.commune) m.push({ quoi: 'la commune', ou: 'Mon association', href: '/espace/association' });
  if (!e.vieStatutaire.bureau.president) m.push({ quoi: 'la présidence au répertoire', ou: 'Mon équipe', href: '/espace/repertoire' });
  return m;
}

function texteBrut(e: Espace) {
  const o = e.organisation;
  const l: string[] = [];
  l.push(o.sigle ? `${o.nom} (${o.sigle})` : o.nom);
  const identite = [o.rna ? `RNA ${o.rna}` : null, o.siret ? `SIRET ${o.siret}` : null].filter(Boolean).join(' · ');
  if (identite) l.push(identite);
  const lieu = [o.adresse, [o.codePostal, o.commune].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  if (lieu) l.push(lieu);
  l.push('');
  if (e.projet.pourQui) l.push(`Pour qui — ${e.projet.pourQui}`);
  if (e.projet.quoi) l.push(`Ce que nous faisons — ${e.projet.quoi}`);
  if (e.projet.comment) l.push(`Comment — ${e.projet.comment}`);
  if (e.projet.apres) l.push(`Ce que ça change — ${e.projet.apres}`);
  const enCours = e.actions;
  if (enCours.length) {
    l.push('');
    l.push('Nos actions');
    for (const a of enCours.slice(0, 8)) {
      const dates = [a.dateDebut ? formaterDate(a.dateDebut) : null, a.lieu].filter(Boolean).join(' · ');
      l.push(`- ${a.intitule}${dates ? ` (${dates})` : ''}${a.resume ? ` : ${a.resume}` : ''}`);
    }
  }
  if (e.repertoire.total) {
    l.push('');
    l.push(
      `L'association compte ${e.repertoire.membres} membre${e.repertoire.membres > 1 ? 's' : ''} et ${e.repertoire.benevoles} bénévole${e.repertoire.benevoles > 1 ? 's' : ''}.`,
    );
  }
  return l.join('\n');
}

export function Presentation({ espace }: { espace: Espace }) {
  const o = espace.organisation;
  const aFaire = useMemo(() => manques(espace), [espace]);
  const texte = useMemo(() => texteBrut(espace), [espace]);
  const [copie, setCopie] = useState(false);

  const actions = espace.actions.slice(0, 8);
  const lieu = [o.adresse, [o.codePostal, o.commune].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2500);
    } catch {
      setCopie(false);
    }
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html:
            '@media print{.sans-impression{display:none!important}.a-imprimer{border:0!important;box-shadow:none!important;padding:0!important}body{background:#fff!important}}',
        }}
      />

      <div className="sans-impression mb-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => window.print()} className={BTN_PRIMAIRE}>
          Imprimer ou enregistrer en PDF
        </button>
        <button type="button" onClick={copier} className={BTN_SECONDAIRE}>
          {copie ? 'Texte copié' : 'Copier le texte'}
        </button>
        <Link href="/espace/projets" className={BTN_DISCRET}>
          Modifier le projet
        </Link>
      </div>

      {aFaire.length ? (
        <div className="sans-impression mb-6">
          <Encart ton="attention">
            <span className="font-extrabold">Il manque {aFaire.length} chose{aFaire.length > 1 ? 's' : ''}</span> avant
            de donner cette page : {aFaire.map((m) => m.quoi).join(', ')}.
            <span className="mt-2 block">
              {aFaire.map((m, i) => (
                <span key={m.quoi}>
                  {i ? ' · ' : ''}
                  <Link href={m.href} className="font-bold underline underline-offset-2">
                    {m.ou}
                  </Link>
                </span>
              ))}
            </span>
          </Encart>
        </div>
      ) : (
        <div className="sans-impression mb-6">
          <Encart ton="ok">La page est complète : tu peux la donner telle quelle.</Encart>
        </div>
      )}

      {/* ------------------------------------------------------- la page */}
      <article className={`${CARTE} a-imprimer p-6 sm:p-8`}>
        <header className="border-b border-[#E6E4F3] pb-5">
          <h2 className="text-[26px] font-black leading-tight text-[#1D1B5C]">
            {o.nom}
            {o.sigle ? <span className="text-[#6B6A8A]"> ({o.sigle})</span> : null}
          </h2>
          <p className="mt-2 text-[14px] text-[#6B6A8A]">
            {[o.rna ? `RNA ${o.rna}` : null, o.siret ? `SIRET ${o.siret}` : null, o.natureJuridique]
              .filter(Boolean)
              .join(' · ') || 'Identité à compléter'}
          </p>
          {lieu ? <p className="text-[15px] text-[#3B3A66]">{lieu}</p> : null}
          {o.dateCreation ? (
            <p className="text-[14px] text-[#6B6A8A]">Créée le {formaterDate(o.dateCreation)}</p>
          ) : null}
        </header>

        <section className="mt-6 grid gap-5">
          {[
            { t: 'Pour qui', v: espace.projet.pourQui },
            { t: 'Ce que nous faisons', v: espace.projet.quoi },
            { t: 'Comment', v: espace.projet.comment },
            { t: 'Ce que ça change', v: espace.projet.apres },
          ]
            .filter((b) => b.v?.trim())
            .map((b) => (
              <div key={b.t}>
                <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-[#4F46E5]">{b.t}</h3>
                <p className="mt-1 whitespace-pre-line text-[16px] leading-relaxed text-[#3B3A66]">{b.v}</p>
              </div>
            ))}
        </section>

        {actions.length ? (
          <section className="mt-7 border-t border-[#E6E4F3] pt-6">
            <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-[#4F46E5]">Nos actions</h3>
            <ul className="mt-3 grid gap-3">
              {actions.map((a) => (
                <li key={a.id} className="rounded-xl bg-[#F5F4FC] px-4 py-3">
                  <p className="text-[16px] font-bold text-[#1D1B5C]">{a.intitule}</p>
                  <p className="text-[13px] text-[#6B6A8A]">
                    {[a.dateDebut ? formaterDate(a.dateDebut) : null, a.lieu].filter(Boolean).join(' · ') || 'Date à venir'}
                  </p>
                  {a.resume ? <p className="mt-1 text-[15px] leading-relaxed text-[#3B3A66]">{a.resume}</p> : null}
                  {a.beneficiaires ? (
                    <p className="mt-1 text-[14px] text-[#3B3A66]">{a.beneficiaires} bénéficiaires</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {espace.vieStatutaire.mandatsExpires.length === 0 && espace.repertoire.bureau.length ? (
          <section className="mt-7 border-t border-[#E6E4F3] pt-6">
            <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-[#4F46E5]">Le bureau</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {espace.repertoire.bureau.map((p) => (
                <li key={p.id} className="rounded-full bg-[#ECEBFC] px-3.5 py-1.5 text-[14px] font-bold text-[#4338CA]">
                  {p.nom} — {p.roles.map((r) => LIBELLES_ROLE[r]).join(', ')}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-7 flex flex-wrap gap-2 border-t border-[#E6E4F3] pt-6">
          <Pastille ton="neutre">
            {espace.repertoire.membres} membre{espace.repertoire.membres > 1 ? 's' : ''}
          </Pastille>
          <Pastille ton="neutre">
            {espace.repertoire.benevoles} bénévole{espace.repertoire.benevoles > 1 ? 's' : ''}
          </Pastille>
          {espace.vieStatutaire.dateDerniereAG ? (
            <Pastille ton="neutre">Dernière AG le {formaterDate(espace.vieStatutaire.dateDerniereAG)}</Pastille>
          ) : null}
        </section>
      </article>
    </>
  );
}
