/**
 * main.js
 * Main entry point for the EduSpark clock lesson application.
 * Initializes page components and UI elements.
 */

/**
 * Initialize the lesson page.
 * Handles page-specific setup and initialization.
 */
function initializeLesson() {
    console.log('Initializing EduSpark lesson page...');
    
    // Initialize progress bar based on current page
    updateProgressBar();
    
    // Future enhancements could include:
    // - Loading interactive clock elements
    // - Setting up audio controls
    // - Initializing accessibility features
}

/**
 * Updates the progress bar based on the current page.
 */
function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    let progressPercentage = 0;
    
    // Determine which page we're on based on the URL or document title
    const currentPath = window.location.pathname;
    const pageTitle = document.title;
    
    if (currentPath.includes('index.html') || currentPath.endsWith('/')) {
        // Warm-up page (first page)
        progressPercentage = 20;
    } else if (currentPath.includes('learn-it.html') || pageTitle.includes('Learn It')) {
        progressPercentage = 40;
    } else if (currentPath.includes('try-it.html') || pageTitle.includes('Try It')) {
        progressPercentage = 60;
    } else if (currentPath.includes('do-it.html') || pageTitle.includes('Do It')) {
        progressPercentage = 80;
    } else if (currentPath.includes('show-it.html') || pageTitle.includes('Show It')) {
        progressPercentage = 100;
    }
    
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
        console.log(`Progress updated: ${progressPercentage}%`);
    }
}

// Initialize everything when the page is loaded
document.addEventListener('DOMContentLoaded', initializeLesson); 