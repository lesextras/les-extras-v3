import { etatFenetre, fenetre, secondesDeValidite, MINUTES_AVANT, MINUTES_APRES } from './fenetre';
import { configMedia, signerJetonSalle, tirerIdentifiant } from './livekit';

/**
 * CE QUE CES TESTS PROTÈGENT.
 *
 * Trois promesses sont écrites en toutes lettres sur la page publique, dans le
 * courriel d'invitation et sur la page du lien. Elles ne se vérifient pas en
 * relisant le code — elles se vérifient en le jouant :
 *
 *  1. « Le lien ne vaut que pour ce rendez-vous » → la fenêtre, et un jeton
 *     de serveur média qui expire AVEC elle.
 *  2. « Rien n'est enregistré » → `roomRecord: false` dans les DEUX jetons,
 *     y compris celui de l'intervenant.
 *  3. « Le lien vous est personnel » → deux jetons distincts, tirés au hasard
 *     cryptographique, jamais dérivés d'un identifiant.
 *
 * Une promesse publiée sans test est une promesse qu'un correctif défait un
 * jour sans que personne ne le voie.
 */

const H = 60 * 60 * 1000;

function dans(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

function lireCharge(jeton: string): Record<string, any> {
  const partie = jeton.split('.')[1];
  const base64 = partie.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}

describe('La fenêtre du rendez-vous', () => {
  it("n'ouvre pas avant l'heure moins quinze", () => {
    expect(etatFenetre(dans(20), 45)).toBe('TROP_TOT');
    expect(etatFenetre(dans(MINUTES_AVANT + 1), 45)).toBe('TROP_TOT');
  });

  it('ouvre exactement quinze minutes avant, et pas une de plus', () => {
    expect(etatFenetre(dans(MINUTES_AVANT - 1), 45)).toBe('OUVERTE');
    expect(etatFenetre(dans(0), 45)).toBe('OUVERTE');
  });

  it('laisse une demi-heure de débordement après la fin prévue', () => {
    // Une séance de 45 min commencée il y a 50 min : elle déborde, la porte
    // reste ouverte. C'est le cas du parent arrivé en retard.
    expect(etatFenetre(dans(-50), 45)).toBe('OUVERTE');
    expect(etatFenetre(dans(-(45 + MINUTES_APRES - 1)), 45)).toBe('OUVERTE');
  });

  it('ferme passé ce débordement', () => {
    expect(etatFenetre(dans(-(45 + MINUTES_APRES + 5)), 45)).toBe('TERMINEE');
    // Le lendemain, le lien ne vaut plus rien : c'est toute la différence avec
    // une salle permanente.
    expect(etatFenetre(new Date(Date.now() - 24 * H), 45)).toBe('TERMINEE');
  });

  it('borne la fenêtre sur la durée réelle, pas sur une durée fixe', () => {
    const court = fenetre(new Date(0), 15);
    const long = fenetre(new Date(0), 120);
    expect(long.fermetureLe.getTime()).toBeGreaterThan(court.fermetureLe.getTime());
    expect(court.ouvertureLe.getTime()).toBe(long.ouvertureLe.getTime());
  });
});

describe('La validité du jeton du serveur média', () => {
  it('expire avec la fenêtre, pas au bout d’une durée fixe', () => {
    // Quelqu'un qui ouvre la page une heure avant ne doit pas obtenir un jeton
    // qui tiendrait toute la journée.
    const tot = secondesDeValidite(dans(60), 45);
    const alHeure = secondesDeValidite(dans(0), 45);
    expect(tot).toBeGreaterThan(alHeure);
    // À l'heure pile : 45 min de séance + 30 min de débordement.
    expect(alHeure).toBeLessThanOrEqual((45 + MINUTES_APRES) * 60 + 5);
  });

  it('garde un plancher de cinq minutes pour qui arrive à la toute fin', () => {
    // Sans ce plancher, le jeton expirerait pendant la poignée de main avec le
    // serveur média, et la personne verrait une erreur au lieu d'une salle.
    expect(secondesDeValidite(dans(-(45 + MINUTES_APRES - 1)), 45)).toBeGreaterThanOrEqual(5 * 60);
  });
});

describe('Le jeton d’accès à la salle', () => {
  const config = { url: 'wss://media.example', cle: 'APIabc', secret: 'un-secret-de-test' };

  it('est un JWT HS256 signé avec la clé d’API en émetteur', () => {
    const jeton = signerJetonSalle(config, {
      salle: 'lex-abc',
      identite: 'Sarah',
      secondes: 600,
      animateur: true,
    });
    expect(jeton.split('.')).toHaveLength(3);
    const entete = JSON.parse(
      Buffer.from(jeton.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(),
    );
    expect(entete).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(lireCharge(jeton).iss).toBe('APIabc');
  });

  it('⚠ N’AUTORISE JAMAIS L’ENREGISTREMENT, PAS MÊME POUR L’INTERVENANT', () => {
    for (const animateur of [true, false]) {
      const charge = lireCharge(
        signerJetonSalle(config, { salle: 'lex-abc', identite: 'X', secondes: 60, animateur }),
      );
      expect(charge.video.roomRecord).toBe(false);
    }
  });

  it('n’ouvre que la salle demandée', () => {
    const charge = lireCharge(
      signerJetonSalle(config, {
        salle: 'lex-la-bonne',
        identite: 'X',
        secondes: 60,
        animateur: false,
      }),
    );
    expect(charge.video.room).toBe('lex-la-bonne');
    expect(charge.video.roomJoin).toBe(true);
  });

  it('ne donne l’administration de la salle qu’à l’intervenant', () => {
    expect(
      lireCharge(
        signerJetonSalle(config, { salle: 's', identite: 'X', secondes: 60, animateur: true }),
      ).video.roomAdmin,
    ).toBe(true);
    expect(
      lireCharge(
        signerJetonSalle(config, { salle: 's', identite: 'X', secondes: 60, animateur: false }),
      ).video.roomAdmin,
    ).toBe(false);
  });

  it('ne laisse jamais fuir le secret dans le jeton', () => {
    const jeton = signerJetonSalle(config, {
      salle: 's',
      identite: 'X',
      secondes: 60,
      animateur: true,
    });
    expect(jeton).not.toContain(config.secret);
    expect(JSON.stringify(lireCharge(jeton))).not.toContain(config.secret);
  });

  it('change de signature dès qu’un caractère de la charge change', () => {
    const a = signerJetonSalle(config, { salle: 's', identite: 'A', secondes: 60, animateur: false });
    const b = signerJetonSalle(config, { salle: 's', identite: 'B', secondes: 60, animateur: false });
    expect(a.split('.')[2]).not.toBe(b.split('.')[2]);
  });
});

describe('Les identifiants tirés', () => {
  it('font 32 caractères hexadécimaux, et ne se répètent pas', () => {
    const vus = new Set<string>();
    for (let i = 0; i < 500; i += 1) {
      const v = tirerIdentifiant();
      expect(v).toMatch(/^[0-9a-f]{32}$/);
      expect(vus.has(v)).toBe(false);
      vus.add(v);
    }
  });

  it('accepte un préfixe pour les noms de salle, sans le rendre devinable', () => {
    const salle = tirerIdentifiant('lex-');
    expect(salle).toMatch(/^lex-[0-9a-f]{32}$/);
  });
});

describe('La configuration du serveur média', () => {
  const sauvegarde = { ...process.env };
  afterEach(() => {
    process.env = { ...sauvegarde };
  });

  it('⚠ REND null TANT QUE LES TROIS VARIABLES NE SONT PAS POSÉES — ce n’est pas une panne', () => {
    delete process.env.LIVEKIT_URL;
    delete process.env.LIVEKIT_API_KEY;
    delete process.env.LIVEKIT_API_SECRET;
    expect(configMedia()).toBeNull();

    process.env.LIVEKIT_URL = 'wss://media.example';
    expect(configMedia()).toBeNull();

    process.env.LIVEKIT_API_KEY = 'cle';
    expect(configMedia()).toBeNull();
  });

  it('ne se contente pas d’une variable présente mais vide', () => {
    process.env.LIVEKIT_URL = 'wss://media.example';
    process.env.LIVEKIT_API_KEY = '   ';
    process.env.LIVEKIT_API_SECRET = 'secret';
    expect(configMedia()).toBeNull();
  });

  it('rend la configuration quand les trois sont là', () => {
    process.env.LIVEKIT_URL = ' wss://media.example ';
    process.env.LIVEKIT_API_KEY = 'cle';
    process.env.LIVEKIT_API_SECRET = 'secret';
    expect(configMedia()).toEqual({
      url: 'wss://media.example',
      cle: 'cle',
      secret: 'secret',
    });
  });

  /*
   * ⚠⚠ LE DÉFAUT DU 21/09/2026, ET IL A COÛTÉ UNE CLÉ.
   *
   * Une clé LiveKit avait été collée dans `LIVEKIT_URL`. Rien ne l'a signalé :
   * le jeton se signait, la route publique répondait 201, et la valeur — un
   * secret — partait à chaque participant, puisque `rejoindre` renvoie
   * `url: config.url` tel quel. Le seul symptôme visible était une salle qui
   * ne s'ouvrait pas, tout au fond du navigateur.
   *
   * Ce test ne vérifie pas qu'une adresse RÉPOND (c'est le travail du
   * navigateur) : il vérifie qu'elle a la FORME d'une adresse. C'est ce qui
   * empêche un secret de franchir la porte.
   */
  it('⚠ REFUSE UNE ADRESSE QUI N’EN EST PAS UNE — une clé collée là ne doit pas sortir', () => {
    process.env.LIVEKIT_API_KEY = 'cle';
    process.env.LIVEKIT_API_SECRET = 'secret';

    for (const valeur of [
      // ⚠ AUCUNE DE CES VALEURS N'EST RÉELLE. On ne met jamais un morceau de
      // secret de production dans un test : le dépôt est lu par plus de monde
      // que la variable d'environnement.
      'APIabcdefghijkl', // la forme d'une clé LiveKit
      'a'.repeat(44), // la forme d'un secret : 44 caractères, aucun schéma
      'media.example', // un hôte sans schéma
      'livekit.cloud/projet',
      'ftp://media.example',
      'javascript:alert(1)',
    ]) {
      process.env.LIVEKIT_URL = valeur;
      expect(configMedia()).toBeNull();
    }
  });

  it('accepte wss, ws et https — les trois formes légitimes', () => {
    process.env.LIVEKIT_API_KEY = 'cle';
    process.env.LIVEKIT_API_SECRET = 'secret';
    for (const valeur of [
      'wss://projet-abcdef.livekit.cloud',
      'ws://localhost:7880',
      'https://projet-abcdef.livekit.cloud',
    ]) {
      process.env.LIVEKIT_URL = valeur;
      expect(configMedia()?.url).toBe(valeur);
    }
  });
});

describe('⚠ AUCUNE DONNÉE DE SANTÉ DANS CE MODULE', () => {
  /*
   * Ce test lit le SOURCE du module, commentaires retirés, et échoue si un
   * champ de santé y apparaît. Il ne protège pas d'une intention : il protège
   * d'un ajout fait de bonne foi, un mardi, parce qu'« il faudrait bien savoir
   * de quoi on va parler ». Ce champ ferait basculer la table dans le régime
   * de l'article 9 du RGPD, avec l'hébergement HDS qui va avec, et rendrait
   * fausse la phrase affichée à chaque famille.
   */
  const interdits = [
    'motifConsultation',
    'symptome',
    'diagnostic',
    'ordonnance',
    'prescription',
    'compteRendu',
    'pathologie',
    'traitement',
  ];

  it('le DTO et le service n’exposent aucun champ clinique', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    for (const fichier of ['dto/visio.dto.ts', 'visio.service.ts']) {
      const brut = fs.readFileSync(path.join(__dirname, fichier), 'utf8');
      /*
       * ⚠ ON RETIRE LES COMMENTAIRES **ET LES CHAÎNES**, et les deux pour la
       * même raison : ces mots-là y figurent EXPRÈS. Les commentaires
       * expliquent pourquoi ces champs n'existent pas ; les chaînes portent la
       * phrase affichée à chaque famille — « aucun diagnostic n'est posé et
       * aucune prescription n'est délivrée ». Un test qui les interdirait
       * partout obligerait à retirer l'avertissement lui-même, c'est-à-dire
       * exactement le contraire de ce qu'il protège.
       *
       * Ce qui est traqué, ce sont les IDENTIFIANTS : un nom de champ, de
       * colonne ou de propriété.
       */
      const code = brut
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/'(?:[^'\\]|\\.)*'/g, "''")
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')
        .replace(/`(?:[^`\\]|\\.)*`/g, '``');
      for (const mot of interdits) {
        expect(code.toLowerCase()).not.toContain(mot.toLowerCase());
      }
    }
  });
});
