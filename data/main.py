from scraper.disney_scraper import create_disney_dataset
from llm.flow import generate_llm_insights


def main():
    create_disney_dataset()
    generate_llm_insights()


if __name__ == "__main__":
    main()
