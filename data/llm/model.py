import json
import os

import requests

from data.logger import logger


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def movie_insights(title, movie_plot):

    if not movie_plot:
        return {}

    logger.info(f"Extracting insights for {title}")

    data = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "You are a Disney movie expert who can provide Disney movie summaries",
            },
            {
                "role": "user",
                "content": movie_plot,
            }
        ],
        "functions": [{
            "name": "movie_insights",
            "description": "Extract meaningful insights from the Disney Movie",
            "parameters": {
                "type": "object",
                "properties": {
                    "movie_summary": {
                        "type": "string",
                        "description": (
                            "A one-paragraph summary of the Disney movie, up to five sentences."
                        ),
                    },
                    "tags": {
                        "type": "array",
                        "items": {
                            "type": "string",
                        },
                        "description": (
                            "Extract up to five tags from the movie plot, "
                            "they should be in snake_case format"
                        ),
                    },
                    "genre": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": [
                                "Musical",
                                "Action",
                                "Drama",
                                "Animation",
                                "Adventure",
                                "Fantasy",
                                "Comedy",
                                "Science fiction",
                                "Fairy tale",
                            ],
                        },
                        "description": "Extract up to two genres of the movie",
                    },
                },
                "additionalProperties": False,
                "required": [
                    "movie_summary",
                    "tags",
                    "genre",
                ],
            },
        }],
        "temperature": 0,
        "max_tokens": 500,
    }

    response = requests.post(
        url="https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json=data,
    )

    if response.status_code == 200:
        content = response.json().get("choices", [{}])[0]
        content = content.get("message", {}).get("function_call", {}).get("arguments", "{}")
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            logger.error(f"Failed to extract insights for {title}:\n{response.text}")
    return {}
