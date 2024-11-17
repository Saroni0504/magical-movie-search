
from pandas import (
    DataFrame,
    merge,
    read_csv,
    Series,
    to_datetime,
)

from app.config import Config
from app.constants import IMAGES_PATH
from app.search_engine import SearchEngine
from data.constants import DATASET_PATH


_documents = None
_search_engine = None


def list_parser(stringified_list: str) -> list:
    lst = stringified_list.strip('"[]').replace("'", "").split(",")
    return [item.strip() for item in lst]


def get_documents() -> DataFrame:
    global _documents
    if _documents is None:
        _documents = read_csv(
            f"{DATASET_PATH}/disney_movies_dataset.csv",
            parse_dates=["release_date"],
        ).fillna("").sort_values(by="release_date", ascending=False)
        _documents = _documents[_documents["description"] != ""]
        for column in ["tags", "genre"]:
            _documents[column] = _documents[column].apply(list_parser)
    return _documents


def get_search_engine() -> SearchEngine:
    global _search_engine
    if _search_engine is None:
        documents = get_documents()
        _search_engine = SearchEngine(text_processing=Config.text_processing)
        content = list(documents[["url", "description"]].values)
        _search_engine.bulk_index(content)
    return _search_engine


def topk_documents(query_results: dict, k: int) -> list[tuple]:
    documents = sorted(
        query_results.items(),
        key=lambda item: item[1],
        reverse=True,
    )
    return documents[:k]


def fetch_query_results(query: str, k: int, score_filter: bool) -> list[tuple]:
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


def processing_movie_record(movie_record: Series) -> dict:
    release_year = movie_record["release_date"].year
    image_name = (movie_record["movie_id"] + "." + movie_record["image_format"])
    image_path = f"{IMAGES_PATH}/{image_name}"
    movie_record_info = {
        "title": movie_record["title"],
        "release_date": movie_record["release_date"],
        "release_year": release_year,
        "running_time": movie_record["running_time_minutes"],
        "genre": movie_record["genre"],
        "tags": movie_record["tags"],
        "summary": movie_record["movie_summary"],
        "budget": movie_record["budget"],
        "box_office": movie_record["box_office"],
        "profit": movie_record["profit"],
        "image_path": image_path,
        "relevancy": movie_record["relevancy"],
    }
    return movie_record_info


def common_tags(tags_n_occurences: int) -> list:
    documents = get_documents()
    tags_frequency = documents["tags"].explode().value_counts()
    tags_frequency = tags_frequency.sample(
        n=len(tags_frequency),
        weights=tags_frequency.values ** 2,
    )
    rel_tags = tags_frequency[(tags_frequency >= tags_n_occurences)].index
    rel_tags = rel_tags[rel_tags != ""].to_list()
    return rel_tags


def days_since_1ad(date: str) -> int:
    return to_datetime(date).toordinal()


def response_search_movie(query: str, is_tag: bool, k: int = Config.k) -> list[dict]:
    documents = get_documents()
    # Show all movies
    if not query and not is_tag:
        relevant_movies = documents.copy()
        relevant_movies["relevancy"] = relevant_movies["release_date"].apply(days_since_1ad)
        relevant_movies = relevant_movies.sort_values(by="release_date", ascending=False)

    else:
        # Fetch query results (If it is by tag the query is the tag)
        results = fetch_query_results(query=query, k=k, score_filter=Config.score_filter)
        results = DataFrame(data=results, columns=["url", "relevancy"])
        relevant_movies = merge(left=documents, right=results, how="left", on="url")

        relevant_movies["relevancy"] = relevant_movies["relevancy"].astype(float).fillna(0)
        # Breaking ties with release_date
        relevant_movies["relevancy"] = (
            relevant_movies["relevancy"].round(10).astype(str) +
            relevant_movies["release_date"].apply(days_since_1ad).astype(str)
        ).astype(float)
        # Applying filters
        tag_filter = relevant_movies["tags"].apply(lambda tags: query.lower() in tags)
        search_filter = relevant_movies["url"].isin(results["url"])
        relevant_movies = relevant_movies[tag_filter | search_filter]

    if relevant_movies.empty:
        return None
    return relevant_movies.apply(processing_movie_record, axis=1).to_list()
