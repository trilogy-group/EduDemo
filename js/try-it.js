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

// --- Global State Object ---
const globalState = {
    audioEnabled: true,
    currentSubStep: 0,
    completedSubSteps: [],
    p5Instance: null
};

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
    '0-instruction': 'find_the_hour_hand_remember_its.mp3',
    '0-feedback-correct': 'you_got_it_thats_the_short.mp3',
    '0-feedback-incorrect': 'hmm_thats_the_long_hand_the.mp3',
    
    // Try It Step 1 (Minute Hand)
    '1-instruction': 'now_find_the_minute_hand_its.mp3',
    '1-feedback-correct': 'correct.mp3',
    '1-feedback-incorrect': 'careful_the_minute_hand_is_the.mp3',
    
    // Try It Step 2 (Clockwise Motion)
    '2-instruction': 'are_they_moving_clockwise_click_yes.mp3',
    '2-feedback-correct': 'correct_they_are_moving_clockwise.mp3',
    '2-feedback-incorrect': 'look_closely_they_are_following_the.mp3',
    
    // Try It Step 3 (Drag Arrow)
    '3-instruction': 'which_way_is_clockwise_drag_the.mp3',
    '3-feedback-correct': 'perfect_thats_clockwise.mp3',
    '3-feedback-incorrect': 'not_quite_remember_clockwise_follows_the.mp3'
};

// --- Lesson Content: Define SubSteps ---
const subSteps = [
    { // 0: Hour Hand Identification
        title: "Find the Hour Hand",
        instruction: "Find the <strong>Hour Hand</strong>. Remember, it's the short one. Click it!",
        checkType: 'hand',
        targetValue: 'hour',
        feedbackCorrect: "You got it! That's the short hour hand.",
        feedbackIncorrect: "Hmm, that's the long hand. The hour hand is the shorter one. Click the short hand.",
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
        instruction: "Which way is clockwise? Click the arrow to show the clock moving in the clockwise direction.",
        checkType: 'arrow',
        feedbackCorrect: "Perfect! That's clockwise!",
        feedbackIncorrect: "Not quite. Remember, clockwise follows the numbers around...",
        p5config: {
            stepIndex: 3,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 3, m: 0 },
            animateHands: false,
            showDirectionArrows: true,
            interactionTarget: { type: 'arrow', value: 'clockwise' }
        },
        setup: (instance) => {
            console.log("Running setup for Try It Step 3");
            const stepData = subSteps[3];
            
            // Update UI
            titleElement.textContent = stepData.title;
            instructionElement.innerHTML = stepData.instruction;
            feedbackArea.textContent = '';
            feedbackArea.className = 'feedback';
            
            // Enable arrow interaction
            if (instance) {
                instance.setInteraction(true, stepData.p5config.interactionTarget);
            }
            
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
    if (globalState.currentSubStep !== 2) return;
    
    const isCorrect = (isYes === true); // "yes" is the correct answer
    handleInteractionResult(isCorrect);
}

// --- Core Functions ---

// Load a specific sub-step
function loadSubStep(index) {
    if (index < 0 || index >= subSteps.length) {
        console.error("Invalid sub-step index:", index);
        // Navigate to next section or handle completion
        window.location.href = 'do-it.html'; 
        return;
    }
    console.log(`Loading sub-step ${index}`);
    currentSubStep = index;
    const stepData = subSteps[currentSubStep];
    const instructionElement = document.getElementById('try-it-instruction');
    const instructionText = stepData.instruction || ""; // Store text

    stopAudio(true); // Stop previous audio
    
    // Hide text initially
    if (instructionElement) {
        instructionElement.innerHTML = "";
        instructionElement.style.visibility = 'hidden';
    }
    if (titleElement && stepData.title) {
        titleElement.textContent = stepData.title;
    }
    feedbackArea.textContent = '';
    feedbackArea.className = 'feedback';
    checkArea.innerHTML = '';
    cleanupCheckLayout(); // Ensure layout is reset if needed

    // Initialize p5 instance
    initializeP5(stepData);

    // Update nav buttons
    updateNavigationButtons();
    if(prevButton) prevButton.disabled = (index === 0);
    nextButton.disabled = true; // Always disable initially

    // Define callback to show text
    const showTextCallback = () => {
        if (instructionElement) {
             instructionElement.innerHTML = instructionText; // Set the stored text
             instructionElement.style.visibility = 'visible';
             console.log("Instruction text made visible for step:", index);
        }
        // Call the step-specific setup logic AFTER text is visible
        if (typeof stepData.setup === 'function') {
             stepData.setup(p5Instance);
        } else {
             console.warn("No setup function defined for step:", index);
             // If no setup, might need to enable next based on step type
             // For Try It, setup usually handles this.
        }
    };

    // Play audio for the step using getAudioFilename
    const audioFile = getAudioFilename(index, 'instruction');
    currentAudioFilename = audioFile; // Store for potential replay
    if (audioFile) {
        playAudio(audioFile, showTextCallback);
    } else {
        console.log("No instruction audio for step:", index);
        // If no audio, run callback immediately to show text
        setTimeout(showTextCallback, 0); 
    }
    
    // Update lesson counter & progress
    updateLessonCounter();
    updateProgressBar();
}

// Handle interaction results
function handleInteractionResult(isCorrect) {
    if (globalState.currentSubStep < 0 || globalState.currentSubStep >= subSteps.length) return;
    
    const stepData = subSteps[globalState.currentSubStep];
    
    if (isCorrect) {
        console.log("Correct interaction!");
        
        // Update feedback area
        feedbackArea.textContent = stepData.feedbackCorrect;
        feedbackArea.className = 'feedback feedback-correct';
        
        // Add to completed steps if not already there
        if (!globalState.completedSubSteps.includes(globalState.currentSubStep)) {
            globalState.completedSubSteps.push(globalState.currentSubStep);
        }
        
        // Play feedback audio
        playAudio(getAudioFilename(globalState.currentSubStep, 'feedback-correct'));
        
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
        playAudio(getAudioFilename(globalState.currentSubStep, 'feedback-incorrect'));
        
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
        let localHoveredArrow = null; // Track which arrow is hovered
        let localClickFeedback = { number: null, hand: null, arrow: null, correct: null };
        let currentHour = config.initialTime ? config.initialTime.h : 3;
        let currentMinute = config.initialTime ? config.initialTime.m : 0;
        
        // Direction animation state
        let directionAnimationActive = false;
        let directionAnimationSpeed = 0;
        let animationStartTime = 0;
        let animationDuration = 2000; // 2 seconds of animation
        let directionAnimationDirection = null; // 'clockwise' or 'counterclockwise'
        
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
            
            if (!localHandAnimationActive && !directionAnimationActive) p.noLoop(); else p.loop();
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
                    // Regular animation for step 2
                    const speed = 1;
                    localHandAngleOffset += speed;
                    mAngle = (localHandAngleOffset % 360) * 6 - 90;
                    hAngle = ((localHandAngleOffset / 12) % 360) * 30 - 90;
                } else if (directionAnimationActive) {
                    // Direction animation for step 3
                    const elapsed = Date.now() - animationStartTime;
                    
                    // Check if animation time is complete
                    if (elapsed >= animationDuration) {
                        directionAnimationActive = false;
                        // Just stop the animation without showing feedback again
                        p.noLoop();
                    } else {
                        // Continue animation based on selected direction
                        if (directionAnimationDirection === 'clockwise') {
                            localHandAngleOffset += directionAnimationSpeed;
                        } else {
                            localHandAngleOffset -= directionAnimationSpeed;
                        }
                        
                        // Calculate angle for animation
                        mAngle = (localHandAngleOffset % 360) * 6 - 90;
                        hAngle = ((localHandAngleOffset / 12) % 360) * 30 - 90;
                    }
                } else {
                    // Static display
                    mAngle = p.map(currentMinute, 0, 60, 0, 360) - 90;
                    hAngle = p.map(currentHour % 12 + currentMinute / 60, 0, 12, 0, 360) - 90;
                }
                
                // Calculate offsets for arrows if hovered
                let hourHandOffset = 0;
                if (localHoveredArrow === 'clockwise') {
                    hourHandOffset = 5; // Down arrow is clockwise - moves hand down
                } else if (localHoveredArrow === 'counterclockwise') {
                    hourHandOffset = -5; // Up arrow is counterclockwise - moves hand up
                }
                
                drawHand(p, 'minute', mAngle, minuteHandColor, minuteHandLength, minuteHandWidth, 
                         localHighlightTarget, localHoveredHand, localClickFeedback);
                drawHand(p, 'hour', hAngle + hourHandOffset, hourHandColor, hourHandLength, hourHandWidth, 
                         localHighlightTarget, localHoveredHand, localClickFeedback);
            }
            
            // Draw direction arrows for step 3
            if (stepConfig.showDirectionArrows) {
                drawDirectionArrows(p, localInteractionEnabled, localHoveredArrow, localClickFeedback);
            }
            
            // Draw center dot on top
            drawCenterDot(p);
        };
        
        // --- p5.js Event Handlers ---
        p.mouseMoved = () => {
            if (!localInteractionEnabled) return;
            
            let prevHoverHand = localHoveredHand;
            let prevHoverArrow = localHoveredArrow;
            localHoveredHand = null;
            localHoveredArrow = null;
            
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
            
            // Check arrow hover for step 3
            if (localInteractionTarget?.type === 'arrow' && stepConfig.showDirectionArrows) {
                const arrowSize = clockDiameter * 0.07; // Same size as in drawDirectionArrows
                const hitRadius = arrowSize * 1.5;
                
                // Calculate arrow positions - same as in drawDirectionArrows
                // Number 2 position (for counterclockwise/up arrow)
                const angle2 = 2 * 30 - 90; // 2nd hour position in degrees (-30 degrees)
                const radius2 = clockDiameter * 0.25; // Closer to center than the number
                const ccwX = p.cos(angle2) * radius2;
                const ccwY = p.sin(angle2) * radius2;
                
                // Number 4 position (for clockwise/down arrow)
                const angle4 = 4 * 30 - 90; // 4th hour position in degrees (30 degrees)
                const radius4 = clockDiameter * 0.25;
                const cwX = p.cos(angle4) * radius4;
                const cwY = p.sin(angle4) * radius4;
                
                // Check if mouse is over either arrow
                const distToCW = p.dist(p.mouseX - p.width / 2, p.mouseY - p.height / 2, cwX, cwY);
                const distToCCW = p.dist(p.mouseX - p.width / 2, p.mouseY - p.height / 2, ccwX, ccwY);
                
                if (distToCW < hitRadius) {
                    localHoveredArrow = 'clockwise';
                } else if (distToCCW < hitRadius) {
                    localHoveredArrow = 'counterclockwise';
                }
            }
            
            // Redraw if hover state changed
            if (prevHoverHand !== localHoveredHand || prevHoverArrow !== localHoveredArrow) {
                if (!localHandAnimationActive && !directionAnimationActive) p.redraw();
            }
            
            // Update cursor
            if (localHoveredHand || localHoveredArrow) {
                p.cursor(p.HAND);
            } else {
                p.cursor(p.ARROW);
            }
        };
        
        p.mousePressed = () => {
            if (!localInteractionEnabled || directionAnimationActive) return;
            
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
                    arrow: null,
                    correct: isCorrect 
                };
                
                p.redraw();
                setTimeout(() => { handleInteractionResult(isCorrect); }, 300);
            }
            
            // Process arrow clicks for step 3
            if (localHoveredArrow && localInteractionTarget?.type === 'arrow') {
                console.log(`Clicked on ${localHoveredArrow} arrow`);
                
                // Immediately determine if the answer is correct
                const isCorrect = (localHoveredArrow === 'clockwise');
                
                // Update feedback immediately
                localClickFeedback = { 
                    number: null, 
                    hand: null, 
                    arrow: localHoveredArrow, 
                    correct: isCorrect 
                };
                
                // Show feedback right away
                handleInteractionResult(isCorrect);
                
                // Start direction animation
                directionAnimationActive = true;
                directionAnimationDirection = localHoveredArrow;
                directionAnimationSpeed = 3; // Adjust speed as needed
                animationStartTime = Date.now(); // Store the current time
                localHandAngleOffset = 0; // Reset animation offset
                
                // Ensure we're looping to animate
                p.loop();
            }
        };
        
        // --- External Control Methods ---
        p.setInteraction = (enabled, target) => {
            if (localInteractionEnabled !== enabled || 
                JSON.stringify(localInteractionTarget) !== JSON.stringify(target)) {
                
                localInteractionEnabled = enabled;
                localInteractionTarget = target || null;
                localClickFeedback = { number: null, hand: null, arrow: null, correct: null };
                localHoveredNumber = null;
                localHoveredHand = null;
                localHoveredArrow = null;
                
                console.log(`Setting interaction: ${enabled}`, target);
                
                if (!localHandAnimationActive && !directionAnimationActive) p.redraw();
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
                if (!directionAnimationActive) p.noLoop();
                p.redraw();
            }
        };
        
        p.resetClickFeedback = () => {
            if (localClickFeedback.hand !== null || localClickFeedback.arrow !== null) {
                localClickFeedback = { number: null, hand: null, arrow: null, correct: null };
                if (!localHandAnimationActive && !directionAnimationActive) p.redraw();
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

// Draw direction arrows for step 3
function drawDirectionArrows(p, interactionEnabled, hoveredArrow, clickFeedback) {
    const arrowSize = clockDiameter * 0.07; // Smaller arrows
    
    // Calculate positions near numbers 2 and 4
    // Number 2 position (for counterclockwise/up arrow)
    const angle2 = 2 * 30 - 90; // 2nd hour position in degrees (-30 degrees)
    const radius2 = clockDiameter * 0.25; // Closer to center than the number
    const ccwX = p.cos(angle2) * radius2;
    const ccwY = p.sin(angle2) * radius2;
    
    // Number 4 position (for clockwise/down arrow)
    const angle4 = 4 * 30 - 90; // 4th hour position in degrees (30 degrees)
    const radius4 = clockDiameter * 0.25;
    const cwX = p.cos(angle4) * radius4;
    const cwY = p.sin(angle4) * radius4;
    
    // Draw counterclockwise (up) arrow
    drawArrow(p, ccwX, ccwY, arrowSize, 'up', 
             hoveredArrow === 'counterclockwise', 
             clickFeedback.arrow === 'counterclockwise', 
             clickFeedback.correct === false); // Reverse correct state since we swapped meaning
    
    // Draw clockwise (down) arrow
    drawArrow(p, cwX, cwY, arrowSize, 'down', 
             hoveredArrow === 'clockwise', 
             clickFeedback.arrow === 'clockwise', 
             clickFeedback.correct === true); // Maintain correct state for clockwise
}

// Helper function to draw arrows with different states
function drawArrow(p, x, y, size, direction, isHovered, isClicked, isCorrect) {
    let arrowColor = numberColor; // Default color
    let arrowScale = 1.0;
    
    // Apply hover effect
    if (isHovered) {
        arrowColor = highlightColor;
        arrowScale = 1.2;
    }
    
    // Apply click feedback (overrides hover)
    if (isClicked) {
        arrowColor = isCorrect ? correctColor : incorrectColor;
        arrowScale = 1.3;
    }
    
    // Draw arrow with selected appearance
    p.push();
    p.translate(x, y);
    p.scale(arrowScale);
    
    // Draw arrow circle background - more opaque and slightly larger
    p.noStroke();
    p.fill(240, 240, 240, 240);
    p.ellipse(0, 0, size * 2.2, size * 2.2);
    
    // Draw arrow
    p.stroke(arrowColor);
    p.strokeWeight(size * 0.18); // Thicker lines
    p.noFill();
    
    if (direction === 'up') {
        // Draw up arrow (clockwise)
        p.line(0, size * 0.6, 0, -size * 0.6);  // Vertical line
        p.line(0, -size * 0.6, -size * 0.4, -size * 0.2);  // Left arrowhead
        p.line(0, -size * 0.6, size * 0.4, -size * 0.2);   // Right arrowhead
    } else {
        // Draw down arrow (counterclockwise)
        p.line(0, -size * 0.6, 0, size * 0.6);  // Vertical line
        p.line(0, size * 0.6, -size * 0.4, size * 0.2);    // Left arrowhead
        p.line(0, size * 0.6, size * 0.4, size * 0.2);     // Right arrowhead
    }
    
    p.pop();
}

// Event listeners - DOMContentLoaded
document.addEventListener("DOMContentLoaded", function() {
    // Setup Help Modal
    const helpButton = document.getElementById("help-button");
    const helpModal = document.getElementById("help-modal");
    const closeModalButton = document.getElementById("close-help-modal-button");

    if (helpButton && helpModal && closeModalButton) {
        helpButton.addEventListener("click", function() {
            helpModal.classList.remove("hidden");
        });

        closeModalButton.addEventListener("click", function() {
            helpModal.classList.add("hidden");
        });

        // Close modal when clicking outside of modal content
        window.addEventListener("click", function(event) {
            if (event.target === helpModal) {
                helpModal.classList.add("hidden");
            }
        });
    } else {
        console.error("Help modal elements not found.");
    }

    // Setup audio button
    const audioButton = document.getElementById("footer-audio-button");
    if (audioButton) {
        audioButton.addEventListener("click", function() {
            // Toggle audio state
            globalState.audioEnabled = !globalState.audioEnabled;
            
            // Update button icon
            const icon = audioButton.querySelector("i");
            if (icon) {
                if (globalState.audioEnabled) {
                    icon.className = "fas fa-volume-up";
                } else {
                    icon.className = "fas fa-volume-mute";
                    stopAudio(); // Stop any playing audio
                }
            }
        });
    } else {
        console.error("Audio button not found.");
    }

    // Setup navigation buttons
    const prevButton = document.querySelector(".btn-prev-step");
    const nextButton = document.getElementById("next-step-button");
    const skipButton = document.getElementById("skip-button");

    if (prevButton && nextButton && skipButton) {
        prevButton.addEventListener("click", loadPreviousSubStep);
        nextButton.addEventListener("click", loadNextSubStep);
        skipButton.addEventListener("click", loadNextSubStep);
    } else {
        console.error("Navigation buttons not found.");
    }

    // Initialize the lesson directly
    initializeLesson();
});

// Initialize the lesson
function initializeLesson() {
    console.log("Initializing lesson...");
    // Reset any global state if needed
    resetState();
    
    // Ensure Skip button is visible
    const skipButton = document.getElementById('skip-button');
    if (skipButton) {
        skipButton.style.display = 'inline-flex'; // Ensure it's visible
    } else {
        console.warn("Skip button not found during initialization!");
    }
    
    // Load the first subStep
    loadSubStep(0);
    
    // Play welcome audio if needed
    if (globalState.audioEnabled) {
        playAudio("welcome_to_try_it");
    }
}

// Reset state for lesson initialization
function resetState() {
    globalState.currentSubStep = 0;
    globalState.completedSubSteps = [];
    
    // Reset the p5 instance if it exists
    if (globalState.p5Instance) {
        globalState.p5Instance.remove();
        globalState.p5Instance = null;
    }
    
    // Clear feedback area
    const feedbackArea = document.getElementById("feedback-area");
    if (feedbackArea) {
        feedbackArea.innerHTML = "";
        feedbackArea.className = "feedback";
    }
}

// Load a specific sub-step
function loadSubStep(index) {
    console.log(`Loading sub-step ${index}`);
    globalState.currentSubStep = index;
    
    // Get the current sub-step data
    const subStep = subSteps[index];
    
    // Update the instruction text
    const instructionElement = document.getElementById("try-it-instruction");
    if (instructionElement && subStep.instruction) {
        instructionElement.innerHTML = subStep.instruction;
    }
    
    // Update navigation buttons based on current step
    updateNavigationButtons();
    
    // Display appropriate feedback
    clearFeedback();
    
    // Initialize p5 instance if needed
    initializeP5(subStep);
    
    // Play audio for the step
    if (globalState.audioEnabled && subStep.audioFile) {
        playAudio(subStep.audioFile);
    }
}

// Load next sub-step
function loadNextSubStep() {
    console.log("Loading next sub-step");
    
    // First, ensure any existing p5 instance is properly removed
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
    }
    
    if (globalState.currentSubStep < subSteps.length - 1) {
        loadSubStep(globalState.currentSubStep + 1);
    } else {
        // Navigate to next page when all steps are completed
        window.location.href = 'do-it.html';
    }
}

// Load previous sub-step
function loadPreviousSubStep() {
    console.log("Loading previous sub-step");
    
    // First, ensure any existing p5 instance is properly removed
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
    }
    
    if (globalState.currentSubStep > 0) {
        loadSubStep(globalState.currentSubStep - 1);
    } else {
        // Navigate to previous page
        window.location.href = 'learn-it.html';
    }
}

// Update navigation buttons based on current step
function updateNavigationButtons() {
    const nextButton = document.getElementById("next-step-button");
    const skipButton = document.getElementById("skip-button");
    
    if (nextButton && skipButton) {
        const isCompleted = globalState.completedSubSteps.includes(globalState.currentSubStep);
        
        // Enable/disable next button based on completion status
        nextButton.disabled = !isCompleted;

    }
}

// Display appropriate feedback
function clearFeedback() {
    // Implementation of clearFeedback function
    const feedbackArea = document.getElementById('feedback-area');
    if (feedbackArea) {
        feedbackArea.textContent = '';
        feedbackArea.className = 'feedback';
    }
}

// Initialize p5 instance if needed
function initializeP5(subStep) {
    if (!subStep.p5config) return;
    
    // Remove any existing p5 instance
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
    }
    
    // Make sure to remove any existing canvas elements
    const existingCanvases = canvasContainer.querySelectorAll('canvas');
    existingCanvases.forEach(canvas => canvas.remove());
    
    // Clear the canvas container
    canvasContainer.innerHTML = '';
    
    // Create a new p5 instance with this step's configuration
    try {
        // Short delay to ensure DOM is ready
        setTimeout(() => {
            p5Instance = new p5(clockSketch(subStep.p5config), canvasContainer);
            globalState.p5Instance = p5Instance;
            
            // Call the step's setup function once the p5 instance is ready
            setTimeout(() => {
                if (p5Instance && typeof subStep.setup === 'function') {
                    subStep.setup(p5Instance);
                }
            }, 50);
        }, 20);
    } catch (error) {
        console.error("Error creating p5 instance:", error);
        const feedbackArea = document.getElementById('feedback-area');
        if (feedbackArea) {
            feedbackArea.textContent = "Error loading interactive element.";
            feedbackArea.className = 'feedback feedback-incorrect';
        }
    }
} 