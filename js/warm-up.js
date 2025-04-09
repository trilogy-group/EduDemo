// --- Global State & Constants ---
let p5Instance = null;
let narrationAudio = new Audio();
let currentAudioFilename = null;
let clockDiameter; 
let inputValues = {}; 
let selectedInputBox = null; 
let currentWarmUpStep = 0; // Start at the first step

// Define warmUpSteps globally
const warmUpSteps = [
    { // Step 0: Intro Animation
        instruction: "Learn the clock parts: <strong>face</strong>, <strong>numbers</strong>, <strong>hands</strong>, and <strong>clockwise direction</strong>.",
        showClockHands: true,
        animateHands: true, // Add flag for animation
        audio: 'welcome_time_explorers_together_we_ll_learn.mp3'
    },
    { // Step 1: Original Number Check (Now index 1)
        instruction: "Click on the empty circles and type the correct number that belongs there.",
        missingNumbers: [1, 4, 8],
        showClockHands: true,
        animateHands: false, // Not animated
        time: '1:00', 
        audio: 'lets_quickly_check.mp3' // Updated audio file
    },
    // Add more warm-up steps here if needed
];

// Color definitions
const bgColor = '#FFFFFF';
const clockFaceColor = '#FDF8E1'; // Creamy off-white
const clockRimColor = '#0077CC'; // Brighter Blue
const numberColor = '#005999'; // Dark Blue for numbers
const centerDotColor = '#FFA500'; // Orange/Yellow
const inputBoxColor = '#EFEFEF'; // Light gray for input boxes
const correctColor = '#5CB85C'; // Green
const incorrectColor = '#E63946'; // Red
const hourHandColor = '#005999'; // Dark Blue hour hand
const minuteHandColor = '#E63946'; // Brighter Red minute hand

// Clock hands config
const hourHandLength = 0.28; // Length as fraction of clock diameter
const minuteHandLength = 0.40;
const hourHandWidth = 10; // Thickness in pixels
const minuteHandWidth = 8;

// --- Core Logic Functions ---

function loadWarmUpStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= warmUpSteps.length) {
        console.error("Invalid warm-up step index:", stepIndex);
        // Handle end of warm-up (e.g., navigate)
        console.log("Warm-up complete. Navigating to Learn It.");
        window.location.href = 'learn-it.html'; 
        return;
    }
    console.log(`Loading warm-up step: ${stepIndex}`);
    currentWarmUpStep = stepIndex;
    const stepData = warmUpSteps[currentWarmUpStep];

    stopAudio(true); // Stop previous audio

    const instructionElement = document.getElementById('warm-up-instruction');
    const instructionText = stepData.instruction || ""; // Store the text
    
    // Hide text initially
    if (instructionElement) {
        instructionElement.innerHTML = ''; // Clear content
        instructionElement.style.visibility = 'hidden';
        console.log("Instruction element hidden initially.");
    } else {
        console.error("Instruction element #warm-up-instruction not found!");
    }

    // Remove previous p5 instance
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
        console.log("Previous p5 instance removed.");
    }

    // Prepare canvas container
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
        console.error('Canvas container #canvas-container not found!');
        return; 
    }
    canvasContainer.innerHTML = ''; // Clear previous canvas

    // Initialize p5 instance (checks container size internally)
    initP5(stepData);

    // Update UI elements
    updateNavigationButtons();
    updateProgressBar();
    updateLessonCounter();

    // --- Audio and Text Visibility Logic --- 
    const nextButton = document.getElementById('next-step-button');
    
    // Define the callback to show text and potentially enable Next button
    const showTextAndEnableNextCallback = () => {
        if (instructionElement) {
            instructionElement.innerHTML = instructionText; // Set text content
            instructionElement.style.visibility = 'visible';
            console.log("Instruction text made visible.");
        }
        // Only enable Next button for step 0 after audio
        if (stepIndex === 0 && nextButton && currentWarmUpStep === 0) { 
            nextButton.disabled = false;
            console.log("Intro audio finished, Next button enabled.");
        }
    };
    
    // Play audio with the combined callback
    playCurrentAudio(showTextAndEnableNextCallback);
    
    // Ensure completion check runs for non-intro steps *after* audio might start
    // (Completion check handles Next button enablement for step 1)
    if (stepIndex !== 0) {
         checkCompletion(); 
    }
    // --- End Audio and Text Visibility Logic ---
}

function initP5(stepData) {
    const canvasContainer = document.getElementById('canvas-container');
    // Check if container is visible and has dimensions
    if (canvasContainer && canvasContainer.offsetWidth > 0 && canvasContainer.offsetHeight > 0) {
        console.log("Canvas container dimensions ready:", canvasContainer.offsetWidth, canvasContainer.offsetHeight);
        if (typeof clockSketch === 'function') {
            const config = { // Prepare config for clockSketch
                missingNumbers: stepData.missingNumbers || [],
                initialTime: stepData.time || '12:00',
                showClockHands: stepData.showClockHands !== undefined ? stepData.showClockHands : true,
                animateHands: stepData.animateHands || false
            };
            try {
                // Create the p5 instance
                p5Instance = new p5(clockSketch(config), canvasContainer);
                console.log("p5 instance created.");
                
                // Initialize inputs and play audio *after* p5 setup is likely underway
                initializeStepInputs(stepData); 
            } catch (error) {
                console.error("Error creating p5 instance:", error);
            }
        } else {
            console.error('clockSketch function is not defined!');
        }
    } else {
        console.warn("Canvas container not ready or has zero dimensions. Retrying p5 init in 100ms...");
        setTimeout(() => initP5(stepData), 100); // Retry after delay
    }
}

function initializeStepInputs(stepData) {
    inputValues = {}; 
    selectedInputBox = null;
    if (stepData.missingNumbers) {
        stepData.missingNumbers.forEach(num => {
                inputValues[num] = undefined;
        });
        console.log("Input values initialized for:", stepData.missingNumbers);
    }
    checkCompletion(); // Set initial state of next button
}

function handleKeyboardInput(key) {
    if (selectedInputBox === null) return;
    console.log(`Keyboard input: ${key} for box ${selectedInputBox}`);
    if (/^[0-9]$/.test(key)) { // Allow only single digits
         inputValues[selectedInputBox] = key; 
         
         // Show feedback based on correctness
         const feedbackArea = document.getElementById('feedback-area');
         if (parseInt(key) === selectedInputBox) {
             feedbackArea.textContent = "Correct!";
             feedbackArea.className = "feedback feedback-correct";
             // Play correct answer audio
             playAudio('voice/correct.mp3');
         } else {
             feedbackArea.textContent = "Not quite right... Try again!";
             feedbackArea.className = "feedback feedback-incorrect";
             // Play incorrect answer audio
             playAudio('voice/not_quite_right_try_again.mp3');
         }
         
         if (p5Instance) {
             p5Instance.redraw(); // Redraw to show input and feedback
         }
         checkCompletion(); // Check if all inputs are now correct
    }
}

function checkCompletion() {
    const nextButton = document.getElementById('next-step-button'); // Use the correct ID from HTML
    if (!nextButton) {
        console.warn("Next button (#next-step-button) not found for completion check.");
        return;
    }
    let allCorrect = true;
    const stepData = warmUpSteps[currentWarmUpStep];
    if (!stepData || !stepData.missingNumbers) {
        allCorrect = false; 
    } else {
        for (const num of stepData.missingNumbers) {
            if (inputValues[num] === undefined || parseInt(inputValues[num]) !== num) {
                allCorrect = false;
                break;
            }
        }
    }
    nextButton.disabled = !allCorrect;
    console.log(`Completion check: All correct = ${allCorrect}, Next button disabled = ${!allCorrect}`);
}

// --- UI Update Functions ---
function updateNavigationButtons() {
     const nextButton = document.getElementById('next-step-button'); // Use correct ID
     const prevButton = document.querySelector('.btn-prev-step'); // Use class for prev
     if(prevButton) {
         prevButton.disabled = (currentWarmUpStep <= 0);
         // Add listener if not already added (or manage listeners in DOMContentLoaded)
     } else {
         console.warn("Previous button (.btn-prev-step) not found.");
     }
     // Next button state is managed by checkCompletion
     if(!nextButton) {
         console.warn("Next button (#next-step-button) not found.");
     }
}

function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if(progressBar) {
        // Assuming Warm-up is the first of 5 sections
        const overallProgress = 0; // Warm-up itself is 0% of the total lesson initially
        progressBar.style.width = `${overallProgress}%`; 
        // If warm-up had multiple steps, calculate internal progress differently
        // const internalProgress = warmUpSteps.length > 0 ? ((currentWarmUpStep + 1) / warmUpSteps.length) * (100/5) : 0; 
    } else {
        console.warn("Progress bar (.progress-bar) not found.");
    }
}

function updateLessonCounter() {
    const lessonCounter = document.querySelector('.lesson-counter');
    if(lessonCounter) {
        // Reflect the overall lesson progress
        lessonCounter.textContent = `Step 1 of 5: Warm-up`; 
    } else {
        console.warn("Lesson counter (.lesson-counter) not found.");
    }
}

// --- Audio Functions ---
function playCurrentAudio(onEndedCallback = null) {
    currentAudioFilename = warmUpSteps[currentWarmUpStep]?.audio || null;
    if (currentAudioFilename) {
        playAudio(currentAudioFilename, onEndedCallback);
    } else {
        console.log("No audio for current warm-up step.");
        // If no audio, execute the callback immediately to show text/enable button
        if(typeof onEndedCallback === 'function') {
             console.log("No audio, running callback immediately.");
             // Use setTimeout to ensure it runs after the current execution stack clears
             setTimeout(onEndedCallback, 0);
        }
    }
}

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
    if (clearCallback) {
        narrationAudio.onended = null;
        narrationAudio.onerror = null;
    }
}

function playAudio(filename, onEndedCallback = null) {
    const handleAudioEnd = () => {
        console.log("Audio ended:", filename);
        cleanupListeners();
        if (typeof onEndedCallback === 'function') onEndedCallback();
    };
    const handleAudioError = (e) => {
        console.error("Audio error:", filename, e);
        cleanupListeners();
        if (e && e.name === 'NotAllowedError') console.warn("Autoplay failed, user interaction needed.");
        else if (e && e.name === 'NotSupportedError') console.error("Audio format may not be supported or file is missing/corrupt.");
        else console.error("Audio playback failed for other reasons.");
        // If an error occurs, still call the callback to potentially unblock the flow
        if (typeof onEndedCallback === 'function') onEndedCallback(); 
    };
    const cleanupListeners = () => {
        narrationAudio.onended = null;
        narrationAudio.onerror = null;
    };

    if (!filename) {
        console.log("No audio filename provided.");
        if (typeof onEndedCallback === 'function') onEndedCallback();
        return;
    }
    
    const audioPath = filename.startsWith('voice/') ? filename : `voice/${filename}`;
    console.log(`Attempting to play audio: ${audioPath}`);

    // --- Modification Start ---
    // Stop previous audio *before* setting new source
    stopAudio(true); // Ensure previous listeners are cleared
    // --- Modification End ---
    
    narrationAudio.onended = handleAudioEnd;
    narrationAudio.onerror = handleAudioError;
    narrationAudio.src = audioPath;
    narrationAudio.currentTime = 0; // Ensure playback starts from beginning

    const playPromise = narrationAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => console.log("Audio playback started:", audioPath))
                   .catch(handleAudioError);
    } else {
         console.warn("Audio play() did not return a promise (may indicate immediate failure).");
         // Try loading manually to see if it triggers error event
         narrationAudio.load();
    }
}

// --- p5.js Sketch Definition ---
function clockSketch(config) {
    let handAngleOffset = 0; // For animation

    return function(p) {
        // Local state variables from config
        let localMissingNumbers = config.missingNumbers || [];
        let initialTime = config.initialTime || '12:00';
        let showHands = config.showClockHands;
        let animateHands = config.animateHands || false; // Get animation flag
        
        p.setup = () => {
            const container = document.getElementById('canvas-container');
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const canvasSize = p.min(containerWidth, containerHeight);
            
            console.log(`p5 setup: Container ${containerWidth}x${containerHeight}, Canvas: ${canvasSize}`);
            
            if (canvasSize <= 0) {
                console.error("p5 setup: Zero canvas size.");
                return; 
            }
            
            let canvas = p.createCanvas(canvasSize, canvasSize);
            canvas.parent('canvas-container');
            clockDiameter = canvasSize * 0.95; 
            
            p.angleMode(p.DEGREES);
            p.textAlign(p.CENTER, p.CENTER);
            p.textFont('Arial');
            
            // Only loop if animating
            if (animateHands) {
                p.loop();
            } else {
                p.noLoop();
            }
            p.redraw();
        };

        p.draw = () => {
            p.background(bgColor);
            p.translate(p.width / 2, p.height / 2);
            
            drawClockFace(p);
            
            if (showHands) {
                if (animateHands) {
                    // Animation logic
                    const speed = 0.5; // Degrees per frame for minute hand rotation
                    handAngleOffset += speed;
                    
                    // Calculate total continuous minutes based on angle offset
                    // 6 degrees = 1 minute
                    const totalMinutesElapsed = (handAngleOffset / 6);
                    
                    // Continuous values (hour can exceed 12, minute wraps 0-59)
                    const continuous_h = totalMinutesElapsed / 60;
                    const continuous_m = totalMinutesElapsed % 60;
                    
                    drawClockHands(p, { h: continuous_h, m: continuous_m });
                } else {
                    // Static display logic
                    let [h, m] = initialTime.split(':').map(Number);
                    h = isNaN(h) ? 12 : h; 
                    m = isNaN(m) ? 0 : m;  
                    drawClockHands(p, { h: h, m: m });
                }
            }
            
                drawNumbersAndInputBoxes(p, localMissingNumbers);
            drawCenterDot(p);
        };

        p.mouseClicked = () => {
             if (animateHands) return; // Don't handle clicks during animation step
             
            let boxSelected = false;
            const radius = clockDiameter * 0.38;
            const circleDiameterInput = clockDiameter * 0.12; 
            
            for (const num of localMissingNumbers) {
                const angle = p.map(num, 0, 12, -90, 270);
                const x = p.cos(angle) * radius;
                const y = p.sin(angle) * radius;
                
                if (p.dist(p.mouseX - p.width/2, p.mouseY - p.height/2, x, y) < circleDiameterInput / 2) {
                    console.log(`Clicked input box for: ${num}`);
                    selectedInputBox = num; // Update global selected box
                    boxSelected = true;
                    break; 
                }
            }
            if (!boxSelected) {
                selectedInputBox = null; // Deselect if clicking elsewhere
                console.log("Clicked outside input boxes, deselected.");
            }
            p.redraw(); // Redraw to show selection change
        };
        
        // Add startAnimation and stopAnimation methods
        p.startAnimation = () => {
             if (!animateHands) return;
             handAngleOffset = 0;
             p.loop();
         };
         
         p.stopAnimation = () => {
             if (!animateHands) return;
             p.noLoop();
         };
        
        p.remove = function() {
            console.log("p5 instance remove() called.");
            p.noLoop();
        };
    };
}

// --- Drawing Functions (Keep existing: drawClockFace, drawCenterDot, drawClockHands, drawHand) ---
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
        const startRadius = tickRadius * (i % 5 === 0 ? 0.92 : 0.95); // Longer hour marks
        const endRadius = tickRadius * (i % 5 === 0 ? 1.03 : 1.0);
        p.strokeWeight(i % 5 === 0 ? 3 : 1);
        p.line(p.cos(angle) * startRadius, p.sin(angle) * startRadius, p.cos(angle) * endRadius, p.sin(angle) * endRadius);
    }
}

function drawCenterDot(p) {
    p.noStroke();
    p.fill(centerDotColor);
    p.ellipse(0, 0, clockDiameter * 0.08, clockDiameter * 0.08);
}

function drawClockHands(p, timeConfig) {
    const hour = timeConfig.h;
    const minute = timeConfig.m;

    // Minute hand angle (always based on 0-59)
    const minuteAngle = p.map(minute, 0, 60, -90, 270);
    drawHand(p, minuteAngle, minuteHandColor, minuteHandLength, minuteHandWidth);

    // Hour hand angle:
    // For animation, hour might be > 12, representing total hours elapsed.
    // For static, hour is the specific hour (1-12).
    // Calculate angle directly: 30 degrees per hour, offset by -90.
    // The fractional part of 'hour' correctly positions it between numbers.
    const hourAngle = (hour * 30) - 90;
    drawHand(p, hourAngle, hourHandColor, hourHandLength, hourHandWidth);
}

function drawHand(p, angle, color, lengthMultiplier, weight) {
    p.push();
    p.rotate(angle);
    p.stroke(color);
    p.strokeWeight(weight);
    p.strokeCap(p.ROUND); 
    p.line(0, 0, clockDiameter * lengthMultiplier, 0);
    p.pop();
}

// Modified drawing function for numbers/inputs
function drawNumbersAndInputBoxes(p, missingNumbers) {
    p.textSize(clockDiameter * 0.10); // Slightly smaller text size
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    const radius = clockDiameter * 0.38; // Position radius
    
    for (let i = 1; i <= 12; i++) {
        const angle = p.map(i, 0, 12, -90, 270);
        const x = p.cos(angle) * radius;
        const y = p.sin(angle) * radius;
        
        if (missingNumbers.includes(i)) {
            const circleDiameterInput = clockDiameter * 0.12; 
            p.noStroke();
            
            // Highlight if selected
            if (selectedInputBox === i) {
                p.fill(200, 200, 255); // Light blue highlight
            } else {
                p.fill(inputBoxColor);
            }
            p.ellipse(x, y, circleDiameterInput);

            // Check correctness and draw feedback border
            let feedbackColor = null;
            if (inputValues[i] !== undefined && inputValues[i] !== '') {
                const isCorrect = (parseInt(inputValues[i]) === i);
                feedbackColor = isCorrect ? correctColor : incorrectColor;
                // Draw entered text
                p.fill(0); // Black text
                p.text(inputValues[i], x, y);
            } else if (selectedInputBox === i) {
                 // Optionally add visual cue for selected empty box (no cursor needed)
            }
             // Draw feedback border if applicable
            if (feedbackColor) {
                p.strokeWeight(3);
                p.stroke(feedbackColor);
                p.noFill();
                p.ellipse(x, y, circleDiameterInput + 4); // Slightly larger ellipse for border
            }
        } else {
            // Draw the number normally
            p.noStroke();
            p.fill(numberColor);
            p.text(i, x, y);
        }
    }
    p.textStyle(p.NORMAL);
}

// Add function to clear feedback
function clearFeedback() {
    const feedbackArea = document.getElementById('feedback-area');
    feedbackArea.textContent = "";
    feedbackArea.className = "feedback";
}

// Update the click handler to clear feedback when selecting a new input box
function handleClockClick(x, y) {
    clearFeedback(); // Clear any existing feedback
    // ... rest of the click handling code ...
}

// --- DOMContentLoaded setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Warm-up page DOM loaded.");
    
    // --- Get DOM Elements ---
    const startLessonButton = document.getElementById('start-lesson-button');
    const introSection = document.getElementById('intro-section'); // Get the new wrapper div
    // const initialTitle = document.getElementById('initial-lesson-title'); // Removed
    // const initialIntro = document.getElementById('initial-lesson-intro'); // Removed
    // const professorImg = document.getElementById('professor-img'); // Removed
    const warmUpContent = document.getElementById('warm-up-content');
    const actualSkipButton = document.getElementById('skip-button'); 
    const actualNextButton = document.getElementById('next-step-button'); // Use correct ID
    const actualPrevButton = document.querySelector('.btn-prev-step'); // Use class
    const audioButton = document.getElementById('footer-audio-button');
    // Add other elements if needed (progressBar, lessonCounter)
    const progressBar = document.querySelector('.progress-bar');
    const lessonCounter = document.querySelector('.lesson-counter');

    // --- Help Modal Logic ---
    const helpModal = document.getElementById('help-modal');
    const helpButton = document.getElementById('help-button');
    const closeHelpButton = document.getElementById('close-help-modal-button');

    const openModal = () => {
        if (helpModal) helpModal.classList.remove('hidden');
    };
    const closeModal = () => {
        if (helpModal) helpModal.classList.add('hidden');
    };
    if (helpButton) helpButton.addEventListener('click', openModal);
    if (closeHelpButton) closeHelpButton.addEventListener('click', closeModal);
    if (helpModal) {
        helpModal.addEventListener('click', (event) => {
            if (event.target === helpModal) closeModal();
        });
    }
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && helpModal && !helpModal.classList.contains('hidden')) {
            closeModal();
        }
    });
    // --- End Help Modal Logic ---

    // --- Initialization (UI only) ---
    updateNavigationButtons(); // Set initial button states
    updateProgressBar(); // Set initial progress
    updateLessonCounter(); // Set initial counter text

    // --- Start Button Logic ---
    if (startLessonButton && introSection && warmUpContent && actualPrevButton && actualNextButton && actualSkipButton) {
        startLessonButton.addEventListener('click', () => {
            console.log("Start Learning button clicked.");
            // Hide initial content
            startLessonButton.style.display = 'none'; 
            introSection.style.display = 'none'; // Hide the wrapper div
            // initialTitle.style.display = 'none'; // Removed
            // initialIntro.style.display = 'none'; // Removed
            // professorImg.style.display = 'none'; // Removed
            // Show main content and nav buttons
            warmUpContent.classList.remove('hidden'); 
            actualNextButton.style.display = 'inline-flex';
            actualPrevButton.style.display = 'inline-flex'; 
            actualSkipButton.style.display = 'inline-flex';
            
            // Load the intro animation step (index 0)
            loadWarmUpStep(0); 
        });
    } else {
        console.error("Warm-up Start Error: Check IDs for start button, intro-section, warm-up-content, and nav buttons in warm-up.html.");
    }

    // --- Other Event Listeners ---
    // Next Button
    if (actualNextButton) {
        actualNextButton.addEventListener('click', () => {
            console.log("Next button clicked.");
            // Check if we are on the intro step (0) before moving
            if (currentWarmUpStep === 0) {
                 // Stop animation before moving to step 1
                 if (p5Instance && p5Instance.stopAnimation) {
                     p5Instance.stopAnimation();
                 }
                 loadWarmUpStep(1); // Explicitly load step 1
            } else {
                 // For other steps, proceed normally
                 loadWarmUpStep(currentWarmUpStep + 1); 
            }
        });
    } else {
         console.warn("Next button #next-step-button not found.");
    }
    // Previous Button
    if (actualPrevButton) { 
        actualPrevButton.addEventListener('click', () => {
             console.log("Previous button clicked.");
             if (currentWarmUpStep > 0) { 
                 // If going back from step 1, stop any potential animation from step 0
                 if (currentWarmUpStep === 1 && p5Instance && p5Instance.stopAnimation) {
                     p5Instance.stopAnimation();
                 }
                 loadWarmUpStep(currentWarmUpStep - 1);
             }
             // Add logic here if you want to go back to the initial welcome screen from step 0
        });
    } else {
        console.warn("Previous button .btn-prev-step not found.");
    }
    // Skip Button (Modified to skip intro animation)
    if (actualSkipButton) {
        actualSkipButton.addEventListener('click', () => {
            console.log("Skip button clicked.");
            if (currentWarmUpStep === 0) {
                 // If on intro animation, skip directly to step 1
                 stopAudio(true); // Stop intro audio
                 if (p5Instance && p5Instance.stopAnimation) {
                     p5Instance.stopAnimation();
                 }
                 loadWarmUpStep(1);
            } else {
                 // For other steps, skip to the next section
                 console.log("Skipping to learn-it.html");
                 window.location.href = 'learn-it.html';
            }
        });
    } else {
        console.warn("Skip button #skip-button not found.");
    }
    // Keyboard Input
    document.addEventListener('keydown', (event) => {
        // Only handle input if an input box is selected
        if (selectedInputBox !== null && /^[0-9]$/.test(event.key)) { 
            handleKeyboardInput(event.key);
        }
    });
    // Footer Audio Button
    if (audioButton) {
        audioButton.addEventListener('click', () => {
            console.log("Footer audio button clicked.");
             stopAudio(true); // Stop if playing
             playCurrentAudio(); // Replay current step's audio
        });
    } else {
        console.warn("Footer audio button #footer-audio-button not found.");
    }
    
    console.log("Warm-up page event listeners attached.");
}); 