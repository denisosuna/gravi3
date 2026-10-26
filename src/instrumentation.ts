export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { startServer } = await import('./server/startup');
  startServer();
}
