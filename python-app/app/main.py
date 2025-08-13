from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import JSONResponse

from app.lib.env import ENV
from app.auth.routes import router as auth_router
from app.posts.poster import router as posts_router
from app.me.schedules import router as me_schedules_router
from app.lib.mongo import Mongo

app = FastAPI(title="X Autoposting Python")
app.add_middleware(SessionMiddleware, secret_key=ENV.SESSION_SECRET, same_site="lax")

# Routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(posts_router, prefix="/me", tags=["me"]) 
app.include_router(me_schedules_router, prefix="/me", tags=["me"]) 

@app.on_event("startup")
def on_startup():
    Mongo.connect()

@app.get("/")
def root():
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=ENV.PORT)
