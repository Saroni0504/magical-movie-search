import random
import re
import time

import requests

from pathlib import Path

from data.logger import logger


class RetryError(Exception):
    """Exception raised for errors that occur during a retry operation."""
    def __init__(self, message, retries):
        super().__init__(message)
        self.retries = retries


def retry(func,
          initial_delay: float = 3,
          exponential_base: float = 2,
          jitter: bool = True,
          max_retries: int = 3,
          errors: tuple = (requests.RequestException,)
          ):
    def wrapper(*args, **kwargs):
        delay = initial_delay
        for _ in range(max_retries):
            try:
                return func(*args, **kwargs)
            except errors as e:
                delay *= exponential_base * (1 + jitter * random.random())
                logger.warning(f"Warning: {e}. Retrying in {delay:.2f} seconds")
                time.sleep(delay)
        raise RetryError(message="All Retries Failed", retries=max_retries)
    return wrapper


def image_exists_in_dir(image_name: str, dir_name: str) -> bool:
    directory = Path(dir_name)
    # The glob module finds all the pathnames matching a specified pattern
    files = list(directory.glob(f"{image_name}.*"))
    return bool(files)


def infobox_number_parser(formatted_number: str) -> int:
    if not isinstance(formatted_number, str):
        return None

    cleaned_text = re.sub(r"[\[\(].*?[\]\)]", "", formatted_number)

    pattern = (
     r"(?:\$|US\$)\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?:\s*[-–—to]*\s*"
     r"(?:(?:\$|US\$)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)))?\s?"
     r"(million|billion)?"
    )
    matches = re.findall(pattern, cleaned_text)

    UNIT_MULTIPLIERS = {
        "million": 1_000_000,
        "billion": 1_000_000_000,
    }

    total_sum = 0
    is_valid_string = False
    for match in matches:
        number1_str, number2_str, unit = match

        number1 = float(number1_str.replace(",", ""))
        if unit.lower().strip() in UNIT_MULTIPLIERS:
            number1 *= UNIT_MULTIPLIERS[unit.lower().strip()]
        number = number1

        if number2_str:
            number2 = float(number2_str.replace(",", ""))
            if unit.lower().strip() in UNIT_MULTIPLIERS:
                number2 *= UNIT_MULTIPLIERS[unit.lower().strip()]
            number = (number1 + number2) / 2

        total_sum += number
        is_valid_string = True

    if not is_valid_string:
        return None
    return int(round(total_sum))


def formatted_running_time(running_time):
    if not isinstance(running_time, str):
        return None
    running_time = running_time.split()
    running_time = running_time[0]
    if "–" in running_time:
        running_time = running_time.split("–")
        running_time = (float(running_time[0]) + float(running_time[1])) // 2
    return int(running_time)
