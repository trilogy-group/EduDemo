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
    console.log("Entering setupStep0Check function."); 
    console.log(`Instance exists: ${!!instance}, currentSubStep: ${currentSubStep}`); 
    
    if (!instance || currentSubStep !== 0) { 
        console.log("setupStep0Check returning early due to invalid instance or step index.");
        return; 
    }
    
    instance.updateHighlight(null); // Ensure highlighting is cleared
    nextButton.disabled = true; // Ensure next is disabled at the start of the check
    
    // Define the callback function to run AFTER audio finishes
    const showCheckTextAndEnableInteraction = () => {
        console.log("Check audio finished. Setting text and enabling interaction for Step 0 check.");
        
        // Check step again inside callback
        if (currentSubStep !== 0) {
            console.log("Callback aborted: Step changed before check text could be shown.");
            return;
        }
        
        console.log("Instruction Element exists:", !!instructionElement);
        console.log("Instruction Check Text:", stepData.instructionCheck);
        
        if (instructionElement) {
            instructionElement.innerHTML = stepData.instructionCheck;
            instructionElement.style.visibility = 'visible'; // Ensure visibility is set
        } else {
            console.error("Instruction element not found in setupStep0Check callback!");
        }
        
        // Enable interaction AFTER text is shown
        if (instance) {
            instance.setInteraction(true, stepData.p5config.interactionTarget);
        } else {
            console.error("p5 instance lost before interaction could be enabled!");
        }
    };

    // Get the audio file
    const checkAudioFile = getAudioFilename(0, 'check');
    currentAudioFilename = checkAudioFile; // Store for potential replay

    // Play audio and pass the callback
    playAudio(checkAudioFile, showCheckTextAndEnableInteraction);
    
    // REMOVED immediate setting of innerHTML and setInteraction from here
}

function setupStep1Check(stepData, instance, checkIndex) {
    console.log(`Setting up check phase for Step 1, check index: ${checkIndex}`);
    if (!instance || !stepData.checks || checkIndex >= stepData.checks.length || currentSubStep !== 1) return; // Check step index
    instance.stopBlinking();
    const check = stepData.checks[checkIndex];
    const target = { type: 'hand', value: check.targetValue };
    instructionElement.innerHTML = check.instruction;
    const audioKey = `check${checkIndex + 1}`;
    const audioFile = getAudioFilename(1, audioKey);
    currentAudioFilename = audioFile; // Store for potential replay
    playAudio(audioFile);
    instance.setInteraction(true, target);
    nextButton.disabled = true;
}

function setupStep2Check(stepData, instance) {
    console.log("Setting up check phase for Step 2.");
    if (!instance || currentSubStep !== 2) return; // Check step index

    // Stop animation and clear highlights before setting up check
    instance.stopAnimation();
    instance.updateHighlight(null);

    // --- Set Check Instruction Text Immediately ---
    if (instructionElement) {
        console.log("Setting check instruction text for Step 2.");
        instructionElement.innerHTML = stepData.instructionCheck;
        instructionElement.style.visibility = 'visible';
    } else {
        console.error("Instruction element not found in setupStep2Check!");
    }
    // --- End Setting Text ---

    // --- Create Wrapper Layout ---
    // Check if wrapper already exists to avoid nesting issues if called multiple times
    let wrapper = document.querySelector('.canvas-check-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'canvas-check-wrapper';
        // Insert wrapper before canvasContainer if it's directly in content-left
        const contentLeft = document.querySelector('.content-left');
        if (contentLeft && canvasContainer.parentNode === contentLeft) {
            contentLeft.insertBefore(wrapper, canvasContainer);
        } else {
            // Fallback: Append wrapper to content-left if structure is different
            console.warn("Unexpected layout structure for Step 2 check setup.");
             if(contentLeft) contentLeft.appendChild(wrapper); else document.body.appendChild(wrapper); // Failsafe
        }
        // Move canvas and checkArea into the wrapper
        wrapper.appendChild(canvasContainer);
        wrapper.appendChild(checkArea);
        console.log("Created canvas-check-wrapper for Step 2.");
    } else {
         console.log("Using existing canvas-check-wrapper for Step 2.");
    }


    checkArea.innerHTML = ''; // Clear area before adding buttons
    createDirectionCheckButtons(); // Add buttons inside the checkArea (now in wrapper)

    // Disable p5 interaction for the button check phase
    console.log("Disabling p5 interaction for Step 2 Check.");
    instance.setInteraction(false, null);

    // Play check audio
    const checkAudioFile = getAudioFilename(2, 'check');
    currentAudioFilename = checkAudioFile; // Store for potential replay
    playAudio(checkAudioFile);
    nextButton.disabled = true;
}

// --- Cleanup Function ---
function cleanupCheckLayout() {
    const wrapper = document.querySelector('.canvas-check-wrapper');
    if (wrapper) {
        console.log("Cleaning up check layout wrapper.");
        const contentLeft = document.querySelector('.content-left');

        // Move canvas and checkArea back out to content-left before removing wrapper
        if (contentLeft) {
            if(canvasContainer.parentNode === wrapper) contentLeft.appendChild(canvasContainer); // Move canvas back
            if(checkArea.parentNode === wrapper) contentLeft.appendChild(checkArea);         // Move checkArea back
        } else {
             console.warn("Cannot find .content-left to restore elements during cleanup.");
             // If contentLeft is missing, elements might be left in the wrapper, which is then removed.
             // This could lead to elements disappearing. Consider appending to body as failsafe.
             document.body.appendChild(canvasContainer);
             document.body.appendChild(checkArea);
        }

        wrapper.remove(); // Remove the wrapper div
    }
    // Ensure check area content is cleared regardless of wrapper presence
    if (checkArea) checkArea.innerHTML = '';
}

// --- Lesson Data (Update setup functions) ---
const subSteps = [
    { // 0: Face & Numbers
        title: "Learn It: The Clock Face",
        instruction: "",
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
            console.log("Running setup for Step 0 (after primary audio/text)");
            const stepData = subSteps[0];
            // Initial instruction text/audio handled by loadSubStep

            // Define highlighting sequence (this now runs *after* initial instruction)
            const highlightNumbersSequentially = () => {
                console.log("Starting number highlighting sequence (Step 0)");
                let currentHighlightNumber = 1;
                const baseHighlightDuration = 360; // Base duration
                const baseDelayBetweenHighlights = 90; // Base delay
                
                function highlightNext() {
                    // Check if we are still on the correct step BEFORE drawing
                    if (!instance || currentSubStep !== 0) {
                        console.log("Highlighting stopped mid-sequence (instance gone or step changed).");
                        return;
                    }
                    
                    instance.updateHighlight({ type: 'number', value: currentHighlightNumber });
                    
                    // Determine current duration based on number
                    const currentDuration = currentHighlightNumber > 3 ? baseHighlightDuration / 2 : baseHighlightDuration;
                    // console.log(`Highlighting ${currentHighlightNumber} for ${currentDuration}ms`);
                    
                    setTimeout(() => {
                         // Check if we are STILL on the correct step AFTER the timeout
                         if (!instance || currentSubStep !== 0) {
                             console.log("Highlighting stopped after duration (instance gone or step changed).");
                             return;
                         }
                        
                        instance.updateHighlight(null); // Clear highlight
                        
                        currentHighlightNumber++; // Increment AFTER clearing highlight
                        
                        // Check if the entire sequence is finished
                        if (currentHighlightNumber > 12) {
                            console.log("Highlighting sequence finished. Scheduling check phase after 1 second.");
                            setTimeout(() => {
                                 // Final check before calling setupStep0Check
                                 if (instance && currentSubStep === 0) {
                                     console.log("Calling setupStep0Check after 1s delay.");
                                     setupStep0Check(stepData, instance); // Call check setup
                                 } else {
                                      console.log("Check phase aborted (instance gone or step changed during delay).");
                                 }
                            }, 1000); // 1-second pause before check
                            return; // Stop the highlightNext recursion
                        }
                        
                        // --- Determine delay before the *next* highlight --- 
                        let nextDelay;
                        if (currentHighlightNumber === 2) {
                            // Special 1-second delay before number 2
                            console.log("Adding 1-second pause before highlighting number 2.");
                            nextDelay = 1000; 
                        } else if (currentHighlightNumber > 3) {
                            // Faster delay for numbers 4 onwards
                            nextDelay = baseDelayBetweenHighlights / 2;
                        } else {
                            // Standard delay for 1 and 3 (and potentially 2 if logic changed)
                            nextDelay = baseDelayBetweenHighlights;
                        }
                        // console.log(`Delaying next highlight (${currentHighlightNumber}) by ${nextDelay}ms`);

                        // Schedule the next highlight
                        setTimeout(highlightNext, nextDelay);

                    }, currentDuration); // Use the calculated duration
                }
                highlightNext(); // Start the sequence
            };

            // Start the highlighting sequence now.
            highlightNumbersSequentially();

            if (instance) instance.setInteraction(false, null); // Interaction disabled until check phase
        }
    },
    { // 1: The Hands
        title: "Learn It: The Hands",
        instruction1: "",
        instruction2: "This long, red hand is the <strong>Minute Hand</strong>. It tells us the minutes.",
        instruction3: "Easy way to remember: <strong>Hour hand is short, Minute hand is long!</strong>",
        check1: "Click on the Hour Hand (the short one).",
        check2: "Click on the Minute Hand (the long one).",
        checkType: 'hand',
        checks: [
            { instruction: "Click on the <strong>Hour Hand</strong> (the short one).", targetValue: 'hour', feedbackCorrect: "You got it! That's the short hour hand.", feedbackIncorrect: "Oops! Remember, the hour hand is the shorter one. Click the short hand." },
            { instruction: "Now, click on the <strong>Minute Hand</strong> (the long one).", targetValue: 'minute', feedbackCorrect: "Excellent! That's the long minute hand.", feedbackIncorrect: "Careful! The minute hand is the longer one. Click the long hand." }
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
            console.log("Running setup for Step 1 (after primary audio/text)");
            const stepData = subSteps[1];
            stepData.currentCheckIndex = 0; // Reset check index
            nextButton.disabled = true;
            // Instruction 1 audio was played by loadSubStep. Text 1 is now visible.

            // Chain the rest: Instruction 2 -> Blink Minute -> Instruction 3 -> Setup Check 1
            const setupCheck1 = () => {
                 if (currentSubStep !== 1) return; // Ensure still on step 1
                 console.log("Setting up Step 1 Check 1.");
                 setupStep1Check(stepData, instance, 0); // Setup the first check
            };

            const playInstruction3 = () => {
                 if (currentSubStep !== 1) return;
                 console.log("Playing Step 1 Instruction 3.");
                 instructionElement.innerHTML = stepData.instruction3; // Update text
                 
                 // Define the callback for AFTER repeat_after_me.mp3
                 const afterRepeatAudioCallback = () => {
                     console.log("repeat_after_me.mp3 finished. Waiting 2 seconds before check setup.");
                     setTimeout(() => {
                         // Check step again after delay
                         if (currentSubStep === 1) {
                             setupCheck1(); // Setup the first check after final delay
                         } else {
                              console.log("Check setup aborted (step changed during final 2s delay).");
                         }
                     }, 2000);
                 };
                 
                 // Define the callback for AFTER instruction 3 audio
                 const afterInstruction3AudioCallback = () => {
                     console.log("Instruction 3 audio finished. Waiting 2 seconds before playing repeat_after_me.mp3.");
                     setTimeout(() => {
                         // Check step again after delay
                         if (currentSubStep === 1) {
                             console.log("Playing repeat_after_me.mp3");
                             playAudio('repeat_after_me.mp3', afterRepeatAudioCallback);
                         } else {
                             console.log("repeat_after_me.mp3 playback aborted (step changed during initial 2s delay).");
                         }
                     }, 2000); // 2-second delay BEFORE repeat audio
                 };
                 
                 // Start the sequence: Play instruction 3 audio, triggering the first callback
                 playAudio(getAudioFilename(1, 'instruction3'), afterInstruction3AudioCallback); 
                 
                 // No blinking for summary instruction
            };

            const playInstruction2 = () => {
                 if (currentSubStep !== 1) return;
                 console.log("Playing Step 1 Instruction 2.");
                 instructionElement.innerHTML = stepData.instruction2; // Update text
                 if (instance) instance.stopBlinking(); 
                 if (instance) instance.startBlinking('minute'); // Start minute hand blink
                 playAudio(getAudioFilename(1, 'instruction2'), () => { // Callback after audio 2 finishes
                     if (currentSubStep !== 1) return;
                     console.log("Step 1 Instruction 2 audio finished.");
                     if (instance) instance.stopBlinking(); // Stop minute hand blink
                     // Use setTimeout for a pause before instruction 3
                     setTimeout(playInstruction3, 1000); // 1-second pause
                  });
            };

            // Start the chain after Instruction 1 finished. Add delay for pacing.
            console.log("Scheduling Step 1 Instruction 2 after short delay.");
            setTimeout(playInstruction2, 1500); // Increased pause after instruction 1 text appears

            if (instance) instance.setInteraction(false, null); // Interaction disabled until check phase
        }
    },
    { // 2: Clockwise Direction
        title: "Learn It: Clockwise Direction",
        instruction: "",
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
            console.log("Running setup for Step 2 (after primary audio/text)");
            const stepData = subSteps[2];
            // Instruction audio played by loadSubStep. Text is visible.
            checkArea.innerHTML = '';
            feedbackArea.textContent = '';
            nextButton.disabled = true;

            // Start the animation now
            if (instance) instance.startAnimation();

            // Set up the check phase immediately after animation starts
            // Add a slight delay to allow animation to start smoothly before check prompt
            setTimeout(() => {
                if(currentSubStep === 2) { // Check if still on step 2
                    console.log("Setting up Step 2 check.");
                    setupStep2Check(stepData, instance); // Call check helper
                }
            }, 500); // 0.5s delay

            // Interaction is disabled within setupStep2Check
            // if (instance) instance.setInteraction(false, null);
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
        }).catch(e => {
            console.error("Audio play failed:", filename, e);
            if (typeof onEndedCallback === 'function') {
                console.log("Calling onEndedCallback despite audio playback failure.");
                onEndedCallback();
            }
        });
    } else {
       console.warn("Audio play() did not return a promise.");
       // Rely on events
    }
}

// --- Core Functions ---

// Initialize p5 Instance
function initP5(stepData) {
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error("Canvas container not found for p5 init!");
        return;
    }
    
    // Ensure container has dimensions before creating canvas
    if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        console.log("Creating p5 instance for step:", stepData.p5config.stepIndex);
        try {
            p5Instance = new p5(sketch(stepData.p5config), container);
             console.log("p5 instance created successfully:", p5Instance);
             // Maybe call setup here if needed? Or rely on stepData.setup?
        } catch (error) {
            console.error("Error creating p5 instance:", error);
        }
    } else {
        console.warn("Canvas container has zero dimensions. Retrying p5 init shortly...");
        // Retry after a short delay if container might still be rendering
        setTimeout(() => initP5(stepData), 100);
    }
}

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
        
        // --- Navigation on Completion --- 
        // Redirect to the next section (try-it.html)
        console.log("End of Learn It, navigating to Try It.");
        window.location.href = 'try-it.html';
        return;
    }

    console.log(`Loading sub-step: ${stepIndex}`);
    currentSubStep = stepIndex;
    const stepData = subSteps[currentSubStep];

    // Determine initial instruction text (handle multi-part instructions)
    const instructionText = stepData.instruction || (stepData.instruction1 || "");

    stopAudio(true); // Stop any previous audio/callbacks
    cleanupCheckLayout(); // Remove check buttons/layout if any
    feedbackArea.textContent = ''; // Clear feedback area
    feedbackArea.className = 'feedback'; // Reset feedback class

    // Hide instruction text initially
    if (instructionElement) {
        instructionElement.innerHTML = "";
        instructionElement.style.visibility = 'hidden';
    }
    if(titleElement && stepData.title) titleElement.textContent = stepData.title;

    // --- p5 Instance Management ---
    if (p5Instance) {
        console.log("Attempting to remove previous p5 instance.");
        try { p5Instance.remove(); p5Instance = null; }
        catch (error) { console.error("Error removing p5:", error); if(canvasContainer) canvasContainer.innerHTML = '';}
    } else { console.log("No existing p5 instance to remove."); }
    if (canvasContainer) {
        // console.log("Clearing canvas container."); // Reduce log noise
        canvasContainer.innerHTML = '';
    } else { console.error("Canvas container not found!"); return; }
    if (stepData.p5config) {
        // console.log("Calling initP5 for step:", stepIndex); // Reduce log noise
        initP5(stepData);
    } else { console.warn("No p5config for step:", stepIndex); }
    // --- End p5 Instance Management ---

    // Update nav buttons
    if (prevButton) prevButton.disabled = (stepIndex === 0);
    nextButton.disabled = true; // Always disable next initially

    // --- Callbacks ---
    const showTextCallback = () => {
        if (instructionElement && currentSubStep === stepIndex) { // Check if still on the same step
             instructionElement.innerHTML = instructionText;
             instructionElement.style.visibility = 'visible';
             console.log("Instruction text made visible for step:", stepIndex);
        }
    };

    // Modified: This callback now schedules text display after a 3s delay, EXCEPT for steps 0 and 2.
    const onPrimaryAudioEnd = () => {
        // <<< MODIFIED: Prevent this callback from running for steps 0 and 2 >>>
        if (stepIndex === 0 || stepIndex === 2) {
            console.log(`onPrimaryAudioEnd skipped for step ${stepIndex} (handled by specific timers or setup).`);
            return;
        }
        // >>> END MODIFIED >>>
        
        if(currentSubStep !== stepIndex) {
             console.log(`Primary audio for step ${stepIndex} ended, but current step is now ${currentSubStep}. Aborting delayed text display.`);
             return;
        }
        console.log(`Primary audio ended or skipped for step ${stepIndex}. Scheduling text display in 3 seconds.`);
        // Schedule the text display
        setTimeout(() => {
            // Check step again inside timeout in case user navigated away quickly
             if (currentSubStep === stepIndex) {
                 showTextCallback(); // Show the text AFTER 3 seconds
             } else {
                 console.log(`Text display for step ${stepIndex} aborted (step changed during 3s delay).`);
             }
         }, 3000); // 3-second delay
        // Setup call remains handled elsewhere
    };
    // --- End Callbacks ---
    
    // --- Specific Timer for Step 0 Text Display ---
    if (stepIndex === 0) {
        console.log("Scheduling Step 0 instruction text display after 6 seconds.");
        setTimeout(() => {
            if (currentSubStep === 0 && instructionElement) { // Check step and element
                console.log("Displaying Step 0 instruction text (6s timer).");
                instructionElement.innerHTML = instructionText; // Use stored text
                instructionElement.style.visibility = 'visible';
            } else {
                 console.log(`Step 0 text display aborted (step changed or element missing during 6s delay).`);
            }
        }, 6000); // 6-second delay from step load
    }
    // --- End Specific Timer ---

    // --- Specific Timer for Step 1 Hour Hand Blink ---
    if (stepIndex === 1) {
        console.log("Scheduling Step 1 hour hand blink after 4 seconds.");
        setTimeout(() => {
            if (currentSubStep === 1 && p5Instance) { // Check step and instance
                console.log("Starting Step 1 hour hand blink (4s timer).");
                p5Instance.startBlinking('hour');
            } else {
                 console.log(`Step 1 hour blink aborted (step changed or p5 missing during 4s delay).`);
            }
        }, 4000); // 4-second delay from step load
    }
    // --- End Specific Timer ---

    // --- Schedule Step Setup Logic ---
    if (typeof stepData.setup === 'function') {
        if (stepIndex === 0) {
            // Special case: Start Step 0 setup (highlighting) after 4 seconds, regardless of audio.
            console.log("Scheduling Step 0 setup after 4 second delay.");
            setTimeout(() => {
                if (currentSubStep === 0 && p5Instance) { // Check step and instance
                    console.log("Running setup for Step 0 (delayed timer).");
                    stepData.setup(p5Instance);
                } else {
                     console.log(`Setup for step ${stepIndex} aborted delayed (step changed or p5 missing).`);
                }
            }, 6000); // 6-second delay
        } 
        // Note: Setup for other steps will be triggered by the audio callback completion below.
    } else {
         console.warn("No setup function defined for step:", stepIndex);
    }
    // --- End Schedule Step Setup Logic ---


    // --- Play Primary Instruction Audio ---
    let primaryAudioFile = null;
    // Determine the correct initial audio based on the step structure
    if (stepIndex === 0) primaryAudioFile = getAudioFilename(0, 'instruction');
    else if (stepIndex === 1) primaryAudioFile = getAudioFilename(1, 'instruction1'); // Play first part
    else if (stepIndex === 2) primaryAudioFile = getAudioFilename(2, 'instruction');

    currentAudioFilename = primaryAudioFile; // Store for potential replay

    if (primaryAudioFile) {
        console.log(`Playing primary audio ${primaryAudioFile} for step ${stepIndex}. Callback set to show text.`);
        // Pass a NEW callback that shows text AND THEN calls setup (unless it's step 0)
        const audioEndCallback = () => {
             onPrimaryAudioEnd(); // Show the text first
             // Now, if it wasn't step 0, call the setup function
             if (stepIndex !== 0 && typeof stepData.setup === 'function') {
                 console.log(`Calling setup for step ${stepIndex} from audio end callback.`);
                 // Add short delay after text appears before setup runs
                 setTimeout(() => {
                    if (currentSubStep === stepIndex && p5Instance) {
                         stepData.setup(p5Instance);
                    } else {
                         console.log(`Setup call skipped for step ${stepIndex} from audio callback (step changed or p5 missing).`);
                    }
                }, 50);
             } else if (stepIndex === 0) {
                 console.log("Setup for Step 0 handled by early timer, not audio callback.");
             }
        };
        playAudio(primaryAudioFile, audioEndCallback); 
    } else {
        console.log(`No primary audio for step ${stepIndex}. Running text display and setup sequence immediately.`);
        onPrimaryAudioEnd(); // Show text immediately
        // Since there was no audio, run setup immediately (unless it's step 0, handled by timer)
        if (stepIndex !== 0 && typeof stepData.setup === 'function') {
             console.log(`Calling setup for step ${stepIndex} (no audio case).`);
             setTimeout(() => {
                 if (currentSubStep === stepIndex && p5Instance) {
                     stepData.setup(p5Instance);
                 } else {
                      console.log(`Setup call skipped for step ${stepIndex} (no audio case, step changed or p5 missing).`);
                 }
             }, 50); // Short delay after text appears
        }
    }
    // --- End Play Audio ---

    // Update counter & progress bar
    updateLessonCounter();
    updateProgressBar(); // Ensure this function exists and is called
}

// --- handleInteractionResult (Revised Incorrect/Re-enable logic) ---
function handleInteractionResult(isCorrect) {
    console.log(`handleInteractionResult called with isCorrect: ${isCorrect}, currentSubStep: ${currentSubStep}`); // Log entry
    if (!p5Instance || currentSubStep < 0 || currentSubStep >= subSteps.length) {
        console.log("handleInteractionResult aborted: Invalid state.");
        return;
    }

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
            // Logic for multi-part hand check
            step.currentCheckIndex++;
            console.log(`Moving to next check within step ${currentSubStep}, index: ${step.currentCheckIndex}`);
            // Use setTimeout for a slight pause before the next check starts
            setTimeout(() => {
                 // Check if instance or step changed during the delay
                 if (p5Instance !== currentInstance || currentSubStep !== step.p5config.stepIndex) {
                     console.log("Aborting next check setup due to instance/step change.");
                     return;
                 }
                 
                 const nextCheck = step.checks[step.currentCheckIndex];
                 const nextTarget = { type: 'hand', value: nextCheck.targetValue };
                 const nextAudioFile = getAudioFilename(1, `check${step.currentCheckIndex + 1}`);
                 currentAudioFilename = nextAudioFile; // Update current filename

                 // Define callback for AFTER audio finishes
                 const afterCheckAudioCallback = () => {
                    // Check instance/step again inside audio callback
                    if (p5Instance !== currentInstance || currentSubStep !== step.p5config.stepIndex) {
                         console.log("Aborting check setup (audio callback) due to instance/step change.");
                         return;
                    }
                    console.log("Setting up next check after audio:", nextCheck.instruction);
                    instructionElement.innerHTML = nextCheck.instruction;
                    currentInstance.updateHighlight(nextTarget);
                    currentInstance.setInteraction(true, nextTarget);
                 };
                 
                 // Clear previous feedback and play audio with the callback
                 feedbackArea.textContent = ''; 
                 feedbackArea.className = 'feedback';
                 currentInstance.resetClickFeedback(); // Reset p5 feedback visualization
                 playAudio(nextAudioFile, afterCheckAudioCallback);
                 
                 // REMOVED immediate setting of text/interaction from here
                 
             }, 1500); // 1.5 second pause before starting next check audio
        } else {
            // Single check passed, or last part of multi-check passed
            console.log(`Correct final check for step ${currentSubStep}. Playing correct audio before enabling Next.`); 
            // Play correct sound and enable Next button in callback
            playAudio('correct.mp3', () => {
                nextButton.disabled = false; 
                console.log("Callback executed after audio attempt, Next button enabled.");
            });

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
                     const speed = 0.25;
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
                console.log(`p5 clicked ${clickedType}: ${clickedValue}, Target: ${localInteractionTarget.value}`); // Added target value log
                const isCorrect = (clickedValue === localInteractionTarget.value);
                console.log(`Click correct: ${isCorrect}`); // Log correctness check
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
                localHandAnimationActive = false; // Stop animation flag FIRST
                console.log(`p5 stopAnimation for step ${stepConfig.stepIndex}`);
                if (setTime) {
                    // Existing logic for explicitly setting time
                    currentHour = setTime.h;
                    currentMinute = setTime.m;
                    console.log(`Animation stopped. Time explicitly set to H:${currentHour}, M:${currentMinute}`);
                } else {
                    // NEW: Calculate final time based on where the offset stopped
                    // Get the angles corresponding to the final offset value
                    let finalMAngle = (localHandAngleOffset % 360) * 6 - 90;
                    let finalHAngle = ((localHandAngleOffset / 12) % 360) * 30 - 90;

                    // Convert angles back to time (handle wrapping)
                    let rawMinute = p.map(finalMAngle + 90, 0, 360, 0, 60);
                    currentMinute = Math.round(rawMinute) % 60; // Round and wrap minute
                    
                    let fractionalHour = p.map(finalHAngle + 90, 0, 360, 0, 12);
                    // Keep fractional hour for smooth positioning if needed, or round?
                    // Let's keep fractional for accuracy in state, draw function handles display logic.
                    currentHour = fractionalHour; 
                    
                    console.log(`Animation stopped. Calculated time H:${currentHour.toFixed(2)}, M:${currentMinute}`);
                }
                p.redraw(); // Redraw ONCE with the new state (either setTime or calculated time)
                p.noLoop(); // Stop the draw loop AFTER the final redraw
                // Removed p.redraw() from here
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
    const learnItContent = document.getElementById('learn-it-content');

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
        !audioButton || !learnItContent) {
        console.error("Learn It Page Error: One or more required elements not found!");
        // Optionally display an error message to the user
        document.body.innerHTML = '<p>Error loading lesson components. Please refresh or contact support.</p>';
        return; // Stop execution if critical elements are missing
    }

    // Navigation button listeners 
    nextButton.addEventListener('click', handleNextClick);
    prevButton.addEventListener('click', handlePrevClick);
    skipButton.addEventListener('click', handleSkipClick);
    
    // Audio button listener
    audioButton.addEventListener('click', toggleAudio);
    
    updateLessonCounter(); // Initialize counter display
    
    // Start the lesson right away
    loadSubStep(0);

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

// Ensure updateProgressBar function exists (placeholder if not defined elsewhere)
function updateProgressBar() {
    // console.log("Updating progress bar (placeholder)"); // Add actual implementation
    // Example: Find progress bar element, calculate percentage based on currentSubStep and total steps, update style/width.
} 