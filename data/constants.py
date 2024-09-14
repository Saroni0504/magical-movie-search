BASE_URL = "https://en.wikipedia.org"
DATASET_NAME = "disney_movies_dataset"
DATASET_PATH = "data"
MOVIE_INFOBOX_HEADERS = [
    ("Running time", "str"),
    ("Budget", "str"),
    ("Box office", "str"),
    ("Starring", "list"),
]
OPENAI_FUNCTION_PARAMETERS = ["movie_summary", "tags", "genre"]
WIKITABLE_MOVIE_COLUMNS = ["Release date", "Title", "Notes"]
WIKITABLE_REQUIRED_MOVIE_COLUMNS = ["Release date", "Title"]
