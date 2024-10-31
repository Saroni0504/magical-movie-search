// DOM elements
const dateFilter = document.getElementById('date-filter');
const searchText = document.getElementById('searchText');
const carousel = document.getElementById('carousel');
const tagContainer = document.querySelector('.tag-container');
const showMoreButton = document.querySelector('.plus-circle');
const filtersRow = document.getElementById('filtersRow');
const sortingDropdown = document.getElementById('sorting'); // Sorting dropdown
const nResultsDropdown = document.getElementById('n-results'); // N results dropdown

let currentSlide = 0;
let selectedTag = null;  // Track selected tag
let allTags = [];        // Store all tags from backend
let currentTagIndex = 0; // Track the current set of displayed tags
const TAGS_PER_BATCH = 6; // Number of tags per batch for display
let currentSortingOption = sortingDropdown.value;
let nResultsLimit = null; // Default limit for results


// Toggle date filter dropdown
dateFilter.addEventListener('focus', () => dateFilter.classList.add('open'));
dateFilter.addEventListener('blur', () => dateFilter.classList.remove('open'));

// Date filter change event
dateFilter.addEventListener('change', handleDateFilterChange);

// Sorting change event
sortingDropdown.addEventListener('change', handleSortChange); // Sorting change event

// Initialize limit results from dropdown
nResultsDropdown.addEventListener('change', limitResults);


// Trigger search on Enter key press
searchText.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') searchMovie();
});

// Initialize tags on page load
window.onload = fetchTags;

// Handle date filter change
async function handleDateFilterChange() {
    if (selectedTag) {
        const tagText = selectedTag.textContent;
        await fetchMoviesByTag(tagText);
    } else {
        searchMovie();
    }
}

// Handle sorting change
async function handleSortChange() {
    await searchMovie();
}

// Search movie function
async function searchMovie() {
    const query = searchText.value.trim();
    if (query === "") return;
    clearSelectedTag();
    await fetchMovies(`/search_disney_movie?query=${encodeURIComponent(query)}`);
}

// Toggle filters row visibility
function toggleFilters() {
    filtersRow.style.display = filtersRow.style.display === "flex" ? "none" : "flex";
}

// Fetch tags from backend
async function fetchTags() {
    try {
        const response = await fetch('/fetch_common_tags');
        const data = await response.json();
        allTags = data.tags;
        displayTags();
    } catch (error) {
        console.error('Error fetching tags:', error);
    }
}

// Display tags in batches
function displayTags() {
    const row = document.createElement('div');
    row.classList.add('tag-row');
    tagContainer.appendChild(row);

    for (let i = currentTagIndex; i < currentTagIndex + TAGS_PER_BATCH && i < allTags.length; i++) {
        const tag = allTags[i];
        const tagElement = document.createElement('span');
        tagElement.classList.add('tag');
        tagElement.textContent = tag;
        tagElement.onclick = () => selectTag(tagElement, tag);
        row.appendChild(tagElement);
    }

    currentTagIndex += TAGS_PER_BATCH;
    if (currentTagIndex >= allTags.length) {
        showMoreButton.style.display = 'none';
    }
}

// Show more tags on button click
function showMoreTags() {
    displayTags();
}

// Select or deselect a tag and fetch movies
async function selectTag(tagElement, tag) {
    if (selectedTag === tagElement) {
        clearSelectedTag();
        await fetchMovies(`/search_disney_movie`);
        return;
    }

    clearSelectedTag();
    selectedTag = tagElement;
    tagElement.classList.add('active-tag');
    tagElement.style.color = '#000';

    await fetchMoviesByTag(tag);
}

// Clear selected tag styling
function clearSelectedTag() {
    if (selectedTag) {
        selectedTag.classList.remove('active-tag');
        selectedTag.style.color = '#736e6e';
        selectedTag = null;
    }
}


// Fetch movies by tag and apply the selected sort option
async function fetchMoviesByTag(tag) {
    const endpoint = `/search_by_tag?tag=${encodeURIComponent(tag)}&sort_by=${currentSortingOption}`;
    await fetchMovies(endpoint);
}

function limitResults() {
    const nResultsDropdown = document.getElementById('n-results');
    const selectedLimit = parseInt(nResultsDropdown.value, 10);
    updateCarousel(selectedLimit);
}

const swiper = new Swiper('.swiper-container', {
    slidesPerView: 3, // Display 3 slides at once
    spaceBetween: 10, // Add space between slides as needed
    centeredSlides: false, // Disable centering to prevent partial slides on the sides
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    breakpoints: {
        768: {
            slidesPerView: 3,
        },
        480: {
            slidesPerView: 1,
        },
    },
});

// Fetch movie data and update carousel
async function fetchMovies(endpoint) {
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        const filteredMovies = filterMoviesByDate(data);

        // Sort movies based on the selected sorting option
        sortMovies(filteredMovies);

        // Apply the results limit
        const limitedMovies = nResultsLimit ? filteredMovies.slice(0, nResultsLimit) : filteredMovies;
        carousel.innerHTML = '';
        limitedMovies.forEach(movie => {
            const slide = document.createElement('div');
            slide.classList.add('swiper-slide');

            slide.innerHTML = `
                <div class="card">
                    <img src="${movie.image_path}" alt="${movie.title}" />
                    <div class="info">
                        <h1>${movie.title}</h1>
                        <p>
                            <strong>Running time:</strong> ${movie.running_time} minutes<br>
                            <strong>Release year:</strong> ${movie.release_year}<br>
                            <strong>Genre:</strong> ${movie.genre.join(', ')}<br>
                            <strong>Tags:</strong> ${movie.tags.join(', ')}<br><br>
                            ${movie.summary}
                        </p>
                    </div>
                </div>`;
            carousel.appendChild(slide); // Add the new slide to the carousel
        });

        swiper.update(); // Update Swiper to recognize new slides
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

// Handle sorting change
async function handleSortChange() {
    currentSortingOption = sortingDropdown.value;

    if (selectedTag) {
        // Sort by tag if a tag is selected
        const tagText = selectedTag.textContent;
        await fetchMoviesByTag(tagText);
    } else {
        // Otherwise, perform a regular search
        searchMovie();
    }
}

// Filter movies based on the selected date filter
function filterMoviesByDate(movies) {
    const dateFilterValue = dateFilter.value;
    const today = new Date();

    return movies.filter(movie => {
        const releaseDate = new Date(movie.release_date);

        if (dateFilterValue === "all_years") {
            return true;
        } else if (dateFilterValue === "past_year") {
            return releaseDate >= new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        } else if (dateFilterValue === "past_decade") {
            return releaseDate >= new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
        }

        return false;
    });
}

// Sort movies based on the selected sorting criteria
function sortMovies(movies) {
    const sortBy = sortingDropdown.value;

    switch (sortBy) {
        case 'release_date':
            movies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
            break;
        case 'budget':
            movies.sort((a, b) => b.budget - a.budget);
            break;
        case 'box_office':
            movies.sort((a, b) => b.box_office - a.box_office);
            break;
        case 'profit':
            movies.sort((a, b) => b.profit - a.profit);
            break;
    }
}

// Limit results based on dropdown
function limitResults() {
    const selectedValue = nResultsDropdown.value;
    nResultsLimit = selectedValue === 'all' ? null : parseInt(selectedValue);

    // Fetch and display movies
    if (selectedTag) {
        fetchMoviesByTag(selectedTag.textContent);
    } else {
        searchMovie();
    }
}
// Create and add a slide to the carousel
function createCarouselSlide(movie) {
    const { title, running_time, release_year, genre, tags, summary, image_path } = movie;
    const slide = document.createElement('div');
    slide.classList.add('carousel-slide');
    slide.innerHTML = `
        <div class="movie-container">
            <div class="movie-details">
                <div class="movie-title">${title}</div>
                <div class="movie-running-time"><strong>Running time:</strong> ${running_time} minutes</div>
                <div class="movie-release-year"><strong>Release year:</strong> ${release_year}</div>
                <div class="movie-genre"><strong>Genre:</strong> ${genre.join(', ')}</div>
                <div class="movie-tags"><strong>Tags:</strong> ${tags.join(', ')}</div>
                <div class="movie-summary">${summary}</div>
            </div>
            <div class="movie-image-container">
                <img src="${image_path}" alt="${title}" class="movie-image-path">
            </div>
        </div>`;
    carousel.appendChild(slide);
}

// Update carousel position
function updateCarousel() {
    const slideWidth = document.querySelector('.carousel-slide').offsetWidth;
    carousel.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
}

// Carousel controls
function prevSlide() {
    const totalSlides = document.querySelectorAll('.carousel-slide').length;
    currentSlide = (currentSlide > 0) ? currentSlide - 1 : totalSlides - 1;
    updateCarousel();
}

function nextSlide() {
    const totalSlides = document.querySelectorAll('.carousel-slide').length;
    currentSlide = (currentSlide < totalSlides - 1) ? currentSlide + 1 : 0;
    updateCarousel();
}
