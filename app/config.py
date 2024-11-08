from app.search_engine import TextProcessing


class Config:
    k: int = 10
    text_processing: TextProcessing = TextProcessing.Stemmer
    stopwords: bool = True
    score_filter: bool = False
    score_threshold: float = 0.5
    tags_n_occurences: int = 5
