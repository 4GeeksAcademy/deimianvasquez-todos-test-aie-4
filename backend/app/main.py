from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.db.database import db
from app.tasks.router import router as tasks_router
from app.users.router import router as users_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.16.0.97:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.state.db = db
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(tasks_router)

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}