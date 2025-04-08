// --- Global Variables & Constants ---
const titleElement = document.getElementById('learn-it-title');
const instructionElement = document.getElementById('learn-it-instruction');
const characterImageElement = document.getElementById('learn-it-character');
const canvasContainer = document.getElementById('canvas-container');
const checkArea = document.getElementById('embedded-check-area');
const feedbackArea = document.getElementById('feedback-area');
const nextButton = document.getElementById('next-step-button');
const prevButton = document.querySelector('.btn-prev-step');
const skipButton = document.getElementById('skip-button');
const lessonCounterElement = document.querySelector('.lesson-counter');

// --- Lesson State (Globals reduced) ---
let currentSubStep = 2; // Start at -1 before first load
let p5Instance = null; // Holds the current p5 instance
let narrationAudio = new Audio(); // Audio object for narration
let currentAudioFilename = null; // Store the filename for the current instruction
let clockDiameter; // Keep global as it's calculated in setup
// --- Removed p5-specific global state variables ---
// highlightTarget, interactionTarget, interactionEnabled, handAnimationActive,
// handAngleOffset, hoveredNumber, clickFeedback are now managed per instance.

// Color definitions (Updated)
const bgColor = '#FFFFFF';
const clockFaceColor = '#FDF8E1'; // Creamy off-white
const clockRimColor = '#0077CC'; // Brighter Blue
const numberColor = '#005999'; // Dark Blue for numbers
const centerDotColor = '#FFA500'; // Orange/Yellow
const hourHandColor = '#005999'; // Dark Blue hour hand
const minuteHandColor = '#E63946'; // Brighter Red minute hand
const highlightColor = '#FDB813'; // Yellow for hover/highlight
const correctColor = '#5CB85C'; // Green
const incorrectColor = '#E63946'; // Red (match minute hand)

// Dimension constants (Updated)
const hourHandLength = 0.28; // Slightly longer hour hand
const minuteHandLength = 0.40; // Slightly longer minute hand
const hourHandWidth = 10; // Thicker hour hand
const minuteHandWidth = 8; // Thicker minute hand

// --- Audio Filename Map ---
const audioFilenameMap = {
    // Learn It Step 0 (Face)
    '0-instruction': 'this_is_a_clock_face_it.mp3',
    '0-check': 'quick_check_the_numbers_go_in.mp3',
    '0-feedback-correct': 'correct.mp3',
    '0-feedback-incorrect': 'think_about_counting_what_number_comes.mp3',

    // Learn It Step 1 (Hands)
    '1-instruction1': 'see_these_pointers_they_are_called.mp3',
    '1-instruction2': 'this_long_red_hand_is_the.mp3',
    '1-instruction3': 'easy_way_to_remember_hour_hand.mp3',
    '1-check1': 'click_on_the_hour_hand_the.mp3', // Check 1 instruction
    '1-check2': 'now_click_on_the_minute_hand.mp3', // Check 2 instruction
    '1-feedback-correct': 'correct.mp3',
    '1-feedback-incorrect': 'not_quite_right_try_again.mp3',

    // Learn It Step 2 (Direction)
    '2-instruction': 'watch_how_the_hands_move_they.mp3',
    '2-check': 'which_arrow_shows_the_clockwise_direction.mp3',
    '2-feedback-correct': 'perfect_thats_clockwise.mp3',
    '2-feedback-incorrect': 'not_quite_remember_clockwise_follows_the.mp3',
};

// --- Helper Functions to Setup Check Phases ---
function setupStep0Check(stepData, instance) {
    console.log("Setting up check phase for Step 0.");
    if (!instance) return;
    instance.updateHighlight(null); // Ensure highlighting is cleared
    instructionElement.innerHTML = stepData.instructionCheck;
    const checkAudioFile = getAudioFilename(0, 'check');
    currentAudioFilename = checkAudioFile;
    playAudio(checkAudioFile);
    instance.setInteraction(true, stepData.p5config.interactionTarget);
}

function setupStep1Check(stepData, instance, checkIndex) {
    console.log(`Setting up check phase for Step 1, check index: ${checkIndex}`);
    if (!instance || !stepData.checks || checkIndex >= stepData.checks.length) return;
    instance.stopBlinking();
    const check = stepData.checks[checkIndex];
    const target = { type: 'hand', value: check.targetValue };
    instructionElement.innerHTML = check.instruction;
    const audioKey = `check${checkIndex + 1}`;
    const audioFile = getAudioFilename(1, audioKey);
    currentAudioFilename = audioFile;
    playAudio(audioFile);
    instance.setInteraction(true, target);
    nextButton.disabled = true;
}

function setupStep2Check(stepData, instance) {
    console.log("Setting up check phase for Step 2.");
    if (!instance) return;
    instance.stopAnimation({h: 12, m: 0}); 
    instance.updateHighlight(null); 
    instructionElement.innerHTML = stepData.instructionCheck;
    
    // --- Create Wrapper Layout ---
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-check-wrapper';
    
    // Using the new layout structure
    const contentLeft = document.querySelector('.content-left');
    contentLeft.innerHTML = ''; // Clear content-left
    contentLeft.appendChild(wrapper);
    wrapper.appendChild(canvasContainer);
    wrapper.appendChild(checkArea);
    
    checkArea.innerHTML = ''; // Clear area before adding buttons
    createDirectionCheckButtons(); // Add buttons inside the checkArea (now in wrapper)
    
    console.log("Disabling interaction for Step 2 Check.");
    instance.setInteraction(false, null); 
    
    const checkAudioFile = getAudioFilename(2, 'check');
    currentAudioFilename = checkAudioFile;
    playAudio(checkAudioFile); 
    nextButton.disabled = true;
}

// --- Cleanup Function ---
function cleanupCheckLayout() {
    const wrapper = document.querySelector('.canvas-check-wrapper');
    if (wrapper) {
        console.log("Cleaning up check layout wrapper.");
        
        // Using the new layout structure
        const contentLeft = document.querySelector('.content-left');
        contentLeft.innerHTML = ''; // Clear content-left first
        contentLeft.appendChild(canvasContainer);
        contentLeft.appendChild(checkArea);
    }
    // No need to reset styles that aren't being set
    checkArea.innerHTML = ''; // Ensure check area is clear after cleanup
}

// --- Lesson Data (Update setup functions) ---
const subSteps = [
    { // 0: Face & Numbers
        title: "Learn It: The Clock Face",
        instruction: "This is a <strong>clock face</strong>! It helps us tell time. Look at the numbers. They go in order all the way around, starting from <span id='num-1'>1</span>, then <span id='num-2'>2</span>, <span id='num-3-dots'>3...</span> up to 12 at the very top.",
        instructionCheck: "Quick check! The numbers go in order. Click the number that comes <strong>right after</strong> the number 8.",
        checkType: 'number',
        correctValue: 9,
        feedbackCorrect: "Correct! 9 comes right after 8.",
        feedbackIncorrect: "Think about counting! What number comes after 8? Find it on the clock face and click it.",
        p5config: {
            stepIndex: 0,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 10, m: 10 },
            animateHands: false,
            showDirectionArrows: false,
            interactionTarget: { type: 'number', value: 9 } // Step-specific target
        },
        setup: (instance) => {
            console.log("Running setup for Step 0");
            const stepData = subSteps[0];
            instructionElement.innerHTML = stepData.instruction;
            const instructionAudioFile = getAudioFilename(0, 'instruction');
            currentAudioFilename = instructionAudioFile;

            // Define highlighting sequence
            const highlightNumbersSequentially = () => {
                let currentHighlightNumber = 1;
                const highlightDuration = 360;
                const delayBetweenHighlights = 90;
                function highlightNext() {
                    if (!instance) { setupStep0Check(stepData, instance); return; } // Call helper
                    if (currentHighlightNumber > 12) { setupStep0Check(stepData, instance); return; } // Call helper
                    instance.updateHighlight({ type: 'number', value: currentHighlightNumber });
                    console.log("Highlighting number:", currentHighlightNumber);
                    setTimeout(() => {
                        if (instance) instance.updateHighlight(null);
                        console.log("Cleared highlight for number:", currentHighlightNumber);
                        setTimeout(() => {
                            currentHighlightNumber++;
                            // Add 1-second pause between numbers 1 and 2
                            if (currentHighlightNumber === 2) {
                                setTimeout(highlightNext, 600); // 1-second pause
                            } else {
                                highlightNext();
                            }
                        }, delayBetweenHighlights);
                    }, highlightDuration);
                }
                highlightNext();
            };

            playAudio(instructionAudioFile);
            console.log("Scheduling number highlighting sequence in 6 seconds (Step 0).");
            setTimeout(highlightNumbersSequentially, 6000);
            if (instance) instance.setInteraction(false, null);
        }
    },
    { // 1: The Hands
        title: "Learn It: The Hands",
        instruction1: "See these pointers? They are called hands! This short, blue hand is the <strong>Hour Hand</strong>. It tells us the hour.",
        instruction2: "This long, red hand is the <strong>Minute Hand</strong>. It tells us the minutes.",
        instruction3: "Easy way to remember: Hour hand is short, Minute hand is long!",
        check1: "Click on the <strong>Hour Hand</strong> (the short one).",
        check2: "Now, click on the <strong>Minute Hand</strong> (the long one).",
        checkType: 'hand',
        checks: [
            { instruction: "Click on the <strong>Hour Hand</strong> (the short one).", targetValue: 'hour', feedbackCorrect: "You got it! That's the short hour hand.", feedbackIncorrect: "Oops! Remember, the hour hand is the *short* one. Click the short hand." },
            { instruction: "Now, click on the <strong>Minute Hand</strong> (the long one).", targetValue: 'minute', feedbackCorrect: "Excellent! That's the long minute hand.", feedbackIncorrect: "Careful! The minute hand is the *long* one. Click the long hand." }
        ],
        currentCheckIndex: 0,
        p5config: {
            stepIndex: 1,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 3, m: 0 },
            animateHands: false,
            showDirectionArrows: false
            // interactionTarget set dynamically by checks
        },
        setup: (instance) => {
            console.log("Running setup for Step 1");
            const stepData = subSteps[1];
            stepData.currentCheckIndex = 0;
            nextButton.disabled = true;

            // Define instruction sequence with blinking
            const playInstruction3 = () => {
                instructionElement.innerHTML = stepData.instruction3;
                // No blinking for summary, proceed to check
                playAudio(getAudioFilename(1, 'instruction3'), () => {
                    setupStep1Check(stepData, instance, 0);
                });
            };
            const playInstruction2 = () => {
                instructionElement.innerHTML = stepData.instruction2;
                if (instance) instance.startBlinking('minute'); // Start minute hand blink
                playAudio(getAudioFilename(1, 'instruction2'), () => {
                    if (instance) instance.stopBlinking(); // Stop minute hand blink
                     setTimeout(playInstruction3, 2000);
                 });
            };
            const playInstruction1 = () => {
                instructionElement.innerHTML = stepData.instruction1;
                 // Start hour hand blink after 4 seconds
                 setTimeout(() => { 
                     if (instance && currentSubStep === 1) { // Check if still on step 1
                         instance.startBlinking('hour'); 
                     }
                 }, 4000);
                playAudio(getAudioFilename(1, 'instruction1'), () => {
                    if (instance) instance.stopBlinking(); // Stop hour hand blink
                     setTimeout(playInstruction2, 2000);
                 });
            };

            playInstruction1();
            if (instance) instance.setInteraction(false, null);
        }
    },
    { // 2: Clockwise Direction
        title: "Learn It: Clockwise Direction",
        instruction: "Watch how the hands move! They always go around in the same direction, past 1, 2, 3... This special direction is called <strong>Clockwise</strong>.",
        instructionCheck: "Which arrow shows the clockwise direction?",
        checkType: 'direction',
        correctValue: 'clockwise',
        feedbackCorrect: "Correct! That arrow shows the clockwise direction.",
        feedbackIncorrect: "Clockwise follows the numbers 1, 2, 3... Try again!",
        p5config: {
            stepIndex: 2,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 12, m: 0 },
            animateHands: true,
            interactionTarget: { type: 'direction', value: 'clockwise' }
        },
        setup: (instance) => {
            console.log("Running setup for Step 2");
            const stepData = subSteps[2];
            instructionElement.innerHTML = stepData.instruction;
            checkArea.innerHTML = '';
            feedbackArea.textContent = '';
            nextButton.disabled = true;
            const instructionAudioFile = getAudioFilename(2, 'instruction');
            currentAudioFilename = instructionAudioFile;

            // Play instruction audio, call check setup helper in callback
            playAudio(instructionAudioFile, () => setupStep2Check(stepData, instance)); // Call helper
            if (instance) instance.startAnimation();
            if (instance) instance.setInteraction(false, null);
        }
    }
];

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
             narrationAudio.onended = null; // Remove listener if we are stopping it unrelated to ending naturally
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
        // Do NOT execute callback on error, especially NotAllowedError
        if (e && e.name === 'NotAllowedError') {
             console.warn("Autoplay failed, user interaction needed.");
        } else {
             console.error("Audio playback failed for other reasons.");
        }
    };
    const cleanupListeners = () => {
         // Use direct property assignment for simpler listener management
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
       // Rely on events
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
        instructionElement.innerHTML = "End of 'Learn It' section.";
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
        // Count steps that have p5 config as 'learn' steps
        const totalLearnSteps = subSteps.filter(s => s.p5config).length;
        lessonCounterElement.textContent = `Learn It - Step ${stepIndex + 1} of ${totalLearnSteps}`;
    }
    nextButton.disabled = true;

    // Create new p5 instance, passing the config
    if (stepData.p5config && typeof p5 !== 'undefined') {
        console.log("Creating new p5 instance with config:", stepData.p5config);
        try {
            // Pass the step-specific config to the sketch function generator <<< MODIFIED
            p5Instance = new p5(sketch(stepData.p5config));
            console.log("p5 instance created successfully:", p5Instance);

            // Call the step's setup function, passing the new instance <<< MODIFIED
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

// --- handleInteractionResult (Revised Incorrect/Re-enable logic) ---
function handleInteractionResult(isCorrect) {
    if (!p5Instance || currentSubStep < 0 || currentSubStep >= subSteps.length) return;

    const step = subSteps[currentSubStep];
    const checkType = step.checkType;
    const currentInstance = p5Instance; // Capture instance at time of call

    // Disable interaction immediately via instance (if applicable)
    if (checkType !== 'direction') {
        currentInstance.setInteraction(false, null);
    }

    if (isCorrect) {
        console.log(`Interaction Correct! Step: ${currentSubStep}`); // Log step
        feedbackArea.textContent = step.feedbackCorrect || "Correct!";
        feedbackArea.className = 'feedback feedback-correct'; // Apply correct class
        playAudio(getAudioFilename(currentSubStep, 'feedback-correct'));

        if (checkType === 'hand' && step.checks && step.currentCheckIndex < step.checks.length - 1) {
            // Logic for multi-part hand check (seems okay)
            step.currentCheckIndex++;
            console.log(`Moving to next check within step ${currentSubStep}, index: ${step.currentCheckIndex}`);
            setTimeout(() => {
                 if (p5Instance !== currentInstance) return;
                 const nextCheck = step.checks[step.currentCheckIndex];
                 const nextTarget = { type: 'hand', value: nextCheck.targetValue };
                 instructionElement.innerHTML = nextCheck.instruction;
                 currentAudioFilename = getAudioFilename(1, `check${step.currentCheckIndex + 1}`);
                 playAudio(currentAudioFilename);
                 currentInstance.updateHighlight(nextTarget);
                 currentInstance.setInteraction(true, nextTarget);
                 currentInstance.resetClickFeedback();
                 feedbackArea.textContent = ''; // Clear feedback when moving to next sub-check
                 feedbackArea.className = 'feedback';
             }, 1500);
        } else {
            // Single check passed, or last part of multi-check passed
            console.log(`Correct final check for step ${currentSubStep}. Enabling Next button now.`);
            nextButton.disabled = false; // Enable Next button immediately for ALL steps

            // Optional: clear p5 click feedback after a delay
            setTimeout(() => {
                 if (p5Instance === currentInstance && checkType !== 'direction') {
                      currentInstance.resetClickFeedback();
                 }
             }, 1500);
        }
    } else { // Incorrect
        console.log("Interaction Incorrect!");
        feedbackArea.textContent = step.feedbackIncorrect || "Try again!";
        feedbackArea.className = 'feedback feedback-incorrect'; // Apply incorrect class
        playAudio(getAudioFilename(currentSubStep, 'feedback-incorrect'));

        // Re-enable interaction after delay (if not direction buttons)
        if (checkType !== 'direction') {
            setTimeout(() => {
                 // Check if instance is still the same one for this step
                 if (p5Instance === currentInstance) {
                     console.log(`Re-enabling interaction for step ${currentSubStep} after incorrect attempt.`);
                     currentInstance.resetClickFeedback(); // Clear visual p5 feedback

                     // Re-enable with the correct interaction target for the current step/check
                     let targetToReEnable = null;
                     if (step.checkType === 'hand' && step.checks) {
                         // For multi-part hand checks, use the current check's target
                         targetToReEnable = { type: 'hand', value: step.checks[step.currentCheckIndex]?.targetValue };
                     } else if (step.p5config.interactionTarget) {
                         // Otherwise, use the main interaction target from the config
                         targetToReEnable = step.p5config.interactionTarget;
                     }

                     if (targetToReEnable && targetToReEnable.value) { // Ensure target is valid
                         currentInstance.setInteraction(true, targetToReEnable);
                     } else {
                          console.warn("Could not determine target to re-enable interaction.");
                     }
                     
                     // DO NOT CLEAR feedback text/class here - let it persist
                     // feedbackArea.textContent = '';
                     // feedbackArea.className = 'feedback';
                 }
            }, 2000);
        }
        // No automatic clearing for direction buttons either
    }
}

// --- Refactored p5 sketch Function ---
function sketch(config) {
    return function(p) {
        // --- Local Sketch State (managed per instance) ---
        let stepConfig = config;
        let localHighlightTarget = null;
        let localInteractionTarget = config.interactionTarget || null;
        let localInteractionEnabled = false;
        let localHandAnimationActive = config.animateHands || false;
        let localHandAngleOffset = 0;
        let localHoveredNumber = null;
        let localHoveredHand = null;
        let localHoveredArrow = null; // <<< NEW state for arrow hover
        let localClickFeedback = { number: null, hand: null, arrow: null, correct: null }; // Added arrow property
        let currentHour = config.initialTime ? config.initialTime.h : 10;
        let currentMinute = config.initialTime ? config.initialTime.m : 10;
        // Blinking State <<< NEW
        let localBlinkingHand = null;
        let localBlinkVisible = true;
        let localBlinkIntervalId = null;

        // --- p5.js Setup ---
        p.setup = () => {
            const container = document.getElementById('canvas-container');
            if (!container) {
                console.error("Canvas container not found!");
                return;
            }
            // Use container dimensions for canvas size
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const canvasSize = p.min(containerWidth, containerHeight); // Keep it square-ish
            
            console.log(`Container size: ${containerWidth}x${containerHeight}, Canvas size: ${canvasSize}`);
            
            let canvas = p.createCanvas(canvasSize, canvasSize); // Create responsive canvas
            canvas.parent('canvas-container');
            clockDiameter = canvasSize * 0.95; // Adjust diameter based on actual size (Increased multiplier)
            
            p.angleMode(p.DEGREES);
            p.textAlign(p.CENTER, p.CENTER);
            p.textFont('Arial');
            console.log(`p5 setup for step ${stepConfig.stepIndex}. Animation: ${localHandAnimationActive}`);
            if (!localHandAnimationActive) p.noLoop(); else p.loop();
            p.redraw();
        };

        // --- p5.js Draw --- (Pass blinking state to drawHand)
        p.draw = () => {
            p.background(bgColor);
            p.translate(p.width / 2, p.height / 2);
            // Pass local state to drawing functions
            drawClockFace(p); // Includes tick marks now
            if (stepConfig.showNumbers) {
                drawHourNumbers(p, localHoveredNumber, localClickFeedback, localHighlightTarget, localInteractionTarget);
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
                 // Pass local state including blinking state to hand drawing <<< MODIFIED
                 drawHand(p, 'minute', mAngle, minuteHandColor, minuteHandLength, minuteHandWidth, localHighlightTarget, localHoveredHand, localClickFeedback, localBlinkingHand, localBlinkVisible);
                 drawHand(p, 'hour', hAngle, hourHandColor, hourHandLength, hourHandWidth, localHighlightTarget, localHoveredHand, localClickFeedback, localBlinkingHand, localBlinkVisible);
            }
             if (stepConfig.showDirectionArrows) {
                 // Pass hover and click state to drawing function <<< MODIFIED
                 drawDirectionArrows(p, localInteractionEnabled, localHoveredArrow, localClickFeedback);
             }
             // Draw center dot last to be on top of hands
             drawCenterDot(p);
        };

        // --- p5.js Event Handlers (using local state) ---
        p.mouseMoved = () => {
            if (!localInteractionEnabled) { // Exit early if interaction is off
                 // Reset hover state if interaction gets disabled while hovering
                 if (localHoveredArrow) {
                     localHoveredArrow = null;
                     if (!localHandAnimationActive) p.redraw(); // Redraw if static
                     p.cursor(p.ARROW);
                 }
                 return;
            }
            let prevHoverNumber = localHoveredNumber;
            let prevHoverHand = localHoveredHand;
            let prevHoverArrow = localHoveredArrow; 
            localHoveredNumber = null;
            localHoveredHand = null;
            localHoveredArrow = null; 

            // Check number hover
            if (localInteractionTarget?.type === 'number' && stepConfig.showNumbers) {
                 for (let i = 1; i <= 12; i++) {
                     const angle = i * 30 - 90;
                     const radius = clockDiameter * 0.38;
                     const x = p.cos(angle) * radius;
                     const y = p.sin(angle) * radius;
                     const numHitRadius = clockDiameter * 0.09;
                     if (p.dist(p.mouseX - p.width / 2, p.mouseY - p.height / 2, x, y) < numHitRadius) {
                         localHoveredNumber = i;
                         break;
                     }
                 }
            }
             // Check hand hover
             else if (localInteractionTarget?.type === 'hand' && stepConfig.showHands) {
                 // --- Basic Hand Hover Detection --- 
                 const mouseVec = p.createVector(p.mouseX - p.width/2, p.mouseY - p.height/2);
                 const checkHandHover = (handType, angle, length) => {
                     const handVec = p5.Vector.fromAngle(p.radians(angle), clockDiameter * length);
                     // Simple bounding box or distance check
                     const distToHand = distPointLine(mouseVec.x, mouseVec.y, 0, 0, handVec.x, handVec.y);
                      // Check distance AND if mouse is roughly within the hand's length
                     const mouseDistFromCenter = mouseVec.mag();
                     const handLengthPixels = clockDiameter * length;
                     if (distToHand < 10 && mouseDistFromCenter < handLengthPixels + 10) { // Tolerance of 10px
                         return true;
                     }
                     return false;
                 };
                  // Get current angles (even if static)
                  let mAngle = p.map(currentMinute, 0, 60, 0, 360) - 90;
                  let hAngle = p.map(currentHour % 12 + currentMinute / 60, 0, 12, 0, 360) - 90;
                 // Check minute hand first (longer, visually on top)
                 if (checkHandHover('minute', mAngle, minuteHandLength)) {
                     localHoveredHand = 'minute';
                 } else if (checkHandHover('hour', hAngle, hourHandLength)) {
                      localHoveredHand = 'hour';
                 }
             }
             // Check direction arrow hover ONLY if interaction is enabled and type is direction <<< MODIFIED
             else if (localInteractionTarget?.type === 'direction') { // No need to check config.showDirectionArrows
                 const arrowRadius = clockDiameter * 0.5; 
                 const arrowSize = clockDiameter * 0.15;
                 const hitRadius = arrowSize * 1.2;

                 // Calculate position ONLY for the clockwise arrow on the RIGHT
                 const cwX_pos = p.cos(-30) * arrowRadius; 
                 const cwY_pos = p.sin(-30) * arrowRadius;

                 const distToCW_Symbol = p.dist(p.mouseX - p.width / 2, p.mouseY - p.height / 2, cwX_pos, cwY_pos);

                 // Assign hover only for the clockwise arrow
                 if (distToCW_Symbol < hitRadius) {
                     localHoveredArrow = 'clockwise'; // Hovering over the ↻ symbol (now on right)
                 }
                 // No else needed, as there's no other arrow
             }

            // Redraw if hover state changed
            if (prevHoverNumber !== localHoveredNumber || prevHoverHand !== localHoveredHand || prevHoverArrow !== localHoveredArrow) { 
                if (!localHandAnimationActive) p.redraw();
            }
            // Update cursor
            let cursorType = p.ARROW;
            if ((localHoveredNumber && localInteractionTarget?.type === 'number') || 
                (localHoveredHand && localInteractionTarget?.type === 'hand') || 
                (localHoveredArrow && localInteractionTarget?.type === 'direction')) { 
                 cursorType = p.HAND;
            }
            p.cursor(cursorType);
        };

        p.mousePressed = () => {
            if (!localInteractionEnabled) return;

            // <<< NEW: Clear previous feedback on new attempt >>>
            if (feedbackArea.textContent) {
                 console.log("Clearing previous feedback on new click.");
                 feedbackArea.textContent = '';
                 feedbackArea.className = 'feedback';
            }
            // <<< End New >>>

            let clickedValue = null;
            let clickedType = null;

            // Determine clicked element (number, hand, or arrow)
            if (localHoveredNumber && localInteractionTarget?.type === 'number') {
                clickedValue = localHoveredNumber;
                clickedType = 'number';
                localClickFeedback = { number: clickedValue, hand: null, arrow: null, correct: null };
            } else if (localHoveredHand && localInteractionTarget?.type === 'hand') {
                 clickedValue = localHoveredHand;
                 clickedType = 'hand';
                 localClickFeedback = { number: null, hand: clickedValue, arrow: null, correct: null };
            } else if (localHoveredArrow && localInteractionTarget?.type === 'direction') { // localHoveredArrow will only be 'clockwise'
                 clickedValue = localHoveredArrow;
                 clickedType = 'direction';
                 localClickFeedback = { number: null, hand: null, arrow: clickedValue, correct: null };
            }

            // Process the click if a valid target type was clicked
            if (clickedType && clickedType === localInteractionTarget.type) {
                console.log(`p5 clicked ${clickedType}: ${clickedValue}`);
                const isCorrect = (clickedValue === localInteractionTarget.value);
                // Update specific feedback property based on type
                if (clickedType === 'number') { localClickFeedback.number = clickedValue; }
                else if (clickedType === 'hand') { localClickFeedback.hand = clickedValue; }
                else if (clickedType === 'direction') { localClickFeedback.arrow = clickedValue; }
                localClickFeedback.correct = isCorrect;
                p.redraw();
                setTimeout(() => { handleInteractionResult(isCorrect); }, 300);
            }
        };

        // --- External Control Methods --- (Add blinking methods)
        p.updateHighlight = (newTarget) => {
            // Avoid redraw if target hasn't changed
            if (JSON.stringify(localHighlightTarget) !== JSON.stringify(newTarget)) {
                localHighlightTarget = newTarget;
                if (!localHandAnimationActive) p.redraw();
            }
        };
        p.setInteraction = (enabled, target) => { // Update to reset arrow hover/feedback
            if (localInteractionEnabled !== enabled || JSON.stringify(localInteractionTarget) !== JSON.stringify(target)) {
                 localInteractionEnabled = enabled;
                 localInteractionTarget = target || null;
                 localClickFeedback = { number: null, hand: null, arrow: null, correct: null }; // Reset feedback (no arrow)
                 localHoveredNumber = null;
                 localHoveredHand = null;
                 console.log(`p5 setInteraction for step ${stepConfig.stepIndex}. Enabled: ${enabled}, Target:`, localInteractionTarget);
                 if (!localHandAnimationActive) p.redraw();
             }
        };
        p.startAnimation = () => {
            if (!localHandAnimationActive) {
                localHandAnimationActive = true;
                console.log(`p5 startAnimation for step ${stepConfig.stepIndex}`);
                p.loop();
            }
        };
        p.stopAnimation = (setTime) => {
            if (localHandAnimationActive) {
                localHandAnimationActive = false;
                console.log(`p5 stopAnimation for step ${stepConfig.stepIndex}`);
                if (setTime) {
                   currentHour = setTime.h;
                   currentMinute = setTime.m;
                }
                p.noLoop();
                p.redraw(); // Draw final static frame
            }
        };
        p.resetClickFeedback = () => {
            if (localClickFeedback.number !== null || localClickFeedback.hand !== null || localClickFeedback.arrow !== null) { 
                localClickFeedback = { number: null, hand: null, arrow: null, correct: null };
                if (!localHandAnimationActive) p.redraw();
            }
        };

        // Blinking Control Methods <<< NEW
        p.startBlinking = (handType) => {
            if (localBlinkIntervalId) p.stopBlinking(); // Stop previous blinking
            localBlinkingHand = handType;
            localBlinkVisible = true; // Start visible
            console.log(`Starting blink for: ${handType}`);
            localBlinkIntervalId = setInterval(() => {
                localBlinkVisible = !localBlinkVisible;
                // console.log(`Blink state: ${localBlinkVisible}`);
                if (!localHandAnimationActive) p.redraw(); // Redraw if static
            }, 500); // Blink interval (ms)
        };
        p.stopBlinking = () => {
             if (localBlinkIntervalId) {
                 console.log(`Stopping blink for: ${localBlinkingHand}`);
                 clearInterval(localBlinkIntervalId);
                 localBlinkIntervalId = null;
             }
             localBlinkingHand = null;
             localBlinkVisible = true; // Ensure hand is visible when stopped
             if (!localHandAnimationActive) p.redraw(); // Redraw final state
         };

        // --- Cleanup --- (Ensure blinking stops)
        p.remove = () => {
            console.log(`Removing p5 instance for step ${stepConfig.stepIndex}.`);
            p.stopBlinking(); // <<< ADDED
            p.noLoop();
        };

        return p;
    };
}

// --- Drawing Functions (Updated) ---
function drawClockFace(p) {
    // Draws the static clock face background, rim, and tick marks
    p.strokeWeight(clockDiameter * 0.04); // Rim thickness
    p.stroke(clockRimColor);
    p.fill(clockFaceColor);
    p.ellipse(0, 0, clockDiameter, clockDiameter);

    // --- Draw Tick Marks ---
    const tickRadius = clockDiameter * 0.45; // Position just inside the rim
    p.stroke(numberColor); // Use number color for ticks
    for (let i = 0; i < 60; i++) {
        const angle = p.map(i, 0, 60, -90, 270); // Map 0-60 minutes to degrees
        const startRadius = tickRadius * 0.95;
        let endRadius = tickRadius;
        let tickWeight = 1;

        if (i % 5 === 0) { // Hour marks are thicker and longer
            tickWeight = 3;
            endRadius = tickRadius * 1.03; // Slightly longer hour marks
        }

        p.strokeWeight(tickWeight);
        const x1 = p.cos(angle) * startRadius;
        const y1 = p.sin(angle) * startRadius;
        const x2 = p.cos(angle) * endRadius;
        const y2 = p.sin(angle) * endRadius;
        p.line(x1, y1, x2, y2);
    }
}

// Separate function for center dot to draw it on top
function drawCenterDot(p) {
     p.noStroke(); // No outline for the dot
     p.fill(centerDotColor); // Use the defined center dot color
     p.ellipse(0, 0, clockDiameter * 0.08, clockDiameter * 0.08); // Larger center dot
}

// Modified drawHand to include blinking logic
function drawHand(p, handType, angle, color, lengthMultiplier, weight, highlightTarget, hoveredHand, clickFeedback, blinkingHand, blinkVisible) {
    p.push();
    p.rotate(angle);
    let finalWeight = weight;
    let finalColor = color;
    let isVisible = true;

    // Check blinking state <<< NEW
    if (blinkingHand === handType && !blinkVisible) {
        isVisible = false;
    }

    // Apply hover state (only if visible)
    if (isVisible && hoveredHand === handType) {
        finalColor = highlightColor;
        finalWeight = weight + 2;
    }
    // Apply highlight state (overrides hover, only if visible)
    if (isVisible && highlightTarget && highlightTarget.type === 'hand' && (highlightTarget.value === handType || highlightTarget.value === 'both')) {
        finalColor = highlightColor;
        finalWeight = weight + 4;
    }
    // Apply click feedback state (overrides hover/highlight, only if visible)
    if (isVisible && clickFeedback.hand === handType) {
         finalColor = clickFeedback.correct ? correctColor : incorrectColor;
         finalWeight = weight + 4;
    }

    // Draw the hand only if it's currently visible
    if (isVisible) {
        p.strokeCap(p.ROUND);
        p.stroke(finalColor);
        p.strokeWeight(finalWeight);
        p.line(0, 0, clockDiameter * lengthMultiplier, 0);
    }
    
    p.pop();
}

function drawHourNumbers(p, hoveredNumber, clickFeedback, highlightTarget, interactionTarget) {
    p.textFont('Arial', clockDiameter * 0.13); // Use Arial Bold, slightly larger size
    p.textStyle(p.BOLD);
    for (let i = 1; i <= 12; i++) {
        const angle = i * 30 - 90;
        const radius = clockDiameter * 0.35; // Adjust radius to fit inside tick marks
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
        // Check hover
        else if (!isHighlighted && hoveredNumber === i && interactionTarget?.type === 'number') {
            highlightFill = highlightColor;
            isHighlighted = true;
        }

        // Draw highlight ellipse BEHIND number if needed
        if (isHighlighted && highlightFill) {
            p.fill(highlightFill);
            // Make highlight slightly larger than number text bounds
            p.ellipse(x, y, clockDiameter * 0.18, clockDiameter * 0.18);
        }

        // Draw number text
        p.fill(numberColor);
        p.text(i, x, y);
    }
    p.textStyle(p.NORMAL); // Reset text style
}

function applyHighlights(p, highlightTarget) {
    // Only handles non-number/non-hand highlights now.
    // Example: Face highlight (if needed for a future step)
    // if (highlightTarget && highlightTarget.type === 'face') { ... }
}

// Update drawDirectionArrows: Only draw single CW arrow on right when interaction enabled
function drawDirectionArrows(p, interactionEnabled, hoveredArrow, clickFeedback) {
    console.log("drawDirectionArrows entered.");
    
    const arrowRadius = clockDiameter * 0.5; 
    const arrowSize = clockDiameter * 0.15;
    const baseTextSize = arrowSize * 1.8;
    const hitRadius = arrowSize * 1.2; 

    // Calculate position ONLY for the clockwise arrow on the RIGHT
    const cwX = p.cos(-30) * arrowRadius; 
    const cwY = p.sin(-30) * arrowRadius;

    p.noStroke();

    // --- Draw Clockwise Arrow '↻' (at right position) --- 
    let cwFill = numberColor; 
    let cwBgFill = null;
    let cwScale = 1.0;

    // Apply click feedback if the clicked arrow was clockwise
    if (clickFeedback.arrow === 'clockwise') {
        cwBgFill = clickFeedback.correct ? correctColor : incorrectColor;
        cwScale = 1.1;
    }
    // Apply hover feedback if hovering over the clockwise arrow
    else if (hoveredArrow === 'clockwise') {
        cwBgFill = highlightColor;
        cwScale = 1.1;
    }

    // Draw background circle if needed
    if (cwBgFill) {
        p.fill(p.color(cwBgFill));
        p.ellipse(cwX, cwY, hitRadius * 2.2 * cwScale, hitRadius * 2.2 * cwScale);
    }
    // Draw arrow text
    p.push();
    p.translate(cwX, cwY);
    p.scale(cwScale);
    p.fill(cwFill);
    p.textSize(baseTextSize);
    p.text("↻", 0, 0); // Draw the clockwise symbol
    p.pop();
}

// --- Utility function needed for hand hover ---
function distPointLine(x, y, x1, y1, x2, y2) {
  const L2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (L2 === 0) return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
  let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / L2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));
}

// --- Navigation Handler Functions ---
function handleNextClick() {
    console.log("Next button clicked.");
    stopAudio(true);
    cleanupCheckLayout();
    
    // If on intro screen, move to step 0
    if (currentSubStep === -1) {
        loadSubStep(0);
        return;
    }
    
    // Go to next step
    if (currentSubStep < subSteps.length - 1) {
        loadSubStep(currentSubStep + 1);
    } else {
        // Redirect to next lesson page (try-it.html)
        window.location.href = 'try-it.html';
    }
}

function handlePrevClick() {
    console.log("Previous button clicked.");
    stopAudio(true);
    cleanupCheckLayout();
    
    // Go to previous step or intro
    if (currentSubStep > 0) {
        loadSubStep(currentSubStep - 1);
    } else if (currentSubStep === 0) {
        // Return to warm-up.html
        window.location.href = 'warm-up.html';
    }
}

function handleSkipClick() {
    console.log("Skip button clicked.");
    stopAudio(true);
    
    if (currentSubStep < subSteps.length - 1) {
        loadSubStep(currentSubStep + 1);
    } else {
        // Redirect to the next lesson page
        window.location.href = 'try-it.html';
    }
}

// --- Toggle Audio Function ---
function toggleAudio() {
    const audioIcon = audioButton.querySelector('i');
    
    if (narrationAudio.paused) {
        // Audio is paused, attempt to restart current audio
        if (currentAudioFilename) {
            playAudio(currentAudioFilename);
            audioIcon.className = 'fas fa-volume-up';
        }
    } else {
        // Audio is playing, pause it
        stopAudio(true);
        audioIcon.className = 'fas fa-volume-mute';
    }
}

// --- Update Lesson Counter Function ---
function updateLessonCounter() {
    if (lessonCounterElement) {
        if (currentSubStep === -1) {
            // On intro screen
            lessonCounterElement.textContent = 'Step 2 of 5: Learn It';
        } else {
            // Count steps that have p5 config as 'learn' steps
            const totalLearnSteps = subSteps.filter(s => s.p5config).length;
            lessonCounterElement.textContent = `Step 2 of 5: Learn It (${currentSubStep + 1}/${totalLearnSteps})`;
        }
    }
}

// --- DOMContentLoaded setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Learn It page DOM loaded.");

    // --- DOM Element References ---
    const titleElement = document.getElementById('learn-it-title');
    const instructionElement = document.getElementById('learn-it-instruction');
    const canvasContainer = document.getElementById('canvas-container');
    const checkArea = document.getElementById('embedded-check-area');
    const feedbackArea = document.getElementById('feedback-area');
    const nextButton = document.getElementById('next-step-button');
    const prevButton = document.querySelector('.btn-prev-step');
    const skipButton = document.getElementById('skip-button');
    const lessonCounterElement = document.querySelector('.lesson-counter');
    const audioButton = document.getElementById('footer-audio-button');
    const audioIcon = audioButton ? audioButton.querySelector('i') : null;
    const startLessonButton = document.getElementById('start-lesson-button');
    const learnItContent = document.getElementById('learn-it-content');
    const initialTitle = document.getElementById('initial-lesson-title');
    const initialIntro = document.getElementById('initial-lesson-intro');
    const professorImg = document.getElementById('professor-img');

    // --- State Variables ---
    let currentSubStep = -1; // Start before the first step
    let p5Instance = null;
    let narrationAudio = new Audio();
    let currentAudioFilename = null;
    let interactionEnabled = true; // Global flag for p5 interaction
    let blinkInterval = null;

    // --- Help Modal Logic ---
    const helpModal = document.getElementById('help-modal');
    const helpButton = document.getElementById('help-button');
    const closeHelpButton = document.getElementById('close-help-modal-button');

    const openModal = () => {
        if (helpModal) {
            helpModal.classList.remove('hidden');
        }
    };

    const closeModal = () => {
        if (helpModal) {
            helpModal.classList.add('hidden');
        }
    };

    if (helpButton) {
        helpButton.addEventListener('click', openModal);
    }

    if (closeHelpButton) {
        closeHelpButton.addEventListener('click', closeModal);
    }

    if (helpModal) {
        helpModal.addEventListener('click', (event) => {
            if (event.target === helpModal) { // Close only if background is clicked
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && helpModal && !helpModal.classList.contains('hidden')) {
            closeModal();
        }
    });
    // --- End Help Modal Logic ---

    // --- Existing Initial Setup & Event Listeners ---
    // Check for required elements
    if (!titleElement || !instructionElement || !canvasContainer || !checkArea || 
        !feedbackArea || !nextButton || !prevButton || !skipButton || !lessonCounterElement || 
        !audioButton || !startLessonButton || !learnItContent || !initialTitle || !initialIntro || !professorImg) {
        console.error("Learn It Page Error: One or more required elements not found!");
        // Optionally display an error message to the user
        document.body.innerHTML = '<p>Error loading lesson components. Please refresh or contact support.</p>';
        return; // Stop execution if critical elements are missing
    }

    // Start button logic
    startLessonButton.addEventListener('click', () => {
        console.log("Start Learning button clicked.");
        startLessonButton.style.display = 'none'; // Hide Start button
        initialTitle.style.display = 'none';
        initialIntro.style.display = 'none';
        professorImg.style.display = 'none';

        learnItContent.classList.remove('hidden'); // Show the main content area
        nextButton.style.display = 'inline-flex'; // Show Next button
        prevButton.style.display = 'inline-flex'; // Show Prev button
        skipButton.style.display = 'inline-flex'; // Show Skip button

        loadSubStep(0); // Load the first actual step
    });

    // Navigation button listeners 
    nextButton.addEventListener('click', handleNextClick); // Assuming handleNextClick exists
    prevButton.addEventListener('click', handlePrevClick); // Assuming handlePrevClick exists
    skipButton.addEventListener('click', handleSkipClick); // Assuming handleSkipClick exists
    
    // Audio button listener
    audioButton.addEventListener('click', toggleAudio);
    
    updateLessonCounter(); // Initialize counter display

}); // End DOMContentLoaded

// --- Rest of the learn-it.js functions (loadSubStep, clockSketch, audio functions, etc.) ---
// ...

// Restore createDirectionCheckButtons function with horizontal layout
function createDirectionCheckButtons() {
    checkArea.innerHTML = ''; // Clear previous content

    // Create a wrapper div for horizontal layout
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'direction-buttons-wrapper';
    
    // Create a container for each button
    const clockwiseContainer = document.createElement('div');
    clockwiseContainer.className = 'direction-btn-container';
    
    const counterClockwiseContainer = document.createElement('div');
    counterClockwiseContainer.className = 'direction-btn-container';
    
    // Create the buttons with improved visuals
    const clockwiseBtn = document.createElement('button');
    clockwiseBtn.id = 'clockwise-btn';
    clockwiseBtn.innerHTML = '<i class="fas fa-redo-alt"></i>'; // Font awesome icon for clockwise
    clockwiseBtn.setAttribute('aria-label', 'Clockwise direction');
    clockwiseBtn.classList.add('btn', 'direction-btn');
    clockwiseBtn.addEventListener('click', () => {
        if (currentSubStep === 2) {
            // Set feedback for correct answer
            feedbackArea.textContent = subSteps[2].feedbackCorrect;
            feedbackArea.className = 'feedback feedback-correct';
            // Play correct feedback audio
            playAudio(getAudioFilename(2, 'feedback-correct'));
            // Enable the next button
            nextButton.disabled = false;
        }
    });

    const counterClockwiseBtn = document.createElement('button');
    counterClockwiseBtn.id = 'counter-clockwise-btn';
    counterClockwiseBtn.innerHTML = '<i class="fas fa-undo-alt"></i>'; // Font awesome icon for counter-clockwise
    counterClockwiseBtn.setAttribute('aria-label', 'Counter-clockwise direction');
    counterClockwiseBtn.classList.add('btn', 'direction-btn');
    counterClockwiseBtn.addEventListener('click', () => {
        if (currentSubStep === 2) {
            // Set feedback for incorrect answer
            feedbackArea.textContent = subSteps[2].feedbackIncorrect;
            feedbackArea.className = 'feedback feedback-incorrect';
            // Play incorrect feedback audio
            playAudio(getAudioFilename(2, 'feedback-incorrect'));
            // Do not enable the next button for incorrect answer
        }
    });

    // Add the buttons to their containers
    clockwiseContainer.appendChild(clockwiseBtn);
    counterClockwiseContainer.appendChild(counterClockwiseBtn);
    
    // Add the containers to the wrapper
    buttonsWrapper.appendChild(clockwiseContainer);
    buttonsWrapper.appendChild(counterClockwiseContainer);
    
    // Add the wrapper to the check area
    checkArea.appendChild(buttonsWrapper);
} 