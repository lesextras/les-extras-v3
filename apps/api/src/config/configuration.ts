/**
 * Chargement + typage des variables d'environnement.
 * Aucune valeur secrète en dur : tout provient de process.env.
 */
export interface AppConfig {
  API_PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGINS?: string;
  MAIL_FROM: string;
  APP_WEB_URL: string;
  INVITATION_TTL_DAYS: number;
}

export default (): AppConfig => ({
  API_PORT: parseInt(process.env.API_PORT ?? '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  MAIL_FROM: process.env.MAIL_FROM ?? 'LES EXTRAS <no-reply@les-extras.fr>',
  APP_WEB_URL: process.env.APP_WEB_URL ?? 'http://localhost:3000',
  INVITATION_TTL_DAYS: parseInt(process.env.INVITATION_TTL_DAYS ?? '7', 10),
});
