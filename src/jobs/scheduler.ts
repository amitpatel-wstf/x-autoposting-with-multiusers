import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { postText, postWithMedia } from '../posts/poster';

// naive in-memory counters; for production, persist & rate-limit per user/app
const postedThisMonth = { app: 0 }; // track to respect Free tier caps (500/month)
function monthKey() { const d = new Date(); return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}`; }
let currentMonth = monthKey();

async function runTick(now = new Date()) {
  // reset counters monthly
  if (monthKey() !== currentMonth) { currentMonth = monthKey(); postedThisMonth.app = 0; }

  const schedules = await prisma.schedule.findMany({ where: { enabled: true } });
  for (const s of schedules) {
    // cron match: node-cron will trigger per schedule; we also provide a catch-up tick
    // but here we schedule each cron below; this function is for on-boot sweep if desired
  }
}

// Register a cron for each schedule on boot (dynamic schedules)
export async function startScheduler() {
  const schedules = await prisma.schedule.findMany({ where: { enabled: true } });

  schedules.forEach((s:any) => {
    cron.schedule(s.cron, async () => {
      try {
        // crude app-level cap for Free tier (adjust for Basic etc.)
        if (postedThisMonth.app >= 480) { // leave headroom
          console.warn('App monthly post cap near limit, skipping…');
          return;
        }

        if (s.mediaPath && s.mediaType) {
          await postWithMedia(s.userId, s.text || '', s.mediaPath, s.mediaType);
        } else {
          await postText(s.userId, s.text || '');
        }

        postedThisMonth.app += 1;
        await prisma.schedule.update({ where: { id: s.id }, data: { lastRunAt: new Date() } });
        console.log(`[ok] posted for user=${s.userId} schedule=${s.name}`);
      } catch (e) {
        console.error(`[fail] schedule=${s.id}`, e);
      }
    }, { timezone: 'Asia/Kolkata' });
  });

  console.log(`Scheduler started for ${schedules.length} schedules`);
}
