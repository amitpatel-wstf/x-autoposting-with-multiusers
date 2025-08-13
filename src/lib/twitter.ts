import { TwitterApi } from 'twitter-api-v2';
import { Mongo } from '../lib/mongo';
import { Account } from '../models/Account';
import { ENV } from '../lib/env';

// returns a client in user context for a given userId
export async function clientForUser(userId: string): Promise<TwitterApi> {
  await Mongo.connect();
  const acc = await Account.findOne({ userId, provider: 'x' }).lean<{
    oauthToken?: string;
    oauthTokenSecret?: string;
  }>();

  // If OAuth1 tokens exist, use OAuth1 client (needed for media upload)
  if (acc?.oauthToken && acc?.oauthTokenSecret) {
    const client = new TwitterApi({
      appKey: ENV.X_API_KEY,
      appSecret: ENV.X_API_SECRET,
      accessToken: acc.oauthToken,
      accessSecret: acc.oauthTokenSecret,
    } as any);
    return client;
  }
  throw new Error('Account not connected with OAuth1. Please visit /auth/login to connect your X account.');
}
