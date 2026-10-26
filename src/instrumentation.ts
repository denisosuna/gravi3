export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const [{ getConfig }, { logger, LOG_EVENTS }] = await Promise.all([
    import('./server/config'),
    import('./server/logger'),
  ]);
  const { tutorEnabled, llm } = getConfig();
  logger.info({
    event: LOG_EVENTS.serverStarted,
    tutorEnabled,
    llmHost: llm.provider && new URL(llm.provider.baseUrl).host,
    model: llm.provider?.model,
  });
}
