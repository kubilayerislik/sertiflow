import { ensureAdminUser } from './bootstrap/ensure-admin';
import { runAnonymizeJob } from './jobs/anonymize';
import { initMail, processMailQueue } from './mail';
import { reclaimTemplateStorage } from './template-storage';

export async function startServerInstrumentation() {
  await ensureAdminUser();
  await initMail();
  try {
    await reclaimTemplateStorage();
  } catch (e) {
    console.warn('[storage] temizlik başarısız:', e instanceof Error ? e.message : e);
  }

  const cron = await import('node-cron');
  let mailRunning = false;
  cron.schedule('* * * * *', async () => {
    if (mailRunning) return;
    mailRunning = true;
    try {
      await processMailQueue();
    } finally {
      mailRunning = false;
    }
  });

  cron.schedule(
    '0 3 * * *',
    async () => {
      await runAnonymizeJob();
      try {
        await reclaimTemplateStorage();
      } catch (e) {
        console.warn('[storage] temizlik başarısız:', e instanceof Error ? e.message : e);
      }
    },
    { timezone: 'Europe/Istanbul' },
  );
}
