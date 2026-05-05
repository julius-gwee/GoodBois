from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, example

app = FastAPI(title="Hackathon API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    # Restrict to your Next.js origin in production
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(example.router, prefix="/example", tags=["example"])


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
