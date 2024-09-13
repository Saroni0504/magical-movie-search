from fastapi import FastAPI

from utils import (
    get_documents,
    get_search_engine,
    topk_documents,
)

app = FastAPI()


@app.get("/search_disney_movie")
def search_disney_movie(query: str) -> dict:
    engine = get_search_engine()
    query_results = engine.search(query)
    result = topk_documents(query_results, k=1)
    if result:
        documents = get_documents()
        movie_record = documents.loc[documents["title"] == result[0][0]]
        response = {
            "result": movie_record["title"].squeeze(),
            "summary": movie_record["description"].squeeze(),
        }
        return response
    return {"result": "Not found"}


@app.get("/get_topk_documents")
def get_topk_documents(query: str, k: int) -> dict:
    engine = get_search_engine()
    query_results = engine.search(query)
    results = topk_documents(query_results, k=k)
    if results:
        return {"result": results}
    return {"result": "Not found"}


@app.get("/status")
def get_status():
    return {"status": "OK"}
