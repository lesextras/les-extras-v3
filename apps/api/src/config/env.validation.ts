/**
 * Validation "fail-fast" des variables critiques au démarrage.
 * On refuse de booter si un secret obligatoire manque, plutôt
 * que d'exposer une API mal configurée.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !config[key] || String(config[key]).trim() === '');

  if (missing.length > 0) {
    throw new Error(
      `Configuration invalide — variables d'environnement manquantes : ${missing.join(', ')}`,
    );
  }

  const jwtSecret = String(config.JWT_SECRET);
  if (jwtSecret === 'change-me-in-prod' && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET par défaut interdit en production.');
  }

  return config;
}
