from pandas import read_csv

from data.constants import (
    DATASET_NAME,
    DATASET_PATH,
    OPENAI_FUNCTION_PARAMETERS,
)
from data.llm.model import movie_insights


def generate_llm_insights():
    data = read_csv(f"{DATASET_PATH}/{DATASET_NAME}_scrape.csv").fillna("")

    data["llm_insights"] = data.apply(
        func=lambda row: movie_insights(row["title"], row["description"]),
        axis=1,
    )

    for info in OPENAI_FUNCTION_PARAMETERS:
        data[info] = data["llm_insights"].str.get(info)
    data = data.drop(columns=["llm_insights"])
    data.to_csv(f"{DATASET_PATH}/{DATASET_NAME}.csv", index=False)
