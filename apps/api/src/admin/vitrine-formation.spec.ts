import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateFormationAdminDto,
  UpdateFormationAdminDto,
} from './dto/formation-admin.dto';

/**
 * LA VITRINE D'UNE FORMATION DOIT ÊTRE REMPLISSABLE — 16/09/2026.
 *
 * ⚠⚠ CE QUE CE TEST PROTÈGE. Le modèle `Formation` porte `images`, `city`,
 * `publicTargets`, `durationMinutes`, `methodology`, `evaluation` et `faq`
 * depuis longtemps. AUCUN n'était dans les DTO de l'administration, et le
 * ValidationPipe global est en `forbidNonWhitelisted` : toute requête les
 * contenant partait en 400. Ces champs n'étaient donc remplissables que par un
 * script de seed, c'est-à-dire par un commit.
 *
 * Le défaut est invisible en lecture de code — chaque fichier pris seul est
 * correct — et il se voit au catalogue : une carte de formation sans photo,
 * sans ville et sans public à côté d'une carte d'atelier qui porte les trois.
 * C'est exactement l'écart relevé le 3/09 ; on avait corrigé la carte, pas le
 * moyen de la remplir.
 */

const VITRINE = {
  images: ['/api/proxy/public/images/abc123'],
  city: 'Melun',
  publicTargets: ['Parents et proches', 'Professionnels du médico-social'],
  durationMinutes: 45,
  methodology: 'Apports brefs, une scène qui dérape, un exercice sur sa propre situation.',
  evaluation: 'Cinq questions d’autocorrection par module, puis un relevé de sept jours.',
  faq: [{ question: 'C’est vraiment gratuit ?', answer: 'Oui, du premier au dernier module.' }],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fautes(dto: object, classe: any) {
  const instance = plainToInstance(classe, dto) as object;
  const erreurs = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return erreurs.map((e) => e.property);
}

describe('Les sept champs de vitrine', () => {
  it('sont acceptés à la CRÉATION', async () => {
    expect(await fautes({ title: 'Décrire sans juger', ...VITRINE }, CreateFormationAdminDto)).toEqual(
      [],
    );
  });

  it('sont acceptés à la MODIFICATION', async () => {
    expect(await fautes({ ...VITRINE }, UpdateFormationAdminDto)).toEqual([]);
  });

  /**
   * ⚠ LE TEST QUI ATTRAPE LE DÉFAUT D'ORIGINE. `forbidNonWhitelisted` rejette
   * un champ absent du DTO : si quelqu'un en retire un, c'est ici que ça
   * casse, et pas six semaines plus tard sur une fiche qui s'affiche vide.
   */
  it.each(Object.keys(VITRINE))('n’est pas rejeté : %s', async (champ) => {
    const partiel = { [champ]: VITRINE[champ as keyof typeof VITRINE] };
    expect(await fautes(partiel, UpdateFormationAdminDto)).toEqual([]);
  });

  it('refuse une FAQ dont les entrées ne sont pas des paires question/réponse', async () => {
    const mauvais = await fautes({ faq: [{ question: 42 }] }, UpdateFormationAdminDto);
    expect(mauvais).toContain('faq');
  });

  /**
   * ⚠ La durée en minutes doit valoir au moins 1 : zéro effacerait la durée de
   * la carte sans qu'on l'ait demandé, ce qui est exactement le défaut que ce
   * champ existe pour corriger (`durationHours` valant 0 pour 45 minutes).
   */
  it('refuse une durée en minutes à zéro', async () => {
    expect(await fautes({ durationMinutes: 0 }, UpdateFormationAdminDto)).toContain(
      'durationMinutes',
    );
  });
});
