import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
for (const filename of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(fileURLToPath(new URL(filename, root)));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
process.env.HOSTNAME ??= '0.0.0.0';

const server = new URL('.next/standalone/server.js', root);
if (!existsSync(server)) {
  console.error('No production build found. Run `pnpm build` before `pnpm start`.');
  process.exit(1);
}
await import(server.href);
