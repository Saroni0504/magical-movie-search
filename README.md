# Disney Movie Data Scraper

## Overview

This Python application scrapes Disney movie data from Wikipedia, processes the information, and serves it through a Uvicorn app. The app uses the Requests and BeautifulSoup libraries to collect movie data and the OpenAI API to enrich the dataset with a short movie summaries. It also implements a BM25 algorithm as a search engine.

![Disney Image](image.png)

## Workflow

1. **Scraping the Disney Movie List**
   - Utilizing `requests` and `BeautifulSoup` to fetch and parse the list of Disney movies from the designated Wikipedia page.

2. **Extracting Detailed Movie Information**
   - For each movie listed, navigate to the individual movie page and scrape detailed information, including:
     - Title
     - Release Year
     - Description
     - Box Office Revenue
     - Budget
     - Running Time

3. **Generating Summaries**
   - Utilizing OpenAI API to create summaries of each movie’s plot.


4. **Generating a Dataset**
   - Compile the scraped information and the movie summaries into a structured dataset.

## Endpoints

#### `search_disney_movie`

- **Description:** Search for a Disney movie based on a user query. Utilizes the BM25 algorithm for ranking.
- **Method:** `GET`
- **Parameters:** 
  - `query` (string): The search query (e.g., text query, movie title or keywords)
- **Response:** JSON object with movie title and summary

#### `get_topk_documents`

- **Description:** Get the top-k Disney movies based on the BM25 algorithm and their score.
- **Method:** `GET`
- **Parameters:** 
  - `k` (integer): The number of top documents to retrieve
- **Response:** JSON object with top-k movie titles and their scores



## Project Structure
```
├── main.py                 # Uvicorn app with endpoints
├── utils.py                # Helper functions
├── search_engine.py        # Search Engine BM25 Algorithm
├── scraper/                # Scraping related files
│   ├── __init__.py
│   ├── constants.py
│   ├── disney_scraper.py
│   └── main.py
├── data/                   # CSV file with movie data
│   └── disney_movies.csv
└── requirements.txt        # Python dependencies
```

## Getting Started

Follow these steps to set up and run the project:

1. **Clone the Repository:**

   ```bash
   git clone git@github.com:Saroni0504/DisneyMovieRecommender.git
   ```

2. **Navigate to the Project Directory:**
   ```bash
   cd DisneyMovieRecommender
   ```

3. **Create a Virtual Environment:**
   ```bash
   python -m venv venv
   ```

4. **Activate the Virtual Environment:**
    - **macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```
    - **Windows:**
        ```bash
        venv\Scripts\activate
        ```

5. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

6. **Scrape the Wikipedia Pages:**
<br>Set the OpenAI API key as an environment variable:
    - **macOS/Linux:**
        ```bash
        export OPENAI_API_KEY=your_openai_api_key
        python scraper/main.py
        ```
    - **Windows:**
        ```bash
        set OPENAI_API_KEY=your_openai_api_key
        python scraper/main.py
        ```

7. **Run the Uvicorn App:**
   ```bash
   uvicorn main:app --reload
   ```

8. **Profit!**
