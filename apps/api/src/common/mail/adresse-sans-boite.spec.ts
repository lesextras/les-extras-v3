import { adresseSansBoite } from './mail.service';

/**
 * Les quatre comptes du seed du 27/07/2026 ont une adresse sur un domaine sans
 * MX : chaque e-mail revenait en erreur. On ne leur écrit plus, et on écrit
 * toujours à tout le monde d'autre.
 */
describe('Adresses sans boîte aux lettres', () => {
  it('ne vise que le domaine sans MX, quelle que soit la casse', () => {
    expect(adresseSansBoite('younes@intervenants.les-extras.fr')).toBe(true);
    expect(adresseSansBoite('Siham@INTERVENANTS.les-extras.fr ')).toBe(true);
  });
  it('laisse passer les vraies adresses, y compris celles du domaine principal', () => {
    expect(adresseSansBoite('contact@les-extras.fr')).toBe(false);
    expect(adresseSansBoite('assoc.adepa@gmail.com')).toBe(false);
  });
});
