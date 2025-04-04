/**
 * stepNavigation.js
 * Handles the navigation between lesson steps, including UI updates for
 * step indicators, progress bar, and navigation buttons.
 */

// DOM Element References
const stepIndicators = document.querySelectorAll('.step-indicator');
const progressBar = document.querySelector('.progress-bar');
const prevButton = document.querySelector('.btn-prev-step');
const nextButton = document.querySelector('.btn-next-step');
const totalSteps = stepIndicators.length;

/**
 * Finds which step is currently marked as active in the UI.
 * @returns {number} The index of the active step (0-based), or -1 if none found.
 */
function findActiveStepIndex() {
    let activeIndex = -1;
    stepIndicators.forEach((step, index) => {
        if (step.classList.contains('active')) {
            activeIndex = index;
        }
    });
    return activeIndex;
}

/**
 * Updates all UI elements related to step navigation to reflect the current step.
 * @param {number} targetStepIndex - The index of the step to mark as active.
 */
function updateStepNavigationUI(targetStepIndex) {
    if (targetStepIndex === -1) return; // Should not happen if initialized correctly

    // Update step indicators in the footer
    stepIndicators.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        step.querySelector('i').className = 'fas fa-lock'; // Default to locked
        step.classList.add('locked'); // Start as locked

        if (index < targetStepIndex) {
            // Previous steps marked as completed
            step.classList.remove('locked');
            step.classList.add('completed');
            step.querySelector('i').className = 'fas fa-check';
        } else if (index === targetStepIndex) {
            // Current step marked as active
            step.classList.remove('locked');
            step.classList.add('active');
            step.querySelector('i').className = 'fas fa-play';
        }
        // Else: Future steps remain locked
    });

    // Update Progress Bar to reflect current step position
    const progressPercentage = totalSteps > 0 ? ((targetStepIndex + 1) / totalSteps) * 100 : 0;
    progressBar.style.width = `${progressPercentage}%`;
    console.log(`Progress updated: ${targetStepIndex + 1}/${totalSteps} (${progressPercentage.toFixed(1)}%)`);

    // Enable/disable navigation buttons based on current position
    prevButton.disabled = targetStepIndex === 0;
    nextButton.disabled = targetStepIndex === totalSteps - 1;
}

/**
 * Advances to the next step if possible.
 * Updates UI and would load next step content.
 */
function navigateToNextStep() {
    const currentIndex = findActiveStepIndex();
    if (currentIndex < totalSteps - 1) {
        const nextIndex = currentIndex + 1;
        updateStepNavigationUI(nextIndex);
        // TODO: Add logic here to load content for the next step
        loadStepContent(nextIndex);
        console.log(`Navigated to Step ${nextIndex + 1}`);
    }
}

/**
 * Returns to the previous step if possible.
 * Updates UI and would load previous step content.
 */
function navigateToPreviousStep() {
    const currentIndex = findActiveStepIndex();
    if (currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        updateStepNavigationUI(prevIndex);
        // TODO: Add logic here to load content for the previous step
        loadStepContent(prevIndex);
        console.log(`Returned to Step ${prevIndex + 1}`);
    }
}

/**
 * Loads the appropriate content for the specified step.
 * This is a placeholder for future implementation.
 * @param {number} stepIndex - The index of the step to load content for.
 */
function loadStepContent(stepIndex) {
    // This function will be implemented later to load the actual content
    // for each lesson step (e.g., updating the activity area, instructions, etc.)
    console.log(`Loading content for Step ${stepIndex + 1}...`);
}

/**
 * Initializes the step navigation system.
 * Sets the initial active step and attaches event listeners.
 */
function initializeStepNavigation() {
    // Find which step is currently active in the HTML
    const initialIndex = findActiveStepIndex();
    
    if (initialIndex !== -1) {
        // If a step is already marked active, ensure UI consistency
        updateStepNavigationUI(initialIndex);
    } else if (totalSteps > 0) {
        // If no step is active initially, default to the first step
        console.warn("No initial active step found. Activating Step 1.");
        updateStepNavigationUI(0);
    } else {
        console.error("Cannot initialize navigation: No step indicators found.");
        return;
    }

    // Attach event listeners to navigation buttons
    nextButton.addEventListener('click', navigateToNextStep);
    prevButton.addEventListener('click', navigateToPreviousStep);
    
    console.log(`Step navigation initialized with ${totalSteps} total steps.`);
}

// Initialize step navigation when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeStepNavigation);

// Export functions for potential use by other modules
export {
    navigateToNextStep,
    navigateToPreviousStep,
    updateStepNavigationUI,
    loadStepContent
}; 