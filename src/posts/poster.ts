import { clientForUser } from '../lib/twitter';
import { Mongo } from '../lib/mongo';
import { Account } from '../models/Account';

export async function postText(userId: string, text: string) {
  const client = await clientForUser(userId);
  const res = await client.v2.tweet(text); // POST /2/tweets
  return res.data;
}

export async function postWithMedia(userId: string, text: string, mediaPath: string, contentType: string) {
  // Ensure user has OAuth1 tokens; otherwise v1.1 media upload will 403
  await Mongo.connect();
  const acc = await Account.findOne({ userId, provider: 'x' }).lean<{ oauthToken?: string; oauthTokenSecret?: string }>();
  if (!acc?.oauthToken || !acc?.oauthTokenSecret) {
    throw new Error('Media upload requires OAuth 1.0a tokens. Please visit /auth/login to connect your X account.');
  }
  const client = await clientForUser(userId);
  // Use twitter-api-v2 helper for media upload (handles OAuth and chunking via v1.1 upload API)
  const mediaId = await client.v1.uploadMedia(mediaPath, { mimeType: contentType });
  const res = await client.v2.tweet({ text, media: { media_ids: [mediaId] } });
  return res.data;
}
