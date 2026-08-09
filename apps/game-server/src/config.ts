function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: parseInt(getEnv('GAME_SERVER_PORT', '3001'), 10),
  corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  database: {
    url: getEnv('DATABASE_URL', ''),
  },
} as const;
