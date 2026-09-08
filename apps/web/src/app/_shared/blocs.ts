/**
 * LES BLOCS D'UNE LEÇON — LEUR NOM, LEURS CHAMPS, LEUR ADRESSE D'INTÉGRATION.
 *
 * Ce fichier ne contient AUCUN composant : il est lisible depuis un rendu
 * serveur comme depuis le navigateur. Le rendu, lui, vit dans
 * `blocs-lecon.tsx` — un seul rendu pour les deux côtés de la vitre, l'aperçu
 * que la formatrice voit en écrivant et la leçon que l'apprenant lit.
 *
 * PRINCIPE DE SÛRETÉ : aucune adresse saisie n'est mise telle quelle dans un
 * cadre d'intégration. On lit l'adresse, on vérifie le domaine attendu, on en
 * extrait l'identifiant, et on reconstruit l'adresse d'intégration officielle.
 * Une adresse qui ne correspond pas ne devient jamais un cadre : elle devient
 * un lien, avec un mot qui dit pourquoi.
 */

export type TypeBloc =
  | 'video'
  | 'audio'
  | 'texte'
  | 'classe'
  | 'separateur'
  | 'image'
  | 'titre'
  | 'fichier'
  | 'information'
  | 'pdf'
  | 'lien'
  | 'leconLiee'
  | 'markdown'
  | 'gif'
  | 'calendly'
  | 'typeform'
  | 'youtube'
  | 'youtubeDirect'
  | 'vimeo'
  | 'dailymotion'
  | 'twitch'
  | 'soundcloud'
  | 'googleDocs'
  | 'googleSheets'
  | 'googleForms'
  | 'googleCalendar'
  | 'googleSlides'
  | 'html'
  | 'genially'
  | 'accordeon'
  | 'carte'
  | 'gratter'
  | 'slideshare'
  | 'instagram'
  | 'tweet'
  | 'pinterest'
  | 'figma'
  | 'gist'
  | 'code'
  | 'chronologie'
  | 'jsfiddle'
  | 'codepen'
  | 'codesandbox'
  | 'tiktok';

export interface Bloc {
  id: string;
  type: TypeBloc;
  /** Texte riche : « texte », « information », « accordeon ». */
  html?: string;
  /** Texte simple : titre, markdown, HTML, code, carte, chronologie. */
  texte?: string;
  /** Le dos d'une carte recto-verso. */
  verso?: string;
  /** L'adresse : médias, documents, intégrations. */
  url?: string;
  legende?: string;
  nom?: string;
  ton?: 'info' | 'attention' | 'succes';
  niveau?: number;
  debut?: string;
  /** Le langage d'un bloc de code. */
  langue?: string;
  /** La leçon visée par « Lien vers une leçon ». */
  leconId?: string;
}

/** L'ordre est celui de la palette : le plus courant d'abord. */
export const PALETTE_BLOCS: TypeBloc[] = [
  'video',
  'audio',
  'texte',
  'classe',
  'separateur',
  'image',
  'titre',
  'fichier',
  'information',
  'pdf',
  'lien',
  'leconLiee',
  'markdown',
  'gif',
  'calendly',
  'typeform',
  'youtube',
  'youtubeDirect',
  'vimeo',
  'dailymotion',
  'twitch',
  'soundcloud',
  'googleDocs',
  'googleSheets',
  'googleForms',
  'googleCalendar',
  'googleSlides',
  'html',
  'genially',
  'accordeon',
  'carte',
  'gratter',
  'slideshare',
  'instagram',
  'tweet',
  'pinterest',
  'figma',
  'gist',
  'code',
  'chronologie',
  'jsfiddle',
  'codepen',
  'codesandbox',
  'tiktok',
];

export const NOM_BLOC: Record<TypeBloc, string> = {
  video: 'Vidéo',
  audio: 'Audio',
  texte: 'Texte',
  classe: 'Classe en direct',
  separateur: 'Séparateur',
  image: 'Image',
  titre: 'Titre',
  fichier: 'Fichier à télécharger',
  information: "Bloc d'information",
  pdf: 'Visionneuse PDF',
  lien: 'Lien',
  leconLiee: 'Lien vers une leçon',
  markdown: 'Contenu Markdown',
  gif: 'Gif',
  calendly: 'Calendly',
  typeform: 'Typeform',
  youtube: 'Vidéo YouTube',
  youtubeDirect: 'Vidéo Live (YouTube)',
  vimeo: 'Vidéo Vimeo',
  dailymotion: 'Vidéo Dailymotion',
  twitch: 'Vidéo Twitch',
  soundcloud: 'Audio Soundcloud',
  googleDocs: 'Google Docs',
  googleSheets: 'Google Sheets',
  googleForms: 'Google Forms',
  googleCalendar: 'Google Calendar',
  googleSlides: 'Google Slides',
  html: 'Contenu HTML',
  genially: 'Genially',
  accordeon: 'Cacher/Afficher',
  carte: 'Carte recto-verso',
  gratter: 'Carte à gratter',
  slideshare: 'Slideshare',
  instagram: 'Photo Instagram',
  tweet: 'Tweet (X)',
  pinterest: 'Pin (Pinterest)',
  figma: 'Figma',
  gist: 'Github Gist',
  code: 'Bloc de code',
  chronologie: 'Fil chronologique',
  jsfiddle: 'JSFiddle',
  codepen: 'CodePen',
  codesandbox: 'CodeSandbox',
  tiktok: 'TikTok',
};

/** Des signes, jamais d'émoji : la palette doit rester sobre. */
export const ICONE_BLOC: Record<TypeBloc, string> = {
  video: '▶',
  audio: '♪',
  texte: '¶',
  classe: '◉',
  separateur: '—',
  image: '▣',
  titre: 'H',
  fichier: '⤓',
  information: 'ⓘ',
  pdf: '▤',
  lien: '↗',
  leconLiee: '↱',
  markdown: 'M↓',
  gif: 'GIF',
  calendly: '☷',
  typeform: '≡',
  youtube: '▷',
  youtubeDirect: '◉',
  vimeo: 'V',
  dailymotion: 'D',
  twitch: 'T',
  soundcloud: '♫',
  googleDocs: '▤',
  googleSheets: '▦',
  googleForms: '☑',
  googleCalendar: '☷',
  googleSlides: '▭',
  html: '‹›',
  genially: '✦',
  accordeon: '⌄',
  carte: '⇆',
  gratter: '░',
  slideshare: '▭',
  instagram: '▢',
  tweet: '✕',
  pinterest: '●',
  figma: '⬡',
  gist: '⌥',
  code: '{ }',
  chronologie: '⏱',
  jsfiddle: 'JS',
  codepen: '◈',
  codesandbox: '⬚',
  tiktok: '♬',
};

export const AIDE_BLOC: Record<TypeBloc, string> = {
  video: 'Un lien YouTube, Vimeo, Dailymotion ou une vidéo hébergée.',
  audio: 'Un lien vers un fichier audio.',
  texte: 'Un paragraphe, une liste, un mot en gras.',
  classe: 'Le rendez-vous en visio, avec sa date.',
  separateur: 'Un trait, pour respirer.',
  image: 'Une image, avec sa légende si besoin.',
  titre: 'Un intertitre pour découper la leçon.',
  fichier: 'Un document que l’apprenant télécharge.',
  information: 'Un encadré : un rappel, une mise en garde, un bravo.',
  pdf: 'Un PDF qui se lit dans la page.',
  lien: 'Un lien vers une page extérieure.',
  leconLiee: 'Un renvoi vers une autre leçon de cette formation.',
  markdown: 'Du texte en Markdown : titres, listes, gras, liens.',
  gif: 'Un gif animé, depuis Giphy ou une adresse directe.',
  calendly: 'Ton agenda Calendly, pour prendre rendez-vous sans sortir de la leçon.',
  typeform: 'Un formulaire Typeform.',
  youtube: 'Une vidéo YouTube.',
  youtubeDirect: 'Un direct YouTube, par son adresse ou sa chaîne.',
  vimeo: 'Une vidéo Vimeo.',
  dailymotion: 'Une vidéo Dailymotion.',
  twitch: 'Une chaîne ou une rediffusion Twitch.',
  soundcloud: 'Un morceau ou un podcast Soundcloud.',
  googleDocs: 'Un document Google, en lecture.',
  googleSheets: 'Un tableur Google, en lecture.',
  googleForms: 'Un formulaire Google, à remplir dans la page.',
  googleCalendar: 'Un agenda Google.',
  googleSlides: 'Une présentation Google.',
  html: 'Du HTML à toi. Il s’affiche isolé du reste de la page.',
  genially: 'Une présentation Genially.',
  accordeon: 'Un titre qu’on déplie : la réponse ne se lit que si on la demande.',
  carte: 'Une carte à retourner : la question devant, la réponse derrière.',
  gratter: 'Une réponse masquée que l’apprenant découvre d’un clic.',
  slideshare: 'Un diaporama Slideshare.',
  instagram: 'Une photo Instagram.',
  tweet: 'Un message publié sur X.',
  pinterest: 'Une épingle Pinterest.',
  figma: 'Une maquette Figma.',
  gist: 'Un extrait de code publié sur GitHub.',
  code: 'Du code, avec son langage, sans coloration trompeuse.',
  chronologie: 'Une suite de repères : une ligne par étape, « date | ce qui se passe ».',
  jsfiddle: 'Un bac à sable JSFiddle.',
  codepen: 'Un bac à sable CodePen.',
  codesandbox: 'Un bac à sable CodeSandbox.',
  tiktok: 'Une vidéo TikTok.',
};

/** Les champs à demander dans les réglages, bloc par bloc. */
export type ChampBloc = 'url' | 'nom' | 'legende' | 'texte' | 'html' | 'ton' | 'debut' | 'langue' | 'verso' | 'lecon';

export const CHAMPS_BLOC: Record<TypeBloc, ChampBloc[]> = {
  video: ['url'],
  audio: ['url'],
  texte: [],
  classe: ['url', 'debut'],
  separateur: [],
  image: ['url', 'legende'],
  titre: [],
  fichier: ['url', 'nom'],
  information: [],
  pdf: ['url', 'nom'],
  lien: ['url', 'nom'],
  leconLiee: ['lecon', 'nom'],
  markdown: ['texte'],
  gif: ['url'],
  calendly: ['url'],
  typeform: ['url'],
  youtube: ['url'],
  youtubeDirect: ['url'],
  vimeo: ['url'],
  dailymotion: ['url'],
  twitch: ['url'],
  soundcloud: ['url'],
  googleDocs: ['url'],
  googleSheets: ['url'],
  googleForms: ['url'],
  googleCalendar: ['url'],
  googleSlides: ['url'],
  html: ['texte'],
  genially: ['url'],
  accordeon: ['nom', 'html'],
  carte: ['texte', 'verso'],
  gratter: ['texte'],
  slideshare: ['url'],
  instagram: ['url'],
  tweet: ['url'],
  pinterest: ['url'],
  figma: ['url'],
  gist: ['url'],
  code: ['texte', 'langue'],
  chronologie: ['texte'],
  jsfiddle: ['url'],
  codepen: ['url'],
  codesandbox: ['url'],
  tiktok: ['url'],
};

/** Les blocs dont le contenu s'écrit directement dans le bloc, en pleine page. */
export const BLOCS_EN_PLACE: TypeBloc[] = ['titre', 'texte', 'information'];

/* ================================================== lire les adresses ==== */

export function adresse(brut?: string): URL | null {
  const v = (brut ?? '').trim();
  if (!v) return null;
  try {
    const u = new URL(v.startsWith('http') ? v : `https://${v}`);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

/** L'hôte finit-il par l'un des domaines attendus ? */
export function chez(u: URL | null, ...domaines: string[]) {
  if (!u) return false;
  const h = u.hostname.toLowerCase().replace(/^www\./, '');
  return domaines.some((d) => h === d || h.endsWith(`.${d}`));
}

function idYouTube(brut?: string): string | null {
  const u = adresse(brut);
  if (!u) return null;
  if (chez(u, 'youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
  if (!chez(u, 'youtube.com', 'youtube-nocookie.com')) return null;
  const v = u.searchParams.get('v');
  if (v) return v;
  const m = u.pathname.match(/\/(embed|shorts|live|v)\/([^/?#]+)/);
  return m ? m[2] : null;
}

function chaineYouTube(brut?: string): string | null {
  const u = adresse(brut);
  if (!chez(u, 'youtube.com')) return null;
  const m = u!.pathname.match(/\/channel\/([^/?#]+)/);
  return m ? m[1] : null;
}

function idVimeo(brut?: string): string | null {
  const u = adresse(brut);
  if (!chez(u, 'vimeo.com')) return null;
  const m = u!.pathname.match(/(\d{6,})/);
  return m ? m[1] : null;
}

function idDailymotion(brut?: string): string | null {
  const u = adresse(brut);
  if (!chez(u, 'dailymotion.com', 'dai.ly')) return null;
  const m = u!.pathname.match(/\/(?:video\/)?([a-z0-9]{5,})/i);
  return m ? m[1] : null;
}

function idTikTok(brut?: string): string | null {
  const u = adresse(brut);
  if (!chez(u, 'tiktok.com')) return null;
  const m = u!.pathname.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

export function idTweet(brut?: string): string | null {
  const u = adresse(brut);
  if (!chez(u, 'twitter.com', 'x.com')) return null;
  const m = u!.pathname.match(/\/status\/(\d+)/);
  return m ? m[1] : null;
}

function refCodePen(brut?: string): string | null {
  const u = adresse(brut);
  if (!chez(u, 'codepen.io')) return null;
  const m = u!.pathname.match(/^\/([^/]+)\/(?:pen|full|details|embed)\/([^/?#]+)/);
  return m ? `${m[1]}/embed/${m[2]}` : null;
}

function idCodeSandbox(brut?: string): string | null {
  const u = adresse(brut);
  if (!chez(u, 'codesandbox.io')) return null;
  const m = u!.pathname.match(/\/(?:s|embed|p\/sandbox)\/([^/?#]+)/);
  return m ? m[1] : null;
}

function partieTwitch(brut?: string): { cle: 'video' | 'channel'; valeur: string } | null {
  const u = adresse(brut);
  if (!chez(u, 'twitch.tv')) return null;
  const v = u!.pathname.match(/\/videos\/(\d+)/);
  if (v) return { cle: 'video', valeur: v[1] };
  const c = u!.pathname.match(/^\/([A-Za-z0-9_]+)\/?$/);
  return c ? { cle: 'channel', valeur: c[1] } : null;
}

/**
 * L'ADRESSE D'INTÉGRATION D'UN BLOC.
 *
 * Rien n'en sort qui ne soit reconstruit ici : le domaine est vérifié,
 * l'identifiant extrait, l'adresse réécrite. Un `null` veut dire « je ne
 * reconnais pas cette adresse », et le bloc se rabat sur un simple lien.
 */
export function integrationBloc(bloc: Bloc, hote?: string): { src: string; ratio: string } | null {
  const u = adresse(bloc.url);
  const large = 'aspect-video';
  const haut = 'aspect-[3/4]';

  switch (bloc.type) {
    case 'video': {
      const y = idYouTube(bloc.url);
      if (y) return { src: `https://www.youtube-nocookie.com/embed/${y}`, ratio: large };
      const v = idVimeo(bloc.url);
      if (v) return { src: `https://player.vimeo.com/video/${v}`, ratio: large };
      const d = idDailymotion(bloc.url);
      if (d) return { src: `https://www.dailymotion.com/embed/video/${d}`, ratio: large };
      return null;
    }
    case 'youtube': {
      const y = idYouTube(bloc.url);
      return y ? { src: `https://www.youtube-nocookie.com/embed/${y}`, ratio: large } : null;
    }
    case 'youtubeDirect': {
      const y = idYouTube(bloc.url);
      if (y) return { src: `https://www.youtube-nocookie.com/embed/${y}`, ratio: large };
      const c = chaineYouTube(bloc.url);
      return c ? { src: `https://www.youtube.com/embed/live_stream?channel=${c}`, ratio: large } : null;
    }
    case 'vimeo': {
      const v = idVimeo(bloc.url);
      return v ? { src: `https://player.vimeo.com/video/${v}`, ratio: large } : null;
    }
    case 'dailymotion': {
      const d = idDailymotion(bloc.url);
      return d ? { src: `https://www.dailymotion.com/embed/video/${d}`, ratio: large } : null;
    }
    case 'twitch': {
      const t = partieTwitch(bloc.url);
      if (!t || !hote) return null;
      return {
        src: `https://player.twitch.tv/?${t.cle}=${encodeURIComponent(t.valeur)}&parent=${encodeURIComponent(hote)}`,
        ratio: large,
      };
    }
    case 'tiktok': {
      const t = idTikTok(bloc.url);
      return t ? { src: `https://www.tiktok.com/embed/v2/${t}`, ratio: haut } : null;
    }
    case 'soundcloud': {
      if (!chez(u, 'soundcloud.com')) return null;
      return {
        src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(u!.toString())}&color=%230F5F3E`,
        ratio: 'aspect-[16/3]',
      };
    }
    case 'calendly':
      return chez(u, 'calendly.com') ? { src: u!.toString(), ratio: 'aspect-[4/5]' } : null;
    case 'typeform':
      return chez(u, 'typeform.com') ? { src: u!.toString(), ratio: 'aspect-[4/3]' } : null;
    case 'genially':
      return chez(u, 'genially.com', 'genial.ly') ? { src: u!.toString(), ratio: large } : null;
    case 'googleDocs':
    case 'googleSheets':
    case 'googleSlides':
    case 'googleForms':
      return chez(u, 'docs.google.com') ? { src: u!.toString(), ratio: 'aspect-[4/3]' } : null;
    case 'googleCalendar':
      return chez(u, 'calendar.google.com') ? { src: u!.toString(), ratio: 'aspect-[4/3]' } : null;
    case 'slideshare':
      return chez(u, 'slideshare.net') ? { src: u!.toString(), ratio: large } : null;
    case 'figma':
      return chez(u, 'figma.com')
        ? { src: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(u!.toString())}`, ratio: large }
        : null;
    case 'instagram': {
      if (!chez(u, 'instagram.com')) return null;
      const m = u!.pathname.match(/\/(p|reel|tv)\/([^/?#]+)/);
      return m ? { src: `https://www.instagram.com/${m[1]}/${m[2]}/embed`, ratio: haut } : null;
    }
    case 'pinterest': {
      if (!chez(u, 'pinterest.com', 'pinterest.fr', 'pin.it')) return null;
      const m = u!.pathname.match(/\/pin\/([^/?#]+)/);
      return m ? { src: `https://assets.pinterest.com/ext/embed.html?id=${m[1]}`, ratio: haut } : null;
    }
    case 'jsfiddle':
      return chez(u, 'jsfiddle.net')
        ? { src: `https://jsfiddle.net${u!.pathname.replace(/\/$/, '')}/embedded/`, ratio: large }
        : null;
    case 'codepen': {
      const r = refCodePen(bloc.url);
      return r ? { src: `https://codepen.io/${r}`, ratio: large } : null;
    }
    case 'codesandbox': {
      const c = idCodeSandbox(bloc.url);
      return c ? { src: `https://codesandbox.io/embed/${c}`, ratio: large } : null;
    }
    case 'pdf':
      return u ? { src: u.toString(), ratio: 'aspect-[3/4]' } : null;
    default:
      return null;
  }
}

/* ================================================== un peu de Markdown ==== */

function echapper(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * DU MARKDOWN, LE NÉCESSAIRE.
 *
 * On échappe d'abord tout le HTML : ce qui ressort ne contient que les
 * balises que cette fonction a elle-même posées.
 */
export function markdownEnHtml(brut: string): string {
  const lignes = echapper(brut).split('\n');
  const sortie: string[] = [];
  let liste = false;
  const enligne = (s: string) =>
    s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  for (const l of lignes) {
    const puce = l.match(/^\s*[-*]\s+(.*)$/);
    if (puce) {
      if (!liste) {
        sortie.push('<ul>');
        liste = true;
      }
      sortie.push(`<li>${enligne(puce[1])}</li>`);
      continue;
    }
    if (liste) {
      sortie.push('</ul>');
      liste = false;
    }
    const titre = l.match(/^(#{1,4})\s+(.*)$/);
    if (titre) {
      const n = Math.min(4, titre[1].length) + 1;
      sortie.push(`<h${n}>${enligne(titre[2])}</h${n}>`);
      continue;
    }
    if (!l.trim()) continue;
    sortie.push(`<p>${enligne(l)}</p>`);
  }
  if (liste) sortie.push('</ul>');
  return sortie.join('');
}
