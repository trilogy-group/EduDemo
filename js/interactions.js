/*
 * Interactions Handler
 * Manages user interactions and connects UI with lesson content
 */

// Track interaction state
let interactionState = {
    isWaitingForAnswer: false,
    currentType: null,
    correctAnswer: null,
    attempts: 0,
    isHandDragging: false,
    isArrowDragging: false,
    dragTarget: null,
    keypadActive: false,
    selectedInputBox: null
};

// UI Elements (set in initializeInteractions)
let tryAgainButton;
let skipButton;
let nextButton;
let currentInstructionText;
let taskDescriptionText;
let interactiveContainer;
let feedbackMessage;

// Initialize interaction handlers
function initializeInteractions() {
    // Get UI elements
    tryAgainButton = document.getElementById('try-again-btn');
    skipButton = document.getElementById('skip-btn');
    nextButton = document.getElementById('next-btn');
    currentInstructionText = document.getElementById('current-instruction');
    taskDescriptionText = document.getElementById('task-description');
    interactiveContainer = document.getElementById('interactive-container');
    
    // Set up button event listeners
    tryAgainButton.addEventListener('click', handleTryAgain);
    skipButton.addEventListener('click', handleSkip);
    nextButton.addEventListener('click', handleNext);
    
    // Set initial button states
    updateButtonStates();
    
    // Load first step
    loadCurrentStep();
}

// Load the current lesson step
function loadCurrentStep() {
    const currentStep = getCurrentStep();
    
    // Update instruction text
    currentInstructionText.textContent = currentStep.instruction;
    taskDescriptionText.textContent = currentStep.taskDescription;
    
    // Update clock state based on step
    updateClockState(currentStep.state);
    
    // Set up interaction based on type
    setupInteraction(currentStep);
    
    // Update UI elements
    updateStepIndicators();
    updateButtonStates();
}

// Set up interaction based on step type
function setupInteraction(step) {
    // Reset previous interaction state
    resetInteractionState();
    
    // Clear any previous content in the interactive area
    clearInteractiveArea();
    
    // Set current interaction type
    interactionState.currentType = step.state.type;
    
    // Set up based on interaction type
    switch (step.state.type) {
        case 'number-input':
            setupNumberInput(step.state);
            break;
            
        case 'click-target':
            setupClickTarget(step.state);
            break;
            
        case 'click-hand':
            setupClickHand(step.state);
            break;
            
        case 'click-arrow':
            setupClickArrow(step.state);
            break;
            
        case 'yes-no':
            setupYesNo(step.state);
            break;
            
        case 'drag-arrow':
            setupDragArrow(step.state);
            break;
            
        case 'animation':
            // No specific setup needed beyond what updateClockState does
            break;
    }
}

// Reset the interaction state
function resetInteractionState() {
    interactionState = {
        isWaitingForAnswer: false,
        currentType: null,
        correctAnswer: null,
        attempts: 0,
        isHandDragging: false,
        isArrowDragging: false,
        dragTarget: null,
        keypadActive: false,
        selectedInputBox: null
    };
}

// Clear the interactive area
function clearInteractiveArea() {
    // Remove any dynamically created elements
    while (interactiveContainer.firstChild) {
        interactiveContainer.removeChild(interactiveContainer.firstChild);
    }
    
    // Remove any feedback messages
    if (document.querySelector('.feedback-message')) {
        document.querySelector('.feedback-message').remove();
    }
}

// Create and show feedback message
function showFeedback(message, isCorrect) {
    // Remove any existing feedback
    if (document.querySelector('.feedback-message')) {
        document.querySelector('.feedback-message').remove();
    }
    
    // Create feedback element
    feedbackMessage = document.createElement('div');
    feedbackMessage.className = `feedback-message ${isCorrect ? 'success-message' : 'error-message'}`;
    feedbackMessage.textContent = message;
    
    // Add to container
    interactiveContainer.appendChild(feedbackMessage);
    
    // If correct, mark step as completed
    if (isCorrect) {
        completeCurrentStep();
        nextButton.disabled = false;
    }
}

// Handle button clicks
function handleTryAgain() {
    // Reset the current interaction
    loadCurrentStep();
}

function handleSkip() {
    // Skip to next step without marking as completed
    if (goToNextStep()) {
        loadCurrentStep();
    }
}

function handleNext() {
    // Move to next step
    if (goToNextStep()) {
        loadCurrentStep();
    }
}

// Update UI to reflect current state
function updateButtonStates() {
    const currentStep = getCurrentStep();
    
    // Try Again button - enabled when an interaction has started
    tryAgainButton.disabled = !interactionState.attempts;
    
    // Skip button - always enabled
    skipButton.disabled = false;
    
    // Next button - enabled when step is completed
    nextButton.disabled = !lessonProgress.completedSteps.includes(currentStep.id);
}

function updateStepIndicators() {
    // Get all step indicators
    const stepIndicators = document.querySelectorAll('.lesson-steps .step');
    
    // Current step index (0-based)
    const currentIndex = currentStepIndex;
    
    // Update each indicator
    stepIndicators.forEach((indicator, index) => {
        // Remove all classes first
        indicator.classList.remove('active', 'current', 'locked');
        
        // Add appropriate class
        if (index < currentIndex) {
            indicator.classList.add('active'); // Completed steps
            indicator.querySelector('i').className = 'fas fa-check';
        } else if (index === currentIndex) {
            indicator.classList.add('current'); // Current step
            indicator.querySelector('i').className = 'fas fa-play';
        } else {
            indicator.classList.add('locked'); // Future steps
            indicator.querySelector('i').className = 'fas fa-lock';
        }
    });
}

// Setup functions for each interaction type
function setupNumberInput(state) {
    interactionState.isWaitingForAnswer = true;
    interactionState.correctAnswer = state.correctAnswers;
    
    // Create input area
    const inputArea = document.createElement('div');
    inputArea.className = 'input-area';
    
    // For each missing number, create an input box
    state.missingNumbers.forEach(number => {
        const inputId = `input-${number}`;
        
        // Create input box
        const inputBox = document.createElement('div');
        inputBox.className = 'number-input-box';
        inputBox.dataset.position = number;
        inputBox.dataset.inputId = inputId;
        inputBox.textContent = '';
        
        // Add click listener to select this input
        inputBox.addEventListener('click', () => {
            selectInputBox(inputBox);
        });
        
        // Add to container
        inputArea.appendChild(inputBox);
    });
    
    // Create keypad if needed
    if (state.showKeypad) {
        const keypad = document.createElement('div');
        keypad.className = 'number-keypad';
        
        // Create 1-9 keys
        for (let i = 1; i <= 9; i++) {
            const key = document.createElement('button');
            key.className = 'keypad-key';
            key.textContent = i;
            key.addEventListener('click', () => {
                handleKeypadInput(i);
            });
            keypad.appendChild(key);
        }
        
        // Create 0 key
        const zeroKey = document.createElement('button');
        zeroKey.className = 'keypad-key';
        zeroKey.textContent = '0';
        zeroKey.addEventListener('click', () => {
            handleKeypadInput(0);
        });
        keypad.appendChild(zeroKey);
        
        // Add to container
        inputArea.appendChild(keypad);
    }
    
    // Add to interactive container
    interactiveContainer.appendChild(inputArea);
    
    // Enable keypad interaction
    interactionState.keypadActive = true;
}

function selectInputBox(inputBox) {
    // Remove selection from all input boxes
    document.querySelectorAll('.number-input-box').forEach(box => {
        box.classList.remove('selected');
    });
    
    // Add selection to this box
    inputBox.classList.add('selected');
    
    // Update interaction state
    interactionState.selectedInputBox = inputBox;
}

function handleKeypadInput(number) {
    // If no input box is selected, do nothing
    if (!interactionState.selectedInputBox) return;
    
    // Update input box with number
    interactionState.selectedInputBox.textContent = number;
    
    // Check if this answer is correct
    checkNumberInputAnswer();
}

function checkNumberInputAnswer() {
    // Get all input boxes
    const inputBoxes = document.querySelectorAll('.number-input-box');
    let allCorrect = true;
    
    // Check each input
    inputBoxes.forEach(box => {
        const inputId = box.dataset.inputId;
        const userValue = parseInt(box.textContent || '0');
        const correctValue = interactionState.correctAnswer[inputId];
        
        if (userValue === correctValue) {
            box.classList.add('correct');
            box.classList.remove('incorrect');
        } else {
            box.classList.add('incorrect');
            box.classList.remove('correct');
            allCorrect = false;
        }
    });
    
    // Increment attempt counter
    interactionState.attempts++;
    
    // Update feedback and buttons
    if (allCorrect) {
        showFeedback("Perfect! All numbers are correct.", true);
    } else {
        showFeedback("Check your answers. Some numbers are incorrect.", false);
    }
    
    updateButtonStates();
}

function setupClickTarget(state) {
    interactionState.isWaitingForAnswer = true;
    interactionState.correctAnswer = state.correctTarget;
    
    // This interaction uses the clock directly, so just set up the mousePressed handler
    canvas.mousePressed(handleClickTarget);
}

function handleClickTarget() {
    // Only handle clicks if waiting for an answer
    if (!interactionState.isWaitingForAnswer) return;
    
    // Check if a number was clicked
    let clickedNumber = null;
    for (let i = 0; i < clockElements.numbers.length; i++) {
        if (isMouseOverNumber(clockElements.numbers[i].number)) {
            clickedNumber = clockElements.numbers[i].number;
            break;
        }
    }
    
    // If a number was clicked, check if it's correct
    if (clickedNumber !== null) {
        interactionState.attempts++;
        
        if (clickedNumber === interactionState.correctAnswer) {
            // Highlight the correct number
            const numIndex = clockElements.numbers.findIndex(n => n.number === clickedNumber);
            if (numIndex >= 0) {
                clockElements.numbers[numIndex].highlighted = true;
            }
            
            // Show feedback
            showFeedback(getCurrentStep().state.feedback.correct, true);
        } else {
            // Show feedback
            showFeedback(getCurrentStep().state.feedback.incorrect, false);
        }
        
        updateButtonStates();
    }
}

function setupClickHand(state) {
    interactionState.isWaitingForAnswer = true;
    interactionState.correctAnswer = state.correctHand;
    
    // This interaction uses the clock directly, so just set up the mousePressed handler
    canvas.mousePressed(handleClickHand);
}

function handleClickHand() {
    // Only handle clicks if waiting for an answer
    if (!interactionState.isWaitingForAnswer) return;
    
    // Check which hand was clicked
    let clickedHand = null;
    
    if (isMouseOverHourHand()) {
        clickedHand = 'hour';
    } else if (isMouseOverMinuteHand()) {
        clickedHand = 'minute';
    }
    
    // If a hand was clicked, check if it's correct
    if (clickedHand !== null) {
        interactionState.attempts++;
        
        if (clickedHand === interactionState.correctAnswer) {
            // Highlight the correct hand
            if (clickedHand === 'hour') {
                clockState.hourHandHighlighted = true;
                clockState.minuteHandHighlighted = false;
            } else {
                clockState.hourHandHighlighted = false;
                clockState.minuteHandHighlighted = true;
            }
            
            // Show feedback
            showFeedback(getCurrentStep().state.feedback.correct, true);
        } else {
            // Show feedback
            showFeedback(getCurrentStep().state.feedback.incorrect, false);
        }
        
        updateButtonStates();
    }
}

function setupClickArrow(state) {
    interactionState.isWaitingForAnswer = true;
    interactionState.correctAnswer = state.correctArrow;
    
    // This interaction uses the clock directly, so just set up the mousePressed handler
    canvas.mousePressed(handleClickArrow);
}

function handleClickArrow() {
    // Only handle clicks if waiting for an answer
    if (!interactionState.isWaitingForAnswer) return;
    
    // Check which arrow was clicked
    let clickedArrow = null;
    
    if (isMouseOverClockwiseArrow()) {
        clickedArrow = 'clockwise';
    } else if (isMouseOverCounterClockwiseArrow()) {
        clickedArrow = 'counterclockwise';
    }
    
    // If an arrow was clicked, check if it's correct
    if (clickedArrow !== null) {
        interactionState.attempts++;
        
        if (clickedArrow === interactionState.correctAnswer) {
            // Show feedback
            showFeedback(getCurrentStep().state.feedback.correct, true);
        } else {
            // Show feedback
            showFeedback(getCurrentStep().state.feedback.incorrect, false);
        }
        
        updateButtonStates();
    }
}

function setupYesNo(state) {
    interactionState.isWaitingForAnswer = true;
    interactionState.correctAnswer = state.correctAnswer;
    
    // Create Yes/No buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'yes-no-buttons';
    
    // Yes button
    const yesButton = document.createElement('button');
    yesButton.className = 'btn yes-btn';
    yesButton.textContent = 'Yes';
    yesButton.addEventListener('click', () => handleYesNoAnswer('yes'));
    buttonContainer.appendChild(yesButton);
    
    // No button
    const noButton = document.createElement('button');
    noButton.className = 'btn no-btn';
    noButton.textContent = 'No';
    noButton.addEventListener('click', () => handleYesNoAnswer('no'));
    buttonContainer.appendChild(noButton);
    
    // Add to interactive container
    interactiveContainer.appendChild(buttonContainer);
}

function handleYesNoAnswer(answer) {
    interactionState.attempts++;
    
    if (answer === interactionState.correctAnswer) {
        // Show feedback
        showFeedback(getCurrentStep().state.feedback.correct, true);
    } else {
        // Show feedback
        showFeedback(getCurrentStep().state.feedback.incorrect, false);
    }
    
    updateButtonStates();
}

function setupDragArrow(state) {
    interactionState.isWaitingForAnswer = true;
    interactionState.correctAnswer = state.correctDirection;
    
    // Create draggable arrow element
    const arrowContainer = document.createElement('div');
    arrowContainer.className = 'drag-arrow-container';
    
    // Instructions
    const instructions = document.createElement('p');
    instructions.textContent = 'Drag the arrow to show the clockwise direction';
    arrowContainer.appendChild(instructions);
    
    // Check button
    const checkButton = document.createElement('button');
    checkButton.className = 'btn check-btn';
    checkButton.textContent = 'Check My Answer';
    checkButton.addEventListener('click', checkDragArrowAnswer);
    arrowContainer.appendChild(checkButton);
    
    // Add to interactive container
    interactiveContainer.appendChild(arrowContainer);
    
    // Set up dragging in p5.js
    interactionState.isArrowDragging = true;
}

function checkDragArrowAnswer() {
    interactionState.attempts++;
    
    // Get the direction of the dragged arrow
    // This would need to be implemented based on the actual drag mechanics
    const userDirection = clockwiseAnimationAngle > 0 ? 'clockwise' : 'counterclockwise';
    
    if (userDirection === interactionState.correctAnswer) {
        // Show feedback
        showFeedback(getCurrentStep().state.feedback.correct, true);
    } else {
        // Show feedback
        showFeedback(getCurrentStep().state.feedback.incorrect, false);
    }
    
    updateButtonStates();
}

// p5.js event handlers
function mousePressed() {
    // Handle different interaction types
    switch (interactionState.currentType) {
        case 'click-target':
            handleClickTarget();
            break;
            
        case 'click-hand':
            handleClickHand();
            break;
            
        case 'click-arrow':
            handleClickArrow();
            break;
            
        case 'drag-arrow':
            // Start dragging if mouse is over the arrow
            if (interactionState.isArrowDragging && isMouseOverClockwiseArrow()) {
                interactionState.dragTarget = 'arrow';
            }
            break;
    }
}

function mouseDragged() {
    // Handle drag interactions
    if (interactionState.dragTarget === 'arrow') {
        // Update arrow position/rotation based on mouse movement
        // This would need to be implemented based on your specific requirements
    }
}

function mouseReleased() {
    // Reset dragging state
    interactionState.dragTarget = null;
}

// Initialize when the page loads
window.addEventListener('load', initializeInteractions); 