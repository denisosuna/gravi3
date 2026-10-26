import 'server-only';
import { getConfig, type ServerConfig } from './config';
import { LOG_EVENTS } from './log-events';
import { createLogger, getLogger } from './logger';

function loadConfigOrExit(): ServerConfig {
  try {
    return getConfig();
  } catch (error) {
    // Fail fast: a misconfigured deployment must not start serving requests.
    createLogger('fatal').fatal({ event: LOG_EVENTS.configInvalid, message: String(error) });
    process.exit(1);
  }
}

export function startServer() {
  const { tutorEnabled, llm } = loadConfigOrExit();
  getLogger().info({
    event: LOG_EVENTS.serverStarted,
    tutorEnabled,
    llmHost: llm.provider && new URL(llm.provider.baseUrl).host,
    model: llm.provider?.model,
  });
}
