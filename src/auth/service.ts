import { TwitterApi } from 'twitter-api-v2';

import { ENV } from '../lib/env';
import { Mongo } from '../lib/mongo';
import { User } from '../models/User';
import { Account } from '../models/Account';

// We will use OAuth 1.0a exclusively to enable media uploads.
// OAuth2 flow removed to keep a single callback.
export const scopes: string[] = [];

// Kept for compatibility but unused now
export function makeOAuth2Client() {
  throw new Error('OAuth2 flow disabled. Use OAuth1.');
}

export function makeOAuth1AppClient() {
  if (!ENV.X_API_KEY || !ENV.X_API_SECRET) {
    throw new Error('Missing X_API_KEY/X_API_SECRET for OAuth1 flow');
  }
  return new TwitterApi({
    appKey: ENV.X_API_KEY,
    appSecret: ENV.X_API_SECRET,
  } as any);
}

/** Step 1: get OAuth1 URL + temporary tokens */
export async function getAuthUrl() {
  const client = makeOAuth1AppClient();
  if (!ENV.X_OAUTH1_CALLBACK_URL) throw new Error('Missing X_OAUTH1_CALLBACK_URL env');
  console.log('Generating OAuth1 auth link with callback:', ENV.X_OAUTH1_CALLBACK_URL);
  const { url, oauth_token, oauth_token_secret } = await client.generateAuthLink(ENV.X_OAUTH1_CALLBACK_URL);
  return { url, oauth_token, oauth_token_secret };
}

/** Step 2: exchange oauth_token + oauth_verifier -> user access tokens; upsert user & account */
export async function handleCallback(params: { oauth_token: string; oauth_verifier: string; oauth_token_secret: string; }) {
  const { oauth_token, oauth_verifier, oauth_token_secret } = params;
  await Mongo.connect();
  if (!ENV.X_API_KEY || !ENV.X_API_SECRET) throw new Error('Missing X_API_KEY/X_API_SECRET for OAuth1 flow');
  // Create a temporary client bound to request token/secret, then exchange with verifier
  const tempClient = new TwitterApi({
    appKey: ENV.X_API_KEY,
    appSecret: ENV.X_API_SECRET,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  } as any);
  const { accessToken, accessSecret, screenName, userId: xUserId } = await tempClient.login(oauth_verifier as any);

  // Build client for the user to fetch profile
  const loggedClient = new TwitterApi({
    appKey: ENV.X_API_KEY,
    appSecret: ENV.X_API_SECRET,
    accessToken,
    accessSecret,
  } as any);
  const me = await loggedClient.v2.me({ 'user.fields': ['profile_image_url', 'name', 'username'] });

  // upsert User
  await User.findByIdAndUpdate(
    xUserId,
    {
      _id: xUserId,
      handle: me.data.username || screenName,
      name: me.data.name,
      imageUrl: me.data.profile_image_url || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // upsert Account with OAuth1 tokens
  await Account.updateOne(
    { userId: xUserId, provider: 'x' },
    {
      $set: {
        oauthToken: accessToken,
        oauthTokenSecret: accessSecret,
      },
      $setOnInsert: { userId: xUserId, provider: 'x' },
    },
    { upsert: true }
  );

  return { userId: xUserId };
}

/** Ensure fresh access token using refresh token (offline.access) */
// getUserOAuth2 deprecated
export async function getUserOAuth2(_: string): Promise<TwitterApi> {
  throw new Error('OAuth2 flow disabled. Use OAuth1 tokens from Account.');
}

/** OAuth 1.0a: start flow (for media upload). Returns URL and oauth_token/secret */
// OAuth1 helpers are integrated into getAuthUrl/handleCallback above
