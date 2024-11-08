// DOM elements
const searchText = document.getElementById('searchText');
const carousel = document.getElementById('carousel');
const tagContainer = document.querySelector('.tag-container');
const showMoreButton = document.querySelector('.plus-circle');
const filtersRow = document.getElementById('filtersRow');

let selectedTag = null;  // Track selected tag
let allTags = [];        // Store all tags from backend
let currentTagIndex = 0; // Track the current set of displayed tags
const TAGS_PER_BATCH = 10; // Number of tags per batch for display
let currentSortingOption = 'relevancy'; // Default sorting field
let currentSortOrder = 'descending'; // Default sorting order
let nResultsLimit = null; // Default limit for results
let dateFilterValue = 'all_years'; // Default date filter
let openMenu = null; // Track the currently open menu
let fetchedMovies = []; // Store fetched movies globally

// Initialize Swiper carousel
const swiper = new Swiper('.swiper-container', {
    slidesPerView: 7,                 // Number of slides to show at once when there are more than 5 slides
    spaceBetween: 5,
    centeredSlides: false,            // Do not center slides by default
    centerInsufficientSlides: true,   // Automatically center slides if they are fewer than slidesPerView
    loop: false,
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    watchOverflow: true,              // Hide navigation if slides are insufficient to scroll
});

// Close all dropdown menus
function closeAllMenus() {
    const menuIds = ['sortMenu', 'dateMenu', 'resultsMenu'];
    menuIds.forEach(id => {
        const menu = document.getElementById(id);
        if (menu) {
            menu.style.display = 'none';
        }
    });
}

// Toggle filters row visibility
function toggleFilters() {
    filtersRow.style.display = filtersRow.style.display === "flex" ? "none" : "flex";
}

// Toggle specific menu visibility
function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
        openMenu = null;
    } else {
        closeAllMenus();
        menu.style.display = 'block';
        openMenu = menu;
    }
}

// Toggle the visibility of the sort menu
function toggleSortMenu() {
    toggleMenu('sortMenu');
}

// Toggle the visibility of the date menu
function toggleDateMenu() {
    toggleMenu('dateMenu');
}

// Toggle the visibility of the results menu
function toggleResultsMenu() {
    toggleMenu('resultsMenu');
}

// Close menus if clicking outside of them
document.addEventListener('click', function(event) {
    const isClickInsideFilter = ['dateMenu', 'sortMenu', 'resultsMenu'].some(menuId => {
        const menu = document.getElementById(menuId);
        return menu && menu.contains(event.target);
    });

    const isClickOnFilterButton = [
        document.querySelector('#date-filter-container .filter-button'),
        document.querySelector('#sorting-container .sort-button'),
        document.querySelector('#n-results-container .filter-button')
    ].some(button => button && button.contains(event.target));

    if (!isClickInsideFilter && !isClickOnFilterButton && openMenu) {
        openMenu.style.display = 'none';
        openMenu = null;
    }
});

// Sort by field (e.g., date, budget, box office, profit, relevancy)
function sortBy(field) {
    currentSortingOption = field;
    
    // If the selected sort option is 'relevancy', enforce descending order
    if (field === 'relevancy') {
        currentSortOrder = 'descending';
        updateActiveSortOrder(); // Update UI to show 'Descending' as active
    }
    
    updateActiveSortOption(); // Mark selected option as active
    applyFiltersAndDisplay(); // Apply filters and display

    if (selectedTag) {
        fetchMoviesByTag(selectedTag.textContent);
    } else {
        searchMovie();
    }
}

// Set sort order (ascending or descending)
function setSortOrder(order) {
    currentSortOrder = order;
    updateActiveSortOrder(); // Mark selected order as active
    applyFiltersAndDisplay(); // Apply filters and display
    if (selectedTag) {
        fetchMoviesByTag(selectedTag.textContent);
    } else {
        searchMovie();
    }
}

// Helper function to mark the active sort option
function updateActiveSortOption() {
    document.querySelectorAll('.sort-options div').forEach(option => {
        option.classList.remove('active');
    });
    const activeSortOption = document.querySelector(`.sort-options div[onclick="sortBy('${currentSortingOption}')"]`);
    if (activeSortOption) {
        activeSortOption.classList.add('active');
    }
}

// Helper function to mark the active sort order
function updateActiveSortOrder() {
    document.querySelectorAll('.sort-order div').forEach(option => {
        option.classList.remove('active');
    });
    const activeSortOrder = document.querySelector(`.sort-order div[onclick="setSortOrder('${currentSortOrder}')"]`);
    if (activeSortOrder) {
        activeSortOrder.classList.add('active');
    }
}

// Set date filter
function setDateFilter(value) {
    dateFilterValue = value;
    updateActiveDateOption(); // Mark selected option as active
    toggleDateMenu();
    applyFiltersAndDisplay(); // Apply filters and display

    if (selectedTag) {
        fetchMoviesByTag(selectedTag.textContent);
    } else {
        searchMovie();
    }
}

// Helper function to mark the active date option
function updateActiveDateOption() {
    document.querySelectorAll('#dateMenu div').forEach(option => {
        option.classList.remove('active');
    });
    const activeDateOption = document.querySelector(`#dateMenu div[onclick="setDateFilter('${dateFilterValue}')"]`);
    if (activeDateOption) {
        activeDateOption.classList.add('active');
    }
}

// Set results limit
function setResultsLimit(value) {
    nResultsLimit = value === 'all' ? null : parseInt(value);
    updateActiveResultsOption();
    toggleResultsMenu();
    applyFiltersAndDisplay(); // Apply filters and display

    // Display limited results without refetching
    displayMovies(nResultsLimit ? fetchedMovies.slice(0, nResultsLimit) : fetchedMovies);
}

// Helper function to mark the active results option
function updateActiveResultsOption() {
    document.querySelectorAll('#resultsMenu div').forEach(option => {
        option.classList.remove('active');
    });
    const value = nResultsLimit === null ? 'all' : nResultsLimit.toString();
    const activeResultsOption = document.querySelector(`#resultsMenu div[onclick="setResultsLimit('${value}')"]`);
    if (activeResultsOption) {
        activeResultsOption.classList.add('active');
    }
}

// Initial setup on window load
window.onload = function() {
    updateActiveSortOption();
    updateActiveSortOrder();
    updateActiveDateOption();
    updateActiveResultsOption();
    fetchTags();
};

// Show all movies with an empty query and is_tag set to false
function showAllMovies() {
    searchText.value = ''; // Clear any existing text in the search box
    clearSelectedTag(); // Clear any selected tags
    fetchMovies({ query: '', is_tag: false }); // Call endpoint with empty query
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
    if (selectedTag) {
        selectedTag.classList.add('previously-selected');
        selectedTag.classList.remove('active-tag');
    }

    selectedTag = tagElement;
    selectedTag.classList.add('active-tag');
    selectedTag.classList.remove('previously-selected');

    // Set the search bar text to the selected tag's name
    searchText.value = tag;

    await fetchMoviesByTag(tag);
    swiper.slideTo(0, 0);
}

// Clear selected tag styling
function clearSelectedTag() {
    if (selectedTag) {
        selectedTag.classList.remove('active-tag');
        selectedTag.classList.remove('previously-selected');
        selectedTag = null;
    }
}

// Search movie function triggered by Enter key or search button
async function searchMovie() {
    const query = searchText.value.trim();
    if (query === "") return;
    clearSelectedTag();
    await fetchMovies({ query: query, is_tag: false });
    swiper.slideTo(0, 0);
}

// Fetch movies by tag
async function fetchMoviesByTag(tag) {
    await fetchMovies({ query: tag, is_tag: true });
}

// Unified fetch function to interact with /search_relevancy endpoint
async function fetchMovies({ query = '', is_tag = false } = {}) {
    try {
        // Construct query parameters
        const params = new URLSearchParams({
            query: query,
            is_tag: is_tag
        });

        const endpoint = `/search_relevancy?${params.toString()}`;
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        fetchedMovies = data; // Store fetched movies globally

        // Apply frontend filters, sort, and limit after fetching
        applyFiltersAndDisplay();
    } catch (error) {
        console.error('Error fetching movies:', error);
        fetchedMovies = []; // Clear fetchedMovies on error
        displayMovies([]);
    }
}

// Apply filters, sort, and limit to the fetched movies and display them
function applyFiltersAndDisplay() {
    // Step 1: Apply date filter
    let filteredMovies = filterMoviesByDate(fetchedMovies);

    // Step 2: Sort the movies
    sortMovies(filteredMovies);

    // Step 3: Limit results if needed
    const limitedMovies = nResultsLimit ? filteredMovies.slice(0, nResultsLimit) : filteredMovies;

    // Display the movies
    displayMovies(limitedMovies);
}

// Function to display movies in the carousel
function displayMovies(movies) {
    const noResultsMessage = document.getElementById('noResultsMessage');
    const swiperContainer = document.getElementById('swiperContainer');

    if (movies.length === 0) {
        // No results found
        swiperContainer.style.display = 'none';
        noResultsMessage.style.display = 'block';
    } else {
        // Results found
        swiperContainer.style.display = 'block';
        noResultsMessage.style.display = 'none';
    }

    carousel.innerHTML = '';
    movies.forEach(movie => {
        const slide = document.createElement('div');
        slide.classList.add('swiper-slide');

        // Set the inner HTML of the slide
        slide.innerHTML = `
            <div class="card">
                <img src="${movie.image_path}" alt="${movie.title}" />
                <div class="info">
                    <h1>${movie.title}</h1>
                    <h2>${movie.release_year} ● ${movie.running_time} minutes<br>${movie.genre.join(' ● ')}</h2>
                    <h2><span class="smaller-text">${movie.tags.join(' ○ ')}</span><br></h2>
                    <p>
                        ${movie.summary}
                    </p>
                </div>
            </div>`;

        // Access the .card element within the slide
        const card = slide.querySelector('.card');

        // Add event listener to reset scroll position on mouse leave
        card.addEventListener('mouseleave', () => {
            const info = card.querySelector('.info');
            info.scrollTop = 0; // Reset scroll position to top
        });

        // Append the slide to the carousel
        carousel.appendChild(slide);
    });

    swiper.slideTo(0, 0);
    swiper.update();
}

// Filter movies based on the selected date filter
function filterMoviesByDate(movies) {
    const today = new Date();

    return movies.filter(movie => {
        const releaseDate = new Date(movie.release_date);

        if (dateFilterValue === "all_years") {
            return true;
        } else if (dateFilterValue === "past_year") {
            const pastYearDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            return releaseDate >= pastYearDate;
        } else if (dateFilterValue === "past_decade") {
            const pastDecadeDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
            return releaseDate >= pastDecadeDate;
        }

        return false;
    });
}

// Sort movies based on the current sorting option and order
function sortMovies(movies) {
    const sortByField = currentSortingOption;

    movies.sort((a, b) => {
        let comparison = 0;
        if (sortByField === 'release_date') {
            comparison = new Date(b.release_date) - new Date(a.release_date);
        } else if (sortByField === 'budget') {
            comparison = b.budget - a.budget;
        } else if (sortByField === 'box_office') {
            comparison = b.box_office - a.box_office;
        } else if (sortByField === 'profit') {
            comparison = b.profit - a.profit;
        } else if (sortByField === 'relevancy') {
            comparison = b.relevancy - a.relevancy; 
        }

        return currentSortOrder === 'ascending' ? comparison * -1 : comparison;
    });
}

// Trigger search on Enter key press
searchText.addEventListener('keypress', (event) => {
    if (event.key === 'Enter'){
        searchMovie();
    } 
});
