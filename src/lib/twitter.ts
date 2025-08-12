import { TwitterApi, TwitterApiReadWrite } from 'twitter-api-v2';
import { getUserOAuth2 } from '../auth/service';

// returns a read/write client in user context for a given userId
export async function clientForUser(userId: string): Promise<TwitterApiReadWrite> {
  const oauth = await getUserOAuth2(userId);     // will refresh if needed
  return oauth.readWrite;                        // v2 write (posts)
}
