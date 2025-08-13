import express from 'express';
import session from 'cookie-session';
import { ENV } from './lib/env';
import authRoutes from './auth/routes';
import { startScheduler } from './jobs/scheduler';
import { Mongo } from './lib/mongo';
import { Schedule } from './models/Schedule';
import { postText, postWithMedia } from './posts/poster';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

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
  await Mongo.connect();
  const created = await Schedule.create({ userId, name, cron, text, mediaPath, mediaType });
  res.json(created);
});

app.get('/me/schedules', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).send('login first');
  await Mongo.connect();
  const rows = await Schedule.find({ userId }).lean();
  res.json(rows);
});

app.post('/me/postnow', async (req, res) => {
  try {

    const { text, mediaPath, mediaType, mediaUrl, userId } = req.body as {
      text?: string;
      mediaPath?: string;
      mediaType?: string;
      mediaUrl?: string; // remote image/video URL
      userId?: string;
    };
    if (!userId) return res.status(401).send('login first');


    if (!text && !mediaPath && !mediaUrl) {
      return res.status(400).json({ error: 'Provide text or mediaPath or mediaUrl' });
    }

    let result;
    if (text && (mediaPath || mediaUrl)) {
      // Prefer direct path if provided, otherwise download from URL
      let localPath = mediaPath;
      let contentType = mediaType;
      let tempFile: string | undefined;

      if (!localPath && mediaUrl) {
        // Download to temp file and infer content-type from response headers
        const resp = await fetch(mediaUrl);
        if (!resp.ok) throw new Error(`Failed to download media: ${resp.status} ${resp.statusText}`);
        const buf = Buffer.from(await resp.arrayBuffer());
        // Infer content-type
        const headerType = resp.headers.get('content-type') || undefined;
        if (!contentType && headerType) contentType = headerType;
        // Fallback: guess by URL extension if no header
        if (!contentType) {
          const ext = path.extname(new URL(mediaUrl).pathname).toLowerCase();
          if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.png') contentType = 'image/png';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.mp4') contentType = 'video/mp4';
          else if (ext === '.mov') contentType = 'video/quicktime';
        }
        if (!contentType) throw new Error('Unable to determine mediaType for mediaUrl; please provide mediaType');

        tempFile = path.join(os.tmpdir(), `tw-media-${Date.now()}${path.extname(new URL(mediaUrl).pathname) || ''}`);
        await fs.writeFile(tempFile, buf);
        localPath = tempFile;
      }

      if (!localPath) return res.status(400).json({ error: 'mediaPath/mediaUrl could not be resolved' });
      if (!contentType) return res.status(400).json({ error: 'mediaType is required when posting media' });

      try {
        result = await postWithMedia(userId, text, localPath, contentType);
      } finally {
        // cleanup temp file if we created one
        if (tempFile) {
          try { await fs.unlink(tempFile); } catch {}
        }
      }
    } else if (text) {
      result = await postText(userId, text);
    } else {
      return res.status(400).json({ error: 'text is required when posting media-less tweets' });
    }

    return res.json({ ok: true, tweet: result });
  } catch (err: any) {
    console.error('postnow error', err);
    return res.status(500).json({ error: err?.message || 'failed to post' });
  }
});

app.listen(ENV.PORT, async () => {
  console.log(`http://localhost:${ENV.PORT}`);
  await Mongo.connect();
  await startScheduler();
});
