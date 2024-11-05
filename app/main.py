import pandas as pd

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
        k: int = Config.k) -> list[dict]:
    documents = get_documents()
    if query is None:
        documents = documents.sort_values(by="release_date", ascending=False)
        response = documents.apply(processing_movie_record, axis=1).to_list()
        return response
    url_list = fetch_query_results(query=query, k=k, score_filter=Config.score_filter)
    if url_list:

        documents = documents[documents["url"].isin(url_list)]
        url_list = [url for url in url_list if url in documents["url"].to_list()]

    if not documents.empty:
        response = documents.apply(processing_movie_record, axis=1).to_list()
        return response
    return [{"result": "Not found"}]


@app.get("/get_topk_documents")
async def get_topk_documents(query: str, k: int) -> dict:
    engine = get_search_engine()
    query_results = engine.search(query)
    results = topk_documents(query_results, k=k)
    return {"result": results if results else "Not found"}


@app.get("/fetch_common_tags")
async def fetch_common_tags(n_occurences: int = Config.n_occurences):
    tags = common_tags(n_occurences=n_occurences)
    return {"tags": tags}


@app.get("/search_by_tag")
async def search_by_tag(
        tag: str,
        k: int = Config.k) -> list[dict]:
    documents = get_documents()
    documents = documents[
        documents["tags"].apply(lambda tag_list: tag.lower() in tag_list)
    ]
    if not documents.empty:
        n_samples = min(k, len(documents))
        documents_sample = documents.sample(n=n_samples)
        documents_sample = documents_sample.sort_values(by="release_date", ascending=False)
        response = documents_sample.apply(processing_movie_record, axis=1).to_list()
        return response
    return [{"result": "Not found"}]


@app.get("/search_relevancy")
def search_relevance(query: str, is_tag: bool, k: int = Config.k) -> list[dict]:
    documents = get_documents()

    def days_since_1ad(date: str) -> int:
        return pd.to_datetime(date).toordinal()

    if not query and not is_tag:
        documents["relevancy"] = documents["release_date"].apply(days_since_1ad)
        sorted_documents = documents.sort_values(by="release_date", ascending=False)
        return sorted_documents.apply(processing_movie_record, axis=1).to_list()

    results = fetch_query_results(query=query, k=k, score_filter=Config.score_filter)
    if not results and not is_tag:
        return [{"result": "Not found"}]

    relevant_movies = documents.copy()
    if results:
        result_scores = dict(results)
        relevant_movies = relevant_movies[relevant_movies["url"].isin(result_scores.keys())]
        relevant_movies["relevancy"] = relevant_movies["url"].map(result_scores)
    else:
        relevant_movies["relevancy"] = documents["release_date"].apply(days_since_1ad)

    if is_tag:
        tag_filtered_movies = documents[documents["tags"].apply(lambda tags: query.lower() in tags)]
        relevant_movies = pd.merge(
            left=tag_filtered_movies,
            right=relevant_movies[["movie_id", "relevancy"]],
            on="movie_id",
            how="left"
        )
        relevant_movies["relevancy"] = relevant_movies["relevancy"].fillna(0)

    # Unique relevance scores using a combination of relevancy and release date
    relevant_movies["relevancy"] = (
        relevant_movies["relevancy"].round(5).astype(str) +
        documents["release_date"].apply(days_since_1ad).astype(str)
    ).astype(float)
    return relevant_movies.apply(processing_movie_record, axis=1).to_list()


@app.get("/status")
async def get_status():
    return {"status": "OK"}
