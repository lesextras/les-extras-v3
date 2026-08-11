import { ServiceCategory, ServiceStatus } from '@prisma/client';
import { PublicService } from './public.service';

/**
 * LA PAGE D'ACCUEIL NE DOIT PAS SE CONTREDIRE.
 *
 * Constaté en production le 11 août 2026, la veille d'une campagne payante :
 * le bloc « Les ateliers de notre réseau » listait TOUTES les fiches publiées,
 * y compris celles rangées en catégorie FORMATION. Trois d'entre elles
 * existaient aussi comme Formation certifiante. Résultat pour le visiteur :
 * la même prestation affichée deux fois sur la même page, et des « ateliers »
 * allant de 50 € à 1 600 €.
 *
 * Le catalogue (`/public/catalog`) filtrait déjà correctement ; seule la mise
 * en avant de l'accueil ne le faisait pas. C'est exactement le genre d'écart
 * qui se réintroduit sans bruit — d'où ce test, qui porte sur la promesse
 * (« un atelier est un atelier ») et non sur la forme de la requête.
 */

function serviceAvecFiches(fiches: Array<Record<string, unknown>>) {
  const vues: Array<Record<string, unknown>> = [];
  const prisma: any = {
    service: {
      findMany: jest.fn((args: any) => {
        vues.push(args.where);
        const cat = args?.where?.category;
        const gardees = fiches.filter((f) => {
          if (!cat) return true;
          if (typeof cat === 'object' && 'not' in cat) return f.category !== (cat as any).not;
          return f.category === cat;
        });
        return Promise.resolve(gardees);
      }),
    },
    formation: { findMany: jest.fn().mockResolvedValue([]) },
    review: { groupBy: jest.fn().mockResolvedValue([]) },
    inscription: { groupBy: jest.fn().mockResolvedValue([]) },
  };
  // `highlights()` ne touche ni au courrier ni à la progression : on ne monte
  // que ce dont il se sert réellement.
  return { service: new PublicService(prisma, {} as any, {} as any), prisma, vues };
}

const FICHES = [
  { id: 'a1', title: 'ATELIER THÉÂTRE', category: ServiceCategory.ATELIER, status: ServiceStatus.PUBLISHED, price: 160 },
  { id: 'a2', title: 'ATELIER PSYCHO-BOXE', category: ServiceCategory.ATELIER, status: ServiceStatus.PUBLISHED, price: 120 },
  { id: 'f1', title: 'ANALYSE DES PRATIQUES PROFESSIONNELLES', category: ServiceCategory.FORMATION, status: ServiceStatus.PUBLISHED, price: 1600 },
  { id: 'f2', title: 'Accueil du public difficile', category: ServiceCategory.FORMATION, status: ServiceStatus.PUBLISHED, price: 1400 },
];

describe('Accueil : un atelier mis en avant est un atelier', () => {
  it('écarte les fiches rangées en FORMATION du bloc « ateliers »', async () => {
    const { service } = serviceAvecFiches(FICHES);
    const { ateliers } = await service.highlights();
    const titres = ateliers.map((a: any) => a.title);

    expect(titres).toEqual(expect.arrayContaining(['ATELIER THÉÂTRE', 'ATELIER PSYCHO-BOXE']));
    expect(titres).not.toContain('ANALYSE DES PRATIQUES PROFESSIONNELLES');
    expect(titres).not.toContain('Accueil du public difficile');
  });

  it('ne met en avant que des fiches réellement publiées', async () => {
    const { service, vues } = serviceAvecFiches(FICHES);
    await service.highlights();
    expect(vues[0]).toMatchObject({ status: ServiceStatus.PUBLISHED });
  });

  it('n’affiche aucun tarif de formation dans le bloc ateliers', async () => {
    // Garde-fou de bon sens : si un jour la catégorie n'est plus renseignée,
    // un écart de prix d'un ordre de grandeur doit quand même se voir.
    const { service } = serviceAvecFiches(FICHES);
    const { ateliers } = await service.highlights();
    const prix = ateliers.map((a: any) => a.price).filter((p: unknown) => typeof p === 'number');
    expect(Math.max(...prix)).toBeLessThan(1000);
  });
});
