from pandas import read_csv

from search_engine import SearchEngine


_documents = None
_search_engine = None


def get_documents():
    global _documents
    if  _documents is None:
        _documents = read_csv("data/scrape_data_v2.csv")
        # TODO: remove preprocess steps
        _documents["url"] = _documents["url"].fillna("")
        _documents["description"] = _documents["description"].fillna("")
    return _documents


def get_search_engine():
    global _search_engine
    if _search_engine is None:
        documents = get_documents()
        _search_engine = SearchEngine()
        content = list(documents[["url", "description"]].values)
        _search_engine.bulk_index(content)
    return _search_engine


def topk_documents(query_results, topk=3):
    return sorted(query_results.items(), key=lambda item: item[1], reverse=True)[:topk]
