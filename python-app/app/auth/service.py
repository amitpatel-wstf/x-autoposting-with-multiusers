from typing import Dict
import tweepy
from app.lib.env import ENV
from app.models import upsert_user, upsert_account_oauth1


class AuthService:
    """Class-based OAuth1 service following SOLID principles."""

    @staticmethod
    def _make_oauth1_handler(callback_url: str) -> tweepy.OAuth1UserHandler:
        return tweepy.OAuth1UserHandler(
            consumer_key=ENV.X_API_KEY,
            consumer_secret=ENV.X_API_SECRET,
            callback=callback_url,
        )

    @staticmethod
    def get_auth_url() -> Dict[str, str]:
        handler = AuthService._make_oauth1_handler(ENV.X_OAUTH1_CALLBACK_URL)
        url = handler.get_authorization_url(signin_with_twitter=True)
        # handler.request_token is set after calling get_authorization_url
        oauth_token = handler.request_token.get("oauth_token")
        oauth_token_secret = handler.request_token.get("oauth_token_secret")
        if not oauth_token or not oauth_token_secret:
            raise RuntimeError("Failed to obtain OAuth request token")
        return {"url": url, "oauth_token": oauth_token, "oauth_token_secret": oauth_token_secret}

    @staticmethod
    def handle_callback(oauth_token: str, oauth_verifier: str, oauth_token_secret: str) -> Dict[str, str]:
        handler = AuthService._make_oauth1_handler(ENV.X_OAUTH1_CALLBACK_URL)
        # Set the same request token & secret obtained during authorization step
        handler.request_token = {"oauth_token": oauth_token, "oauth_token_secret": oauth_token_secret}
        access_token, access_token_secret = handler.get_access_token(oauth_verifier)

        # Build API client with user credentials to fetch profile
        auth = tweepy.OAuth1UserHandler(
            consumer_key=ENV.X_API_KEY,
            consumer_secret=ENV.X_API_SECRET,
            access_token=access_token,
            access_token_secret=access_token_secret,
        )
        api = tweepy.API(auth)
        me = api.verify_credentials(include_email=False)
        x_user_id = str(me.id)

        upsert_user(
            x_user_id=x_user_id,
            handle=me.screen_name,
            name=me.name,
            image_url=getattr(me, "profile_image_url_https", None),
        )
        upsert_account_oauth1(
            x_user_id=x_user_id,
            oauth_token=access_token,
            oauth_token_secret=access_token_secret,
        )

        return {"userId": x_user_id}
