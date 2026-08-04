import { ExportService } from './export.service';
import { ExtractionService } from './extraction.service';

/**
 * EXPORT ET RELECTURE.
 *
 * Le test qui compte vraiment est l'aller-retour : le .docx produit doit être
 * relisible par notre propre lecteur de modèles. S'il ne l'est pas, c'est
 * qu'il n'est pas un vrai document Word — et un fichier qui ne s'ouvre pas
 * chez la personne est pire que pas de fichier du tout.
 */

const CONTENU = `## Objet
Demande d'autorisation — séjour du 10 au 14 février

Madame, Monsieur,

Votre enfant **participe régulièrement** aux activités du groupe.

- Dates : du 10 au 14 février
- Encadrement : 3 professionnels

1. Le transport est assuré par l'établissement.
2. Aucun coût ne reste à votre charge.

---

**COUPON-RÉPONSE** — à retourner avant le 15 janvier`;

describe('ExportService', () => {
  const service = new ExportService();
  const lecteur = new ExtractionService();

  it('produit un .docx qui est bien une archive Office', async () => {
    const buffer = await service.docx('Demande parentale', CONTENU);
    // Signature ZIP : c'est ce que Word attend.
    expect(buffer.subarray(0, 4).toString('latin1')).toBe('PK');
    expect(buffer.length).toBeGreaterThan(2000);
  });

  it('le .docx produit se relit : aller-retour complet', async () => {
    const buffer = await service.docx('Demande parentale', CONTENU);
    const relu = await lecteur.extraire(
      buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'sortie.docx',
    );
    expect(relu).toContain('Demande parentale');
    expect(relu).toContain('séjour du 10 au 14 février');
    expect(relu).toContain('COUPON-RÉPONSE');
    // Le gras est une mise en forme, pas du texte : les astérisques du
    // markdown ne doivent pas se retrouver dans le document.
    expect(relu).not.toContain('**');
    // Les titres markdown non plus.
    expect(relu).not.toContain('## ');
  });

  it("l'italique est une mise en forme, pas des astérisques imprimées", async () => {
    // « *La cheffe de service* » ressortait avec ses astérisques en bas du
    // courrier : impossible à envoyer tel quel à une famille.
    const buffer = await service.docx(
      'Courrier à la famille',
      "Madame, Monsieur,\n\nNous vous remercions de votre retour concernant le séjour organisé par l'établissement au mois de février prochain.\n\n*La cheffe de service*",
    );
    const relu = await lecteur.extraire(
      buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'sortie.docx',
    );
    expect(relu).toContain('La cheffe de service');
    expect(relu).not.toContain('*');
  });

  it('produit un PDF valide', async () => {
    const buffer = await service.pdf('Demande parentale', CONTENU);
    expect(buffer.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(800);
  });

  it('propose un nom de fichier lisible, sans accent, daté', () => {
    expect(service.nomFichier("Demande d'autorisation parentale", 'docx', new Date('2026-08-04'))).toBe(
      'demande-d-autorisation-parentale-2026-08-04.docx',
    );
    expect(service.nomFichier('Écrit — été', 'pdf', new Date('2026-01-02'))).toBe(
      'ecrit-ete-2026-01-02.pdf',
    );
  });

  it("un titre vide ne produit pas un nom de fichier vide", () => {
    expect(service.nomFichier('***', 'docx', new Date('2026-08-04'))).toBe('ecrit-2026-08-04.docx');
  });
});

describe('ExtractionService', () => {
  const lecteur = new ExtractionService();

  it('lit un texte brut et normalise les blancs', async () => {
    const texte = `Rapport   de    situation\n\n\n\nContexte : ${'la mesure est en cours. '.repeat(10)}`;
    const lu = await lecteur.extraire(Buffer.from(texte), 'text/plain', 'modele.txt');
    expect(lu).toContain('Rapport de situation');
    expect(lu).not.toMatch(/\n{3,}/);
  });

  it('refuse un document sans texte lisible, en disant quoi faire', async () => {
    await expect(
      lecteur.extraire(Buffer.from('trop court'), 'text/plain', 'x.txt'),
    ).rejects.toThrow(/copiez le texte/i);
  });

  it('borne la longueur : un modèle se lit sur quelques pages', async () => {
    const enorme = Buffer.from('Contexte de la mesure éducative. '.repeat(5000));
    const lu = await lecteur.extraire(enorme, 'text/plain', 'gros.txt');
    expect(lu.length).toBeLessThanOrEqual(24_000);
  });
});
