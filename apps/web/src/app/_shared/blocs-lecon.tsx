'use client';

import { useEffect, useState } from 'react';
import {
  NOM_BLOC,
  adresse,
  chez,
  idTweet,
  integrationBloc,
  markdownEnHtml,
  type Bloc,
} from './blocs';

/* ============================================== les pièces d'affichage ==== */

const TONS: Record<string, { fond: string; encre: string }> = {
  info: { fond: '#E3F5EC', encre: '#0F5F3E' },
  attention: { fond: '#FEF3E2', encre: '#7C3E06' },
  succes: { fond: '#E3F5EC', encre: '#0F5F3E' },
};

function Manque({ quoi }: { quoi: string }) {
  return (
    <p className="text-sm italic" style={{ color: '#5E7A6E' }}>
      {quoi}
    </p>
  );
}

function Cadre({ src, ratio, titre }: { src: string; ratio: string; titre: string }) {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#DDEBE4' }}>
      <iframe
        src={src}
        title={titre}
        className={`w-full ${ratio}`}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}

/** Le HTML de la formatrice s'affiche isolé : il ne peut rien lire de la page. */
function CadreIsole({ html, titre, ratio }: { html: string; titre: string; ratio: string }) {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#DDEBE4' }}>
      <iframe
        srcDoc={`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;font:15px/1.6 system-ui,sans-serif;color:#334A42}</style>${html}`}
        title={titre}
        className={`w-full ${ratio}`}
        sandbox="allow-scripts allow-popups allow-forms"
        loading="lazy"
      />
    </div>
  );
}

function LienSimple({ url, texte }: { url: string; texte: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded-xl border-2 bg-white px-4 py-2 text-[15px] font-bold no-underline"
      style={{ borderColor: '#DDEBE4', color: '#0F5F3E' }}
    >
      {texte}
    </a>
  );
}

function Deplier({ titre, html }: { titre: string; html: string }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="rounded-xl border" style={{ borderColor: '#DDEBE4' }}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-[15px] font-bold"
        style={{ color: '#12312A' }}
      >
        <span aria-hidden className="shrink-0">
          {ouvert ? '⌄' : '›'}
        </span>
        <span className="min-w-0 flex-1">{titre}</span>
      </button>
      {ouvert ? (
        <div
          className="border-t px-4 py-3 text-[15px] leading-relaxed [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-2 [&_p:last-child]:mb-0"
          style={{ borderColor: '#DDEBE4', color: '#334A42' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
    </div>
  );
}

function CarteRetournable({ recto, verso }: { recto: string; verso: string }) {
  const [dos, setDos] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setDos((v) => !v)}
      className="grid w-full min-h-[140px] place-items-center rounded-2xl border-2 px-6 py-8 text-center text-[17px] font-bold"
      style={{
        borderColor: dos ? '#0F5F3E' : '#DDEBE4',
        backgroundColor: dos ? '#E3F5EC' : '#FFFFFF',
        color: '#12312A',
      }}
    >
      <span>
        {dos ? verso : recto}
        <span className="mt-3 block text-xs font-bold uppercase tracking-wide" style={{ color: '#5E7A6E' }}>
          {dos ? 'Clique pour revenir' : 'Clique pour retourner'}
        </span>
      </span>
    </button>
  );
}

function AGratter({ texte }: { texte: string }) {
  const [vu, setVu] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setVu(true)}
      className="w-full rounded-xl border-2 px-4 py-4 text-left text-[15px]"
      style={{
        borderColor: '#DDEBE4',
        backgroundColor: vu ? '#FFFFFF' : '#F2F7F5',
        color: '#334A42',
        filter: vu ? 'none' : 'blur(5px)',
        cursor: vu ? 'default' : 'pointer',
      }}
      aria-label={vu ? undefined : 'Découvrir la réponse'}
    >
      {texte}
    </button>
  );
}

function Chronologie({ texte }: { texte: string }) {
  const lignes = texte
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lignes.length) return <Manque quoi="Une ligne par étape : « date | ce qui se passe »." />;
  return (
    <ol className="grid gap-3 border-l-2 pl-5" style={{ borderColor: '#B7E4CE' }}>
      {lignes.map((l, i) => {
        const [quand, ...reste] = l.split('|');
        const quoi = reste.join('|').trim();
        return (
          <li key={i} className="relative">
            <span
              aria-hidden
              className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 bg-white"
              style={{ borderColor: '#0F5F3E' }}
            />
            <span className="block text-xs font-extrabold uppercase tracking-wide" style={{ color: '#0F5F3E' }}>
              {quand.trim()}
            </span>
            {quoi ? (
              <span className="block text-[15px]" style={{ color: '#334A42' }}>
                {quoi}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/* =========================================================== le rendu ==== */

export function BlocRendu({
  bloc,
  couleur = '#0F5F3E',
  lecons,
  ouvrirLecon,
}: {
  bloc: Bloc;
  couleur?: string;
  /** Pour « Lien vers une leçon » : le titre à afficher. */
  lecons?: { id: string; titre: string }[];
  ouvrirLecon?: (id: string) => void;
}) {
  // Twitch exige le domaine qui l'héberge : on attend d'être dans le navigateur.
  const [hote, setHote] = useState<string | undefined>(undefined);
  useEffect(() => setHote(window.location.hostname), []);

  const t = bloc.type;

  if (t === 'titre') {
    return (
      <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#12312A' }}>
        {bloc.texte || 'Un titre'}
      </h2>
    );
  }

  if (t === 'texte') {
    return (
      <div
        className="prose-sm max-w-none text-[15px] leading-relaxed [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3"
        style={{ color: '#334A42' }}
        dangerouslySetInnerHTML={{ __html: bloc.html || '' }}
      />
    );
  }

  if (t === 'information') {
    const ton = TONS[bloc.ton ?? 'info'] ?? TONS.info;
    return (
      <div
        className="rounded-xl px-4 py-3 text-[15px] leading-relaxed [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-2 [&_p:last-child]:mb-0"
        style={{ backgroundColor: ton.fond, color: ton.encre }}
        dangerouslySetInnerHTML={{ __html: bloc.html || '' }}
      />
    );
  }

  if (t === 'separateur') return <hr className="border-t-2" style={{ borderColor: '#DDEBE4' }} />;

  if (t === 'image' || t === 'gif') {
    const u = adresse(bloc.url);
    if (!u) return <Manque quoi={t === 'gif' ? 'L’adresse du gif.' : 'Une image — colle son adresse.'} />;
    // Un lien de page Giphy devient son cadre ; une adresse directe reste une image.
    if (t === 'gif' && chez(u, 'giphy.com') && !/\.(gif|webp|mp4)$/i.test(u.pathname)) {
      const m = u.pathname.match(/-([A-Za-z0-9]+)$/) || u.pathname.match(/\/(?:gifs|embed|media)\/([A-Za-z0-9]+)/);
      if (m) return <Cadre src={`https://giphy.com/embed/${m[1]}`} ratio="aspect-video" titre="Gif" />;
    }
    return (
      <figure className="grid gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={u.toString()} alt={bloc.legende || ''} className="w-full rounded-xl" loading="lazy" />
        {bloc.legende ? (
          <figcaption className="text-sm" style={{ color: '#5E7A6E' }}>
            {bloc.legende}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (t === 'audio') {
    const u = adresse(bloc.url);
    return u ? (
      <audio controls src={u.toString()} className="w-full">
        Ton navigateur ne lit pas cet audio.
      </audio>
    ) : (
      <Manque quoi="Le lien de l’audio." />
    );
  }

  if (t === 'classe') {
    const u = adresse(bloc.url);
    return (
      <div className="grid gap-2">
        <p className="text-[15px] font-bold" style={{ color: couleur }}>
          Classe en direct
          {bloc.debut ? (
            <span className="font-normal" style={{ color: '#5E7A6E' }}>
              {' '}
              — {new Date(bloc.debut).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
            </span>
          ) : null}
        </p>
        {u ? <LienSimple url={u.toString()} texte="Rejoindre la visio" /> : <Manque quoi="Le lien de la visio." />}
      </div>
    );
  }

  if (t === 'fichier' || t === 'lien') {
    const u = adresse(bloc.url);
    if (!u) return <Manque quoi="L’adresse du document." />;
    return <LienSimple url={u.toString()} texte={bloc.nom || (t === 'lien' ? 'Ouvrir le lien' : 'Télécharger')} />;
  }

  if (t === 'leconLiee') {
    const titre = bloc.nom || lecons?.find((l) => l.id === bloc.leconId)?.titre || 'Aller à la leçon';
    if (!bloc.leconId) return <Manque quoi="Choisis la leçon vers laquelle renvoyer." />;
    return ouvrirLecon ? (
      <button
        type="button"
        onClick={() => ouvrirLecon(bloc.leconId as string)}
        className="inline-block rounded-xl border-2 bg-white px-4 py-2 text-[15px] font-bold"
        style={{ borderColor: '#DDEBE4', color: couleur }}
      >
        {titre} →
      </button>
    ) : (
      <p className="text-[15px] font-bold" style={{ color: couleur }}>
        {titre} →
      </p>
    );
  }

  if (t === 'markdown') {
    const md = (bloc.texte || '').trim();
    if (!md) return <Manque quoi="Écris ton Markdown." />;
    return (
      <div
        className="text-[15px] leading-relaxed [&_a]:underline [&_code]:rounded [&_code]:bg-[#F2F7F5] [&_code]:px-1 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-extrabold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_ul]:mb-3"
        style={{ color: '#334A42' }}
        dangerouslySetInnerHTML={{ __html: markdownEnHtml(md) }}
      />
    );
  }

  if (t === 'html') {
    const h = (bloc.texte || '').trim();
    return h ? <CadreIsole html={h} titre="Contenu" ratio="aspect-[4/3]" /> : <Manque quoi="Colle ton HTML." />;
  }

  if (t === 'code') {
    const c = bloc.texte || '';
    if (!c.trim()) return <Manque quoi="Colle ton code." />;
    return (
      <div className="grid gap-1.5">
        {bloc.langue ? (
          <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#5E7A6E' }}>
            {bloc.langue}
          </span>
        ) : null}
        <pre
          className="overflow-x-auto rounded-xl border px-4 py-3 text-[13px] leading-relaxed"
          style={{ borderColor: '#DDEBE4', backgroundColor: '#F2F7F5', color: '#12312A' }}
        >
          <code>{c}</code>
        </pre>
      </div>
    );
  }

  if (t === 'accordeon') {
    return <Deplier titre={bloc.nom || 'Afficher la suite'} html={bloc.html || ''} />;
  }

  if (t === 'carte') {
    return <CarteRetournable recto={bloc.texte || 'La question'} verso={bloc.verso || 'La réponse'} />;
  }

  if (t === 'gratter') {
    return bloc.texte ? <AGratter texte={bloc.texte} /> : <Manque quoi="Écris ce qui se découvre." />;
  }

  if (t === 'chronologie') return <Chronologie texte={bloc.texte || ''} />;

  if (t === 'tweet') {
    const id = idTweet(bloc.url);
    if (!id) return <Manque quoi="L’adresse du message sur X." />;
    return (
      <CadreIsole
        ratio="aspect-[4/3]"
        titre="Message X"
        html={`<blockquote class="twitter-tweet"><a href="https://twitter.com/i/status/${id}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js"></script>`}
      />
    );
  }

  if (t === 'gist') {
    const u = adresse(bloc.url);
    if (!chez(u, 'gist.github.com')) return <Manque quoi="L’adresse du gist GitHub." />;
    return (
      <CadreIsole
        ratio="aspect-[4/3]"
        titre="Gist"
        html={`<script src="${u!.toString().replace(/\/$/, '')}.js"></script>`}
      />
    );
  }

  // Tout le reste : un cadre d'intégration reconstruit, ou un lien.
  const cadre = integrationBloc(bloc, hote);
  if (cadre) return <Cadre src={cadre.src} ratio={cadre.ratio} titre={NOM_BLOC[t]} />;

  const u = adresse(bloc.url);
  if (!u) return <Manque quoi={`L’adresse — ${NOM_BLOC[t]}.`} />;
  return (
    <div className="grid gap-2">
      <LienSimple url={u.toString()} texte={bloc.nom || `Ouvrir — ${NOM_BLOC[t]}`} />
      <p className="text-xs" style={{ color: '#5E7A6E' }}>
        Cette adresse ne ressemble pas à un lien {NOM_BLOC[t]} : elle s’affiche en lien plutôt que dans la page.
      </p>
    </div>
  );
}

/** Tous les blocs d'une leçon, à la suite. */
export function BlocsLecon({
  blocs,
  couleur,
  lecons,
  ouvrirLecon,
}: {
  blocs: Bloc[];
  couleur?: string;
  lecons?: { id: string; titre: string }[];
  ouvrirLecon?: (id: string) => void;
}) {
  if (!blocs?.length) return null;
  return (
    <div className="grid gap-5">
      {blocs.map((b) => (
        <BlocRendu key={b.id} bloc={b} couleur={couleur} lecons={lecons} ouvrirLecon={ouvrirLecon} />
      ))}
    </div>
  );
}
