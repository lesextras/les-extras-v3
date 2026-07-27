import { Injectable, Logger, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const API = 'https://api.linkedin.com/v2';
/** w_member_social = publier au nom du membre ; openid/profile = son identité. */
const SCOPES = 'openid profile w_member_social';

/**
 * Connexion LinkedIn d'un utilisateur et publication d'une actualité sur son
 * profil. Le jeton reste côté serveur : le navigateur ne le voit jamais.
 */
@Injectable()
export class LinkedinService {
  private readonly logger = new Logger(LinkedinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get clientId(): string {
    const v = this.config.get<string>('LINKEDIN_CLIENT_ID');
    if (!v) throw new ServiceUnavailableException("LinkedIn n'est pas configuré (LINKEDIN_CLIENT_ID).");
    return v;
  }

  private get clientSecret(): string {
    const v = this.config.get<string>('LINKEDIN_CLIENT_SECRET');
    if (!v) throw new ServiceUnavailableException("LinkedIn n'est pas configuré (LINKEDIN_CLIENT_SECRET).");
    return v;
  }

  private get redirectUri(): string {
    const base = this.config.get<string>('API_PUBLIC_URL') ?? 'https://api.les-extras.fr/api';
    return `${base.replace(/\/$/, '')}/articles/linkedin/callback`;
  }

  private get siteUrl(): string {
    return (this.config.get<string>('WEB_PUBLIC_URL') ?? 'https://app.les-extras.fr').replace(/\/$/, '');
  }

  /** Indique si l'intégration est utilisable (clés présentes). */
  configured(): boolean {
    return Boolean(
      this.config.get('LINKEDIN_CLIENT_ID') && this.config.get('LINKEDIN_CLIENT_SECRET'),
    );
  }

  /** URL de consentement. `state` = identifiant utilisateur signé côté appelant. */
  authorizeUrl(state: string): string {
    const p = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      scope: SCOPES,
    });
    return `${AUTH_URL}?${p.toString()}`;
  }

  /** Échange le code contre un jeton et mémorise l'identité du membre. */
  async exchangeCode(code: string, userId: string) {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
    });
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      this.logger.warn(`LinkedIn token ${res.status}: ${(await res.text()).slice(0, 200)}`);
      throw new BadRequestException("La connexion LinkedIn a échoué.");
    }
    const jeton = (await res.json()) as { access_token: string; expires_in?: number };

    // Identité du membre : nécessaire pour signer la publication (author URN).
    const me = await fetch(`${API}/userinfo`, {
      headers: { Authorization: `Bearer ${jeton.access_token}` },
    });
    if (!me.ok) throw new BadRequestException("Profil LinkedIn illisible.");
    const profil = (await me.json()) as { sub: string; name?: string };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        linkedinAccessToken: jeton.access_token,
        linkedinExpiresAt: jeton.expires_in
          ? new Date(Date.now() + jeton.expires_in * 1000)
          : null,
        linkedinUrn: `urn:li:person:${profil.sub}`,
        linkedinName: profil.name ?? null,
      },
    });
    return { ok: true, name: profil.name ?? null };
  }

  /** État de la connexion pour l'interface. */
  async status(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { linkedinUrn: true, linkedinName: true, linkedinExpiresAt: true },
    });
    const expire = u?.linkedinExpiresAt ? u.linkedinExpiresAt.getTime() < Date.now() : false;
    return {
      configured: this.configured(),
      connected: Boolean(u?.linkedinUrn) && !expire,
      name: u?.linkedinName ?? null,
      expiresAt: u?.linkedinExpiresAt ?? null,
    };
  }

  async disconnect(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        linkedinAccessToken: null,
        linkedinExpiresAt: null,
        linkedinUrn: null,
        linkedinName: null,
      },
    });
    return { ok: true };
  }

  /**
   * Publie un partage de lien sur le profil du membre.
   * Retourne l'URN de la publication (traçabilité).
   */
  async share(userId: string, article: { title: string; slug: string; excerpt?: string | null }, comment?: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { linkedinAccessToken: true, linkedinUrn: true, linkedinExpiresAt: true },
    });
    if (!u?.linkedinAccessToken || !u.linkedinUrn) {
      throw new BadRequestException('Connectez votre compte LinkedIn avant de partager.');
    }
    if (u.linkedinExpiresAt && u.linkedinExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Votre connexion LinkedIn a expiré : reconnectez-vous.');
    }

    const url = `${this.siteUrl}/actualites/${article.slug}`;
    const texte = (comment?.trim() || article.excerpt?.trim() || article.title).slice(0, 2900);

    const res = await fetch(`${API}/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${u.linkedinAccessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: u.linkedinUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: `${texte}\n\n${url}` },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                originalUrl: url,
                title: { text: article.title.slice(0, 200) },
                ...(article.excerpt
                  ? { description: { text: article.excerpt.slice(0, 256) } }
                  : {}),
              },
            ],
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 250);
      this.logger.warn(`LinkedIn share ${res.status}: ${detail}`);
      throw new BadRequestException('LinkedIn a refusé la publication.');
    }
    const urn = res.headers.get('x-restli-id') ?? ((await res.json()) as { id?: string }).id ?? '';
    return { urn, url };
  }
}
