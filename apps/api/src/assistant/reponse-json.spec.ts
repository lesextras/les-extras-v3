import { ServiceUnavailableException } from '@nestjs/common';
import { ecritDepuisJsonEventuel } from './reponse-json';

describe('LEX : une réponse en JSON ne devient jamais un écrit', () => {
  it('laisse passer un écrit normal sans y toucher', () => {
    const t = 'FAITS OBSERVÉS\n\nLe participant A rejoint l’atelier à 10 h.';
    expect(ecritDepuisJsonEventuel(t)).toBe(t);
  });

  it('refuse un JSON coupé : le crédit est rendu et la personne relance', () => {
    const coupe = '{"faits_observes": "Le participant A rejoint l’atelier dessin à 10 h.", "elements_d_analyse": ';
    expect(() => ecritDepuisJsonEventuel(coupe)).toThrow(ServiceUnavailableException);
    expect(() => ecritDepuisJsonEventuel('```json\n{"a": ')).toThrow(/incomplet/);
  });

  it('remet un JSON complet en forme d’écrit, sans rien ajouter', () => {
    const t = ecritDepuisJsonEventuel('```json\n{"faits_observes": "Il dessine quinze minutes.", "elements_d_analyse": ["Il demande une feuille", "Il range les crayons"], "vide": ""}\n```');
    expect(t).toBe('FAITS OBSERVES\n\nIl dessine quinze minutes.\n\nELEMENTS D’ANALYSE\n\n• Il demande une feuille\n• Il range les crayons');
    expect(t).not.toMatch(/[{}"]/);
  });

  it('refuse un JSON vide', () => {
    expect(() => ecritDepuisJsonEventuel('{}')).toThrow(/vide/);
  });
});
