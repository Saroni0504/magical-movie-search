from pandas import read_csv

from app.search_engine import SearchEngine

from data.constants import (
    DATASET_PATH,
    DATASET_NAME,
)

_documents = None
_search_engine = None


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
        _search_engine = SearchEngine()
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


def list_parser(stringified_list):
    lst = stringified_list.strip('"[]').replace("'", "").split(",")
    return [item.strip() for item in lst]
