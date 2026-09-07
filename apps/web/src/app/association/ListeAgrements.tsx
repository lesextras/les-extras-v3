import { BTN_SECONDAIRE, CARTE } from './_ui';
import { AGREMENTS_VERIFIE_LE, FAMILLES_AGREMENTS, TRONC_COMMUN } from './_agrements';

/**
 * La liste des agréments qu'une association peut demander. Elle sert à deux
 * endroits : dans « Mon association » (repliée, chaque famille s'ouvre au clic)
 * et sur la page publique /agrements (tout ouvert).
 */
export function dateAgrements() {
  return new Date(AGREMENTS_VERIFIE_LE).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const NOMBRE_AGREMENTS = FAMILLES_AGREMENTS.reduce((t, f) => t + f.agrements.length, 0);

function Fiches({ agrements }: { agrements: (typeof FAMILLES_AGREMENTS)[number]['agrements'] }) {
  return (
    <ul className="mt-4 grid gap-4 md:grid-cols-2">
      {agrements.map((a) => (
        <li key={a.code} id={a.code} className="scroll-mt-24">
          <article className={`${CARTE} flex h-full flex-col p-5`}>
            <h4 className="text-lg font-extrabold leading-snug text-[#1D1B5C]">{a.nom}</h4>
            <p className="mt-1 text-sm font-bold text-[#6B6A8A]">{a.par}</p>
            <p className="mt-3 leading-relaxed text-[#3B3A66]">{a.ouvre}</p>

            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="font-extrabold text-[#1D1B5C]">Pour qui</dt>
                <dd className="mt-0.5 leading-relaxed text-[#3B3A66]">{a.pourQui}</dd>
              </div>
              {a.duree ? (
                <div>
                  <dt className="font-extrabold text-[#1D1B5C]">Durée</dt>
                  <dd className="mt-0.5 text-[#3B3A66]">{a.duree}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-extrabold text-[#1D1B5C]">Où le demander</dt>
                <dd className="mt-0.5 leading-relaxed text-[#3B3A66]">{a.ou}</dd>
              </div>
            </dl>

            <a href={a.lien} target="_blank" rel="noopener" className="mt-auto pt-4 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
              {a.lienLibelle} ↗
            </a>
          </article>
        </li>
      ))}
    </ul>
  );
}

/**
 * @param replie Vrai dans l'espace : chaque famille est un bloc qu'on déplie.
 */
export function ListeAgrements({ replie = false }: { replie?: boolean }) {
  return (
    <>
      {/* ------------------------------------------------------ tronc commun */}
      <section className={`${CARTE} mb-8 p-5 sm:p-6`}>
        <h3 className="text-xl font-extrabold text-[#1D1B5C]">{TRONC_COMMUN.titre}</h3>
        <p className="mt-1 max-w-[70ch] leading-relaxed text-[#3B3A66]">{TRONC_COMMUN.enUnMot}</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {TRONC_COMMUN.conditions.map((c, index) => (
            <li key={c.titre} className="flex gap-3 rounded-xl bg-[#F5F4FC] p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ECEBFC] text-sm font-extrabold text-[#4338CA]">
                {index + 1}
              </span>
              <span>
                <span className="block font-extrabold text-[#1D1B5C]">{c.titre}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-[#3B3A66]">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <a href={TRONC_COMMUN.lien} target="_blank" rel="noopener" className={`${BTN_SECONDAIRE} mt-4`}>
          {TRONC_COMMUN.lienLibelle} ↗
        </a>
      </section>

      {/* --------------------------------------------------------- les fiches */}
      {replie ? (
        <div className="space-y-3">
          {FAMILLES_AGREMENTS.map((famille) => (
            <details key={famille.code} id={famille.code.toLowerCase()} className={`${CARTE} scroll-mt-24 p-5`}>
              <summary className="cursor-pointer list-none">
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-lg font-extrabold text-[#1D1B5C]">{famille.titre}</span>
                    <span className="mt-0.5 block max-w-[70ch] text-sm leading-relaxed text-[#6B6A8A]">{famille.enUnMot}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[#ECEBFC] px-3 py-1 text-sm font-extrabold text-[#4338CA]">
                    {famille.agrements.length}
                  </span>
                </span>
              </summary>
              <Fiches agrements={famille.agrements} />
            </details>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {FAMILLES_AGREMENTS.map((famille) => (
            <section key={famille.code} id={famille.code.toLowerCase()} className="scroll-mt-24">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#1D1B5C]">{famille.titre}</h3>
              <p className="mt-1 max-w-[70ch] leading-relaxed text-[#3B3A66]">{famille.enUnMot}</p>
              <Fiches agrements={famille.agrements} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
