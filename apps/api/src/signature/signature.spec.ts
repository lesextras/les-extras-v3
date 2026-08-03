import {
  codeCorrect,
  dossierPreuve,
  empreinte,
  EtatSignature,
  genererCode,
  hacherCode,
  TENTATIVES_MAX,
  verifier,
  VALIDITE_CODE_MINUTES,
} from './signature';

/**
 * Ce que ces tests protègent n'est pas une fonctionnalité : c'est la valeur
 * probante d'un contrat de travail. Si l'un d'eux tombe, une signature
 * recueillie par le logiciel cesse d'être défendable devant un conseil de
 * prud'hommes.
 *
 * Le test le plus important est celui du document modifié. Sans lui, on
 * saurait que quelqu'un a saisi un code — pas sur quel texte.
 */

const SEL = 'sig_abcdef123456';

const etat = (o: Partial<EtatSignature> = {}): EtatSignature => ({
  statut: 'EN_ATTENTE',
  codeHache: hacherCode('123456', SEL),
  codeExpireLe: new Date(Date.now() + 10 * 60_000),
  tentatives: 0,
  empreinte: empreinte('le contrat'),
  ...o,
});

describe('empreinte du document', () => {
  it('produit une empreinte SHA-256 stable', () => {
    const e = empreinte('Contrat à durée déterminée — Awa Diallo');
    expect(e).toHaveLength(64);
    expect(e).toBe(empreinte('Contrat à durée déterminée — Awa Diallo'));
  });

  it('change dès qu’un seul caractère change', () => {
    // La propriété qui fait toute la valeur du procédé : passer une
    // rémunération de 1 800 à 1 300 € rend la signature caduque.
    const a = empreinte('rémunération brute : 1 800 €');
    const b = empreinte('rémunération brute : 1 300 €');
    expect(a).not.toBe(b);
  });
});

describe('code à usage unique', () => {
  it('fait six chiffres', () => {
    for (let i = 0; i < 50; i++) {
      expect(genererCode()).toMatch(/^\d{6}$/);
    }
  });

  it('ne se répète pas d’un tirage à l’autre', () => {
    // Un million de valeurs possibles : cinquante tirages identiques
    // signaleraient une source cassée.
    const tirages = new Set(Array.from({ length: 50 }, () => genererCode()));
    expect(tirages.size).toBeGreaterThan(40);
  });

  it('n’est jamais stocké en clair', () => {
    const h = hacherCode('123456', SEL);
    expect(h).not.toContain('123456');
    expect(h).toHaveLength(64);
  });

  it('est salé, donc invulnérable à une table précalculée', () => {
    // Sans sel, un million d'empreintes se calcule en quelques secondes et
    // permettrait de retrouver n'importe quel code depuis la base.
    expect(hacherCode('123456', 'sig_a')).not.toBe(hacherCode('123456', 'sig_b'));
  });

  it('reconnaît le bon code et rejette les autres', () => {
    const h = hacherCode('482913', SEL);
    expect(codeCorrect('482913', h, SEL)).toBe(true);
    expect(codeCorrect('482914', h, SEL)).toBe(false);
    expect(codeCorrect('', h, SEL)).toBe(false);
  });
});

describe('vérification — le chemin normal', () => {
  it('accepte un code valide sur un document intact', () => {
    const r = verifier(etat(), '123456', SEL, empreinte('le contrat'));
    expect(r.ok).toBe(true);
  });
});

describe('vérification — les refus', () => {
  it('refuse un code erroné', () => {
    const r = verifier(etat(), '000000', SEL, empreinte('le contrat'));
    expect(r.ok).toBe(false);
    expect(r.echec).toBe('CODE_ERRONE');
  });

  it('refuse un code expiré', () => {
    const r = verifier(
      etat({ codeExpireLe: new Date(Date.now() - 60_000) }),
      '123456',
      SEL,
      empreinte('le contrat'),
    );
    expect(r.echec).toBe('EXPIREE');
    expect(r.message).toContain(String(VALIDITE_CODE_MINUTES));
  });

  it('bloque après trois tentatives', () => {
    const r = verifier(etat({ tentatives: TENTATIVES_MAX }), '123456', SEL, empreinte('le contrat'));
    expect(r.echec).toBe('TROP_DE_TENTATIVES');
  });

  it('refuse de signer deux fois', () => {
    const r = verifier(etat({ statut: 'SIGNEE' }), '123456', SEL, empreinte('le contrat'));
    expect(r.echec).toBe('DEJA_SIGNEE');
  });

  it('refuse une demande annulée', () => {
    const r = verifier(etat({ statut: 'ANNULEE' }), '123456', SEL, empreinte('le contrat'));
    expect(r.echec).toBe('ANNULEE');
  });

  it('refuse quand aucun code n’a été envoyé', () => {
    const r = verifier(etat({ codeHache: null }), '123456', SEL, empreinte('le contrat'));
    expect(r.echec).toBe('CODE_ABSENT');
  });

  it('REFUSE QUAND LE DOCUMENT A CHANGÉ — même avec le bon code', () => {
    // Le test le plus important du fichier. Sans lui, on pourrait faire
    // signer un contrat à 1 800 €, en modifier la rémunération, et se
    // prévaloir d'une signature qui ne porte plus sur rien.
    const r = verifier(etat(), '123456', SEL, empreinte('le contrat MODIFIÉ'));
    expect(r.ok).toBe(false);
    expect(r.echec).toBe('DOCUMENT_MODIFIE');
    expect(r.message).toContain('modifié');
  });
});

describe('ordre d’examen des refus', () => {
  it('annonce l’annulation plutôt qu’un code erroné', () => {
    // Un message trompeur enverrait l'utilisateur ressaisir un code alors
    // que la demande n'existe plus.
    const r = verifier(etat({ statut: 'ANNULEE' }), '999999', SEL, empreinte('autre chose'));
    expect(r.echec).toBe('ANNULEE');
  });

  it('annonce l’expiration plutôt que le blocage', () => {
    const r = verifier(
      etat({ codeExpireLe: new Date(Date.now() - 1000), tentatives: TENTATIVES_MAX }),
      '123456',
      SEL,
      empreinte('le contrat'),
    );
    expect(r.echec).toBe('EXPIREE');
  });
});

describe('dossier de preuve', () => {
  const base = {
    id: 'sig_zzzz11112222',
    documentType: 'CONTRAT_CDD',
    documentId: 'c_1',
    empreinte: empreinte('le contrat'),
    signataireNom: 'Awa Diallo',
    signataireEmail: 'awa@example.org',
    statut: 'SIGNEE',
    signeLe: new Date('2026-09-01T10:00:00Z'),
    ip: '82.64.10.5',
    userAgent: 'Mozilla/5.0',
    evenements: [
      { type: 'SIGNEE', createdAt: new Date('2026-09-01T10:00:00Z') },
      { type: 'DEMANDE', createdAt: new Date('2026-09-01T09:00:00Z') },
      { type: 'CODE_ENVOYE', createdAt: new Date('2026-09-01T09:01:00Z') },
    ],
  };

  it('remet la chronologie dans l’ordre', () => {
    const d = dossierPreuve({ ...base, prestataire: null });
    expect(d.chronologie.map((e) => e.type)).toEqual(['DEMANDE', 'CODE_ENVOYE', 'SIGNEE']);
  });

  it('dit franchement qu’il s’agit d’une signature simple', () => {
    // Laisser croire à une signature qualifiée serait un mensonge qui se
    // découvre au pire moment : le jour du litige.
    const d = dossierPreuve({ ...base, prestataire: null });
    expect(d.portee).toContain('simple');
    expect(d.portee).toContain('1367');
    expect(d.portee).toContain('ne bénéficie pas');
  });

  it('renvoie au prestataire quand la signature est déléguée', () => {
    const d = dossierPreuve({ ...base, prestataire: 'yousign' });
    expect(d.procede).toContain('yousign');
    expect(d.portee).toContain('prestataire');
  });

  it('porte l’empreinte du document signé', () => {
    const d = dossierPreuve({ ...base, prestataire: null });
    expect(d.document.empreinte).toHaveLength(64);
  });
});
