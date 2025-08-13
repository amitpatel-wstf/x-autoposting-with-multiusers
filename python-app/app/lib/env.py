import os
from dotenv import load_dotenv

load_dotenv()

class ENV:
    # PORT = int(os.getenv("PORT", "3001"))
    SESSION_SECRET = os.environ["SESSION_SECRET"]
    DATABASE_URL = os.environ["DATABASE_URL"]

    # OAuth1 (unified)
    X_API_KEY = os.environ["X_API_KEY"]
    X_API_SECRET = os.environ["X_API_SECRET"]
    X_OAUTH1_CALLBACK_URL = os.environ["X_OAUTH1_CALLBACK_URL"]
