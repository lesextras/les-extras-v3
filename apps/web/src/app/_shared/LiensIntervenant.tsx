import { Globe, Instagram, Linkedin, Facebook, Youtube, Music2 } from "lucide-react";

/**
 * LES LIENS PUBLICS DE L'INTERVENANT — 9/09/2026.
 *
 * Un établissement qui hésite entre deux ateliers ne juge pas sur un texte de
 * présentation : il veut VOIR le travail. Une page LinkedIn, un compte
 * Instagram où l'on voit une séance, une chaîne où l'on entend la personne
 * parler — c'est cela qui décide, et rien de tout cela n'était affiché.
 *
 * Le réseau est déduit du domaine, jamais demandé : l'intervenant colle une
 * adresse, on trouve l'icône. Un lien qu'on ne reconnaît pas reste un lien,
 * avec l'icône « site » et son domaine en clair — mieux vaut un lien affiché
 * sobrement qu'un lien caché parce qu'il ne rentre pas dans une case.
 *
 * `rel="nofollow ugc noopener noreferrer"` : ces adresses sont saisies par des
 * utilisateurs sur des pages publiques. Sans `ugc`/`nofollow`, la plateforme
 * prête sa réputation à n'importe quel domaine ; sans `noopener`, la page
 * ouverte garde une prise sur la nôtre.
 */

type Reseau = { nom: string; Icone: typeof Globe };

function reconnaitre(url: string): Reseau {
  let hote = "";
  try {
    hote = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return { nom: "Site", Icone: Globe };
  }
  if (hote.endsWith("linkedin.com")) return { nom: "LinkedIn", Icone: Linkedin };
  if (hote.endsWith("instagram.com")) return { nom: "Instagram", Icone: Instagram };
  if (hote.endsWith("facebook.com") || hote.endsWith("fb.com"))
    return { nom: "Facebook", Icone: Facebook };
  if (hote.endsWith("youtube.com") || hote.endsWith("youtu.be"))
    return { nom: "YouTube", Icone: Youtube };
  if (hote.endsWith("tiktok.com")) return { nom: "TikTok", Icone: Music2 };
  return { nom: hote, Icone: Globe };
}

export function LiensIntervenant({
  liens,
  titre = "Voir son travail",
  className,
}: {
  liens?: string[] | null;
  titre?: string | null;
  className?: string;
}) {
  const propres = (liens ?? []).filter((l) => /^https?:\/\//i.test(l)).slice(0, 6);
  if (propres.length === 0) return null;

  return (
    <div className={className}>
      {titre ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {titre}
        </p>
      ) : null}
      <ul className="flex flex-wrap gap-2">
        {propres.map((url) => {
          const { nom, Icone } = reconnaitre(url);
          return (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="nofollow ugc noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
              >
                <Icone className="size-3.5 shrink-0" aria-hidden />
                <span className="max-w-[10rem] truncate">{nom}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
