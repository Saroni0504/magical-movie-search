# Disney Movie Recommender

## Overview

This Python project allows users to search for the most relevant Disney movies using free-text queries. The data module leverages the Requests and BeautifulSoup libraries to scrape Disney movie information from Wikipedia, which is then processed and enhanced with summaries via the OpenAI API. The dataset is indexed using the BM25 algorithm to enable efficient searching and is made accessible through FastAPI endpoints.

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

3. **Extracting Additional Information**
   - Utilizing OpenAI API to extract additional information based on the movie plot such as:
     - Genre
     - Tags
     - Summary

4. **Generating a Dataset**
   - Compile the scraped information and the movie summaries into a structured dataset.

## Endpoints

#### `search_disney_movie`

- **Description:** Search for a Disney movie based on a user query. Utilizes the BM25 algorithm for ranking.
- **Method:** `GET`
- **Parameters:** 
  - `query` (string): The search query (e.g., text query, movie title or keywords)
- **Response:** JSON object with movie title, genre, tags and summary

#### `get_topk_documents`

- **Description:** Get the top-k Disney movies based on the BM25 algorithm and their score.
- **Method:** `GET`
- **Parameters:** 
  - `k` (integer): The number of top documents to retrieve
- **Response:** JSON object with top-k movie urls and their scores



## Project Structure
```
├── app/
│   ├── static/
│   │   ├── css/
│   │   ├── js/                
│   │   └── images/
│   │
│   ├── templates/
│   │   └── index.html
│   │
│   ├── main.py                     # Uvicorn app with endpoints
│   ├── constants.py
│   ├── config.py
│   ├── utils.py
|   └── search_engine.py            # Search Engine BM25 Algorithm
│
├── data/
│   ├── llm/                        # OpenAI API
│   │   ├── flow.py                 
│   │   └── model.py                
│   │
│   ├── scraper/                    # Scraping related files
│   │   └── disney_scraper.py
│   │
│   ├── main.py
│   ├── constants.py
│   ├── logger.py
│   ├── utils.py
│   └── disney_movies_dataset.csv   # CSV file with movie data
|
├── tests/
│   ├── app/
|   ├── data/
│
└── requirements.txt                # Python dependencies
```

## Getting Started

Follow these steps to set up and run the project:

1. **Navigate to the Project Directory:**
   ```bash
   cd DisneyMovieRecommender
   ```

2. **Clone the Repository:**

   ```bash
   git clone git@github.com:Saroni0504/DisneyMovieRecommender.git
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

6. **Scrape the Wikipedia Pages and extract insights with LLM:**

   There are two options to get the movies data and images:
   1. Use Git LFS for pulling the dataset and images (install Git LFS):
      ```
      git lfs pull
      ```

   2. Scrape the images and data and extract insights (with OpenAI):
      <br>Set the environment variables:
         - **macOS/Linux:**
            ```bash
            export SCRAPER_EMAIL_ADDRESS=your_email_address
            export OPENAI_API_KEY=your_openai_api_key
            PYTHONPATH=.
            ```
         - **Windows:**
            ```powershell
            $env:SCRAPER_EMAIL_ADDRESS = "your_email_address"
            $env:OPENAI_API_KEY = "your_openai_api_key"
            $env:PYTHONPATH = "."
            ```
         Run the program:
         ```
         python data/main.py
         ```

7. **Run the Uvicorn App:**
   ```bash
   uvicorn app.main:app --reload
   ```

8. **Profit!**
