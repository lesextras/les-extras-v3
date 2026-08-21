import {
  estLAssociation,
  logoDeLEmetteur,
  logoPourEmetteur,
  _internals,
} from './emetteur';

// Un PNG 1×1 valide (89 octets) : le plus petit fichier réel possible, pour
// tester le parseur d'en-tête sur autre chose qu'un buffer fabriqué à la main.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

describe('reconnaissance de l’association', () => {
  it('reconnaît les graphies accentuées et espacées', () => {
    expect(estLAssociation('ADéPA')).toBe(true);
    expect(estLAssociation('ADEPA 77')).toBe(true);
    expect(estLAssociation('Association adepa')).toBe(true);
  });
  it('ne reconnaît personne d’autre', () => {
    expect(estLAssociation('MECS Les Tilleuls')).toBe(false);
    expect(estLAssociation(null)).toBe(false);
  });
});

describe('dimensions lues dans l’en-tête', () => {
  it('lit un PNG réel', () => {
    expect(_internals.dimensionsPng(PNG_1x1)).toEqual({ largeur: 1, hauteur: 1 });
  });

  it('lit un JPEG minimal (SOF0 fabriqué)', () => {
    // FFD8 (SOI) puis un APP0 vide puis SOF0 480×640.
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xe0, 0x00, 0x04, 0x00, 0x00]),
      Buffer.from([0xff, 0xc0, 0x00, 0x0b, 0x08, 0x01, 0xe0, 0x02, 0x80, 0x01, 0x11, 0x00]),
    ]);
    expect(_internals.dimensionsJpeg(jpeg)).toEqual({ largeur: 640, hauteur: 480 });
  });

  it('refuse ce qui n’est ni PNG ni JPEG', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
    expect(_internals.dimensionsPng(svg)).toBeNull();
    expect(_internals.dimensionsJpeg(svg)).toBeNull();
  });
});

describe('logoPourEmetteur', () => {
  it('retombe sur la convention par le nom quand aucune URL n’est déposée', async () => {
    const logo = await logoPourEmetteur({ legalName: 'ADéPA', logoUrl: null });
    expect(logo).not.toBeNull();
    expect(logo!.ratio).toBeCloseTo(480 / 441, 5);
  });

  it('sort sans logo pour un émetteur ordinaire sans dépôt', async () => {
    expect(await logoPourEmetteur({ legalName: 'MECS Les Tilleuls' })).toBeNull();
  });

  it('un dépôt inutilisable ne fait jamais échouer le document : repli silencieux', async () => {
    // URL invalide (pas de http) : le chargeur la refuse sans réseau.
    const logo = await logoPourEmetteur({
      legalName: 'ADéPA',
      logoUrl: 'ftp://exemple.fr/logo.png',
    });
    // Le repli joue : l'association garde son logo embarqué.
    expect(logo).not.toBeNull();
  });

  it('sert le dépôt du compte quand il se télécharge et se lit', async () => {
    const fetchOriginal = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => PNG_1x1.buffer.slice(PNG_1x1.byteOffset, PNG_1x1.byteOffset + PNG_1x1.byteLength),
    }) as never;
    try {
      const logo = await logoPourEmetteur({
        legalName: 'MECS Les Tilleuls',
        logoUrl: 'https://exemple.fr/logo-des-tests.png',
      });
      expect(logo).not.toBeNull();
      expect(logo!.ratio).toBe(1);
    } finally {
      global.fetch = fetchOriginal;
    }
  });
});

describe('logoDeLEmetteur (convention historique)', () => {
  it('reste inchangé : nom d’usage OU raison sociale', () => {
    expect(logoDeLEmetteur(null, 'ADéPA')).not.toBeNull();
    expect(logoDeLEmetteur('Autre', 'Autre')).toBeNull();
  });
});
