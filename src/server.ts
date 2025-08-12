import express from 'express';
import session from 'cookie-session';
import { ENV } from './lib/env';
import authRoutes from './auth/routes';
import { prisma } from './lib/prisma';
import { startScheduler } from './jobs/scheduler';

const app = express();
app.use(express.json());
app.use(session({ name: 'sess', secret: ENV.SESSION_SECRET, sameSite: 'lax' }));

app.get('/', (_, res) => res.send('X multi-user bot up. Go to /auth/login to connect your account.'));

app.use('/auth', authRoutes);

// quick endpoints to create/update schedules for the logged-in user
app.post('/me/schedules', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).send('login first');
  const { name, cron, text, mediaPath, mediaType } = req.body;
  const created = await prisma.schedule.create({ data: { userId, name, cron, text, mediaPath, mediaType } });
  res.json(created);
});

app.get('/me/schedules', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).send('login first');
  const rows = await prisma.schedule.findMany({ where: { userId } });
  res.json(rows);
});

app.listen(ENV.PORT, async () => {
  console.log(`http://localhost:${ENV.PORT}`);
  await startScheduler();
});
