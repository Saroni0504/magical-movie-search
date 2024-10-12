from pandas import (
    read_csv,
    Series,
)

from app.config import Config
from app.constants import IMAGES_PATH
from app.search_engine import SearchEngine
from data.constants import (
    DATASET_PATH,
    DATASET_NAME,
)

_documents = None
_search_engine = None


def list_parser(stringified_list: str) -> list:
    lst = stringified_list.strip('"[]').replace("'", "").split(",")
    return [item.strip() for item in lst]


def get_documents():
    global _documents
    if _documents is None:
        _documents = read_csv(f"{DATASET_PATH}/{DATASET_NAME}.csv").fillna("")
        for column in ["tags", "genre"]:
            _documents[column] = _documents[column].apply(list_parser)
    return _documents


def get_search_engine():
    global _search_engine
    if _search_engine is None:
        documents = get_documents()
        _search_engine = SearchEngine(text_proccessing=Config.text_processing)
        content = list(documents[["url", "description"]].values)
        _search_engine.bulk_index(content)
    return _search_engine


def topk_documents(query_results, k):
    documents = sorted(
        query_results.items(),
        key=lambda item: item[1],
        reverse=True,
    )
    return documents[:k]


def fetch_query_results(query, k, score_filter) -> list[tuple]:
    engine = get_search_engine()
    query_results = engine.search(query)
    results = topk_documents(query_results, k=k)
    if score_filter:
        max_score = None if len(results) == 0 else results[0][1]
        results = [
            (url, score) for url, score in results
            if score >= (max_score * Config.score_threshold)
        ]
    return results


def extract_movies_details(results: list[tuple]) -> list[dict]:
    documents = get_documents()
    response = []
    for i in range(len(results)):
        url = results[i][0]
        movie_record = documents.loc[documents["url"] == url]
        response.append(processing_movie_record(movie_record))
    return response


def processing_movie_record(movie_record: Series) -> dict:
    release_date = movie_record["release_date"].squeeze()
    release_year = release_date.split(",")[1].strip() if "," in release_date else ""
    image_name = (movie_record["movie_id"] + "." + movie_record["image_format"]).squeeze()
    image_path = f"{IMAGES_PATH}/{image_name}"
    movie_record_info = {
        "title": movie_record["title"].squeeze(),
        "release_year": release_year,
        "genre": movie_record["genre"].squeeze(),
        "tags": movie_record["tags"].squeeze(),
        "summary": movie_record["movie_summary"].squeeze(),
        "image_path": image_path,
    }
    return movie_record_info
