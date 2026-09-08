'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { NOM_BLOC, VERT, nouvelIdentifiant, type Bloc, type Lecon, type TypeBloc } from './types';

/**
 * L'ÉDITEUR D'UNE LEÇON, EN PLEIN ÉCRAN.
 *
 * À gauche, trois onglets : la leçon (son titre, sa durée, son état), les
 * blocs qu'on peut poser, les annexes. Au centre, la leçon telle qu'elle se
 * lira — on survole un bloc, on le modifie, on le déplace, on le retire.
 *
 * Rien n'est enregistré tant qu'on n'a pas cliqué « Sauvegarder » : le bouton
 * s'allume dès qu'une chose a changé, et l'écran prévient avant de se fermer
 * sur du travail non enregistré.
 */

const PALETTE: TypeBloc[] = [
  'texte',
  'titre',
  'video',
  'audio',
  'image',
  'fichier',
  'pdf',
  'lien',
  'information',
  'separateur',
  'classe',
];

const AIDE_BLOC: Record<TypeBloc, string> = {
  titre: 'Un intertitre pour découper la leçon.',
  texte: 'Un paragraphe, une liste, un mot en gras.',
  video: 'Un lien YouTube, Vimeo, Dailymotion ou une vidéo hébergée.',
  audio: 'Un lien vers un fichier audio.',
  image: 'Une image, avec sa légende si besoin.',
  separateur: 'Un trait, pour respirer.',
  information: 'Un encadré : un rappel, une mise en garde, un bravo.',
  fichier: 'Un document que l’apprenant télécharge.',
  pdf: 'Un PDF qui se lit dans la page.',
  lien: 'Un lien vers une page extérieure.',
  classe: 'Le rendez-vous en visio, avec sa date.',
};

export function EditeurLecon({
  lecon,
  titreFormation,
  adressePublique,
  enregistrer,
  fermer,
}: {
  lecon: Lecon;
  titreFormation: string;
  adressePublique: string | null;
  enregistrer: (patch: Record<string, unknown>) => Promise<boolean>;
  fermer: () => void;
}) {
  const [onglet, setOnglet] = useState<'lecon' | 'blocs' | 'annexes'>('lecon');
  const [titre, setTitre] = useState(lecon.titre);
  const [duree, setDuree] = useState(String(lecon.dureeMinutes || ''));
  const [publie, setPublie] = useState(lecon.publie !== false);
  const [apercu, setApercu] = useState(lecon.apercu);
  const [blocs, setBlocs] = useState<Bloc[]>(lecon.blocs ?? []);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [cherche, setCherche] = useState('');
  const [modifie, setModifie] = useState(false);
  const [occupe, setOccupe] = useState(false);

  const toucher = () => setModifie(true);

  // On ne quitte pas un travail non enregistré sans le dire.
  useEffect(() => {
    const garde = (e: BeforeUnloadEvent) => {
      if (!modifie) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', garde);
    return () => window.removeEventListener('beforeunload', garde);
  }, [modifie]);

  const sauver = async () => {
    setOccupe(true);
    const fait = await enregistrer({
      titre: titre.trim() || 'Leçon',
      dureeMinutes: Number(duree) || 0,
      publie,
      apercu,
      blocs,
    });
    setOccupe(false);
    if (fait) setModifie(false);
  };

  const sortir = () => {
    if (modifie && !window.confirm("Cette leçon a changé et n'est pas enregistrée. Fermer quand même ?")) return;
    fermer();
  };

  const poser = (type: TypeBloc) => {
    const neuf: Bloc = { id: nouvelIdentifiant(), type };
    if (type === 'titre') neuf.texte = 'Un titre';
    if (type === 'texte') neuf.html = '<p>Écris ici.</p>';
    if (type === 'information') {
      neuf.html = '<p>Ce qu’il faut retenir.</p>';
      neuf.ton = 'info';
    }
    setBlocs((b) => [...b, neuf]);
    setOuvert(neuf.id);
    setOnglet('lecon');
    toucher();
  };

  const changer = (id: string, patch: Partial<Bloc>) => {
    setBlocs((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    toucher();
  };

  const retirer = (id: string) => {
    setBlocs((b) => b.filter((x) => x.id !== id));
    if (ouvert === id) setOuvert(null);
    toucher();
  };

  const bouger = (i: number, sens: -1 | 1) => {
    const j = i + sens;
    if (j < 0 || j >= blocs.length) return;
    const copie = [...blocs];
    [copie[i], copie[j]] = [copie[j], copie[i]];
    setBlocs(copie);
    toucher();
  };

  const palette = useMemo(() => {
    const q = cherche.trim().toLowerCase();
    if (!q) return PALETTE;
    return PALETTE.filter((t) => NOM_BLOC[t].toLowerCase().includes(q) || AIDE_BLOC[t].toLowerCase().includes(q));
  }, [cherche]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* ------------------------------------------------------- la barre haute */}
      <header
        className="flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: VERT.bord }}
      >
        <p className="min-w-0 flex-1 truncate text-sm font-bold" style={{ color: VERT.sourdine }}>
          {titreFormation}
        </p>
        {adressePublique ? (
          <a
            href={adressePublique}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-sm font-bold no-underline hover:underline"
            style={{ color: VERT.fonce }}
          >
            Voir la page
          </a>
        ) : null}
        <button
          type="button"
          onClick={sauver}
          disabled={!modifie || occupe}
          className="shrink-0 rounded-xl px-5 py-2 text-sm font-extrabold text-white disabled:opacity-50"
          style={{ backgroundColor: VERT.fonce }}
        >
          {occupe ? 'Enregistrement…' : 'Sauvegarder'}
        </button>
        <button
          type="button"
          onClick={sortir}
          className="shrink-0 rounded-xl border-2 bg-white px-3 py-2 text-sm font-extrabold"
          style={{ borderColor: VERT.bord, color: VERT.texte }}
          aria-label="Fermer l'éditeur"
        >
          ✕
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* ------------------------------------------------- le panneau de gauche */}
        <aside
          className="w-full shrink-0 overflow-y-auto border-b md:w-[340px] md:border-b-0 md:border-r"
          style={{ borderColor: VERT.bord }}
        >
          <nav className="flex border-b" style={{ borderColor: VERT.bord }}>
            {(['lecon', 'blocs', 'annexes'] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOnglet(o)}
                className="flex-1 border-b-2 px-3 py-3 text-sm font-extrabold"
                style={{
                  borderColor: onglet === o ? VERT.plein : 'transparent',
                  color: onglet === o ? VERT.fonce : VERT.sourdine,
                }}
              >
                {o === 'lecon' ? 'Leçon' : o === 'blocs' ? 'Blocs' : 'Annexes'}
              </button>
            ))}
          </nav>

          {onglet === 'lecon' ? (
            <div className="grid gap-4 p-4">
              <label className="grid gap-1.5 text-sm font-bold" style={{ color: VERT.texte }}>
                Renseigne le titre de cette leçon
                <input
                  value={titre}
                  onChange={(e) => {
                    setTitre(e.target.value);
                    toucher();
                  }}
                  className="rounded-xl border-2 px-3 py-2 text-[15px] font-normal focus:outline-none"
                  style={{ borderColor: VERT.bord, color: VERT.encre }}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-bold" style={{ color: VERT.texte }}>
                La durée, en minutes
                <input
                  type="number"
                  min={0}
                  value={duree}
                  onChange={(e) => {
                    setDuree(e.target.value);
                    toucher();
                  }}
                  className="rounded-xl border-2 px-3 py-2 text-[15px] font-normal focus:outline-none"
                  style={{ borderColor: VERT.bord, color: VERT.encre }}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-bold" style={{ color: VERT.texte }}>
                Cette leçon
                <select
                  value={publie ? 'oui' : 'non'}
                  onChange={(e) => {
                    setPublie(e.target.value === 'oui');
                    toucher();
                  }}
                  className="rounded-xl border-2 bg-white px-3 py-2 text-[15px] font-normal focus:outline-none"
                  style={{ borderColor: VERT.bord, color: VERT.encre }}
                >
                  <option value="oui">Se lit — publiée</option>
                  <option value="non">Ne se lit pas encore — brouillon</option>
                </select>
              </label>

              <label className="flex items-start gap-2 text-sm" style={{ color: VERT.texte }}>
                <input
                  type="checkbox"
                  checked={apercu}
                  onChange={(e) => {
                    setApercu(e.target.checked);
                    toucher();
                  }}
                  className="mt-1 size-4"
                />
                <span>
                  <span className="font-bold">Aperçu libre</span>
                  <br />
                  Cette leçon se lit sans avoir acheté la formation.
                </span>
              </label>

              <div>
                <p className="mb-2 text-sm font-extrabold" style={{ color: VERT.encre }}>
                  Les blocs de cette leçon ({blocs.length})
                </p>
                {blocs.length === 0 ? (
                  <p className="text-sm" style={{ color: VERT.sourdine }}>
                    Rien encore. Ouvre l’onglet « Blocs » et clique sur ce que tu veux poser.
                  </p>
                ) : (
                  <ul className="grid gap-1.5">
                    {blocs.map((b, i) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => setOuvert(ouvert === b.id ? null : b.id)}
                          className="flex w-full items-center gap-2 rounded-xl border-2 bg-white px-3 py-2 text-left text-sm font-bold"
                          style={{
                            borderColor: ouvert === b.id ? VERT.plein : VERT.bord,
                            color: VERT.encre,
                          }}
                        >
                          <span className="shrink-0 tabular-nums" style={{ color: VERT.sourdine }}>
                            {i + 1}.
                          </span>
                          <span className="min-w-0 flex-1 truncate">{resume(b)}</span>
                          <span className="shrink-0 text-xs font-bold" style={{ color: VERT.sourdine }}>
                            {NOM_BLOC[b.type]}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

          {onglet === 'blocs' ? (
            <div className="p-4">
              <p className="mb-3 text-center text-sm" style={{ color: VERT.sourdine }}>
                Clique sur un bloc pour l’ajouter à cette leçon.
              </p>
              <input
                value={cherche}
                onChange={(e) => setCherche(e.target.value)}
                placeholder="Chercher un contenu"
                className="mb-3 w-full rounded-xl border-2 px-3 py-2 text-[15px] focus:outline-none"
                style={{ borderColor: VERT.bord, color: VERT.encre }}
              />
              <div className="grid grid-cols-2 gap-2">
                {palette.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => poser(t)}
                    title={AIDE_BLOC[t]}
                    className="rounded-xl border-2 bg-white px-3 py-4 text-sm font-bold"
                    style={{ borderColor: VERT.bord, color: VERT.encre }}
                  >
                    {NOM_BLOC[t]}
                  </button>
                ))}
              </div>
              {palette.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: VERT.sourdine }}>
                  Aucun bloc ne porte ce nom.
                </p>
              ) : null}
            </div>
          ) : null}

          {onglet === 'annexes' ? (
            <div className="grid gap-3 p-4">
              <p className="text-sm" style={{ color: VERT.texte }}>
                Une annexe est un document que l’apprenant garde : le support de séance, un modèle à
                remplir, la bibliographie.
              </p>
              <p className="text-sm" style={{ color: VERT.sourdine }}>
                Pose-la comme un bloc « Fichier à télécharger » : elle apparaît alors dans la leçon,
                à l’endroit exact où elle sert.
              </p>
              <button
                type="button"
                onClick={() => poser('fichier')}
                className="rounded-xl border-2 bg-white px-3 py-2 text-sm font-bold"
                style={{ borderColor: VERT.bord, color: VERT.fonce }}
              >
                + Ajouter un fichier à télécharger
              </button>
            </div>
          ) : null}
        </aside>

        {/* ------------------------------------------------------------- l'aperçu */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8" style={{ backgroundColor: VERT.fond }}>
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-center text-3xl font-black tracking-tight" style={{ color: VERT.encre }}>
              {titre || 'Sans titre'}
            </h1>

            {blocs.length === 0 ? (
              <p
                className="rounded-2xl border-2 border-dashed bg-white px-5 py-10 text-center text-sm"
                style={{ borderColor: VERT.bord, color: VERT.sourdine }}
              >
                Cette leçon est vide. Ouvre « Blocs » à gauche et pose ce que tu veux dire.
              </p>
            ) : null}

            <div className="grid gap-4">
              {blocs.map((b, i) => (
                <article
                  key={b.id}
                  className="group relative rounded-2xl border-2 bg-white p-5"
                  style={{ borderColor: ouvert === b.id ? VERT.plein : 'transparent' }}
                >
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    <Icone titre="Monter ce bloc" onClick={() => bouger(i, -1)} disabled={i === 0}>
                      ↑
                    </Icone>
                    <Icone titre="Descendre ce bloc" onClick={() => bouger(i, 1)} disabled={i === blocs.length - 1}>
                      ↓
                    </Icone>
                    <Icone titre="Modifier ce bloc" onClick={() => setOuvert(ouvert === b.id ? null : b.id)}>
                      ✎
                    </Icone>
                    <Icone titre="Supprimer ce bloc" onClick={() => retirer(b.id)} danger>
                      ✕
                    </Icone>
                  </div>

                  {ouvert === b.id ? (
                    <ReglagesBloc bloc={b} changer={(p) => changer(b.id, p)} fermer={() => setOuvert(null)} />
                  ) : (
                    <ApercuBloc bloc={b} />
                  )}
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ l'aperçu */

function ApercuBloc({ bloc }: { bloc: Bloc }) {
  if (bloc.type === 'titre') {
    return (
      <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: VERT.encre }}>
        {bloc.texte || 'Un titre'}
      </h2>
    );
  }

  if (bloc.type === 'texte') {
    return (
      <div
        className="prose-sm max-w-none text-[15px] leading-relaxed [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3"
        style={{ color: VERT.texte }}
        dangerouslySetInnerHTML={{ __html: bloc.html || '' }}
      />
    );
  }

  if (bloc.type === 'information') {
    const tons: Record<string, { fond: string; encre: string }> = {
      info: { fond: VERT.clair, encre: VERT.fonce },
      attention: { fond: '#FEF3E2', encre: '#7C3E06' },
      succes: { fond: '#E3F5EC', encre: '#0F5F3E' },
    };
    const t = tons[bloc.ton ?? 'info'] ?? tons.info;
    return (
      <div
        className="rounded-xl px-4 py-3 text-[15px] leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0"
        style={{ backgroundColor: t.fond, color: t.encre }}
        dangerouslySetInnerHTML={{ __html: bloc.html || '' }}
      />
    );
  }

  if (bloc.type === 'separateur') {
    return <hr className="border-t-2" style={{ borderColor: VERT.bord }} />;
  }

  if (bloc.type === 'image') {
    return bloc.url ? (
      <figure className="grid gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bloc.url} alt={bloc.legende || ''} className="w-full rounded-xl" />
        {bloc.legende ? (
          <figcaption className="text-sm" style={{ color: VERT.sourdine }}>
            {bloc.legende}
          </figcaption>
        ) : null}
      </figure>
    ) : (
      <Vide quoi="Une image — colle son adresse." />
    );
  }

  if (bloc.type === 'video' || bloc.type === 'classe') {
    return bloc.url ? (
      <p className="text-[15px] font-bold" style={{ color: VERT.fonce }}>
        {bloc.type === 'classe' ? 'Classe en direct : ' : 'Vidéo : '}
        <span className="break-all font-normal" style={{ color: VERT.texte }}>
          {bloc.url}
        </span>
        {bloc.debut ? <span style={{ color: VERT.sourdine }}> — {bloc.debut}</span> : null}
      </p>
    ) : (
      <Vide quoi={bloc.type === 'classe' ? 'Le lien de la visio.' : 'Le lien de la vidéo.'} />
    );
  }

  if (bloc.type === 'audio') {
    return bloc.url ? (
      <audio controls src={bloc.url} className="w-full">
        Ton navigateur ne lit pas cet audio.
      </audio>
    ) : (
      <Vide quoi="Le lien de l’audio." />
    );
  }

  if (bloc.type === 'fichier' || bloc.type === 'pdf' || bloc.type === 'lien') {
    return bloc.url ? (
      <a
        href={bloc.url}
        target="_blank"
        rel="noreferrer"
        className="inline-block rounded-xl border-2 px-4 py-2 text-[15px] font-bold no-underline"
        style={{ borderColor: VERT.bord, color: VERT.fonce }}
      >
        {bloc.nom || (bloc.type === 'pdf' ? 'Ouvrir le PDF' : bloc.type === 'lien' ? 'Ouvrir le lien' : 'Télécharger')}
      </a>
    ) : (
      <Vide quoi="L’adresse du document." />
    );
  }

  return null;
}

function Vide({ quoi }: { quoi: string }) {
  return (
    <p className="text-sm italic" style={{ color: VERT.sourdine }}>
      {quoi}
    </p>
  );
}

/* ---------------------------------------------------------- les réglages ---- */

function ReglagesBloc({
  bloc,
  changer,
  fermer,
}: {
  bloc: Bloc;
  changer: (patch: Partial<Bloc>) => void;
  fermer: () => void;
}) {
  const champ =
    'w-full rounded-xl border-2 px-3 py-2 text-[15px] focus:outline-none';

  return (
    <div className="grid gap-3 pr-24">
      <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: VERT.sourdine }}>
        {NOM_BLOC[bloc.type]}
      </p>

      {bloc.type === 'titre' ? (
        <input
          autoFocus
          value={bloc.texte ?? ''}
          onChange={(e) => changer({ texte: e.target.value })}
          className={champ}
          style={{ borderColor: VERT.bord, color: VERT.encre }}
          placeholder="Le titre"
        />
      ) : null}

      {bloc.type === 'texte' || bloc.type === 'information' ? (
        <TexteRiche valeur={bloc.html ?? ''} changer={(html) => changer({ html })} />
      ) : null}

      {bloc.type === 'information' ? (
        <label className="grid gap-1 text-sm font-bold" style={{ color: VERT.texte }}>
          Le ton
          <select
            value={bloc.ton ?? 'info'}
            onChange={(e) => changer({ ton: e.target.value as Bloc['ton'] })}
            className={champ}
            style={{ borderColor: VERT.bord, color: VERT.encre }}
          >
            <option value="info">Un rappel</option>
            <option value="attention">Une mise en garde</option>
            <option value="succes">Un encouragement</option>
          </select>
        </label>
      ) : null}

      {['video', 'audio', 'image', 'fichier', 'pdf', 'lien', 'classe'].includes(bloc.type) ? (
        <label className="grid gap-1 text-sm font-bold" style={{ color: VERT.texte }}>
          L’adresse
          <input
            autoFocus
            value={bloc.url ?? ''}
            onChange={(e) => changer({ url: e.target.value })}
            className={champ}
            style={{ borderColor: VERT.bord, color: VERT.encre }}
            placeholder="https://…"
          />
        </label>
      ) : null}

      {bloc.type === 'image' ? (
        <label className="grid gap-1 text-sm font-bold" style={{ color: VERT.texte }}>
          La légende
          <input
            value={bloc.legende ?? ''}
            onChange={(e) => changer({ legende: e.target.value })}
            className={champ}
            style={{ borderColor: VERT.bord, color: VERT.encre }}
          />
        </label>
      ) : null}

      {['fichier', 'pdf', 'lien'].includes(bloc.type) ? (
        <label className="grid gap-1 text-sm font-bold" style={{ color: VERT.texte }}>
          Ce qu’on lit sur le bouton
          <input
            value={bloc.nom ?? ''}
            onChange={(e) => changer({ nom: e.target.value })}
            className={champ}
            style={{ borderColor: VERT.bord, color: VERT.encre }}
            placeholder="Télécharger le support"
          />
        </label>
      ) : null}

      {bloc.type === 'classe' ? (
        <label className="grid gap-1 text-sm font-bold" style={{ color: VERT.texte }}>
          Quand
          <input
            type="datetime-local"
            value={bloc.debut ?? ''}
            onChange={(e) => changer({ debut: e.target.value })}
            className={champ}
            style={{ borderColor: VERT.bord, color: VERT.encre }}
          />
        </label>
      ) : null}

      {bloc.type === 'separateur' ? (
        <p className="text-sm" style={{ color: VERT.sourdine }}>
          Un séparateur n’a rien à régler.
        </p>
      ) : null}

      <div>
        <button
          type="button"
          onClick={fermer}
          className="rounded-xl px-4 py-2 text-sm font-extrabold text-white"
          style={{ backgroundColor: VERT.fonce }}
        >
          Terminé
        </button>
      </div>
    </div>
  );
}

/**
 * UN TEXTE QU'ON MET EN FORME.
 *
 * Gras, italique, liste, lien : le strict nécessaire pour écrire un cours,
 * sans transformer l'écran en traitement de texte.
 */
function TexteRiche({ valeur, changer }: { valeur: string; changer: (html: string) => void }) {
  const zone = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (zone.current && zone.current.innerHTML !== valeur) zone.current.innerHTML = valeur;
    // On ne réécrit la zone que lorsqu'on change de bloc, jamais en frappant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const geste = (commande: string, valeurCommande?: string) => {
    document.execCommand(commande, false, valeurCommande);
    if (zone.current) changer(zone.current.innerHTML);
  };

  const bouton = 'rounded-lg border-2 bg-white px-2.5 py-1 text-sm font-extrabold';

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1">
        <button type="button" onClick={() => geste('bold')} className={bouton} style={{ borderColor: VERT.bord, color: VERT.encre }}>
          G
        </button>
        <button
          type="button"
          onClick={() => geste('italic')}
          className={`${bouton} italic`}
          style={{ borderColor: VERT.bord, color: VERT.encre }}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => geste('insertUnorderedList')}
          className={bouton}
          style={{ borderColor: VERT.bord, color: VERT.encre }}
        >
          Liste
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('L’adresse du lien');
            if (url) geste('createLink', url);
          }}
          className={bouton}
          style={{ borderColor: VERT.bord, color: VERT.encre }}
        >
          Lien
        </button>
      </div>
      <div
        ref={zone}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => changer((e.target as HTMLDivElement).innerHTML)}
        className="min-h-[120px] rounded-xl border-2 px-3 py-2 text-[15px] leading-relaxed focus:outline-none [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-2"
        style={{ borderColor: VERT.bord, color: VERT.texte }}
      />
    </div>
  );
}

function Icone({
  children,
  onClick,
  disabled,
  titre,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  titre: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titre}
      aria-label={titre}
      className="size-8 rounded-lg border-2 bg-white text-sm font-extrabold disabled:opacity-40"
      style={{ borderColor: danger ? '#F3B0C2' : VERT.bord, color: danger ? '#8A1B3D' : VERT.texte }}
    >
      {children}
    </button>
  );
}

/** Ce qu'on lit d'un bloc dans la liste de gauche. */
function resume(b: Bloc) {
  if (b.type === 'titre') return b.texte || 'Un titre';
  if (b.type === 'texte' || b.type === 'information') {
    const nu = (b.html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return nu ? nu.slice(0, 60) : 'Un texte';
  }
  if (b.type === 'separateur') return 'Un trait';
  return b.nom || b.legende || b.url || NOM_BLOC[b.type];
}
