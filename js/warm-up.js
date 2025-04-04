// --- Global Variables & Constants ---
// Use let instead of const for DOM elements that might be created dynamically
let titleElement;
let instructionElement;
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
    // Audio for introduction step (now skipped)
    // '0-instruction': 'this_is_how_a_clock_looks_like.mp3',
    
    // Updated indices for missing numbers activity (now at index 0)
    '0-instruction': 'welcome_time_explorers_lets_quickly_check.mp3',
    '0-feedback-correct': 'correct.mp3',
    '0-feedback-incorrect': 'try_again.mp3',
    '0-complete': 'perfect.mp3'
};

// --- Lesson Data (Defined as substeps) ---
const subSteps = [
    // Step 0 is already commented out - we're skipping the introduction and going straight to
    // the missing numbers activity as requested
    // { // 0: Introduction to Clock
    //     title: "Let's Take a Look at a Clock",
    //     instruction: "This is how a clock looks like. A clock has numbers from 1 to 12 arranged in a circle. It also has two hands that tell us the time.",
    //     p5config: {
    //         stepIndex: 0,
    //         showAllNumbers: true,
    //         showHands: true,
    //         initialTime: { h: 1, m: 0 },
    //         animateHands: false,
    //         showMissingNumbers: false
    //     },
    //     setup: (instance) => {
    //         console.log("Running setup for Step 0");
    //         const stepData = subSteps[0];
    //         instructionElement.innerHTML = stepData.instruction;
    //         const instructionAudioFile = getAudioFilename(0, 'instruction');
    //         currentAudioFilename = instructionAudioFile;
            
    //         playAudio(instructionAudioFile);
    //         // Enable next button for this step
    //         nextButton.disabled = false;
    //     }
    // },
    { // 1: Missing Numbers Activity
        title: "Fix the Missing Numbers",
        instruction: "Welcome, time explorers! Let's quickly check this clock. A few numbers are missing! Can you type the correct number in each empty box?",
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
            console.log("Running setup for Step 0 (Missing Numbers)");
            const stepData = subSteps[0]; // This is now the first step
            instructionElement.innerHTML = stepData.instruction; // Use the updated instruction
            
            const instructionAudioFile = getAudioFilename(0, 'instruction'); 
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
    
    // Make sure canvas container and check area are clear
    canvasContainer.innerHTML = '';
    checkArea.innerHTML = '';
    
    // Stop any playing audio
    stopAudio(true);
    
    // Update general UI elements (Title, Feedback, etc.)
    titleElement.textContent = stepData.title;
    instructionElement.innerHTML = ''; // Setup will set
    feedbackArea.textContent = '';
    feedbackArea.className = 'feedback';
    
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
    if (!p5Instance || currentSubStep !== 0) return; // Updated index check since step 1 is now index 0
    
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
        let localInteractionEnabled = true;
        
        // --- p5.js Setup ---
        p.setup = () => {
            // Get container dimensions for responsive canvas
            const container = document.getElementById('canvas-container');
            if (!container) {
                console.error("Canvas container not found!");
                return;
            }
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const canvasSize = p.min(containerWidth, containerHeight);
            
            console.log(`Container size: ${containerWidth}x${containerHeight}, Canvas size: ${canvasSize}`);
            
            let canvas = p.createCanvas(canvasSize, canvasSize);
            canvas.parent('canvas-container');
            clockDiameter = canvasSize * 0.95; // Match learn-it.js size (95% of canvas)
            
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
        p.mouseClicked = () => {
            if (!localInteractionEnabled) return;
            let boxSelected = false;
            for (const num of stepConfig.missingNumbers) {
                const angle = p.map(num, 0, 12, -90, 270);
                const numberRadius = clockDiameter * 0.38;
                const x = p.cos(angle) * numberRadius;
                const y = p.sin(angle) * numberRadius;
                const circleDiameter = clockDiameter * 0.12;
                // Check if click is within the circle bounds
                if (p.dist(p.mouseX - p.width/2, p.mouseY - p.height/2, x, y) < circleDiameter / 2) {
                    console.log(`Clicked on input box for number ${num}`);
                    selectedInputBox = num;
                    boxSelected = true;
                    break; // Only select one box at a time
                }
            }
            if (!boxSelected) {
                selectedInputBox = null; // Deselect if clicking elsewhere
            }
            p.redraw(); // Redraw to show selection highlight
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
    p.textSize(clockDiameter * 0.10);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);

    for (let i = 1; i <= 12; i++) {
        const angle = p.map(i, 0, 12, -90, 270);
        const numberRadius = clockDiameter * 0.38;
        const x = p.cos(angle) * numberRadius;
        const y = p.sin(angle) * numberRadius;

        if (missingNumbers.includes(i)) {
            // Draw a circle placeholder instead of a rectangle
            const circleDiameter = clockDiameter * 0.12; // Size of the circle
            p.noStroke();
            
            // Highlight if selected
            if (selectedInputBox === i) {
                p.fill(200, 200, 255); // Light blue highlight
            } else {
                p.fill(inputBoxColor); // Default grey placeholder color
            }
            p.ellipse(x, y, circleDiameter);

            // Determine correctness directly
            let feedbackColor = null;
            if (inputValues[i] !== undefined && inputValues[i] !== '') {
                const isCorrect = (parseInt(inputValues[i]) === i);
                feedbackColor = isCorrect ? correctColor : incorrectColor;

                // Draw entered text inside the circle
                p.fill(0); // Black text
                p.text(inputValues[i], x, y);
            } else if (selectedInputBox === i) {
                // Maybe show a blinking cursor simulation if selected and empty
                // if (p.frameCount % 60 < 30) { // <<< Comment out this block
                //     p.fill(0); 
                //     p.rect(x - circleDiameter * 0.05, y - circleDiameter * 0.2, circleDiameter * 0.1, circleDiameter * 0.4);
                // } // <<< End comment out
            }

            // Draw feedback indicator (like a border) if needed
            if (feedbackColor) {
                p.strokeWeight(3);
                p.stroke(feedbackColor);
                p.noFill();
                p.ellipse(x, y, circleDiameter + 4);
            }

        } else {
            // Draw the number normally
            p.noStroke();
            p.fill(numberColor);
            p.text(i, x, y);
        }
    }
    p.textStyle(p.NORMAL); // Reset text style
}

// --- Keyboard Input Handler ---
function handleKeyboardInput(key) {
    if (currentSubStep !== 0 || selectedInputBox === null) return; // Updated index check
    
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
    const contentRight = document.querySelector('.content-right');
    
    // Initialize title and instruction elements
    titleElement = document.getElementById('warm-up-title');
    if (!titleElement) {
        titleElement = document.createElement('h2');
        titleElement.id = 'warm-up-title';
        titleElement.textContent = "Let's Take a Look at a Clock";
    }
    
    instructionElement = document.getElementById('warm-up-instruction');
    if (!instructionElement) {
        instructionElement = document.createElement('p');
        instructionElement.id = 'warm-up-instruction';
        instructionElement.className = 'instruction';
        instructionElement.textContent = "Instructions will appear here.";
    }
    
    // Append to content-right if not already there and if contentRight exists
    if (contentRight) {
        if (!document.getElementById('warm-up-title')) {
            contentRight.appendChild(titleElement);
        }
        if (!document.getElementById('warm-up-instruction')) {
            contentRight.appendChild(instructionElement);
        }
    }

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

            // Make sure content containers are ready
            const contentLeft = document.querySelector('.content-left');
            const contentRight = document.querySelector('.content-right');
            
            // Make sure canvasContainer and checkArea are in contentLeft
            if (contentLeft && canvasContainer.parentNode !== contentLeft) {
                contentLeft.appendChild(canvasContainer);
                contentLeft.appendChild(checkArea);
            }
            
            // Make sure title and instruction are in contentRight
            if (contentRight) {
                if (titleElement.parentNode !== contentRight) {
                    contentRight.appendChild(titleElement);
                }
                if (instructionElement.parentNode !== contentRight) {
                    contentRight.appendChild(instructionElement);
                }
            }

            // --- Load the FIRST sub-step ---
            loadSubStep(0); // We're now loading index 0 which is the missing numbers activity
        });
        
        // Setup navigation buttons
        nextButtonActual.addEventListener('click', () => {
            if (currentSubStep < subSteps.length - 1) {
                // If moving from missing numbers to next step
                loadSubStep(currentSubStep + 1);
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