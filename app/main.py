from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.config import Config
from app.utils import (
    get_search_engine,
    topk_documents,
    fetch_query_results,
    extract_movies_details,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic: Load the documents and create the search engine
    get_search_engine()
    yield

app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")


@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/search_disney_movie")
async def search_disney_movie(
        query: str,
        k: int = Config.k,
        score_filter: bool = Config.score_filter) -> list[dict]:
    results = fetch_query_results(query, k, score_filter)
    if results:
        response = extract_movies_details(results=results)
        return response
    return [{"result": "Not found"}]


@app.get("/get_topk_documents")
async def get_topk_documents(query: str, k: int) -> dict:
    engine = get_search_engine()
    query_results = engine.search(query)
    results = topk_documents(query_results, k=k)
    if results:
        return {"result": results}
    return {"result": "Not found"}


@app.get("/status")
async def get_status():
    return {"status": "OK"}
