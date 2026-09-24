import { PartagesService } from './partages.service';
import { masquer, filtrerEtMasquer } from './masquage';
import type { EvenementAgenda } from '../agenda/agenda.service';

/**
 * CE QUE CES TESTS PROTÈGENT : un agenda partagé ne laisse jamais voir plus
 * que le niveau accordé, et c'est toujours la personne sollicitée qui décide.
 */
const evt = (over: Partial<EvenementAgenda> = {}): EvenementAgenda => ({
  id: 'rdv:1',
  source: 'RENDEZ_VOUS',
  rendezVousId: 'r1',
  titre: 'Synthèse avec la famille M.',
  detail: 'Point sur le projet personnalisé',
  lieu: 'Salle 2',
  lien: 'https://visio.exemple/abc',
  debut: new Date('2026-10-05T08:00:00Z'),
  fin: new Date('2026-10-05T09:00:00Z'),
  journeeEntiere: false,
  categorie: 'REUNION',
  participants: ['Mme M.'],
  modifiable: true,
  href: '/dashboard/agenda',
  par: 'Siham',
  ...over,
});

describe('masquage d’un agenda partagé', () => {
  it('« disponibilités » ne dit que « Occupé » et l’horaire', () => {
    const m = masquer(evt(), 'DISPONIBILITES', 'p:1');
    expect(m).toMatchObject({ titre: 'Occupé', source: 'OCCUPE', detail: null, lieu: null, lien: null, participants: [], modifiable: false, href: null, rendezVousId: null });
    expect(m.debut).toEqual(evt().debut);
    expect(JSON.stringify(m)).not.toContain('famille');
  });
  it('« titres » garde titre et lieu, jamais la description ni les participants', () => {
    const m = masquer(evt(), 'TITRES', 'p:1');
    expect(m.titre).toBe('Synthèse avec la famille M.');
    expect(m.lieu).toBe('Salle 2');
    expect(m.detail).toBeNull();
    expect(m.participants).toEqual([]);
    expect(m.lien).toBeNull();
  });
  it('« détails » montre tout mais ne rend rien modifiable et retire le lien interne', () => {
    const m = masquer(evt(), 'DETAILS', 'p:1');
    expect(m.detail).toContain('projet');
    expect(m.modifiable).toBe(false);
    expect(m.href).toBeNull();
  });
  it('« modification » rend modifiables les seuls rendez-vous notés à la main', () => {
    expect(masquer(evt(), 'MODIFICATION', 'p:1')).toMatchObject({ modifiable: true, rendezVousId: 'r1' });
    expect(masquer(evt({ source: 'RESERVATION', rendezVousId: null }), 'MODIFICATION', 'p:1').modifiable).toBe(false);
  });
  it('préfixe les identifiants et retire les réservations quand le partage les exclut', () => {
    const liste = filtrerEtMasquer([evt(), evt({ id: 'resa:9', source: 'RESERVATION' })], 'DETAILS', false, 'p:7');
    expect(liste).toHaveLength(1);
    expect(liste[0].id).toBe('p:7:rdv:1');
  });
});

function monter(partages: Record<string, unknown>[] = []) {
  const store = [...partages];
  const prisma = {
    partageAgenda: {
      count: jest.fn(async () => 0),
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => store),
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => store.find((p) => p.id === where.id) ?? null),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const p = { id: 'n1', createdAt: new Date(), reponduLe: null, couleur: null, visible: true, compte: null, proprietaire: null, destinataire: null, ...data };
        store.push(p);
        return p;
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const p = store.find((x) => x.id === where.id) as Record<string, unknown>;
        Object.assign(p, data);
        return p;
      }),
    },
    user: {
      findFirst: jest.fn(async () => ({ id: 'u2', email: 'bob@exemple.fr' })),
      findUnique: jest.fn(async () => ({ firstName: 'Ana', lastName: 'B', email: 'ana@exemple.fr' })),
    },
    account: { findUnique: jest.fn(async () => ({ name: 'MECS Les Tilleuls' })) },
    service: { findMany: jest.fn(async () => []) },
  };
  const agenda = { evenements: jest.fn(async () => [evt()]), creer: jest.fn(async () => ({ titre: 'x' })) };
  const mail = { sendPartageAgenda: jest.fn(async () => undefined) };
  const notifications = { create: jest.fn(async () => undefined) };
  const service = new PartagesService(prisma as never, agenda as never, mail as never, notifications as never);
  return { service, prisma, agenda, mail, notifications, store };
}

const ana = { id: 'u1', email: 'ana@exemple.fr', role: 'USER' } as never;
const bob = { id: 'u2', email: 'bob@exemple.fr', role: 'USER' } as never;
const compteAna = { id: 'acc1', role: 'OWNER', type: 'ESTABLISHMENT', membershipId: 'm1' } as never;
const compteBob = { id: 'acc2', role: 'OWNER', type: 'FREELANCE', membershipId: 'm2' } as never;

describe('PartagesService', () => {
  it('une invitation ne montre rien tant qu’elle n’est pas acceptée', async () => {
    const { service, prisma } = monter();
    await service.calendrier(bob, '2026-10-01T00:00:00Z', '2026-10-31T00:00:00Z');
    const where = (prisma.partageAgenda.findMany.mock.calls[0] as unknown as [{ where: { statut: string } }])[0].where;
    expect(where.statut).toBe('ACCEPTE');
  });

  it('crée l’invitation en attente et prévient la personne invitée', async () => {
    const { service, store, notifications, mail } = monter();
    await service.inviter(ana, compteAna, { email: 'Bob@Exemple.fr', niveau: 'DETAILS' });
    expect(store[0]).toMatchObject({ statut: 'EN_ATTENTE', sens: 'INVITATION', compteId: 'acc1', destinataireEmail: 'bob@exemple.fr', destinataireId: 'u2' });
    expect(notifications.create).toHaveBeenCalledWith('u2', expect.objectContaining({ type: 'PARTAGE_AGENDA' }));
    expect(mail.sendPartageAgenda).toHaveBeenCalled();
  });

  it('refuse de partager son agenda avec soi-même, et hors titulaire', async () => {
    const { service } = monter();
    await expect(service.inviter(ana, compteAna, { email: 'ana@exemple.fr', niveau: 'TITRES' })).rejects.toThrow();
    await expect(service.inviter(ana, { ...(compteAna as object), role: 'MEMBER' } as never, { email: 'bob@exemple.fr', niveau: 'TITRES' })).rejects.toThrow();
  });

  it('une demande est acceptée par la personne titulaire, qui choisit son compte et le niveau', async () => {
    const { service, store } = monter();
    await service.demander(ana, { email: 'bob@exemple.fr', niveau: 'MODIFICATION' });
    expect(store[0]).toMatchObject({ sens: 'DEMANDE', proprietaireId: 'u2', destinataireId: 'u1' });
    expect(store[0].compteId).toBeUndefined();
    // Ana ne peut pas accepter sa propre demande.
    await expect(service.accepter(ana, compteAna, 'n1', {})).rejects.toThrow();
    await service.accepter(bob, compteBob, 'n1', { niveau: 'TITRES' });
    expect(store[0]).toMatchObject({ statut: 'ACCEPTE', niveau: 'TITRES', compte: { connect: { id: 'acc2' } } });
  });

  it('écrire dans un agenda partagé exige le niveau « modification »', async () => {
    const { service, agenda } = monter([
      { id: 'p1', statut: 'ACCEPTE', sens: 'INVITATION', niveau: 'DETAILS', compteId: 'acc1', proprietaireId: 'u1', destinataireId: 'u2', destinataireEmail: 'bob@exemple.fr', creeParId: 'u1', inclutReservations: true, createdAt: new Date() },
    ]);
    await expect(service.creerRendezVous(bob, 'p1', { titre: 'Point', debut: '2026-10-05T08:00:00Z' })).rejects.toThrow(/consulter/);
    expect(agenda.creer).not.toHaveBeenCalled();
  });

  it('le calendrier partagé passe toujours par le masquage', async () => {
    const { service } = monter([
      { id: 'p1', statut: 'ACCEPTE', sens: 'INVITATION', niveau: 'DISPONIBILITES', compteId: 'acc1', proprietaireId: 'u1', destinataireId: 'u2', destinataireEmail: 'bob@exemple.fr', creeParId: 'u1', inclutReservations: true, createdAt: new Date(), compte: { id: 'acc1', name: 'MECS', type: 'ESTABLISHMENT', slug: 'mecs' } },
    ]);
    const cal = await service.calendrier(bob, '2026-10-01T00:00:00Z', '2026-10-31T00:00:00Z');
    expect(cal[0].evenements[0].titre).toBe('Occupé');
    expect(JSON.stringify(cal)).not.toContain('famille');
  });

  it('refuse une fenêtre de plus de 100 jours', async () => {
    const { service } = monter();
    await expect(service.calendrier(bob, '2026-01-01T00:00:00Z', '2026-12-31T00:00:00Z')).rejects.toThrow(/100 jours/);
  });
});
