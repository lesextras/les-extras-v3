import type { Metadata } from 'next';
import { apiAdministration, sessionAdministration, type CompteAdmin, type CoursAdmin, type FormulaireAdmin, type PersonneAdmin, type Tableau } from './_admin';
import { Console } from './Console';

export const metadata: Metadata = { title: 'Administration', robots: { index: false, follow: false } };

/**
 * L'ADMINISTRATION.
 *
 * Tout est chargé côté serveur, en une fois : l'écran s'ouvre déjà rempli. Le
 * rôle est vérifié ici et à chaque appel de l'API — l'affichage n'autorise
 * rien par lui-même.
 */
export default async function AdministrationPage() {
  const session = await sessionAdministration();

  const [t, c, p, f, co] = await Promise.all([
    apiAdministration<Tableau>(session, '/administration/tableau'),
    apiAdministration<CompteAdmin[]>(session, '/administration/comptes'),
    apiAdministration<PersonneAdmin[]>(session, '/administration/personnes'),
    apiAdministration<FormulaireAdmin[]>(session, '/administration/formulaires'),
    apiAdministration<CoursAdmin[]>(session, '/administration/cours'),
  ]);

  if (!t.data) {
    return (
      <p className="rounded-2xl border border-[#7A1D3A] bg-[#2A1220] px-5 py-4 text-[15px] font-bold text-[#F3B0C2]">
        {t.error ?? "L'administration ne se charge pas pour le moment."}
      </p>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
        Tout ce qui se passe sur Piloter
      </h1>
      <Console
        tableau={t.data}
        comptes={c.data ?? []}
        personnes={p.data ?? []}
        formulaires={f.data ?? []}
        cours={co.data ?? []}
      />
    </>
  );
}
