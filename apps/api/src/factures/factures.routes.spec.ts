import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Nest enregistre les routes dans l'ordre de déclaration : une route générique
 * (`PATCH :id`) déclarée AVANT une route nommée du même verbe et du même nombre
 * de segments (`PATCH reglages`) l'avale, sans erreur ni avertissement. Vu en
 * production le 28/09/2026. Ce test lit le source et refuse l'inversion.
 */
describe('FacturesController : ordre des routes', () => {
  const source = readFileSync(join(__dirname, 'factures.controller.ts'), 'utf8');
  const position = (motif: string) => {
    const i = source.indexOf(motif);
    expect(i).toBeGreaterThan(-1);
    return i;
  };

  it("déclare les routes génériques d'une facture après toutes les routes nommées", () => {
    const generiques = ["@Patch(':id')", "@Delete(':id')", "@Post(':id/valider')"].map(position);
    const nommees = ["@Patch('reglages')", "@Get('reglages')", "@Get('journal')", "@Get('bilan')", "@Post('releves')", "@Post('frais')", "@Post('saisie')", "@Post('devis')", "@Get('tresorerie')", "@Get('sessions')", "@Get('depot')"].map(position);
    expect(Math.min(...generiques)).toBeGreaterThan(Math.max(...nommees));
  });
});
