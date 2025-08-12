import { Router } from 'express';
import { getAuthUrl, handleCallback } from './service';

const router = Router();

router.get('/login', async (req, res) => {
  const { url, codeVerifier, state } = await getAuthUrl();
  // persist verifier/state in session
  (req.session as any).codeVerifier = codeVerifier;
  (req.session as any).state = state;
  res.redirect(url);
});

router.get('/callback', async (req, res, next) => {
  try {
    const state = req.query.state as string;
    const code = req.query.code as string;
    const storedState = (req.session as any).state;
    const codeVerifier = (req.session as any).codeVerifier;
    const { userId } = await handleCallback({ state, code, storedState, codeVerifier });
    (req.session as any).userId = userId;
    res.send('Connected your X account! You can close this tab.');
  } catch (e) {
    next(e);
  }
});

export default router;
