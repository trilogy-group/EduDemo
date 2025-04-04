/**
 * main.js
 * Main entry point for the Learning Buddy lesson application.
 * Coordinates initialization of different application components.
 */

// Import modules (future implementation with proper module bundling)
// import { initializeStepNavigation } from './stepNavigation.js';

/**
 * Initialize the complete lesson application.
 * Acts as the central coordinator for all lesson components.
 */
function initializeLesson() {
    console.log('Initializing Learning Buddy lesson...');
    
    // For now the initialization is handled directly in stepNavigation.js
    // In the future, we'll use proper module imports and initialize each component here
    
    // Example of future initialization pattern:
    // initializeStepNavigation();
    // initializeClockActivities();
    // initializeAudio();
    // etc.
}

// Initialize everything when the page is loaded
document.addEventListener('DOMContentLoaded', initializeLesson); 