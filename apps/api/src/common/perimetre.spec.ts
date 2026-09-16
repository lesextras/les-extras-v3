import { Capacite, NiveauResponsabilite, PorteeService } from '@prisma/client';
import {
  MembreCourant,
  estDirection,
  filtreMembresVisibles,
  capacitesEffectives,
  capacitesDelegables,
  niveauDelegable,
  niveauValideDOffice,
  peutPiloterService,
  servicesPilotes,
  versMembreCourant,
} from './perimetre';
import { normaliserNom, memeNom } from './normaliser';

const membre = (p: Partial<MembreCourant> = {}): MembreCourant => ({
  id: 'm1',
  accountId: 'a1',
  userId: 'u1',
  niveau: NiveauResponsabilite.SALARIE,
  niveauValide: false,
  capacites: [],
  servicesEncadres: [],
  servicesRattaches: [],
  ...p,
});

/**
 * Le périmètre est LE garde-fou du modèle ouvert : n'importe qui peut se
 * déclarer directeur, et rien ne se passe tant que ce n'est pas validé. Si ces
 * tests tombent, le modèle entier tombe avec eux — ils ne se « réparent » pas
 * en assouplissant l'assertion.
 */
describe('périmètre — qui voit qui', () => {
  describe('un niveau DÉCLARÉ ne produit rien', () => {
    it("une DIRECTION non validée n'est pas une direction", () => {
      expect(estDirection(membre({ niveau: NiveauResponsabilite.DIRECTION }))).toBe(false);
    });

    it('une DIRECTION non validée ne voit qu’elle-même et ses invités', () => {
      const filtre = filtreMembresVisibles(membre({ niveau: NiveauResponsabilite.DIRECTION }));
      expect(filtre.OR).toEqual([{ id: 'm1' }, { parrainMembershipId: 'm1' }]);
    });

    it("une DIRECTION non validée n'a que le socle de droits", () => {
      expect(capacitesEffectives(membre({ niveau: NiveauResponsabilite.DIRECTION }))).toEqual([
        Capacite.DEMANDER_DEVIS,
      ]);
    });

    it('une DIRECTION validée voit tout l’établissement, sans condition', () => {
      const filtre = filtreMembresVisibles(
        membre({ niveau: NiveauResponsabilite.DIRECTION, niveauValide: true }),
      );
      expect(filtre).toEqual({ accountId: 'a1' });
      expect(filtre.OR).toBeUndefined();
    });
  });

  describe('un responsable est autonome, sans validation', () => {
    const chef = membre({
      niveau: NiveauResponsabilite.RESPONSABLE,
      niveauValide: false,
      servicesEncadres: ['s1', 's2'],
    });

    it('voit les gens de ses services et ceux qu’il a fait venir', () => {
      const filtre = filtreMembresVisibles(chef);
      expect(filtre.accountId).toBe('a1');
      expect(filtre.OR).toEqual(
        expect.arrayContaining([
          { id: 'm1' },
          { parrainMembershipId: 'm1' },
          { services: { some: { orgUnitId: { in: ['s1', 's2'] } } } },
        ]),
      );
    });

    it('ne pilote QUE les services qu’il encadre', () => {
      expect(peutPiloterService(chef, 's1')).toBe(true);
      expect(peutPiloterService(chef, 's9')).toBe(false);
      expect(servicesPilotes(chef)).toEqual(['s1', 's2']);
    });

    it('a d’office les droits qui pilotent son équipe', () => {
      const c = capacitesEffectives(chef);
      expect(c).toContain(Capacite.INVITER_MEMBRES);
      expect(c).toContain(Capacite.GERER_PLANNING);
      expect(c).toContain(Capacite.DEMANDER_RENFORT_INTERNE);
      // Mais pas ceux qui engagent l'établissement.
      expect(c).not.toContain(Capacite.RESERVER_DIRECT);
      expect(c).not.toContain(Capacite.SIGNER_CONVENTIONS);
    });
  });

  describe('un salarié ne voit que lui, et ses invités', () => {
    it('a le socle : demander un devis', () => {
      expect(capacitesEffectives(membre())).toEqual([Capacite.DEMANDER_DEVIS]);
    });

    it('peut recevoir un droit à l’unité', () => {
      const avec = membre({ capacites: [Capacite.RESERVER_DIRECT] });
      expect(capacitesEffectives(avec)).toContain(Capacite.RESERVER_DIRECT);
    });

    it('ne pilote aucun service', () => {
      expect(servicesPilotes(membre())).toEqual([]);
      expect(peutPiloterService(membre(), 's1')).toBe(false);
    });
  });
});

describe('délégation — on ne donne que ce qu’on a', () => {
  it('un responsable ne peut pas déléguer un droit qu’il n’a pas', () => {
    const chef = membre({ niveau: NiveauResponsabilite.RESPONSABLE, servicesEncadres: ['s1'] });
    const accorde = capacitesDelegables(chef, [
      Capacite.GERER_PLANNING,
      Capacite.SIGNER_CONVENTIONS,
    ]);
    expect(accorde).toEqual([Capacite.GERER_PLANNING]);
  });

  it('une direction validée peut tout déléguer', () => {
    const dir = membre({ niveau: NiveauResponsabilite.DIRECTION, niveauValide: true });
    expect(capacitesDelegables(dir, [Capacite.SIGNER_CONVENTIONS])).toEqual([
      Capacite.SIGNER_CONVENTIONS,
    ]);
  });

  it('un salarié à qui on a donné un droit peut le transmettre', () => {
    const sal = membre({ capacites: [Capacite.INVITER_MEMBRES] });
    expect(capacitesDelegables(sal, [Capacite.INVITER_MEMBRES])).toEqual([
      Capacite.INVITER_MEMBRES,
    ]);
  });
});

describe('délégation — on n’invite pas plus haut que soi', () => {
  it('un responsable qui invite une direction crée un responsable', () => {
    const chef = membre({ niveau: NiveauResponsabilite.RESPONSABLE });
    expect(niveauDelegable(chef, NiveauResponsabilite.DIRECTION)).toBe(
      NiveauResponsabilite.RESPONSABLE,
    );
  });

  it('un responsable peut inviter un responsable — c’est le coordinateur', () => {
    const chef = membre({ niveau: NiveauResponsabilite.RESPONSABLE });
    expect(niveauDelegable(chef, NiveauResponsabilite.RESPONSABLE)).toBe(
      NiveauResponsabilite.RESPONSABLE,
    );
  });

  it('un salarié n’invite que des salariés', () => {
    expect(niveauDelegable(membre(), NiveauResponsabilite.RESPONSABLE)).toBe(
      NiveauResponsabilite.SALARIE,
    );
  });

  it('une direction validée peut promouvoir une autre direction', () => {
    const dir = membre({ niveau: NiveauResponsabilite.DIRECTION, niveauValide: true });
    expect(niveauDelegable(dir, NiveauResponsabilite.DIRECTION)).toBe(
      NiveauResponsabilite.DIRECTION,
    );
    expect(niveauValideDOffice(dir, NiveauResponsabilite.DIRECTION)).toBe(true);
  });

  it('une direction invitée par un responsable arrive NON validée', () => {
    const chef = membre({ niveau: NiveauResponsabilite.RESPONSABLE });
    expect(niveauValideDOffice(chef, NiveauResponsabilite.DIRECTION)).toBe(false);
  });

  it('tout niveau autre que direction est validé d’office', () => {
    expect(niveauValideDOffice(membre(), NiveauResponsabilite.RESPONSABLE)).toBe(true);
    expect(niveauValideDOffice(membre(), NiveauResponsabilite.SALARIE)).toBe(true);
  });
});

describe('versMembreCourant — rattachement et encadrement sont distincts', () => {
  it('sépare les deux portées', () => {
    const m = versMembreCourant({
      id: 'm1',
      accountId: 'a1',
      userId: 'u1',
      niveau: NiveauResponsabilite.RESPONSABLE,
      niveauValide: false,
      capacites: [],
      services: [
        { orgUnitId: 'pole-jour', portee: PorteeService.RATTACHEMENT },
        { orgUnitId: 'pole-jour', portee: PorteeService.ENCADREMENT },
        { orgUnitId: 'sessad', portee: PorteeService.ENCADREMENT },
      ],
    });
    // Le cas exact décrit par la fondatrice : rattaché au Pôle jour, encadre
    // le Pôle jour ET le SESSAD.
    expect(m.servicesRattaches).toEqual(['pole-jour']);
    expect(m.servicesEncadres).toEqual(['pole-jour', 'sessad']);
  });
});

describe('normalisation d’un nom de service', () => {
  it('fait tomber les trois orthographes de SESSAD sur la même clé', () => {
    expect(normaliserNom('SESSAD')).toBe('sessad');
    expect(normaliserNom('Sessad')).toBe('sessad');
    expect(normaliserNom('S.E.S.S.A.D.')).toBe('sessad');
    expect(memeNom('SESSAD', 's e s s a d')).toBe(true);
  });

  it('retire les accents', () => {
    expect(normaliserNom('Pôle éducatif')).toBe('poleeducatif');
  });

  it('distingue deux vrais services', () => {
    expect(memeNom('SESSAD Melun', 'SESSAD Sénart')).toBe(false);
  });

  it('ne rapproche pas deux noms vides', () => {
    expect(memeNom('!!!', '???')).toBe(false);
  });
});
