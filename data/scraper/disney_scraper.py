import os
import random
import string
import time

import requests

from bs4 import BeautifulSoup
from pandas import (
    DataFrame,
    Series,
)

from app.constants import IMAGES_PATH
from data.constants import (
    BASE_URL,
    DATASET_NAME,
    DATASET_PATH,
    MOVIE_INFOBOX_HEADERS,
    WIKITABLE_MOVIE_COLUMNS,
    WIKITABLE_REQUIRED_MOVIE_COLUMNS,
)
from data.logger import logger
from data.utils import (
    image_exists_in_dir,
    retry,
    RetryError,
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

    data = scrape_movie_list(
        url=f"{BASE_URL}/wiki/List_of_Walt_Disney_Pictures_films"
    ).tail(records_limit)

    data["release_date"] = data["release_date"].str.extract(
        pat=r"([A-Z][a-z]+ \d{1,2}, \d{4})",
        expand=False,
    )
    # Extract movie image url and format
    data[["image_url", "image_format"]] = data["url"].apply(extract_movie_image_url_and_format)

    # Create movie id
    data["movie_id"] = data.apply(
        func=lambda row: create_movie_id(
            movie_url=row["url"],
            title=row["title"],
            release_date=row["release_date"],
        ),
        axis=1,
    )
    # Download movie image
    data.apply(
        func=lambda row: download_if_image_not_exists(
            movie_id=row["movie_id"],
            image_url=row["image_url"],
            image_format=row["image_format"],
        ),
        axis=1,
    )

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
        row_data[column_name] = value.text.strip().rstrip("‡†*§ ")
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


def preprocess_title_name(title, url):
    if "/" in title:
        logger.error(f"URL: {url} - title is invalid: {title}")
        return "0"
    translator = str.maketrans(string.punctuation, "_" * len(string.punctuation))
    return title.replace(" ", "_").lower().translate(translator)


def extract_release_year(release_date, url):
    if release_date.count(",") == 1:
        release_year = release_date.split(",")[1].strip()
        if release_year.isdigit():
            return release_year
    logger.error(f"URL: {url} - release date is invalid: {release_date}")
    return "0"


def create_movie_id(movie_url, title, release_date):
    _title = preprocess_title_name(title=title, url=movie_url)
    release_year = extract_release_year(release_date=release_date, url=movie_url)
    return f"{_title}_{release_year}"


@retry
def download_movie_image(image_url: str,
                         image_name: str,
                         image_format: str,
                         image_folder: str,
                         wait_between_requests_sec=5) -> None:
    logger.info(f"URL: {image_url} -> Downloading image")
    scraper_email_address = os.getenv("SCRAPER_EMAIL_ADDRESS")
    image_response = requests.get(
        url=image_url,
        headers={"User-Agent": f"ScrapeBot/1.0 ({scraper_email_address})"},
    )
    if image_response.status_code == 200:
        _image_name = f"{image_name}.{image_format}"
        with open(f"{image_folder}/{_image_name}", "wb") as file:
            file.write(image_response.content)
        # Throttling requests
        sleep_time = abs(random.gauss(mu=wait_between_requests_sec))
        logger.info(f"Image: {image_name} was saved succesfuly, waiting {sleep_time:.1f} seconds")
        time.sleep(sleep_time)
    else:
        logger.error(
            f"URL: {image_url}, "
            f"Status code: {image_response.status_code}, "
            f"Error: {image_response.text}"
        )
        raise requests.RequestException


def extract_movie_image_url_and_format(movie_url: str) -> Series:
    soup = get_movie_page(movie_url)
    if soup:
        infobox = soup.find("table", {"class": "infobox"})
        if not infobox:
            logger.warning(f"{movie_url} - Infobox not found.")
        else:
            image = infobox.find("img")
            if not image:
                logger.warning(f"{movie_url} - image not found in the infobox.")
            else:
                image_url = "https:" + image["src"]
                image_format = image["src"].split(".")[-1]
                return Series([image_url, image_format])
    return Series(["", ""])


def download_if_image_not_exists(movie_id: str, image_url: str, image_format: str) -> str:
    if image_url:
        image_folder = f"app/{IMAGES_PATH}"
        image_exists = image_exists_in_dir(
            image_name=movie_id,
            dir_name=image_folder,
        )
        logger.info(f"URL: {image_url} -> image " + ("" if image_exists else "not ") + "exists")
        if not image_exists:
            try:
                download_movie_image(
                    image_url=image_url,
                    image_name=movie_id,
                    image_format=image_format,
                    image_folder=image_folder,
                )
            except RetryError as e:
                logger.error(e)
