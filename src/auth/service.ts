import { TwitterApi } from 'twitter-api-v2';
import OAuth2User from 'twitter-api-v2';

import { ENV } from '../lib/env';
import { prisma } from '../lib/prisma';

export const scopes = [
  'users.read',
  'tweet.read',
  'tweet.write',
  'media.write',
  'offline.access',
];

export function makeOAuth2Client() {
  return new TwitterApi({
    clientId: ENV.X_CLIENT_ID,
    clientSecret: ENV.X_CLIENT_SECRET,
  });
}

/** Step 1: get URL + codeVerifier/state */
export async function getAuthUrl() {
  const client = makeOAuth2Client();
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    ENV.X_CALLBACK_URL,
    { scope: scopes }
  );
  return { url, codeVerifier, state };
}

/** Step 2: exchange code + verifier -> tokens; upsert user & account */
export async function handleCallback(params: { state: string; code: string; storedState: string; codeVerifier: string; }) {
  const { state, code, storedState, codeVerifier } = params;
  if (state !== storedState) throw new Error('State mismatch');

  const client = makeOAuth2Client();
  const { client: loggedClient, accessToken, refreshToken, expiresIn, scope } =
    await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: ENV.X_CALLBACK_URL,
    });

  // Get user data of the connected account
  const me = await loggedClient.v2.me({ 'user.fields': ['profile_image_url', 'name', 'username'] });
  const xUserId = me.data.id;

  const user = await prisma.user.upsert({
    where: { xUserId },
    create: {
      xUserId,
      handle: me.data.username,
      name: me.data.name,
      imageUrl: me.data.profile_image_url || null,
      accounts: {
        create: {
          provider: 'x',
          accessToken,
          refreshToken: refreshToken!, // present because offline.access
          expiresAt: new Date(Date.now() + (expiresIn! * 1000)),
          scope: scope?.join(' ') || '',
          tokenType:'bearer',
        },
      },
    },
    update: {
      handle: me.data.username,
      name: me.data.name,
      imageUrl: me.data.profile_image_url || null,
      accounts: {
        updateMany: {
          where: { provider: 'x' },
          data: {
            accessToken,
            refreshToken: refreshToken!,
            expiresAt: new Date(Date.now() + (expiresIn! * 1000)),
            scope: scope?.join(' ') || '',
            tokenType:'bearer',
          },
        },
      },
    },
  });

  return { userId: user.id };
}

/** Ensure fresh access token using refresh token (offline.access) */
export async function getUserOAuth2(userId: string): Promise<OAuth2User> {
  const acc = await prisma.account.findFirstOrThrow({ where: { userId, provider: 'x' } });
  // token not expired?
  if (acc.expiresAt.getTime() - Date.now() > 60_000) {
    return new TwitterApi(acc.accessToken);
  }
  // refresh
  const base = makeOAuth2Client();
  const { client, accessToken, refreshToken, expiresIn, scope } =
    await base.refreshOAuth2Token(acc.refreshToken);
  await prisma.account.update({
    where: { id: acc.id },
    data: {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + (expiresIn! * 1000)),
      scope: scope?.join(' ') || acc.scope,
      tokenType: acc.tokenType,
    },
  });
  return client;
}
