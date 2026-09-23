/**
 * LE RELAIS DE L'ESPACE APPRENANT.
 *
 * Le navigateur appelle /api/apprenant/<chemin>, ce relais lit le cookie de
 * session apprenant (httpOnly : le JavaScript de la page ne le voit jamais) et
 * le transmet à l'API en en-tête `x-apprenant`, sur /public/ecole/<chemin>.
 *
 * ⚠ LA SESSION NE TRAVERSE JAMAIS LE NAVIGATEUR EN CLAIR. Quand l'API rend un
 * `sessionApprenant` (connexion, mot de passe choisi), ce relais le pose en
 * cookie et le RETIRE de la réponse. `deconnexion` efface le cookie, sans
 * appeler l'API.
 *
 * ⚠ CE N'EST PAS LE RELAIS DE PILOTER. Aucune session Piloter n'est lue ni
 * transmise ici : un apprenant n'a pas de compte sur la plateforme, et une
 * personne connectée à son académie qui ouvre une école ne doit pas y entrer
 * sous son identité d'organisme.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const COOKIE_APPRENANT = 'pilote_apprenant';
const TRENTE_JOURS = 30 * 24 * 3600;

function apiBase(): string {
  return (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');
}

async function relayer(req: NextRequest, chemin: string[]): Promise<Response> {
  const store = await cookies();

  if (chemin.length === 1 && chemin[0] === 'deconnexion') {
    const res = NextResponse.json({ deconnecte: true });
    res.cookies.set(COOKIE_APPRENANT, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax', secure: true });
    return res;
  }

  const session = store.get(COOKIE_APPRENANT)?.value;
  const cible = `${apiBase()}/public/ecole/${chemin.map(encodeURIComponent).join('/')}${req.nextUrl.search ?? ''}`;
  const entetes: Record<string, string> = { Accept: req.headers.get('accept') ?? 'application/json' };
  const type = req.headers.get('content-type');
  if (type) entetes['Content-Type'] = type;
  if (session) entetes['x-apprenant'] = session;
  for (const nom of ['x-forwarded-for', 'x-real-ip']) {
    const v = req.headers.get(nom);
    if (v) entetes[nom] = v;
  }

  const methode = req.method.toUpperCase();
  const brut = ['GET', 'HEAD'].includes(methode) ? undefined : await req.arrayBuffer();
  let reponse: Response;
  try {
    reponse = await fetch(cible, {
      method: methode,
      headers: entetes,
      body: brut && brut.byteLength ? Buffer.from(brut) : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Service indisponible pour le moment.' }, { status: 502 });
  }

  const typeReponse = reponse.headers.get('content-type') ?? '';
  if (typeReponse.includes('application/json')) {
    const texte = await reponse.text();
    let corps: unknown = null;
    try {
      corps = texte ? JSON.parse(texte) : null;
    } catch {
      corps = null;
    }
    const nouvelle = corps && typeof corps === 'object' && 'sessionApprenant' in corps ? (corps as { sessionApprenant?: string }).sessionApprenant : null;
    if (nouvelle && corps && typeof corps === 'object') delete (corps as Record<string, unknown>).sessionApprenant;
    const res = NextResponse.json(corps ?? {}, { status: reponse.status });
    if (nouvelle) {
      res.cookies.set(COOKIE_APPRENANT, nouvelle, { path: '/', maxAge: TRENTE_JOURS, httpOnly: true, sameSite: 'lax', secure: true });
    }
    // Une session refusée s'efface : sinon chaque page redemanderait en vain.
    if (reponse.status === 401 && session) {
      res.cookies.set(COOKIE_APPRENANT, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax', secure: true });
    }
    return res;
  }

  const sortie: Record<string, string> = { 'content-type': typeReponse || 'application/octet-stream' };
  for (const nom of ['content-disposition', 'cache-control', 'x-content-type-options']) {
    const v = reponse.headers.get(nom);
    if (v) sortie[nom] = v;
  }
  return new NextResponse(await reponse.arrayBuffer(), { status: reponse.status, headers: sortie });
}

type Ctx = { params: Promise<{ path: string[] }> };
export const GET = async (req: NextRequest, { params }: Ctx) => relayer(req, (await params).path);
export const POST = async (req: NextRequest, { params }: Ctx) => relayer(req, (await params).path);
export const PATCH = async (req: NextRequest, { params }: Ctx) => relayer(req, (await params).path);
export const DELETE = async (req: NextRequest, { params }: Ctx) => relayer(req, (await params).path);
