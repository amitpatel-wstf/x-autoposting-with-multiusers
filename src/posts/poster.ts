import { clientForUser } from '../lib/twitter';
import { uploadMediaV2 } from '../media/upload-v2';

export async function postText(userId: string, text: string) {
  const client = await clientForUser(userId);
  const res = await client.v2.tweet(text); // POST /2/tweets
  return res.data;
}

export async function postWithMedia(userId: string, text: string, mediaPath: string, contentType: string) {
  const client = await clientForUser(userId);
  // Obtain raw OAuth2 bearer token from client
  const bearer = (client as any).bearerToken || (client as any)._currentUser?.accessToken;
  // Upload media to v2 endpoint to get media_id
  const mediaId = await uploadMediaV2({
    accessToken: bearer,
    filePath: mediaPath,
    contentType, // e.g., "image/jpeg" or "video/mp4"
  });
  const res = await client.v2.tweet({ text, media: { media_ids: [mediaId] } });
  return res.data;
}
