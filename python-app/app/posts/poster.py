from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os

from app.lib.twitter import clients_for_user
from app.lib.downloader import download_to_temp

router = APIRouter()


class PostBody(BaseModel):
    userId: str
    text: Optional[str] = None
    mediaPath: Optional[str] = None
    mediaUrl: Optional[str] = None
    mediaType: Optional[str] = None


@router.post("/postnow")
async def post_now(body: PostBody):
    try:
        api_v1, client_v2 = clients_for_user(body.userId)

        # Validate input similar to TS implementation
        if not body.text and not body.mediaPath and not body.mediaUrl:
            raise HTTPException(status_code=400, detail="Provide text or mediaPath or mediaUrl")

        # Text only
        if body.text and not body.mediaPath and not body.mediaUrl:
            created = client_v2.create_tweet(text=body.text)
            return {"ok": True, "tweet": created.data}

        # Media flow: require text and media
        if not body.text:
            raise HTTPException(status_code=400, detail="text is required when posting media-less tweets")

        # Prefer direct path, otherwise download from URL
        local_path = body.mediaPath
        content_type = body.mediaType
        temp_file = None
        if not local_path and body.mediaUrl:
            temp_file, content_type = download_to_temp(body.mediaUrl)
            local_path = temp_file

        if not local_path:
            raise HTTPException(status_code=400, detail="mediaPath/mediaUrl could not be resolved")
        if not content_type:
            raise HTTPException(status_code=400, detail="mediaType is required when posting media")

        try:
            # Upload media via v1.1
            media = api_v1.media_upload(filename=local_path)
            media_id = media.media_id
            # Create tweet via v2 with media_ids (per Tweepy Client API)
            created = client_v2.create_tweet(text=body.text, media_ids=[media_id])
        finally:
            if temp_file:
                try:
                    os.remove(temp_file)
                except Exception:
                    pass

        return {"ok": True, "tweet": created.data}
    except HTTPException:
        raise
    except Exception as e:
        # Surface common permission errors from X API
        msg = str(e)
        if "403" in msg or "Forbidden" in msg:
            msg += " | Your X App access level may not permit this endpoint. Ensure Elevated/appropriate access."
        raise HTTPException(status_code=500, detail=msg)
