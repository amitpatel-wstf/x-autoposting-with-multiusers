import fs from 'fs';
import path from 'path';
import axios from 'axios';

type UploadArgs = {
  accessToken: string;     // OAuth2 user token
  filePath: string;        // local path
  contentType: string;     // "image/jpeg", "video/mp4", etc.
  mediaCategory?: 'tweet_image' | 'tweet_video';
  chunkSizeBytes?: number; // default 4MB
};

/**
 * Upload media via X API v2:
 * 1) INIT  -> receive media_id
 * 2) APPEND (one or many chunks)
 * 3) FINALIZE
 * returns media_id string
 */
export async function uploadMediaV2(args: UploadArgs): Promise<string> {
  const {
    accessToken,
    filePath,
    contentType,
    mediaCategory = contentType.startsWith('video') ? 'tweet_video' : 'tweet_image',
    chunkSizeBytes = 4 * 1024 * 1024,
  } = args;

  const stat = fs.statSync(filePath);
  const total = stat.size;

  const api = axios.create({
    baseURL: 'https://api.x.com/2/media',
    headers: { Authorization: `Bearer ${accessToken}` },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  // 1) INIT
  const initRes = await api.post('/upload', {
    command: 'INIT',
    total_bytes: total,
    media_type: contentType,
    media_category: mediaCategory,
  });
  const mediaId = initRes.data.media_id_string || initRes.data.media_id;

  // 2) APPEND chunks
  const fd = fs.openSync(filePath, 'r');
  try {
    let segmentIndex = 0;
    let offset = 0;
    const buffer = Buffer.alloc(chunkSizeBytes);

    while (offset < total) {
      const toRead = Math.min(chunkSizeBytes, total - offset);
      const bytesRead = fs.readSync(fd, buffer, 0, toRead, offset);

      const chunk = buffer.subarray(0, bytesRead);
      // The v2 upload expects raw bytes in multipart as media param
      const form = new (require('form-data'))();
      form.append('command', 'APPEND');
      form.append('media_id', mediaId);
      form.append('segment_index', String(segmentIndex));
      form.append('media', chunk, {
        filename: path.basename(filePath),
        contentType,
        knownLength: bytesRead,
      });

      await api.post('/upload', form, { headers: form.getHeaders() });

      offset += bytesRead;
      segmentIndex += 1;
    }
  } finally {
    fs.closeSync(fd);
  }

  // 3) FINALIZE
  const fin = await api.post('/upload', { command: 'FINALIZE', media_id: mediaId });

  // Optional: poll processing for videos until state = 'succeeded'
  if (mediaCategory === 'tweet_video' && fin.data.processing_info) {
    let { state, check_after_secs } = fin.data.processing_info;
    while (state === 'pending' || state === 'in_progress') {
      await new Promise(r => setTimeout(r, (check_after_secs || 2) * 1000));
      const status = await api.get(`/upload?command=STATUS&media_id=${mediaId}`);
      state = status.data.processing_info.state;
      check_after_secs = status.data.processing_info.check_after_secs;
      if (state === 'failed') throw new Error('Video processing failed');
    }
  }

  return mediaId;
}
