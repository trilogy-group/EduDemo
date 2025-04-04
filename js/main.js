/*
 * Main Application Entry Point
 * Initializes and coordinates the Learning Buddy application
 */

// p5.js canvas instance
let canvas;

// Application state
let appState = {
    appInitialized: false,
    canvasInitialized: false,
    lessonLoaded: false
};

// Initialize the application
function initializeApp() {
    console.log("Initializing Learning Buddy application...");
    
    // Add avatar placeholder if image is missing
    const avatar = document.querySelector('.avatar img');
    if (avatar) {
        avatar.onerror = function() {
            // Simple data URI for a blue square with "J" text
            this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%236a4fed" /><text x="50%" y="50%" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle">J</text></svg>';
        };
    }
    
    // Add professor placeholder if image is missing
    const professor = document.querySelector('.character img');
    if (professor) {
        professor.onerror = function() {
            // Simple data URI for a green square with "P" text
            this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%2324c486" /><text x="50%" y="50%" font-family="Arial" font-size="36" fill="white" text-anchor="middle" dominant-baseline="middle">P</text></svg>';
        };
    }
    
    // Enable tooltips for step indicators
    const stepIndicators = document.querySelectorAll('.lesson-steps .step');
    stepIndicators.forEach((step, index) => {
        step.title = `Step ${index + 1}`;
    });
    
    // Set up audio button toggle
    const audioButton = document.getElementById('audio-btn');
    if (audioButton) {
        let audioEnabled = true;
        audioButton.addEventListener('click', () => {
            audioEnabled = !audioEnabled;
            if (audioEnabled) {
                audioButton.querySelector('i').className = 'fas fa-volume-up';
            } else {
                audioButton.querySelector('i').className = 'fas fa-volume-mute';
            }
        });
    }
    
    // Set up closed caption button toggle
    const ccButton = document.getElementById('cc-btn');
    if (ccButton) {
        let ccEnabled = false;
        ccButton.addEventListener('click', () => {
            ccEnabled = !ccEnabled;
            ccButton.classList.toggle('active');
        });
    }
    
    // Set up help button
    const helpButton = document.getElementById('help-btn');
    if (helpButton) {
        helpButton.addEventListener('click', showGlossary);
    }
    
    // Adjust container height to fit window
    adjustContainerHeight();
    window.addEventListener('resize', adjustContainerHeight);
    
    appState.appInitialized = true;
    
    console.log("Application initialized successfully");
}

// Adjust container height based on window size
function adjustContainerHeight() {
    const container = document.querySelector('.app-container');
    if (container) {
        container.style.height = window.innerHeight + 'px';
    }
}

// Show the glossary popup
function showGlossary() {
    // Create glossary container if it doesn't exist
    let glossaryContainer = document.getElementById('glossary-container');
    
    if (!glossaryContainer) {
        glossaryContainer = document.createElement('div');
        glossaryContainer.id = 'glossary-container';
        glossaryContainer.className = 'glossary-popup';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'glossary-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Glossary';
        header.appendChild(title);
        
        const closeButton = document.createElement('button');
        closeButton.className = 'glossary-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', hideGlossary);
        header.appendChild(closeButton);
        
        glossaryContainer.appendChild(header);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'glossary-content';
        
        // Add glossary terms
        for (const term in glossary) {
            const termElement = document.createElement('div');
            termElement.className = 'glossary-term';
            
            const termTitle = document.createElement('h4');
            termTitle.textContent = term;
            termElement.appendChild(termTitle);
            
            const termDefinition = document.createElement('p');
            termDefinition.textContent = glossary[term];
            termElement.appendChild(termDefinition);
            
            content.appendChild(termElement);
        }
        
        glossaryContainer.appendChild(content);
        
        // Add to document
        document.body.appendChild(glossaryContainer);
    }
    
    // Show the glossary
    glossaryContainer.style.display = 'block';
    
    // Add event listener to close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', closeGlossaryOutside);
    }, 100);
}

// Hide the glossary popup
function hideGlossary() {
    const glossaryContainer = document.getElementById('glossary-container');
    if (glossaryContainer) {
        glossaryContainer.style.display = 'none';
        document.removeEventListener('click', closeGlossaryOutside);
    }
}

// Close glossary when clicking outside
function closeGlossaryOutside(event) {
    const glossaryContainer = document.getElementById('glossary-container');
    if (glossaryContainer && !glossaryContainer.contains(event.target)) {
        hideGlossary();
    }
}

// Add a term to the glossary if it's not already there
function addToGlossary(term) {
    if (glossary[term]) {
        // Highlight the term in the glossary
        const termElement = document.querySelector(`.glossary-term h4[data-term="${term}"]`);
        if (termElement) {
            termElement.classList.add('highlight');
            setTimeout(() => {
                termElement.classList.remove('highlight');
            }, 2000);
        }
    }
}

// Window load event
window.addEventListener('load', () => {
    initializeApp();
    
    // Initialize interaction handlers (defined in interactions.js)
    if (typeof initializeInteractions === 'function') {
        initializeInteractions();
    }
}); 