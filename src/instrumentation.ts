export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const [{ getConfig }, { logger }] = await Promise.all([
      import('./server/config'),
      import('./server/logger'),
    ]);
    const config = getConfig();
    logger.info({
      event: 'server.started',
      tutorEnabled: config.enabled && Boolean(config.apiKey),
      model: config.model,
    });
  }
}
