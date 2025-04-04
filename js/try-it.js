// --- Global Variables & Constants ---
// DOM Elements
const titleElement = document.getElementById('try-it-title');
const instructionElement = document.getElementById('try-it-instruction');
const canvasContainer = document.getElementById('canvas-container');
const checkArea = document.getElementById('embedded-check-area');
const feedbackArea = document.getElementById('feedback-area');
const nextButton = document.getElementById('next-step-button');
const prevButton = document.querySelector('.btn-prev-step');
const skipButton = document.getElementById('skip-button');
const lessonCounterElement = document.querySelector('.lesson-counter');

// --- Lesson State ---
let currentSubStep = -1; // Start at -1 before first load
let p5Instance = null; // Holds the current p5 instance
let narrationAudio = new Audio(); // Audio object for narration
let currentAudioFilename = null; // Store current audio filename
let clockDiameter; // Will be calculated during setup
let dragableArrow = null; // For the draggable arrow in step 3

// --- Clock Style Constants ---
const bgColor = '#FFFFFF';
const clockFaceColor = '#FDF8E1';
const clockRimColor = '#0077CC';
const numberColor = '#005999';
const centerDotColor = '#FFA500';
const hourHandColor = '#005999';
const minuteHandColor = '#E63946';
const highlightColor = '#FDB813';
const correctColor = '#5CB85C';
const incorrectColor = '#E63946';

// --- Clock Dimension Constants ---
const hourHandLength = 0.28;
const minuteHandLength = 0.40;
const hourHandWidth = 10;
const minuteHandWidth = 8;

// --- Audio Filename Map ---
const audioFilenameMap = {
    // Try It Step 0 (Hour Hand)
    '0-instruction': 'find_the_hour_hand_remember.mp3',
    '0-feedback-correct': 'you_got_it_thats_the_short.mp3',
    '0-feedback-incorrect': 'hmm_thats_the_long_hand.mp3',
    
    // Try It Step 1 (Minute Hand)
    '1-instruction': 'now_find_the_minute_hand.mp3',
    '1-feedback-correct': 'excellent_thats_the_long_minute.mp3',
    '1-feedback-incorrect': 'careful_the_minute_hand_is.mp3',
    
    // Try It Step 2 (Clockwise Motion)
    '2-instruction': 'are_they_moving_clockwise_click.mp3',
    '2-feedback-correct': 'correct_they_are_moving_clockwise.mp3',
    '2-feedback-incorrect': 'look_closely_they_are_following.mp3',
    
    // Try It Step 3 (Drag Arrow)
    '3-instruction': 'which_way_is_clockwise_drag.mp3',
    '3-feedback-correct': 'perfect_thats_clockwise.mp3',
    '3-feedback-incorrect': 'not_quite_remember_clockwise_follows.mp3'
};

// --- Lesson Content: Define SubSteps ---
const subSteps = [
    { // 0: Hour Hand Identification
        title: "Find the Hour Hand",
        instruction: "Find the <strong>Hour Hand</strong>. Remember, it's the short one. Click it!",
        checkType: 'hand',
        targetValue: 'hour',
        feedbackCorrect: "You got it! That's the short hour hand.",
        feedbackIncorrect: "Hmm, that's the long hand. The hour hand is the <em>shorter</em> one. Click the short hand.",
        p5config: {
            stepIndex: 0,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 6, m: 0 },
            animateHands: false,
            showDirectionArrows: false,
            interactionTarget: { type: 'hand', value: 'hour' }
        },
        setup: (instance) => {
            console.log("Running setup for Try It Step 0");
            const stepData = subSteps[0];
            
            // Update UI
            titleElement.textContent = stepData.title;
            instructionElement.innerHTML = stepData.instruction;
            feedbackArea.textContent = '';
            feedbackArea.className = 'feedback';
            
            // Play instruction audio
            const instructionAudioFile = getAudioFilename(0, 'instruction');
            currentAudioFilename = instructionAudioFile;
            playAudio(instructionAudioFile);
            
            // Enable interaction
            if (instance) {
                instance.setInteraction(true, stepData.p5config.interactionTarget);
            }
            
            // Disable next button until correct answer
            nextButton.disabled = true;
        }
    },
    { // 1: Minute Hand Identification 
        title: "Find the Minute Hand",
        instruction: "Now, find the <strong>Minute Hand</strong>. It's the long one. Click it!",
        checkType: 'hand',
        targetValue: 'minute',
        feedbackCorrect: "Excellent! That's the long minute hand.",
        feedbackIncorrect: "Careful! The minute hand is the long one. Click the long hand.",
        p5config: {
            stepIndex: 1,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 9, m: 0 },
            animateHands: false,
            showDirectionArrows: false,
            interactionTarget: { type: 'hand', value: 'minute' }
        },
        setup: (instance) => {
            console.log("Running setup for Try It Step 1");
            const stepData = subSteps[1];
            
            // Update UI
            titleElement.textContent = stepData.title;
            instructionElement.innerHTML = stepData.instruction;
            feedbackArea.textContent = '';
            feedbackArea.className = 'feedback';
            
            // Play instruction audio
            const instructionAudioFile = getAudioFilename(1, 'instruction');
            currentAudioFilename = instructionAudioFile;
            playAudio(instructionAudioFile);
            
            // Enable interaction
            if (instance) {
                instance.setInteraction(true, stepData.p5config.interactionTarget);
            }
            
            // Disable next button until correct answer
            nextButton.disabled = true;
        }
    },
    { // 2: Clockwise Motion Identification
        title: "Clockwise Motion",
        instruction: "Are they moving <strong>Clockwise</strong>? Click Yes or No.",
        checkType: 'yesno',
        correctValue: 'yes',
        feedbackCorrect: "Correct! They are moving clockwise.",
        feedbackIncorrect: "Look closely! They are following the numbers 1, 2, 3... That <em>is</em> clockwise.",
        p5config: {
            stepIndex: 2,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 12, m: 0 },
            animateHands: true,
            showDirectionArrows: false
        },
        setup: (instance) => {
            console.log("Running setup for Try It Step 2");
            const stepData = subSteps[2];
            
            // Update UI
            titleElement.textContent = stepData.title;
            instructionElement.innerHTML = stepData.instruction;
            feedbackArea.textContent = '';
            feedbackArea.className = 'feedback';
            
            // Clear the default check area
            checkArea.innerHTML = '';
            
            // Move the check area to the content-right div for this step
            const contentLeft = document.querySelector('.content-left');
            const contentRight = document.querySelector('.content-right');
            
            // If checkArea is in content-left, move it to content-right
            if (checkArea.parentNode === contentLeft) {
                contentLeft.removeChild(checkArea);
                contentRight.appendChild(checkArea);
            }
            
            // Ensure instruction area has some spacing at the bottom
            instructionElement.style.marginBottom = '20px';
            
            // Create Yes/No buttons in check area
            createYesNoButtons();
            
            // Play instruction audio
            const instructionAudioFile = getAudioFilename(2, 'instruction');
            currentAudioFilename = instructionAudioFile;
            playAudio(instructionAudioFile);
            
            // Start the animation
            if (instance) {
                instance.startAnimation();
            }
            
            // Disable next button until correct answer
            nextButton.disabled = true;
        }
    },
    { // 3: Drag Arrow in Clockwise Direction
        title: "Drag the Arrow Clockwise",
        instruction: "Which way is clockwise? Drag the arrow around the clock in the clockwise direction.",
        checkType: 'drag',
        feedbackCorrect: "Perfect! That's clockwise!",
        feedbackIncorrect: "Not quite. Remember, clockwise follows the numbers around...",
        p5config: {
            stepIndex: 3,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 3, m: 0 },
            animateHands: false,
            showDirectionArrows: false
        },
        setup: (instance) => {
            console.log("Running setup for Try It Step 3");
            const stepData = subSteps[3];
            
            // Update UI
            titleElement.textContent = stepData.title;
            instructionElement.innerHTML = stepData.instruction;
            feedbackArea.textContent = '';
            feedbackArea.className = 'feedback';
            
            // Set up draggable arrow
            setupDragArrow(instance);
            
            // Play instruction audio
            const instructionAudioFile = getAudioFilename(3, 'instruction');
            currentAudioFilename = instructionAudioFile;
            playAudio(instructionAudioFile);
            
            // Disable next button until correct answer
            nextButton.disabled = true;
        }
    }
];

// --- Helper Functions ---

// Get audio filename from the map based on step index and part key
function getAudioFilename(stepIndex, partKey) {
    const key = `${stepIndex}-${partKey}`;
    const filename = audioFilenameMap[key];
    if (!filename) {
        console.warn(`Audio mapping not found for key: ${key}`);
        return null;
    }
    return filename;
}

// Control audio playback
function stopAudio(clearCallback = true) {
    if (narrationAudio && !narrationAudio.paused) {
        narrationAudio.pause();
        narrationAudio.currentTime = 0;
        console.log("Stopped audio playback.");
        
        if (clearCallback) {
            narrationAudio.onended = null;
            narrationAudio.onerror = null;
        }
    }
}

function playAudio(filename, onEndedCallback = null) {
    if (!filename) {
        console.log("No audio filename provided.");
        if (typeof onEndedCallback === 'function') {
            onEndedCallback();
        }
        return;
    }
    
    const audioPath = `voice/${filename}`;
    console.log(`Playing audio: ${audioPath}`);
    
    // Stop previous audio without clearing callbacks
    stopAudio(false);
    
    // Clear any existing listeners
    narrationAudio.onended = null;
    narrationAudio.onerror = null;
    
    // Set up new listeners
    narrationAudio.onended = () => {
        console.log("Audio ended:", filename);
        narrationAudio.onended = null;
        narrationAudio.onerror = null;
        if (typeof onEndedCallback === 'function') {
            onEndedCallback();
        }
    };
    
    narrationAudio.onerror = (e) => {
        console.error("Audio error:", filename, e);
        narrationAudio.onended = null;
        narrationAudio.onerror = null;
    };
    
    // Set source and play
    narrationAudio.src = audioPath;
    narrationAudio.currentTime = 0;
    
    const playPromise = narrationAudio.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => {
            console.error("Audio play failed:", e);
        });
    }
}

// Create Yes/No buttons for step 2
function createYesNoButtons() {
    checkArea.innerHTML = '';
    
    // Create a wrapper div with specific styling for Yes/No buttons
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'direction-buttons-wrapper yesno-buttons-wrapper';
    
    // Create a container for each button
    const yesContainer = document.createElement('div');
    yesContainer.className = 'direction-btn-container';
    
    const noContainer = document.createElement('div');
    noContainer.className = 'direction-btn-container';
    
    // Create the buttons with updated styling
    const yesButton = document.createElement('button');
    yesButton.id = 'yes-btn';
    yesButton.innerHTML = 'Yes';
    yesButton.setAttribute('aria-label', 'Yes');
    yesButton.className = 'yesno-btn';
    yesButton.addEventListener('click', () => handleYesNoResponse(true));
    
    const noButton = document.createElement('button');
    noButton.id = 'no-btn';
    noButton.innerHTML = 'No';
    noButton.setAttribute('aria-label', 'No');
    noButton.className = 'yesno-btn';
    noButton.addEventListener('click', () => handleYesNoResponse(false));
    
    // Add the buttons to their containers
    yesContainer.appendChild(yesButton);
    noContainer.appendChild(noButton);
    
    // Add the containers to the wrapper
    buttonsWrapper.appendChild(yesContainer);
    buttonsWrapper.appendChild(noContainer);
    
    // Add the wrapper to the check area
    checkArea.appendChild(buttonsWrapper);
}

// Handle Yes/No button responses
function handleYesNoResponse(isYes) {
    if (currentSubStep !== 2) return;
    
    const isCorrect = (isYes === true); // "yes" is the correct answer
    handleInteractionResult(isCorrect);
}

// Set up draggable arrow for step 3
function setupDragArrow(instance) {
    // This function will be implemented to create a draggable arrow
    // using p5.js or native DOM manipulation
    console.log("Setting up draggable arrow");
    
    // Implementation will depend on the chosen approach:
    // 1. We could use p5.js to draw and handle the draggable arrow
    // 2. We could create a DOM element and use standard drag events
    
    // For now, we'll add a placeholder button to check
    // This will be replaced with actual draggable functionality
    checkArea.innerHTML = '';
    
    const checkButton = document.createElement('button');
    checkButton.textContent = 'Check Direction';
    checkButton.className = 'btn btn-primary';
    checkButton.addEventListener('click', () => {
        // In a complete implementation, we would check if the arrow
        // has been dragged in the clockwise direction
        // For now, we'll simulate a correct response
        handleInteractionResult(true);
    });
    
    checkArea.appendChild(checkButton);
}

// --- Core Functions ---

// Load a substep
function loadSubStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= subSteps.length) {
        console.error("Invalid step index:", stepIndex);
        if (p5Instance) {
            p5Instance.remove();
            p5Instance = null;
        }
        return;
    }
    
    console.log(`Loading Try It sub-step: ${stepIndex}`);
    currentSubStep = stepIndex;
    const stepData = subSteps[currentSubStep];
    
    // Remove previous p5 instance
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
    }
    
    // Clear containers
    canvasContainer.innerHTML = '';
    checkArea.innerHTML = '';
    
    // Ensure checkArea is in the correct location based on the step
    const contentLeft = document.querySelector('.content-left');
    const contentRight = document.querySelector('.content-right');
    
    // For step 2, checkArea should be in content-right
    // For all other steps, checkArea should be in content-left
    if (stepIndex === 2) {
        if (checkArea.parentNode === contentLeft) {
            contentLeft.removeChild(checkArea);
            contentRight.appendChild(checkArea);
        }
    } else {
        if (checkArea.parentNode === contentRight) {
            contentRight.removeChild(checkArea);
            contentLeft.appendChild(checkArea);
        }
    }
    
    // Stop any playing audio
    stopAudio(true);
    
    // Update counter
    if (lessonCounterElement) {
        lessonCounterElement.textContent = `Try It - Step ${stepIndex + 1} of ${subSteps.length}`;
    }
    
    // Create new p5 instance
    if (stepData.p5config && typeof p5 !== 'undefined') {
        console.log("Creating new p5 instance with config:", stepData.p5config);
        
        try {
            p5Instance = new p5(clockSketch(stepData.p5config));
            
            // Call the step's setup function
            if (typeof stepData.setup === 'function') {
                setTimeout(() => {
                    if (p5Instance && currentSubStep === stepIndex) {
                        stepData.setup(p5Instance);
                    }
                }, 50);
            }
        } catch (error) {
            console.error(`Error creating p5 instance:`, error);
            feedbackArea.textContent = "Error loading interactive element.";
            feedbackArea.className = 'feedback feedback-incorrect';
        }
    }
    
    // Update navigation buttons
    prevButton.disabled = (currentSubStep === 0);
}

// Handle interaction results
function handleInteractionResult(isCorrect) {
    if (currentSubStep < 0 || currentSubStep >= subSteps.length) return;
    
    const stepData = subSteps[currentSubStep];
    
    if (isCorrect) {
        console.log("Correct interaction!");
        
        // Update feedback area
        feedbackArea.textContent = stepData.feedbackCorrect;
        feedbackArea.className = 'feedback feedback-correct';
        
        // Play feedback audio
        playAudio(getAudioFilename(currentSubStep, 'feedback-correct'));
        
        // Enable next button
        nextButton.disabled = false;
        
        // For p5 instance, disable further interaction
        if (p5Instance && stepData.checkType === 'hand') {
            p5Instance.setInteraction(false, null);
        }
    } else {
        console.log("Incorrect interaction.");
        
        // Update feedback area
        feedbackArea.textContent = stepData.feedbackIncorrect;
        feedbackArea.className = 'feedback feedback-incorrect';
        
        // Play feedback audio
        playAudio(getAudioFilename(currentSubStep, 'feedback-incorrect'));
        
        // For p5 instance, re-enable interaction after a delay
        if (p5Instance && stepData.checkType === 'hand') {
            setTimeout(() => {
                if (p5Instance) {
                    p5Instance.resetClickFeedback();
                    p5Instance.setInteraction(true, stepData.p5config.interactionTarget);
                }
            }, 2000);
        }
    }
}

// --- p5.js Sketch Function ---
function clockSketch(config) {
    return function(p) {
        // Local state variables
        let stepConfig = config;
        let localHighlightTarget = null;
        let localInteractionTarget = config.interactionTarget || null;
        let localInteractionEnabled = false;
        let localHandAnimationActive = config.animateHands || false;
        let localHandAngleOffset = 0;
        let localHoveredNumber = null;
        let localHoveredHand = null;
        let localClickFeedback = { number: null, hand: null, correct: null };
        let currentHour = config.initialTime ? config.initialTime.h : 3;
        let currentMinute = config.initialTime ? config.initialTime.m : 0;
        
        // --- p5.js Setup ---
        p.setup = () => {
            const container = document.getElementById('canvas-container');
            if (!container) {
                console.error("Canvas container not found!");
                return;
            }
            
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const canvasSize = p.min(containerWidth, containerHeight);
            
            console.log(`Canvas size: ${canvasSize}x${canvasSize}`);
            
            let canvas = p.createCanvas(canvasSize, canvasSize);
            canvas.parent('canvas-container');
            
            clockDiameter = canvasSize * 0.95;
            
            p.angleMode(p.DEGREES);
            p.textAlign(p.CENTER, p.CENTER);
            p.textFont('Arial');
            
            if (!localHandAnimationActive) p.noLoop(); else p.loop();
            p.redraw();
        };
        
        // --- p5.js Draw ---
        p.draw = () => {
            p.background(bgColor);
            p.translate(p.width / 2, p.height / 2);
            
            // Draw clock elements
            drawClockFace(p);
            
            if (stepConfig.showNumbers) {
                drawHourNumbers(p, localHoveredNumber, localClickFeedback, localHighlightTarget);
            }
            
            if (stepConfig.showHands) {
                let hAngle, mAngle;
                
                if (localHandAnimationActive) {
                    const speed = 1;
                    localHandAngleOffset += speed;
                    mAngle = (localHandAngleOffset % 360) * 6 - 90;
                    hAngle = ((localHandAngleOffset / 12) % 360) * 30 - 90;
                } else {
                    mAngle = p.map(currentMinute, 0, 60, 0, 360) - 90;
                    hAngle = p.map(currentHour % 12 + currentMinute / 60, 0, 12, 0, 360) - 90;
                }
                
                drawHand(p, 'minute', mAngle, minuteHandColor, minuteHandLength, minuteHandWidth, 
                         localHighlightTarget, localHoveredHand, localClickFeedback);
                drawHand(p, 'hour', hAngle, hourHandColor, hourHandLength, hourHandWidth, 
                         localHighlightTarget, localHoveredHand, localClickFeedback);
            }
            
            // Draw center dot on top
            drawCenterDot(p);
        };
        
        // --- p5.js Event Handlers ---
        p.mouseMoved = () => {
            if (!localInteractionEnabled) return;
            
            let prevHoverHand = localHoveredHand;
            localHoveredHand = null;
            
            // Check hand hover
            if (localInteractionTarget?.type === 'hand' && stepConfig.showHands) {
                const mouseVec = p.createVector(p.mouseX - p.width/2, p.mouseY - p.height/2);
                
                const checkHandHover = (handType, angle, length) => {
                    const handVec = p5.Vector.fromAngle(p.radians(angle), clockDiameter * length);
                    const distToHand = distPointLine(mouseVec.x, mouseVec.y, 0, 0, handVec.x, handVec.y);
                    const mouseDistFromCenter = mouseVec.mag();
                    const handLengthPixels = clockDiameter * length;
                    
                    if (distToHand < 10 && mouseDistFromCenter < handLengthPixels + 10) {
                        return true;
                    }
                    return false;
                };
                
                // Get current angles
                let mAngle = p.map(currentMinute, 0, 60, 0, 360) - 90;
                let hAngle = p.map(currentHour % 12 + currentMinute / 60, 0, 12, 0, 360) - 90;
                
                // Check minute hand first (longer, visually on top)
                if (checkHandHover('minute', mAngle, minuteHandLength)) {
                    localHoveredHand = 'minute';
                } else if (checkHandHover('hour', hAngle, hourHandLength)) {
                    localHoveredHand = 'hour';
                }
            }
            
            // Redraw if hover state changed
            if (prevHoverHand !== localHoveredHand) {
                if (!localHandAnimationActive) p.redraw();
            }
            
            // Update cursor
            p.cursor(localHoveredHand ? p.HAND : p.ARROW);
        };
        
        p.mousePressed = () => {
            if (!localInteractionEnabled) return;
            
            // Clear previous feedback
            if (feedbackArea.textContent) {
                feedbackArea.textContent = '';
                feedbackArea.className = 'feedback';
            }
            
            // Process hand clicks
            if (localHoveredHand && localInteractionTarget?.type === 'hand') {
                console.log(`Clicked on ${localHoveredHand} hand`);
                
                const isCorrect = (localHoveredHand === localInteractionTarget.value);
                localClickFeedback = { 
                    number: null, 
                    hand: localHoveredHand, 
                    correct: isCorrect 
                };
                
                p.redraw();
                setTimeout(() => { handleInteractionResult(isCorrect); }, 300);
            }
        };
        
        // --- External Control Methods ---
        p.setInteraction = (enabled, target) => {
            if (localInteractionEnabled !== enabled || 
                JSON.stringify(localInteractionTarget) !== JSON.stringify(target)) {
                
                localInteractionEnabled = enabled;
                localInteractionTarget = target || null;
                localClickFeedback = { number: null, hand: null, correct: null };
                localHoveredNumber = null;
                localHoveredHand = null;
                
                console.log(`Setting interaction: ${enabled}`, target);
                
                if (!localHandAnimationActive) p.redraw();
            }
        };
        
        p.startAnimation = () => {
            if (!localHandAnimationActive) {
                localHandAnimationActive = true;
                console.log("Starting animation");
                p.loop();
            }
        };
        
        p.stopAnimation = (setTime) => {
            if (localHandAnimationActive) {
                localHandAnimationActive = false;
                
                if (setTime) {
                    currentHour = setTime.h;
                    currentMinute = setTime.m;
                }
                
                console.log("Stopping animation");
                p.noLoop();
                p.redraw();
            }
        };
        
        p.resetClickFeedback = () => {
            if (localClickFeedback.hand !== null) {
                localClickFeedback = { number: null, hand: null, correct: null };
                if (!localHandAnimationActive) p.redraw();
            }
        };
        
        // --- Cleanup ---
        p.remove = () => {
            console.log(`Removing p5 instance for step ${stepConfig.stepIndex}`);
            p.noLoop();
        };
    };
}

// --- Drawing Functions ---
function drawClockFace(p) {
    p.strokeWeight(clockDiameter * 0.04);
    p.stroke(clockRimColor);
    p.fill(clockFaceColor);
    p.ellipse(0, 0, clockDiameter, clockDiameter);
    
    // Draw tick marks
    const tickRadius = clockDiameter * 0.45;
    p.stroke(numberColor);
    
    for (let i = 0; i < 60; i++) {
        const angle = p.map(i, 0, 60, -90, 270);
        const startRadius = tickRadius * 0.95;
        let endRadius = tickRadius;
        let tickWeight = 1;
        
        if (i % 5 === 0) {
            tickWeight = 3;
            endRadius = tickRadius * 1.03;
        }
        
        p.strokeWeight(tickWeight);
        const x1 = p.cos(angle) * startRadius;
        const y1 = p.sin(angle) * startRadius;
        const x2 = p.cos(angle) * endRadius;
        const y2 = p.sin(angle) * endRadius;
        p.line(x1, y1, x2, y2);
    }
}

function drawCenterDot(p) {
    p.noStroke();
    p.fill(centerDotColor);
    p.ellipse(0, 0, clockDiameter * 0.08, clockDiameter * 0.08);
}

function drawHand(p, handType, angle, color, lengthMultiplier, weight, 
                 highlightTarget, hoveredHand, clickFeedback) {
    p.push();
    p.rotate(angle);
    
    let finalWeight = weight;
    let finalColor = color;
    
    // Apply hover state
    if (hoveredHand === handType) {
        finalColor = highlightColor;
        finalWeight = weight + 2;
    }
    
    // Apply highlight state (overrides hover)
    if (highlightTarget && highlightTarget.type === 'hand' && 
        (highlightTarget.value === handType || highlightTarget.value === 'both')) {
        finalColor = highlightColor;
        finalWeight = weight + 4;
    }
    
    // Apply click feedback state (overrides hover/highlight)
    if (clickFeedback.hand === handType) {
        finalColor = clickFeedback.correct ? correctColor : incorrectColor;
        finalWeight = weight + 4;
    }
    
    p.strokeCap(p.ROUND);
    p.stroke(finalColor);
    p.strokeWeight(finalWeight);
    p.line(0, 0, clockDiameter * lengthMultiplier, 0);
    
    p.pop();
}

function drawHourNumbers(p, hoveredNumber, clickFeedback, highlightTarget) {
    p.textFont('Arial', clockDiameter * 0.13);
    p.textStyle(p.BOLD);
    
    for (let i = 1; i <= 12; i++) {
        const angle = i * 30 - 90;
        const radius = clockDiameter * 0.35;
        const x = p.cos(angle) * radius;
        const y = p.sin(angle) * radius;
        
        p.noStroke();
        let isHighlighted = false;
        let highlightFill = null;
        
        // Check click feedback
        if (clickFeedback.number === i) {
            highlightFill = clickFeedback.correct ? correctColor : incorrectColor;
            isHighlighted = true;
        }
        // Check sequential highlight
        else if (highlightTarget && highlightTarget.type === 'number' && highlightTarget.value === i) {
            highlightFill = highlightColor;
            isHighlighted = true;
        }
        
        // Draw highlight circle if needed
        if (isHighlighted && highlightFill) {
            p.fill(highlightFill);
            p.ellipse(x, y, clockDiameter * 0.18, clockDiameter * 0.18);
        }
        
        // Draw number
        p.fill(numberColor);
        p.text(i, x, y);
    }
    
    p.textStyle(p.NORMAL);
}

// Utility function for hand hover detection
function distPointLine(x, y, x1, y1, x2, y2) {
    const L2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (L2 === 0) return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
    
    let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / L2;
    t = Math.max(0, Math.min(1, t));
    
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    
    return Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const footerAudioButton = document.getElementById('footer-audio-button');
    const startLessonButton = document.getElementById('start-lesson-button');
    const skipButtonActual = document.getElementById('skip-button');
    const prevButtonActual = document.querySelector('.btn-prev-step');
    const nextButtonActual = document.getElementById('next-step-button');
    const professorImg = document.getElementById('professor-img');
    const tryItContent = document.getElementById('try-it-content');
    const initialTitle = document.getElementById('initial-lesson-title');
    const initialIntro = document.getElementById('initial-lesson-intro');
    
    console.log("DOM Loaded for Try It section.");
    
    // --- Start Button Listener ---
    if (startLessonButton && skipButtonActual && prevButtonActual && nextButtonActual && 
        professorImg && tryItContent && initialTitle && initialIntro) {
        
        console.log("Attaching Start button listener.");
        
        startLessonButton.addEventListener('click', () => {
            console.log("Start button clicked.");
            startLessonButton.style.display = 'none';
            
            // Hide intro content
            initialTitle.classList.add('hidden');
            initialIntro.classList.add('hidden');
            professorImg.classList.add('hidden');
            
            // Show main content
            tryItContent.classList.remove('hidden');
            
            // Show navigation buttons
            skipButtonActual.style.display = 'inline-flex';
            prevButtonActual.style.display = 'inline-flex';
            nextButtonActual.style.display = 'inline-flex';
            
            // Load first step
            loadSubStep(0);
        });
        
        // --- Next Button Listener ---
        nextButtonActual.addEventListener('click', () => {
            console.log("Next button clicked.");
            
            if (currentSubStep < subSteps.length - 1) {
                loadSubStep(currentSubStep + 1);
            } else {
                // Navigate to next page when all steps are completed
                window.location.href = 'do-it.html';
            }
        });
        
        // --- Previous Button Listener ---
        prevButtonActual.addEventListener('click', () => {
            console.log("Previous button clicked.");
            
            if (currentSubStep > 0) {
                loadSubStep(currentSubStep - 1);
            } else {
                // Navigate to previous page
                window.location.href = 'learn-it.html';
            }
        });
        
        // --- Skip Button Listener ---
        skipButtonActual.addEventListener('click', () => {
            console.log("Skip button clicked.");
            
            // Enable next button even if activity not completed
            nextButtonActual.disabled = false;
            
            // Stop animations if playing
            if (p5Instance) {
                p5Instance.stopAnimation();
                p5Instance.setInteraction(false, null);
            }
        });
        
    } else {
        console.error("One or more required initial elements not found!");
    }
    
    // --- Footer Audio Button Listener ---
    if (footerAudioButton) {
        footerAudioButton.addEventListener('click', () => {
            console.log("Footer audio button clicked.");
            
            stopAudio(true);
            playAudio(currentAudioFilename);
        });
    } else {
        console.error("Footer audio button not found!");
    }
}); 