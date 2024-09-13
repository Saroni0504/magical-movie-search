from fastapi import FastAPI

from utils import (
    get_documents,
    get_search_engine,
    topk_documents,
)

app = FastAPI()


@app.get("/")
def search_disney_movie(text: str):
    engine = get_search_engine()
    query_results = engine.search(text)
    result = topk_documents(query_results)
    if result:
        documents = get_documents()
        movie_record = documents.loc[documents["url"] == result[0][0]]
        return movie_record["title"].squeeze()
    return "Not found"


@app.get("/status")
def get_status():
    return {"status": "OK"}
