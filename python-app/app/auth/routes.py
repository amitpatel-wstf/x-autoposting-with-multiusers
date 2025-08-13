from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, PlainTextResponse
from app.auth.service import AuthService

router = APIRouter()

@router.get("/login")
async def login(request: Request):
    data = AuthService.get_auth_url()
    # persist temporary token & secret in session
    request.session["oauth_token"] = data["oauth_token"]
    request.session["oauth_token_secret"] = data["oauth_token_secret"]
    return RedirectResponse(url=data["url"]) 

@router.get("/callback")
async def callback(request: Request, oauth_token: str, oauth_verifier: str):
    sess_token = request.session.get("oauth_token")
    oauth_token_secret = request.session.get("oauth_token_secret")
    if not sess_token or not oauth_token_secret:
        return PlainTextResponse("Missing session tokens; retry /auth/login", status_code=400)
    if oauth_token != sess_token:
        return PlainTextResponse("OAuth1 token mismatch; retry /auth/login", status_code=400)

    res = AuthService.handle_callback(oauth_token, oauth_verifier, oauth_token_secret)
    request.session["userId"] = res["userId"]
    return PlainTextResponse("Connected your X account! You can close this tab.")
