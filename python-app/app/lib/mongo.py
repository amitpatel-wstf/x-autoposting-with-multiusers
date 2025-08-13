from pymongo import MongoClient
from typing import Optional
from app.lib.env import ENV


class Mongo:
    _client: Optional[MongoClient] = None

    @classmethod
    def connect(cls) -> MongoClient:
        if cls._client is None:
            cls._client = MongoClient(ENV.DATABASE_URL)
        return cls._client

    @classmethod
    def db(cls):
        return cls.connect().get_default_database()
