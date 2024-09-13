import argparse
import requests


parser = argparse.ArgumentParser(description="Send data to OpenAI API.")
parser.add_argument("--OPENAI_API_KEY", required=True, help="Your OpenAI API key.")
args = parser.parse_args()


def movie_summary(movie_plot):
    
    data = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "system",
                "content": "Provide a short summary of a given Disney movie plot",
            },
            {
                "role": "user",
                "content": movie_plot,
            }
        ],
        "functions": {
            "name": "movie_summary",
            "description": "Provide a short summary of a given Disney movie plot",
            "strict": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "movie_summary": {
                        "type": "string",
                        "description": "The summary of the Disney movie",
                    },
                },
            "required": ["movie_summary"],
            "additionalProperties": False,
            },
        },
        "temperature": 0,
        "max_tokens": 500,
    }

    response = requests.post(
        url="https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {args.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json=data,
    )

    if response.status_code == 200:
        content = response.json()
        return content.get("choices", [{}])[0].get("message", {}).get("function_call", {}).get("arguments", {}).get("content")
