// DOM elements
const dateFilter = document.getElementById('date-filter');
const searchText = document.getElementById('searchText');
const carousel = document.getElementById('carousel');
const tagContainer = document.querySelector('.tag-container');
const showMoreButton = document.querySelector('.plus-circle');
const filtersRow = document.getElementById('filtersRow');
const nResultsDropdown = document.getElementById('n-results'); // N results dropdown

let currentSlide = 0;
let selectedTag = null;  // Track selected tag
let allTags = [];        // Store all tags from backend
let currentTagIndex = 0; // Track the current set of displayed tags
const TAGS_PER_BATCH = 6; // Number of tags per batch for display
let currentSortingOption = 'release_date'; // Default sorting field
let currentSortOrder = 'descending'; // Default sorting order
let nResultsLimit = null; // Default limit for results




// Toggle date filter dropdown
dateFilter.addEventListener('focus', () => dateFilter.classList.add('open'));
dateFilter.addEventListener('blur', () => dateFilter.classList.remove('open'));

nResultsDropdown.addEventListener('focus', () => nResultsDropdown.classList.add('open'));
nResultsDropdown.addEventListener('blur', () => nResultsDropdown.classList.remove('open'));

// Date filter change event
dateFilter.addEventListener('change', handleDateFilterChange);

// Toggle the visibility of the sort menu
function toggleSortMenu() {
    const menu = document.getElementById('sortMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Close the sort menu if clicking outside of it
window.addEventListener('click', function(event) {
    const menu = document.getElementById('sortMenu');
    const button = document.querySelector('.sort-button');
    if (!menu.contains(event.target) && !button.contains(event.target)) {
        menu.style.display = 'none';
    }
});

// Sort by field (e.g., date, budget, box office, profit)
function sortBy(field) {
    currentSortingOption = field;
    updateActiveSortOption(); // Mark selected option as active
    toggleSortMenu(); // Close menu after selection

    // Check if a tag is selected, then fetch movies by tag with the updated sort option
    if (selectedTag) {
        fetchMoviesByTag(selectedTag.textContent);
    } else {
        searchMovie(); // Otherwise, update results based on current search query
    }
}

// Set sort order (ascending or descending)
function setSortOrder(order) {
    currentSortOrder = order;
    updateActiveSortOrder(); // Mark selected order as active
    toggleSortMenu(); // Close menu after selection

    // Check if a tag is selected, then fetch movies by tag with the updated sort order
    if (selectedTag) {
        fetchMoviesByTag(selectedTag.textContent);
    } else {
        searchMovie(); // Otherwise, update results based on current search query
    }
}


// Helper function to mark the active sort option
function updateActiveSortOption() {
    document.querySelectorAll('.sort-options div').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`.sort-options div[onclick="sortBy('${currentSortingOption}')"]`).classList.add('active');
}

// Helper function to mark the active sort order
function updateActiveSortOrder() {
    document.querySelectorAll('.sort-order div').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`.sort-order div[onclick="setSortOrder('${currentSortOrder}')"]`).classList.add('active');
}

// Initial setup to mark the default options as active
window.onload = function() {
    updateActiveSortOption();
    updateActiveSortOrder();
};
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
    await fetchMovies({ query });
    swiper.slideTo(0, 0);
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
    // Deselect the previously selected tag, if any
    if (selectedTag) {
        selectedTag.classList.add('previously-selected');
        selectedTag.classList.remove('active-tag');
    }

    // Set the new selected tag
    selectedTag = tagElement;
    selectedTag.classList.add('active-tag');
    selectedTag.classList.remove('previously-selected');

    // Fetch movies by tag and reset the carousel to the first slide
    await fetchMoviesByTag(tag);
    swiper.slideTo(0, 0); // Reset carousel to the first slide without animation
}


// Clear selected tag styling
function clearSelectedTag() {
    if (selectedTag) {
        selectedTag.classList.remove('active-tag');
        selectedTag.style.color = '#fffff';
        selectedTag = null;
    }
}


// Fetch movies by tag and apply the selected sort option
async function fetchMoviesByTag(tag) {
    await fetchMovies({ tag });
}

function limitResults() {
    const nResultsDropdown = document.getElementById('n-results');
    const selectedLimit = parseInt(nResultsDropdown.value, 10);
    updateCarousel(selectedLimit);
}

const swiper = new Swiper('.swiper-container', {
    slidesPerView: 5,          // Show 3 slides at a time
    spaceBetween: 5,          // Space between slides
    centeredSlides: false,     // Disable centering to prevent starting in the middle
    loop: false,               // Disable looping for sequential slide presentation
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    breakpoints: {
        768: {
            slidesPerView: 5,
        },
        480: {
            slidesPerView: 1,
        },
    },
});




async function fetchMovies({ query = '', tag = '', sort_by = currentSortingOption, order = currentSortOrder } = {}) {
    try {
        // Build the endpoint with optional query and tag parameters
        let endpoint = `/search_disney_movie?sort_by=${encodeURIComponent(sort_by)}&order=${encodeURIComponent(order)}`;
        
        if (query) {
            endpoint += `&query=${encodeURIComponent(query)}`;
        }
        if (tag) {
            endpoint = `/search_by_tag?tag=${encodeURIComponent(tag)}`;
        }

        const response = await fetch(endpoint);
        const data = await response.json();

        // Apply client-side sorting based on the selected sorting option
        const filteredMovies = filterMoviesByDate(data);
        sortMovies(filteredMovies);

        // Apply the results limit
        const limitedMovies = nResultsLimit ? filteredMovies.slice(0, nResultsLimit) : filteredMovies;
        displayMovies(limitedMovies); // Display the sorted and limited movies
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

// Function to display movies in the carousel
function displayMovies(movies) {
    carousel.innerHTML = ''; // Clear previous movies
    movies.forEach(movie => {
        const slide = document.createElement('div');
        slide.classList.add('swiper-slide');

        slide.innerHTML = `
            <div class="card">
                <img src="${movie.image_path}" alt="${movie.title}" />
                <div class="info">
                    <h1>${movie.title}</h1>
                    <h2>${movie.release_year} ● ${movie.running_time} minutes<br>${movie.genre.join(' ● ')}</h2>
                    <h2><span class="smaller-text"><i>${movie.tags.join(' ○ ')}</i></span><br></h2>
                    <p>
                        ${movie.summary}
                    </p>
                </div>
            </div>`;
        carousel.appendChild(slide);
    });

    swiper.slideTo(0, 0); // Reset carousel to the first slide
    swiper.update(); // Update Swiper to recognize new slides
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

function sortMovies(movies) {
    const sortBy = currentSortingOption;

    movies.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'release_date') {
            comparison = new Date(b.release_date) - new Date(a.release_date);
        } else if (sortBy === 'budget') {
            comparison = b.budget - a.budget;
        } else if (sortBy === 'box_office') {
            comparison = b.box_office - a.box_office;
        } else if (sortBy === 'profit') {
            comparison = b.profit - a.profit;
        }

        return currentSortOrder === 'ascending' ? comparison * -1 : comparison;
    });
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
