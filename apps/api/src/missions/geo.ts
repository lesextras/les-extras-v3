/**
 * Geocodage d'un code postal francais via geo.api.gouv.fr (service public,
 * sans cle). Meilleur effort : toute erreur renvoie null, jamais d'exception.
 */
export async function geocoderCodePostal(
  codePostal?: string | null,
): Promise<{ latitude: number; longitude: number } | null> {
  const cp = (codePostal ?? '').trim();
  if (!/^\d{5}$/.test(cp)) return null;
  try {
    const ctl = new AbortController();
    const minuteur = setTimeout(() => ctl.abort(), 3_000);
    const rep = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=centre&format=json`,
      { signal: ctl.signal },
    );
    clearTimeout(minuteur);
    if (!rep.ok) return null;
    const communes = (await rep.json()) as { centre?: { coordinates?: [number, number] } }[];
    const centre = communes?.[0]?.centre?.coordinates;
    if (!centre) return null;
    return { longitude: centre[0], latitude: centre[1] };
  } catch {
    return null;
  }
}

/** Distance a vol d'oiseau (haversine), en kilometres. */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
