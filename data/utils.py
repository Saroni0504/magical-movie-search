
import random
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
