import os
import uvicorn

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.config import Config
from app.utils import (
    common_tags,
    get_search_engine,
    response_search_movie,
    topk_documents,
)


# Lazy initialization for the application lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Only initialize when necessary
    yield

app = FastAPI(lifespan=lifespan)

# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files and templates
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")


@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/get_topk_documents")
async def get_topk_documents(query: str, k: int) -> dict:
    engine = get_search_engine()
    query_results = engine.search(query)
    results = topk_documents(query_results, k=k)
    return {"result": results if results else "Not found"}


@app.get("/fetch_common_tags")
async def fetch_common_tags(tags_n_occurences: int = Config.tags_n_occurences):
    return {"tags": common_tags(tags_n_occurences=tags_n_occurences)}


@app.get("/search_disney_movie")
async def search_movie(query: str, is_tag: bool, k: int = Config.k) -> list[dict]:
    response = response_search_movie(query=query, is_tag=is_tag, k=k)
    if not response:
        return [{"result": "Not found"}]
    return response


@app.get("/status")
async def get_status():
    return {"status": "OK"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# For deployment
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
