import { cp, readdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const standalone = new URL('.next/standalone/', root);
// Next.js traces loaded env files; keep credentials out of the portable build.
const privateFiles = (await readdir(standalone)).filter((name) => name.startsWith('.env'));
await Promise.all(privateFiles.map((name) => rm(new URL(name, standalone))));
await Promise.all([
  cp(new URL('public/', root), new URL('public/', standalone), { recursive: true }),
  cp(new URL('.next/static/', root), new URL('.next/static/', standalone), { recursive: true }),
]);
