/**
 * LA MÉDIATHÈQUE D'UNE FORMATION, SERVIE AU NAVIGATEUR.
 *
 * Une route à part, et non le proxy générique, pour une raison précise : une
 * vidéo ne se lit pas comme un JSON. Le lecteur demande une tranche d'octets
 * (« Range »), et attend une réponse 206 accompagnée de « Content-Range ».
 * Sans cela on peut regarder la vidéo du début à la fin, mais pas s'y
 * déplacer — la barre de progression reste inerte.
 *
 * Le corps traverse en flux : charger une vidéo entière en mémoire côté
 * serveur avant de la renvoyer serait ruineux, et incompatible avec une
 * réponse partielle.
 *
 * Aucune authentification : un apprenant ouvre son cours avec un jeton
 * personnel, pas avec un compte, et le lecteur du navigateur ne sait pas
 * présenter d'en-tête. L'API applique les mêmes garde-fous que pour les
 * illustrations publiques — famille de fichier vérifiée, type MIME revalidé,
 * identifiant non devinable, clé de stockage jamais exposée.
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function apiBase(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001/api'
  );
}

/** Les en-têtes qu'on relaie tels quels : ils décrivent le fichier, pas nous. */
const RELAIS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'content-disposition',
  'cache-control',
  'x-content-type-options',
  'etag',
  'last-modified',
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  // L'identifiant est un cuid : on refuse tout ce qui pourrait servir à
  // remonter dans les chemins avant même d'appeler l'API.
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(id)) {
    return NextResponse.json({ message: 'Média introuvable.' }, { status: 404 });
  }

  const entetes: Record<string, string> = {};
  const intervalle = req.headers.get('range');
  if (intervalle) entetes['Range'] = intervalle;

  let amont: Response;
  try {
    amont = await fetch(`${apiBase()}/public/medias/${id}`, {
      headers: entetes,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: 'Service indisponible (API injoignable).' },
      { status: 502 },
    );
  }

  const sortie: Record<string, string> = {};
  for (const nom of RELAIS) {
    const valeur = amont.headers.get(nom);
    if (valeur) sortie[nom] = valeur;
  }

  // 204 et 304 n'ont pas de corps : leur en donner un lève une erreur.
  const sansCorps = amont.status === 204 || amont.status === 304;
  return new NextResponse(sansCorps ? null : amont.body, {
    status: amont.status,
    headers: sortie,
  });
}
