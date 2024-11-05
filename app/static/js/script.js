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
let currentSortingOption = 'release_date'; // Default sorting field
let currentSortOrder = 'descending'; // Default sorting order
let nResultsLimit = null; // Default limit for results
let dateFilterValue = 'all_years'; // Default date filter
let openMenu = null; // Track the currently open menu
let fetchedMovies = []; // Store fetched movies globally


function closeAllMenus() {
    const menuIds = ['sortMenu', 'dateMenu', 'resultsMenu'];
    menuIds.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}
// Toggle filters row visibility
function toggleFilters() {
    filtersRow.style.display = filtersRow.style.display === "flex" ? "none" : "flex";
}

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

// Close menus if clicking outside of them
window.addEventListener('click', function(event) {
    setTimeout(function() {
        const menuIds = ['sortMenu', 'dateMenu', 'resultsMenu'];
        const buttonSelectors = [
            '#sorting-container .sort-button',
            '#date-filter-container .filter-button',
            '#n-results-container .filter-button'
        ];

        menuIds.forEach((id, index) => {
            const menu = document.getElementById(id);
            const button = document.querySelector(buttonSelectors[index]);
            if (!menu.contains(event.target) && !button.contains(event.target)) {
                menu.style.display = 'none';
            }
        });
    }, 0);
});
// Sort by field (e.g., date, budget, box office, profit)
function sortBy(field) {
    currentSortingOption = field;
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
    document.querySelector(`.sort-options div[onclick="sortBy('${currentSortingOption}')"]`).classList.add('active');
}

// Helper function to mark the active sort order
function updateActiveSortOrder() {
    document.querySelectorAll('.sort-order div').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`.sort-order div[onclick="setSortOrder('${currentSortOrder}')"]`).classList.add('active');
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
    document.querySelector(`#dateMenu div[onclick="setDateFilter('${dateFilterValue}')"]`).classList.add('active');
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
    document.querySelector(`#resultsMenu div[onclick="setResultsLimit('${value}')"]`).classList.add('active');
}

// Initial setup
window.onload = function() {
    updateActiveSortOption();
    updateActiveSortOrder();
    updateActiveDateOption();
    updateActiveResultsOption();
    fetchTags();
};

function showAllMovies() {
    searchText.value = ''; // Clear any existing text in the search box
    clearSelectedTag(); // Clear any selected tags
    fetchMovies({ query: '' }); // Trigger search with an empty query
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

    await fetchMoviesByTag(tag);
    swiper.slideTo(0, 0);
}

// Clear selected tag styling
function clearSelectedTag() {
    if (selectedTag) {
        selectedTag.classList.remove('active-tag');
        selectedTag.style.color = '#fffff';
        selectedTag = null;
    }
}

// Search movie function
async function searchMovie() {
    const query = searchText.value.trim();
    if (query === "") return;
    clearSelectedTag();
    await fetchMovies({ query });
    swiper.slideTo(0, 0);
}


// Fetch movies by tag
async function fetchMoviesByTag(tag) {
    await fetchMovies({ tag });
}


const swiper = new Swiper('.swiper-container', {
    slidesPerView: 5,                 // Number of slides to show at once when there are more than 5 slides
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

function showAllMovies() {
    searchText.value = ''; // Clear any existing text in the search box
    clearSelectedTag(); // Clear any selected tags
    fetchMovies({ 
        query: '', 
        sort_by: currentSortingOption, 
        order: currentSortOrder, 
        date_filter: dateFilterValue, 
        results_limit: nResultsLimit 
    });
}

function fetchMoviesWithCurrentFilters() {
    fetchMovies({ 
        query: searchText.value.trim(), 
        sort_by: currentSortingOption, 
        order: currentSortOrder, 
        date_filter: dateFilterValue, 
        results_limit: nResultsLimit 
    });
}

async function fetchMovies({ query = '', tag = '' } = {}) {
    try {
        // Fetch all movies without sorting or filtering
        let endpoint = `/search_disney_movie?query=${encodeURIComponent(query)}`;
        if (tag) {
            endpoint = `/search_by_tag?tag=${encodeURIComponent(tag)}`;
        }

        const response = await fetch(endpoint);
        const data = await response.json();
        fetchedMovies = data; // Store fetched movies globally

        // Apply filters, sort, and limit after fetching
        applyFiltersAndDisplay();
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

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

// Trigger search on Enter key press
searchText.addEventListener('keypress', (event) => {
    if (event.key === 'Enter'){
        searchMovie();
    } 
});