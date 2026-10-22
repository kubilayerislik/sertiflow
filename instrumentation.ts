export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const { startServerInstrumentation } = await import('./src/server/instrumentation-node');
  await startServerInstrumentation();
}
