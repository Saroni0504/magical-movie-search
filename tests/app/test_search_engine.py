# import pytest
# import spacy

# from app.search_engine import (
#     remove_stopwords,
#     stemming,
#     lemmatizing,
# )


# class TestTextProcessing:
#     # Load spaCy model once for all tests
#     nlp = spacy.load("en_core_web_sm")

#     # Test Scenarios and outputs for Stemming, Lemmatizing
#     test_data = {
#         "I change cloths": ["i chang cloth", "I change cloth"],
#         "They eat a fruit": ["they eat a fruit", "they eat a fruit"],
#         "They eating a fruit and a veggie": [
#             "they eat a fruit and a veggi", "they eat a fruit and a veggie"],
#     }

#     @pytest.mark.parametrize("input_text, outputs", test_data.items())
#     def test_stemming(self, input_text, outputs):
#         assert stemming(input_text) == outputs[0]

#     @pytest.mark.parametrize("input_text, outputs", test_data.items())
#     def test_lemmatizing(self, input_text, outputs):
#         assert lemmatizing(input_text, self.nlp) == outputs[1]

#     @pytest.mark.parametrize("input_text, expected_output", [
#         ("and and and", ""),
#         ("and hello and world", "hello world"),
#         ("Hello world", "Hello world"),
#         ("Hello,and,World", "Hello,and,World"),
#         ("and, World", "and, World"),
#     ])
#     def test_remove_stopwords(self, input_text, expected_output):
#         assert remove_stopwords(input_text) == expected_output
