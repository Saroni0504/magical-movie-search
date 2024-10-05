let currentSlide = 0;

async function searchMovie() {
    const searchText = document.getElementById('searchText').value;
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = 'Loading movies...';

    try {
        // Fetch movie results from FastAPI endpoint
        const response = await fetch(`/search_disney_movie?query=${encodeURIComponent(searchText)}`);
        const data = await response.json();

        // Clear any previous results
        carousel.innerHTML = '';

        // Iterate over each movie and create a slide for each
        data.forEach(movie => {
            const { result, release_year, genre, tags, summary, image_path } = movie;

            // Create a slide div
            const slide = document.createElement('div');
            slide.classList.add('carousel-slide');

            // Add movie details to the slide with a frame around the image on the left and text on the right
            slide.innerHTML = `
                <div class="movie-container">
                    <div class="movie-details">
                        <div class="movie-title">${result}</div>
                        <div class="movie-release-year"><strong>Release Year:</strong> ${release_year}</div>
                        <div class="movie-genre"><strong>Genre:</strong> ${genre.join(', ')}</div>
                        <div class="movie-tags"><strong>Tags:</strong> ${tags.join(', ')}</div>
                        <div class="movie-summary">${summary}</div>
                    </div>
                    <div class="movie-image-container">
                        <img src="${image_path}" alt="${result}" class="movie-image-path">
                    </div>
                </div>
            `;

            // Append the slide to the carousel
            carousel.appendChild(slide);
        });

        // Reset the slide position
        currentSlide = 0;
        updateCarousel();

    } catch (error) {
        carousel.innerHTML = 'An error occurred: ' + error.message;
        console.error('Fetch error:', error);
    }
}


// Add event listener for the Enter key
document.getElementById('searchText').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        searchMovie(); // Call the search function on Enter key press
    }
});

// Function to go to the previous slide
function prevSlide() {
    const totalSlides = document.querySelectorAll('.carousel-slide').length;
    currentSlide = (currentSlide > 0) ? currentSlide - 1 : totalSlides - 1;
    updateCarousel();
}

// Function to go to the next slide
function nextSlide() {
    const totalSlides = document.querySelectorAll('.carousel-slide').length;
    currentSlide = (currentSlide < totalSlides - 1) ? currentSlide + 1 : 0;
    updateCarousel();
}

// Function to update the carousel position
function updateCarousel() {
    const carousel = document.getElementById('carousel');
    const slideWidth = document.querySelector('.carousel-slide').offsetWidth;
    carousel.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
}
