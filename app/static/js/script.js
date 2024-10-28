let currentSlide = 0;
let selectedTag = null;  // Track selected tag
let allTags = [];        // Store all tags from backend
let currentTagIndex = 0; // Track the current set of displayed tags
const TAGS_PER_BATCH = 6; // Number of tags per batch for display

// DOM elements
const dateFilter = document.getElementById('date-filter');
const searchText = document.getElementById('searchText');
const carousel = document.getElementById('carousel');
const tagContainer = document.querySelector('.tag-container');
const showMoreButton = document.querySelector('.plus-circle');
const filtersRow = document.getElementById('filtersRow');

// Toggle date filter dropdown
dateFilter.addEventListener('focus', () => dateFilter.classList.add('open'));
dateFilter.addEventListener('blur', () => dateFilter.classList.remove('open'));

// Date filter change event
dateFilter.addEventListener('change', handleDateFilterChange);

// Trigger search on Enter key press
searchText.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') searchMovie();
});

// Initialize tags on page load
window.onload = fetchTags;

// Function to handle date filter change
async function handleDateFilterChange() {
    const dateFilterValue = dateFilter.value;
    if (selectedTag) {
        const tagText = selectedTag.textContent;
        const endpoint = dateFilterValue === "all_years"
            ? `/search_by_tag?tag=${encodeURIComponent(tagText)}`
            : `/search_by_tag?tag=${encodeURIComponent(tagText)}&date_filter=${encodeURIComponent(dateFilterValue)}`;
        await fetchMovies(endpoint);
    } else {
        searchMovie();
    }
}

// Function to search movies by text
async function searchMovie() {
    const query = searchText.value;
    const dateFilterValue = dateFilter.value;
    clearSelectedTag();
    
    const endpoint = dateFilterValue === "all_years"
        ? `/search_disney_movie?query=${encodeURIComponent(query)}`
        : `/search_disney_movie?query=${encodeURIComponent(query)}&date_filter=${encodeURIComponent(dateFilterValue)}`;
    await fetchMovies(endpoint);
}

// Toggle filters row visibility
function toggleFilters() {
    filtersRow.style.display = filtersRow.style.display === "flex" ? "none" : "flex";
}

// Function to fetch tags from backend
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

    const dateFilterValue = dateFilter.value;
    const endpoint = dateFilterValue === "all_years"
        ? `/search_by_tag?tag=${encodeURIComponent(tag)}`
        : `/search_by_tag?tag=${encodeURIComponent(tag)}&date_filter=${encodeURIComponent(dateFilterValue)}`;
    await fetchMovies(endpoint);
}

// Clear selected tag styling
function clearSelectedTag() {
    if (selectedTag) {
        selectedTag.classList.remove('active-tag');
        selectedTag.style.color = '#988e8e';
        selectedTag = null;
    }
}

// Fetch movie data and update carousel
async function fetchMovies(endpoint) {
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        carousel.innerHTML = '';
        
        data.forEach(movie => createCarouselSlide(movie));
        
        currentSlide = 0;
        updateCarousel();
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

// Create and add a slide to the carousel
function createCarouselSlide(movie) {
    const { title, release_year, genre, tags, summary, image_path } = movie;
    const slide = document.createElement('div');
    slide.classList.add('carousel-slide');
    slide.innerHTML = `
        <div class="movie-container">
            <div class="movie-details">
                <div class="movie-title">${title}</div>
                <div class="movie-release-year"><strong>Release Year:</strong> ${release_year}</div>
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
