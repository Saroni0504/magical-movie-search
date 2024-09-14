import time

import requests

from bs4 import BeautifulSoup
from pandas import (
    DataFrame,
)

from data.logger import logger
from data.constants import (
    BASE_URL,
    DATASET_NAME,
    DATASET_PATH,
    MOVIE_INFOBOX_HEADERS,
    WIKITABLE_MOVIE_COLUMNS,
    WIKITABLE_REQUIRED_MOVIE_COLUMNS,
)


_movie_pages = {}


def get_movie_page(url):
    if not url:
        return
    global _movie_pages
    if url not in _movie_pages:
        soup = scrape_movie_page(url)
        _movie_pages[url] = soup
    return _movie_pages[url]


def create_disney_dataset(records_limit=1_000):
    logger.info("Starting flow")

    data = scrape_movie_list(url=f"{BASE_URL}/wiki/List_of_Walt_Disney_Pictures_films")
    data = data.tail(records_limit)

    # Find the plot paragraphs
    data["description"] = data["url"].apply(find_plot_paragraphs)
    data = data.dropna(subset=["description"])
    # Extract infobox data
    for header, output_format in MOVIE_INFOBOX_HEADERS:
        column_name = header.lower().replace(" ", "_")
        data[column_name] = data["url"].apply(
            func=find_infobox_data,
            header=header,
            output_format=output_format,
        )
    data["title"] = data["title"].str.rstrip("‡†* §")
    data.to_csv(f"{DATASET_PATH}/{DATASET_NAME}_scrape.csv", index=False)


def scrape_movie_page(url: str) -> BeautifulSoup:
    logger.info(f"Scraping url: {url}")
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")
    time.sleep(1)  # Throttling 1 request per second
    return soup


def scrape_movie_list(url: str) -> DataFrame:
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")
    movie_tables = soup.find_all("table", {"class": "wikitable"})
    movies_data = parse_wikitables(movie_tables)
    return DataFrame(movies_data).fillna("")
    

# TODO: handle split cells
def parse_wikitables(movie_tables: list[BeautifulSoup]) -> list[dict]:
    movies_data = []
    for table in movie_tables:
        table_headers = table.find_all("tr")[0].find_all("th")
        table_headers_parsed = [th.text.strip() for th in table_headers]
        if table_headers_parsed == WIKITABLE_MOVIE_COLUMNS:
            rows = table.find_all("tr")[1:]
            for row in rows:
                row_data = parse_row_data(row_td=row.find_all("td")) 
                movies_data.append(row_data)
    return movies_data


def parse_row_data(row_td: list[BeautifulSoup]) -> dict:
    row_data = {}
    for key, value in zip(WIKITABLE_REQUIRED_MOVIE_COLUMNS, row_td):
        column_name = key.lower().replace(" ", "_")
        row_data[column_name] = value.text.strip()
        # Create additional column of url
        if key == WIKITABLE_REQUIRED_MOVIE_COLUMNS[1]:  # Title column
            anchor = value.find("a")
            row_data["url"] = BASE_URL + anchor["href"] if anchor else ""
    return row_data


def find_plot_paragraphs(movie_url, elements_limit=50):
    soup = get_movie_page(movie_url)
    if soup:
        try:
            description = ""    
            plot_heading = soup.find("h2", id="Plot")
            if plot_heading:
                current_element = plot_heading.find_next()
                for _ in range(elements_limit):
                    if current_element.name == "p":
                        description += current_element.text + "\n"
                    current_element = current_element.find_next()
                    if current_element.name == "h2":
                        break
            return description.strip()
        except Exception as e:
            logger.error(f"{movie_url} - {e}")
    return ""


def find_infobox_data(movie_url, header, output_format="str"):
    soup = get_movie_page(movie_url)
    if soup:
        infobox = soup.find("table", {"class": "infobox"})
        if not infobox:
            logger.warning(f"{movie_url} - Infobox not found.")
        else:
            row = infobox.find("th", string=header)
            if not row:
                logger.warning(f"{movie_url} - {header} not found in the infobox.")
            else:
                row_to_present = row.find_next("td").text.strip()
                if output_format == "list":
                    row_to_present = row_to_present.split("\n")
                return row_to_present
    return ""
