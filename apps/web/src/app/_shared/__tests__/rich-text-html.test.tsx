/**
 * Tests Vitest — lecture du HTML hérité de WordPress par `RichText`.
 *
 * Deux contrats, et le second compte plus que le premier :
 *  1. les vingt articles importés doivent s'AFFICHER (avant, leurs balises
 *     sortaient en clair sur l'Édublog, qui est la vitrine du produit) ;
 *  2. rien de ce que contient un article ne doit pouvoir devenir exécutable.
 *     Le fil est ouvert à tout membre : un article est une donnée, pas du code.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichText, decoderEntites, texteBrut } from '../RichText';

describe('RichText — contenu HTML', () => {
  it('rend les paragraphes et les titres au lieu d’afficher les balises', () => {
    const { container } = render(
      <RichText value={'<p class="wp-block-paragraph">Bonjour</p><h2 class="wp-block-heading">Un titre</h2>'} />,
    );
    expect(container.querySelector('p')?.textContent).toBe('Bonjour');
    expect(container.querySelector('h2')?.textContent).toBe('Un titre');
    expect(container.textContent).not.toContain('<p');
    expect(container.textContent).not.toContain('wp-block');
  });

  it('conserve gras, italique et listes', () => {
    const { container } = render(
      <RichText value="<p>Un <strong>renfort</strong> et un <em>atelier</em></p><ul><li>Premier</li><li>Second</li></ul>" />,
    );
    expect(container.querySelector('strong')?.textContent).toBe('renfort');
    expect(container.querySelector('em')?.textContent).toBe('atelier');
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('garde les listes numérotées dans l’ordre', () => {
    const { container } = render(
      <RichText value="<ol><li>Un</li><li>Deux</li><li>Trois</li></ol>" />,
    );
    expect(container.querySelector('ol')).not.toBeNull();
    expect([...container.querySelectorAll('li')].map((l) => l.textContent)).toEqual([
      'Un',
      'Deux',
      'Trois',
    ]);
  });

  it('rend un lien http en lien cliquable', () => {
    render(<RichText value={'<p>Voir <a href="https://les-extras.fr/listing/theatre/">l’atelier</a></p>'} />);
    const lien = screen.getByRole('link', { name: 'l’atelier' });
    expect(lien.getAttribute('href')).toBe('https://les-extras.fr/listing/theatre/');
    expect(lien.getAttribute('rel')).toContain('noopener');
  });

  it('décode les entités : « l&#039;équipe » ne doit pas s’afficher tel quel', () => {
    const { container } = render(
      <RichText value="<p>L&#039;atelier de l&rsquo;&eacute;quipe co&#251;te 0 &euro;</p>" />,
    );
    expect(container.textContent).toBe('L\'atelier de l’équipe coûte 0 €');
  });

  it('ne perd pas le texte laissé hors de toute balise', () => {
    const { container } = render(<RichText value="Texte nu.<p>Puis un paragraphe.</p>" />);
    expect(container.textContent).toContain('Texte nu.');
    expect(container.textContent).toContain('Puis un paragraphe.');
  });

  it('continue de lire le Markdown des articles écrits dans l’application', () => {
    const { container } = render(
      <RichText value={'## Titre markdown\n\nUn **mot** important.'} />,
    );
    expect(container.querySelector('h2')?.textContent).toBe('Titre markdown');
    expect(container.querySelector('strong')?.textContent).toBe('mot');
  });
});

describe('RichText — rien ne devient exécutable', () => {
  it('n’émet jamais de balise script, même si l’article en contient une', () => {
    const { container } = render(
      <RichText value={'<p>Avant</p><script>window.__pirate = 1</script><p>Après</p>'} />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('Avant');
    expect(container.textContent).toContain('Après');
    expect((window as unknown as Record<string, unknown>).__pirate).toBeUndefined();
  });

  it('refuse une adresse javascript: et n’en garde que le libellé', () => {
    const { container } = render(
      <RichText value={'<p><a href="javascript:alert(1)">Cliquez ici</a></p>'} />,
    );
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('Cliquez ici');
  });

  it('refuse une image en data: et n’insère pas la balise', () => {
    const { container } = render(
      <RichText value={'<p><img src="data:text/html;base64,PHNjcmlwdD4=" alt="x"></p>'} />,
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('ne reporte pas les gestionnaires d’événements des balises d’origine', () => {
    const { container } = render(
      <RichText value={'<p onclick="alert(1)" onmouseover="alert(2)">Texte</p>'} />,
    );
    const p = container.querySelector('p');
    expect(p?.getAttribute('onclick')).toBeNull();
    expect(p?.getAttribute('onmouseover')).toBeNull();
    expect(p?.textContent).toBe('Texte');
  });

  it('n’exécute pas une iframe déguisée en contenu', () => {
    const { container } = render(
      <RichText value={'<p>Texte</p><iframe src="https://exemple.test"></iframe>'} />,
    );
    expect(container.querySelector('iframe')).toBeNull();
  });
});

describe('decoderEntites', () => {
  it('laisse une entité inconnue visible plutôt que d’inventer un caractère', () => {
    expect(decoderEntites('&inconnue; & &amp;')).toBe('&inconnue; & &');
  });

  it('lit le décimal et l’hexadécimal', () => {
    expect(decoderEntites('&#8217;&#x2019;')).toBe('’’');
  });

  it('couvre les lettres accentuées, majuscule comprise', () => {
    expect(decoderEntites('&Eacute;chec &agrave; l&#039;&eacute;cole, co&ucirc;t 0 &euro;')).toBe(
      "Échec à l'école, coût 0 €",
    );
  });

  it('distingue la casse : &Eacute; n’est pas &eacute;', () => {
    expect(decoderEntites('&Eacute;&eacute;')).toBe('Éé');
  });
});

describe('texteBrut', () => {
  it('retire les balises et décode les entités pour la meta description', () => {
    expect(texteBrut('<p>L&#039;atelier <strong>théâtre</strong></p>')).toBe(
      "L'atelier théâtre",
    );
  });

  it('ne recopie pas le contenu d’un script dans la description', () => {
    expect(texteBrut('<p>Bonjour</p><script>var a=1</script>')).toBe('Bonjour');
  });
});
