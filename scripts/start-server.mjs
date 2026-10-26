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

const standalone = new URL('.next/standalone/', root);
await import('./prepare-standalone.mjs');
await import(new URL('server.js', standalone).href);
