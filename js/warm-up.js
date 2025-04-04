// --- Global Variables & Constants ---
const titleElement = document.getElementById('warm-up-title');
const instructionElement = document.getElementById('warm-up-instruction');
const characterImageElement = document.getElementById('learn-it-character');
const canvasContainer = document.getElementById('canvas-container');
const checkArea = document.getElementById('embedded-check-area');
const feedbackArea = document.getElementById('feedback-area');
const nextButton = document.getElementById('next-step-button');
const prevButton = document.querySelector('.btn-prev-step');
const skipButton = document.getElementById('skip-button');
const lessonCounterElement = document.querySelector('.lesson-counter');

// --- Lesson State (Globals reduced) ---
let currentSubStep = -1; // Start at -1 before first load
let p5Instance = null; // Holds the current p5 instance
let narrationAudio = new Audio(); // Audio object for narration
let currentAudioFilename = null; // Store the filename for the current instruction
let clockDiameter; // Keep global as it's calculated in setup

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

// --- Audio Filename Map ---
const audioFilenameMap = {
    '0-instruction': 'this_is_how_a_clock_looks_like.mp3',
    '1-instruction': 'welcome_time_explorers_lets_quickly.mp3',
    '1-feedback-correct': 'correct.mp3',
    '1-feedback-incorrect': 'try_again.mp3',
    '1-complete': 'perfect.mp3'
};

// --- Lesson Data (Defined as substeps) ---
const subSteps = [
    { // 0: Introduction to Clock
        title: "Let's Take a Look at a Clock",
        instruction: "This is how a clock looks like. A clock has numbers from 1 to 12 arranged in a circle. It also has two hands that tell us the time.",
        p5config: {
            stepIndex: 0,
            showAllNumbers: true,
            showHands: true,
            initialTime: { h: 1, m: 0 },
            animateHands: false,
            showMissingNumbers: false
        },
        setup: (instance) => {
            console.log("Running setup for Step 0");
            const stepData = subSteps[0];
            instructionElement.innerHTML = stepData.instruction;
            const instructionAudioFile = getAudioFilename(0, 'instruction');
            currentAudioFilename = instructionAudioFile;
            
            playAudio(instructionAudioFile);
            // Enable next button for this step
            nextButton.disabled = false;
        }
    },
    { // 1: Missing Numbers Activity
        title: "Fix the Missing Numbers",
        instruction: "Oh no! Some numbers are missing from our clock! Can you help fix the clock by filling in the missing numbers? Click on each empty box and type the correct number on your keyboard.",
        missingNumbers: [1, 4, 8],
        p5config: {
            stepIndex: 1,
            showAllNumbers: false,
            showHands: true,
            initialTime: { h: 1, m: 0 },
            animateHands: false,
            showMissingNumbers: true,
            missingNumbers: [1, 4, 8]
        },
        setup: (instance) => {
            console.log("Running setup for Step 1");
            const stepData = subSteps[1];
            instructionElement.innerHTML = stepData.instruction;
            
            const instructionAudioFile = getAudioFilename(1, 'instruction');
            currentAudioFilename = instructionAudioFile;
            playAudio(instructionAudioFile);
            
            // Initialize input values
            for (const num of stepData.missingNumbers) {
                inputValues[num] = undefined;
            }
            
            // Disable next button until all inputs are correct
            nextButton.disabled = true;
            
            // Enable interaction
            if (instance) {
                instance.initializeInputBoxes(stepData.missingNumbers);
            }
        }
    }
];

// Track user input for missing numbers
let inputValues = {};
let selectedInputBox = null;

// --- Helper Functions (Audio, etc.) ---
function getAudioFilename(stepIndex, partKey) {
    const key = `${stepIndex}-${partKey}`;
    const filename = audioFilenameMap[key];
    if (!filename) {
        console.warn(`Audio mapping not found for key: ${key}`);
        return null;
    }
    return filename;
}

function stopAudio(clearCallback = true) {
    if (narrationAudio && !narrationAudio.paused) {
        narrationAudio.pause();
        narrationAudio.currentTime = 0;
        console.log("Stopped audio playback.");
        // Optionally clear the callback if stopping manually mid-sequence
        if (clearCallback) {
            narrationAudio.onended = null;
            narrationAudio.onerror = null;
        }
    }
    
    // Also clear any pending callbacks if stopping explicitly
    if (clearCallback) {
        narrationAudio.onended = null;
        narrationAudio.onerror = null;
    }
}

function playAudio(filename, onEndedCallback = null) {
    // --- Listener Setup ---
    const handleAudioEnd = () => {
        console.log("Audio ended:", filename);
        cleanupListeners(); // Remove listeners
        if (typeof onEndedCallback === 'function') {
            console.log("Executing onEndedCallback.");
            onEndedCallback(); // Execute callback only on natural end
        }
    };
    
    const handleAudioError = (e) => {
        console.error("Audio error:", filename, e);
        cleanupListeners(); // Remove listeners
        if (e && e.name === 'NotAllowedError') {
            console.warn("Autoplay failed, user interaction needed.");
        } else {
            console.error("Audio playback failed for other reasons.");
        }
    };
    
    const cleanupListeners = () => {
        narrationAudio.onended = null;
        narrationAudio.onerror = null;
    };
    // --- End Listener Setup ---

    if (!filename) {
        console.log("No audio filename provided or available for current step.");
        if (typeof onEndedCallback === 'function') {
            console.log("No audio, executing callback immediately.");
            onEndedCallback(); // Execute callback if no audio needed
        }
        return;
    }
    
    const audioPath = `voice/${filename}`;
    console.log(`Attempting to play audio:`, audioPath);

    // Stop previous audio WITHOUT clearing potential new listeners/callbacks
    stopAudio(false); // Don't clear callback when stopping for new track

    // Assign new listeners
    cleanupListeners(); // Clear any stray listeners first
    narrationAudio.onended = handleAudioEnd;
    narrationAudio.onerror = handleAudioError;

    narrationAudio.src = audioPath;
    console.log("Audio source set to:", audioPath);
    narrationAudio.currentTime = 0;

    // --- Attempt to play ---
    const playPromise = narrationAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log("Audio playback started:", audioPath);
        }).catch(handleAudioError);
    } else {
        console.warn("Audio play() did not return a promise.");
    }
}

// --- Core Functions ---

// Modified loadSubStep to pass config to sketch
function loadSubStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= subSteps.length) {
        console.error("Invalid step index:", stepIndex);
        if (p5Instance) {
            p5Instance.remove();
            p5Instance = null;
        }
        instructionElement.innerHTML = "End of 'Warm-Up' section.";
        titleElement.textContent = "Finished!";
        const container = document.getElementById('canvas-container');
        if (container) container.innerHTML = '';
        return;
    }

    console.log(`Loading sub-step: ${stepIndex}`);
    currentSubStep = stepIndex;
    const stepData = subSteps[currentSubStep];

    // Remove previous p5 instance
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
    }
    
    const container = document.getElementById('canvas-container');
    if (container) container.innerHTML = '';
    else { console.error("Canvas container not found!"); return; }

    stopAudio(true);
    
    // Update general UI elements (Title, Feedback, etc.)
    titleElement.textContent = stepData.title;
    instructionElement.innerHTML = ''; // Setup will set
    feedbackArea.textContent = '';
    feedbackArea.className = 'feedback';
    checkArea.innerHTML = '';
    
    if (lessonCounterElement) {
        lessonCounterElement.textContent = `Warm-up - Step ${stepIndex + 1} of ${subSteps.length}`;
    }
    
    nextButton.disabled = true;

    // Create new p5 instance, passing the config
    if (stepData.p5config && typeof p5 !== 'undefined') {
        console.log("Creating new p5 instance with config:", stepData.p5config);
        try {
            // Pass the step-specific config to the sketch function generator
            p5Instance = new p5(clockSketch(stepData.p5config));
            console.log("p5 instance created successfully:", p5Instance);

            // Call the step's setup function, passing the new instance
            if (typeof stepData.setup === 'function') {
                setTimeout(() => {
                    if (p5Instance && currentSubStep === stepIndex) {
                        console.log(`Calling setup function for step ${currentSubStep}`);
                        stepData.setup(p5Instance); // Pass instance to setup
                    } else {
                        console.warn(`p5 instance changed/removed before setup for step ${stepIndex} could run.`);
                    }
                }, 50); // Short delay for init
            }
        } catch (error) {
            console.error(`Error creating p5 instance for step ${currentSubStep}:`, error);
            p5Instance = null;
            feedbackArea.textContent = "Error loading interactive element.";
            feedbackArea.className = 'feedback feedback-incorrect';
        }
    } else {
        // Handle steps without p5 config or if p5 isn't loaded
        console.log(`No p5 config for step ${currentSubStep}, or p5 library not loaded.`);
        nextButton.disabled = false; // Enable next if no interaction
    }

    // Update button states
    prevButton.disabled = (currentSubStep === 0);
}

// --- Handle Interaction Result (for input validation) ---
function handleInteractionResult(boxNumber, inputValue, isCorrect) {
    if (!p5Instance || currentSubStep !== 1) return; // Only relevant for step 1
    
    const step = subSteps[currentSubStep];
    
    if (isCorrect) {
        console.log(`Input Correct! Box: ${boxNumber}, Value: ${inputValue}`);
        feedbackArea.textContent = "Great job! That's correct!";
        feedbackArea.className = 'feedback feedback-correct';
        playAudio(getAudioFilename(currentSubStep, 'feedback-correct'));
        
        // Check if all inputs are correct
        checkAllInputsComplete();
    } else {
        console.log(`Input Incorrect! Box: ${boxNumber}, Value: ${inputValue}`);
        feedbackArea.textContent = "Not quite right. Try again! Remember, the number should match its position on the clock.";
        feedbackArea.className = 'feedback feedback-incorrect';
        playAudio(getAudioFilename(currentSubStep, 'feedback-incorrect'));
    }
}

function checkAllInputsComplete() {
    const step = subSteps[currentSubStep];
    const missingNumbers = step.missingNumbers;
    
    // Check if all missing numbers have correct inputs
    const allCorrect = missingNumbers.every(num => 
        inputValues[num] !== undefined && parseInt(inputValues[num]) === num
    );
    
    if (allCorrect) {
        feedbackArea.textContent = "Amazing! You fixed all the missing numbers on our clock! Now it's complete!";
        feedbackArea.className = 'feedback feedback-correct';
        playAudio(getAudioFilename(currentSubStep, 'complete'));
        
        // Enable next button
        nextButton.disabled = false;
    }
}

// --- p5.js Sketch Function (with config) ---
function clockSketch(config) {
    return function(p) {
        // Local state variables
        let stepConfig = config;
        let localMissingNumbers = config.missingNumbers || [];
        let localSelectedInputBox = null;
        
        // --- p5.js Setup ---
        p.setup = () => {
            let canvas = p.createCanvas(400, 400);
            canvas.parent('canvas-container');
            clockDiameter = p.min(p.width, p.height) * 0.6;
            p.angleMode(p.DEGREES);
            p.textAlign(p.CENTER, p.CENTER);
            p.textFont('Arial');
            p.noLoop(); // Static display
            p.redraw();
        };

        // --- p5.js Draw ---
        p.draw = () => {
            p.background(bgColor);
            p.translate(p.width / 2, p.height / 2);
            
            // Draw clock face
            drawClockFace(p);
            
            // Draw hands if enabled
            if (stepConfig.showHands) {
                drawClockHands(p, stepConfig.initialTime);
            }
            
            // Draw numbers
            if (stepConfig.showAllNumbers) {
                drawAllNumbers(p);
            } else if (stepConfig.showMissingNumbers) {
                drawNumbersAndInputBoxes(p, localMissingNumbers);
            }
            
            // Draw center dot
            drawCenterDot(p);
        };

        // --- p5.js Event Handlers ---
        p.mousePressed = () => {
            // Check if we're in step 1 (missing numbers)
            if (stepConfig.stepIndex !== 1) return;
            
            // Check if clicked on an input box
            for (const numStr of Object.keys(inputValues)) {
                const num = parseInt(numStr);
                if (isMouseOverNumber(p, num)) {
                    if (localSelectedInputBox !== num) {
                        localSelectedInputBox = num;
                        selectedInputBox = num; // Update global
                        console.log("Selected input box:", localSelectedInputBox);
                        p.redraw();
                        
                        // Clear previous feedback when selecting a new box
                        feedbackArea.textContent = '';
                        feedbackArea.className = 'feedback';
                    }
                    return;
                }
            }
            localSelectedInputBox = null; // Clear selection if clicked elsewhere
            selectedInputBox = null; // Update global
            p.redraw();
        };
        
        // --- Helper function to check if mouse is over a number position ---
        function isMouseOverNumber(p, num) {
            const angle = num * 30 - 90;
            const radius = clockDiameter * 0.35;
            const x = p.cos(angle) * radius;
            const y = p.sin(angle) * radius;
            return p.dist(p.mouseX - p.width / 2, p.mouseY - p.height / 2, x, y) < clockDiameter * 0.09;
        }
        
        // --- External interface methods ---
        p.initializeInputBoxes = (missingNums) => {
            localMissingNumbers = missingNums;
            for (const num of missingNums) {
                inputValues[num] = undefined;
            }
            p.redraw();
        };
        
        p.handleKeyInput = (key, boxNum) => {
            if (boxNum !== null && /^[0-9]$/.test(key)) {
                const numericInput = parseInt(key);
                const isCorrect = (numericInput === boxNum);
                inputValues[boxNum] = key;
                p.redraw();
                return isCorrect;
            }
            return false;
        };
        
        // --- Clean up ---
        p.remove = function() {
            console.log(`Removing p5 instance for step ${config.stepIndex}.`);
            p.noLoop();
        };
        
        return p;
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

        if (i % 5 === 0) { // Hour marks are thicker and longer
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

function drawClockHands(p, timeConfig) {
    const hour = timeConfig ? timeConfig.h : 1;
    const minute = timeConfig ? timeConfig.m : 0;
    
    // Draw hour hand
    const hourAngle = p.map(hour % 12 + minute / 60, 0, 12, 0, 360) - 90;
    drawHand(p, hourAngle, hourHandColor, hourHandLength, hourHandWidth);
    
    // Draw minute hand
    const minuteAngle = p.map(minute, 0, 60, 0, 360) - 90;
    drawHand(p, minuteAngle, minuteHandColor, minuteHandLength, minuteHandWidth);
}

function drawHand(p, angle, color, lengthMultiplier, weight) {
    p.push();
    p.rotate(angle);
    p.stroke(color);
    p.strokeWeight(weight);
    p.strokeCap(p.ROUND); // Rounded end for hands
    p.line(0, 0, clockDiameter * lengthMultiplier, 0);
    p.pop();
}

function drawAllNumbers(p) {
    p.textFont('Arial', clockDiameter * 0.13);
    p.textStyle(p.BOLD);
    
    for (let i = 1; i <= 12; i++) {
        const angle = i * 30 - 90;
        const radius = clockDiameter * 0.35;
        const x = p.cos(angle) * radius;
        const y = p.sin(angle) * radius;
        
        // Draw all numbers
        p.noStroke();
        p.fill(numberColor);
        p.text(i, x, y);
    }
    p.textStyle(p.NORMAL);
}

function drawNumbersAndInputBoxes(p, missingNumbers) {
    p.textFont('Arial', clockDiameter * 0.13);
    p.textStyle(p.BOLD);
    
    for (let i = 1; i <= 12; i++) {
        const angle = i * 30 - 90;
        const radius = clockDiameter * 0.35;
        const x = p.cos(angle) * radius;
        const y = p.sin(angle) * radius;
        
        if (missingNumbers.includes(i)) {
            // Draw input box
            p.noStroke();
            
            // Box background
            if (selectedInputBox === i) {
                p.fill('#FFD700'); // Highlight selected box
            } else if (inputValues[i] !== undefined) {
                // Box has a value - color based on correctness
                if (parseInt(inputValues[i]) === i) {
                    p.fill(correctColor);
                } else {
                    p.fill(incorrectColor);
                }
            } else {
                p.fill(inputBoxColor);
            }
            
            p.rect(x - clockDiameter * 0.08, y - clockDiameter * 0.08, 
                   clockDiameter * 0.16, clockDiameter * 0.16, 
                   clockDiameter * 0.02); // Rounded rectangle
                   
            // Draw input value if it exists
            if (inputValues[i] !== undefined) {
                p.fill(numberColor);
                p.text(inputValues[i], x, y);
            }
        } else {
            // Draw regular number
            p.noStroke();
            p.fill(numberColor);
            p.text(i, x, y);
        }
    }
    p.textStyle(p.NORMAL);
}

// --- Keyboard Input Handler ---
function handleKeyboardInput(key) {
    if (currentSubStep !== 1 || selectedInputBox === null) return;
    
    if (/^[0-9]$/.test(key)) {
        // Use p5 instance to handle the input
        if (p5Instance) {
            const isCorrect = p5Instance.handleKeyInput(key, selectedInputBox);
            handleInteractionResult(selectedInputBox, key, isCorrect);
        }
    }
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    const footerAudioButton = document.getElementById('footer-audio-button');
    const startLessonButton = document.getElementById('start-lesson-button');
    const nextButtonActual = document.getElementById('next-step-button');
    const prevButtonActual = document.querySelector('.btn-prev-step');
    const skipButtonActual = document.getElementById('skip-button');
    const professorImg = document.getElementById('professor-img');
    const warmUpContent = document.getElementById('warm-up-content');
    const initialTitle = document.getElementById('initial-lesson-title');
    const initialIntro = document.getElementById('initial-lesson-intro');

    console.log("DOM Loaded for Warm-up.");
    
    // Initialize keyboard event listener for number input
    document.addEventListener('keydown', (event) => {
        // Only handle digit keys (0-9) for input
        if (/^[0-9]$/.test(event.key)) {
            handleKeyboardInput(event.key);
        }
    });
    
    // --- Adjust Start Button Logic ---
    if (startLessonButton && skipButtonActual && prevButtonActual && nextButtonActual && professorImg && 
        warmUpContent && initialTitle && initialIntro) {
        
        console.log("All required initial elements found.");
        
        startLessonButton.addEventListener('click', () => {
            console.log("Start button clicked.");
            startLessonButton.style.display = 'none'; 
            
            // --- Hide Initial Text & Image, Show Content --- 
            initialTitle.classList.add('hidden'); 
            initialIntro.classList.add('hidden'); 
            professorImg.classList.add('hidden');
            warmUpContent.classList.remove('hidden'); 
            
            // Show the actual navigation buttons
            skipButtonActual.style.display = 'inline-flex'; 
            prevButtonActual.style.display = 'inline-flex'; 
            nextButtonActual.style.display = 'inline-flex'; 

            // --- Load the FIRST sub-step ---
            loadSubStep(0);
        });
        
        // Setup navigation buttons
        nextButtonActual.addEventListener('click', () => {
            if (currentSubStep < subSteps.length - 1) {
                // If moving from step 0 to step 1, show a transition message
                if (currentSubStep === 0) {
                    // Temporarily disable the button to prevent double clicks
                    nextButtonActual.disabled = true;
                    
                    // Show transition message
                    feedbackArea.textContent = "Now let's see if you can help fix a clock with some missing numbers!";
                    feedbackArea.className = 'feedback';
                    
                    // Load the next step after a short delay to let user read the message
                    setTimeout(() => {
                        loadSubStep(currentSubStep + 1);
                        nextButtonActual.disabled = false;
                    }, 2000);
                } else {
                    loadSubStep(currentSubStep + 1);
                }
            } else {
                // Navigate to next page
                window.location.href = 'learn-it.html';
            }
        });
        
        prevButtonActual.addEventListener('click', () => {
            if (currentSubStep > 0) {
                loadSubStep(currentSubStep - 1);
            } else {
                // Navigate to previous page
                window.location.href = 'index.html';
            }
        });
        
    } else {
        console.error("One or more required elements not found!",
            {start: startLessonButton, skip: skipButtonActual, prev: prevButtonActual, 
             next: nextButtonActual, professor: professorImg, content: warmUpContent, 
             initialTitle, initialIntro});
    }

    if (footerAudioButton) {
        console.log("Footer audio button found.");
        footerAudioButton.addEventListener('click', () => {
            console.log("Footer audio button clicked.");
            console.log("Current audio filename to play:", currentAudioFilename);
            stopAudio(true); // Stop current and clear pending callback
            playAudio(currentAudioFilename); // Replay from beginning
        });
    } else {
        console.error("Footer audio button not found!");
    }
}); 