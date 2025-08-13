from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.lib.mongo import Mongo
from app.models import schedules_col

router = APIRouter()

class ScheduleBody(BaseModel):
    name: str
    cron: str
    text: Optional[str] = None
    mediaPath: Optional[str] = None
    mediaType: Optional[str] = None

@router.post("/schedules")
async def create_schedule(request: Request, body: ScheduleBody):
    user_id = request.session.get("userId")
    if not user_id:
        raise HTTPException(status_code=401, detail="login first")
    await Mongo.connect()  # safe if already connected
    doc = {
        "userId": user_id,
        "name": body.name,
        "cron": body.cron,
        "text": body.text,
        "mediaPath": body.mediaPath,
        "mediaType": body.mediaType,
    }
    schedules_col().insert_one(doc)
    # return with generated _id as string for convenience
    doc["_id"] = str(doc.get("_id"))
    return doc

@router.get("/schedules")
async def list_schedules(request: Request):
    user_id = request.session.get("userId")
    if not user_id:
        raise HTTPException(status_code=401, detail="login first")
    await Mongo.connect()
    rows = list(schedules_col().find({"userId": user_id}))
    for r in rows:
        r["_id"] = str(r["_id"])  # make JSON serializable
    return rows
