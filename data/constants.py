BASE_URL = "https://en.wikipedia.org"
DATASET_GITHUB = (
    "https://media.githubusercontent.com/media/"
    "Saroni0504/magical-movie-search/refs/heads/main/data/disney_movies_dataset.csv"
)
MOVIE_INFOBOX_HEADERS = [
    ("Running time", "str"),
    ("Starring", "list"),
    ("Budget", "str"),
    ("Box office", "str"),
]
OPENAI_FUNCTION_PARAMETERS = ["movie_summary", "tags", "genre"]
WIKITABLE_MOVIE_COLUMNS = ["Release date", "Title", "Notes"]
WIKITABLE_REQUIRED_MOVIE_COLUMNS = ["Release date", "Title"]
