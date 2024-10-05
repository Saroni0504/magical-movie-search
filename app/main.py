from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.constants import IMAGES_PATH
from app.utils import (
    get_documents,
    get_search_engine,
    topk_documents,
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
async def search_disney_movie(query: str, k: int = 100) -> list[dict]:
    engine = get_search_engine()
    query_results = engine.search(query)
    result = topk_documents(query_results, k=k)
    if result:
        documents = get_documents()
        response = []
        for i in range(len(result)):
            movie_record = documents.loc[documents["url"] == result[i][0]]
            release_date = movie_record["release_date"].squeeze()
            release_year = release_date.split(",")[1].strip() if "," in release_date else ""
            image_name = (movie_record["movie_id"] + "." + movie_record["image_format"]).squeeze()
            image_path = f"{IMAGES_PATH}/{image_name}"
            response.append({
                "title": movie_record["title"].squeeze(),
                "release_year": release_year,
                "genre": movie_record["genre"].squeeze(),
                "tags": movie_record["tags"].squeeze(),
                "summary": movie_record["movie_summary"].squeeze(),
                "image_path": image_path,
            })
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
