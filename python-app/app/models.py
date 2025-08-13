from typing import Optional, Dict, Any
from app.lib.mongo import Mongo


def users_col():
    return Mongo.db()["users"]


def accounts_col():
    return Mongo.db()["accounts"]


def schedules_col():
    return Mongo.db()["schedules"]


def upsert_user(x_user_id: str, handle: str, name: str, image_url: Optional[str]):
    users_col().update_one(
        {"_id": x_user_id},
        {"$set": {"handle": handle, "name": name, "imageUrl": image_url}},
        upsert=True,
    )


def upsert_account_oauth1(x_user_id: str, oauth_token: str, oauth_token_secret: str):
    accounts_col().update_one(
        {"userId": x_user_id, "provider": "x"},
        {
            "$set": {
                "oauthToken": oauth_token,
                "oauthTokenSecret": oauth_token_secret,
            },
            "$setOnInsert": {"userId": x_user_id, "provider": "x"},
        },
        upsert=True,
    )


def find_account(user_id: str) -> Optional[Dict[str, Any]]:
    return accounts_col().find_one({"userId": user_id, "provider": "x"})
