import { Router } from 'express';
import { getAuthUrl, handleCallback } from './service';

const router = Router();

router.get('/login', async (req, res, next) => {
  try {
    const { url, oauth_token, oauth_token_secret } = await getAuthUrl();
    // persist temporary token & secret in session for callback step
    (req.session as any).oauth_token = oauth_token;
    (req.session as any).oauth_token_secret = oauth_token_secret;
    res.redirect(url);
  } catch (e) {
    next(e);
  }
});

router.get('/callback', async (req, res, next) => {
  try {
    const oauth_token = req.query.oauth_token as string;
    const oauth_verifier = req.query.oauth_verifier as string;
    const sess_token = (req.session as any).oauth_token as string;
    const oauth_token_secret = (req.session as any).oauth_token_secret as string;
    if (!oauth_token || !oauth_verifier || !oauth_token_secret || !sess_token) {
      return res.status(400).send('Missing OAuth1 parameters');
    }
    if (oauth_token !== sess_token) {
      // Token mismatch means stale session or multiple auth attempts
      return res.status(400).send('OAuth1 token mismatch. Please retry login at /auth/login');
    }
    const { userId } = await handleCallback({ oauth_token, oauth_verifier, oauth_token_secret });
    (req.session as any).userId = userId;
    res.send('Connected your X account! You can close this tab.');
  } catch (e) {
    // surface helpful error
    console.error('OAuth1 callback error:', e);
    next(e);
  }
});

export default router;
