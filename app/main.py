from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


from app.config import Config
from app.utils import (
    common_tags,
    fetch_query_results,
    get_documents,
    get_search_engine,
    processing_movie_record,
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
async def search_disney_movie(
        query: str,
        k: int = Config.k,
        score_filter: bool = Config.score_filter) -> list[dict]:

    url_list = fetch_query_results(query, k, score_filter)
    if url_list:
        documents = get_documents()
        response = [
            processing_movie_record(movie_record=documents[documents["url"] == url].squeeze())
            for url in url_list
        ]
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


@app.get("/fetch_common_tags")
async def fetch_common_tags(n_occurences: int = Config.n_occurences):
    tags = common_tags(n_occurences=n_occurences)
    return {"tags": tags}


@app.get("/search_by_tag")
async def search_by_tag(tag: str, k: int = Config.k) -> list[dict]:
    documents = get_documents()
    documents = documents[documents["tags"].apply(lambda tag_list: tag.lower() in tag_list)]
    n_samples = min(k, len(documents))
    documents_sample = documents.sample(n=n_samples)
    response = documents_sample.apply(processing_movie_record, axis=1).to_list()
    return response


@app.get("/status")
async def get_status():
    return {"status": "OK"}
