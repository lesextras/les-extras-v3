import Link from 'next/link';

/**
 * LES TROIS VUES DE « MON AGENDA » (01/10/2026).
 *
 * Le menu avait trois entrées de dates (Calendrier, Mon agenda, Planning). Il
 * n'en garde qu'une ; les deux autres vues, qui montrent autre chose (les
 * créneaux formateurs et salles ; ce que voient les apprenants), restent à un
 * clic, en onglets, en haut de chacune des trois pages.
 */
const ONGLETS = [
  { cle: 'agenda', href: '/academie/agenda', libelle: 'Agenda', icone: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { cle: 'planning', href: '/academie/planning', libelle: 'Planning des sessions', icone: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8' },
  { cle: 'calendrier', href: '/academie/calendrier', libelle: 'Calendrier apprenants', icone: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
] as const;

export function OngletsAgenda({ actif }: { actif: (typeof ONGLETS)[number]['cle'] }) {
  return (
    <nav aria-label="Vues de l'agenda" className="mb-6 flex flex-wrap gap-2">
      {ONGLETS.map((o) => {
        const est = o.cle === actif;
        return (
          <Link
            key={o.cle}
            href={o.href}
            aria-current={est ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-[15px] font-bold no-underline transition ${
              est ? 'border-[#1E9E6A] bg-[#1E9E6A] text-white' : 'border-[#CFE4D9] bg-white text-[#12312A] hover:border-[#1E9E6A] hover:text-[#0F5F3E]'
            }`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={o.icone} />
            </svg>
            {o.libelle}
          </Link>
        );
      })}
    </nav>
  );
}
