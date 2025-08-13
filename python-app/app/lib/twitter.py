from typing import Tuple
import tweepy
from app.lib.env import ENV
from app.models import find_account


def clients_for_user(user_id: str) -> Tuple[tweepy.API, tweepy.Client]:
    """
    Returns a tuple of (v1.1 API client for media upload, v2 Client for tweeting).
    We require OAuth1 user tokens for both.
    """
    acc = find_account(user_id)
    if not acc or not acc.get("oauthToken") or not acc.get("oauthTokenSecret"):
        raise RuntimeError(
            "Account not connected with OAuth1. Please visit /auth/login to connect your X account."
        )

    # v1.1 API (media upload)
    auth = tweepy.OAuth1UserHandler(
        consumer_key=ENV.X_API_KEY,
        consumer_secret=ENV.X_API_SECRET,
        access_token=acc["oauthToken"],
        access_token_secret=acc["oauthTokenSecret"],
    )
    api_v1 = tweepy.API(auth)

    # v2 Client (create tweet)
    client_v2 = tweepy.Client(
        consumer_key=ENV.X_API_KEY,
        consumer_secret=ENV.X_API_SECRET,
        access_token=acc["oauthToken"],
        access_token_secret=acc["oauthTokenSecret"],
    )

    return api_v1, client_v2
