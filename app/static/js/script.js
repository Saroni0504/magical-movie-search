let currentSlide = 0;
let selectedTag = null;  // Variable to keep track of the selected tag

// Function to search for movies by free text
async function searchMovie() {
    const searchText = document.getElementById('searchText').value;

    // Reset the selected tag to inactive state
    if (selectedTag) {
        selectedTag.classList.remove('active-tag'); // Remove the active class
        selectedTag.style.color = '#988e8e'; // Reset color to default
        selectedTag = null; // Clear the selected tag
    }

    await fetchMovies(`/search_disney_movie?query=${encodeURIComponent(searchText)}`);
}

function toggleFilters() {
    var filtersRow = document.getElementById('filtersRow');
    if (filtersRow.style.display === "none" || filtersRow.style.display === "") {
        filtersRow.style.display = "flex"; // You can adjust the display to "block" if needed
    } else {
        filtersRow.style.display = "none";
    }
}


let allTags = [];  // Will store all the tags fetched from the backend
let currentTagIndex = 0;  // Index to track the current set of tags being displayed
const TAGS_PER_BATCH = 6;  // Number of tags to show per batch

// Function to fetch predefined tags from the backend
async function fetchTags() {
    try {
        const response = await fetch('/fetch_common_tags');
        const data = await response.json();
        allTags = data.tags;  // Store all tags
        displayTags();  // Display initial set of tags
    } catch (error) {
        console.error('Error fetching tags:', error);
    }
}

// Function to display tags in batches of 6
function displayTags() {
    const tagContainer = document.querySelector('.tag-container');

    // Create a new row for each batch of tags
    const row = document.createElement('div');
    row.classList.add('tag-row');  // Add a class for styling
    tagContainer.appendChild(row);

    // Loop to display the next batch of tags
    for (let i = currentTagIndex; i < currentTagIndex + TAGS_PER_BATCH && i < allTags.length; i++) {
        const tag = allTags[i];
        const tagElement = document.createElement('span');
        tagElement.classList.add('tag');
        tagElement.textContent = tag;
        tagElement.onclick = () => selectTag(tagElement, tag);  // Add click event to search by tag
        row.appendChild(tagElement);  // Add tag to the current row
    }

    currentTagIndex += TAGS_PER_BATCH;  // Update index for the next batch

    // Hide the "Show More" button if all tags have been displayed
    if (currentTagIndex >= allTags.length) {
        document.querySelector('.plus-circle').style.display = 'none';
    }
}

// Function to handle the "New Ideas" button click
function showMoreTags() {
    displayTags();  // Display the next set of tags
}

// Call the fetchTags function when the page loads
window.onload = fetchTags;

// Function to handle tag selection and fetch movies
async function selectTag(tagElement, tag) {
    // If a tag is already selected, revert its color
    if (selectedTag) {
        selectedTag.classList.remove('active-tag'); // Remove the active class from the previously selected tag
        selectedTag.style.color = '#988e8e'; // Reset color to default
    }

    // Set the new selected tag
    selectedTag = tagElement;
    tagElement.classList.add('active-tag');  // Change color of selected tag

    // Fetch movies for the selected tag
    await fetchMovies(`/search_by_tag?tag=${encodeURIComponent(tag)}`);
}

// Fetch movie results from the backend API
async function fetchMovies(endpoint) {
    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        const carousel = document.getElementById('carousel');
        carousel.innerHTML = '';  // Clear previous results

        data.forEach(movie => {
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
                </div>
            `;
            carousel.appendChild(slide);
        });

        currentSlide = 0;
        updateCarousel();

    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

// Function to update carousel position
function updateCarousel() {
    const carousel = document.getElementById('carousel');
    const slideWidth = document.querySelector('.carousel-slide').offsetWidth;
    carousel.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
}

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

// Add event listener for the Enter key
document.getElementById('searchText').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        searchMovie();
    }
});
