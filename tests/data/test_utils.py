import pytest

from data.utils import infobox_number_parser, formatted_running_time


@pytest.mark.parametrize("formatted_number, expected_result", [
    ("$400 million[2]", 400_000_000),
    ("$40 million[2]", 40_000_000),
    ("$1.2 billion[2]", 1_200_000_000),
    ("$1.2 million[2]", 1_200_000),
    ("$1.2-1.4 million[2]", (1_200_000 + 1_400_000) // 2),
    (">$1.2 million", 1_200_000),
    ("$900,000", 900_000),
    ("$76.4–$83.3 million", (76_400_000 + 83_300_000) // 2),
    ("$418[4] million[2]", 418_000_000),
    (("Original release:$2.6 million (est. US/ Canada rentals)[2] "
      "1969 re-release:$2.3 million (US/ Canada rentals)[3]"), 2_600_000 + 2_300_000),
    ("est. $1,600,000 (US/ Canada)[1]", 1_600_000),
    ("$3.6–4 million[2][3]", (3_600_000 + 4_000_000) // 2),
    ("¥23.2 billionUS$236 million (worldwide), US$1.5 billion, and US$1,500.", 1_736_001_500),
])
def test_infobox_number_parser(formatted_number, expected_result):
    assert infobox_number_parser(formatted_number) == expected_result


@pytest.mark.parametrize("running_time, expected_result", [
    ("70 minutes", 70),
    ("65 min", 65),
    ("60 minutes (VHS and Wild Discovery version)", 60),
    ("22–24 minutes", (22 + 24) // 2),
    ("22", 22),
])
def test_formatted_running_time(running_time, expected_result):
    assert formatted_running_time(running_time) == expected_result
