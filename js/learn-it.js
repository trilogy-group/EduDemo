// --- DOM Elements ---
const titleElement = document.getElementById('learn-it-title');
const instructionElement = document.getElementById('learn-it-instruction');
const characterImageElement = document.getElementById('learn-it-character');
const canvasContainer = document.getElementById('canvas-container');
const checkArea = document.getElementById('embedded-check-area');
const feedbackArea = document.getElementById('feedback-area');
const nextButton = document.getElementById('next-step-button');
const prevButton = document.querySelector('.btn-prev-step'); // Already links to index.html
const skipButton = document.getElementById('skip-button');
const lessonCounterElement = document.querySelector('.lesson-counter');

// --- Lesson State ---
let currentSubStep = 0;
let p5Instance;
let clockDiameter;
let highlightTarget = null; // { type: 'number'/'hand', value: 1..12/'hour'/'minute'/'clockwise' }
let interactionTarget = null; // { type: 'number'/'hand'/'direction', value: 1..12/'hour'/'minute'/'clockwise'/'counter-clockwise' }
let interactionEnabled = false;
let handAnimationActive = false;
let handAngleOffset = 0; // For animation
let hoveredNumber = null; // Track which number (1-12) is hovered
let clickFeedback = { number: null, correct: null }; // Track last clicked number and result
let narrationAudio = new Audio(); // Audio object for narration
let currentAudioFilename = null; // Store the filename for the current instruction

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

    // Learn It Step 2 (Direction)
    '2-instruction': 'watch_how_the_hands_move_they.mp3',
    '2-check': 'which_arrow_shows_the_clockwise_direction.mp3',
};

// Helper to get audio filename using the map
function getAudioFilename(stepIndex, partKey) {
    const key = `${stepIndex}-${partKey}`;
    const filename = audioFilenameMap[key];
    if (!filename) {
        console.warn(`Audio mapping not found for key: ${key}`);
        return null;
    }
    return filename;
}

// Helper function to stop audio
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

// Helper function to play audio
function playAudio(filename, onEndedCallback = null) {
    // --- Listener Setup ---
    const handleAudioEnd = () => {
        console.log("Audio ended:", audioPath);
        cleanupListeners(); // Remove listeners
        if (typeof onEndedCallback === 'function') {
            console.log("Executing onEndedCallback.");
            onEndedCallback(); // Execute callback only on natural end
        }
    };
    const handleAudioError = (e) => {
        console.error("Audio error:", audioPath, e);
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

const subSteps = [
    { // 0: Face & Numbers
        title: "Learn It: The Clock Face",
        instruction: "This is a <strong>clock face</strong>! It helps us tell time. Look at the numbers. They go in order all the way around, starting from 1, then 2, 3... up to 12 at the very top.",
        instructionCheck: "Quick check! The numbers go in order. Click the number that comes <strong>right after</strong> the number 8.",
        checkType: 'number',
        correctValue: 9,
        feedbackCorrect: "Correct! 9 comes right after 8.",
        feedbackIncorrect: "Think about counting! What number comes after 8? Find it on the clock face and click it.",
        setup: () => {
            highlightTarget = { type: 'numbers', value: 'all' }; 
            interactionTarget = { type: 'number', value: 9 };
            interactionEnabled = false; 
            handAnimationActive = false;
            const instructionAudioFile = getAudioFilename(0, 'instruction');
            currentAudioFilename = instructionAudioFile;

            // Play instruction, THEN setup check in its callback
            playAudio(instructionAudioFile, () => { 
                const checkAudioFile = getAudioFilename(0, 'check');
                currentAudioFilename = checkAudioFile;
                playAudio(checkAudioFile);
                interactionEnabled = true;
                nextButton.disabled = true; 
                console.log("Callback for instruction audio ended. p5Instance:", p5Instance);
                if (p5Instance) { p5Instance.redraw(); }
                instructionElement.innerHTML = subSteps[currentSubStep].instruction;
            });
        }
    },
    { // 1: The Hands
        title: "Learn It: The Hands",
        instruction1: "See these pointers? They are called hands! This short, blue hand is the <strong>Hour Hand</strong>. It tells us the hour.",
        instruction2: "This long, red hand is the <strong>Minute Hand</strong>. It tells us the minutes.",
        instruction3: "Easy way to remember: Hour hand is short, Minute hand is long!",
        check1: "Click on the <strong>Hour Hand</strong> (the short one).",
        check2: "Now, click on the <strong>Minute Hand</strong> (the long one).",
        checkType: 'hand', // Will have sub-checks
        checks: [
            { instruction: "Click on the <strong>Hour Hand</strong> (the short one).", targetValue: 'hour', feedbackCorrect: "You got it! That's the short hour hand.", feedbackIncorrect: "Oops! Remember, the hour hand is the *short* one. Click the short hand." },
            { instruction: "Now, click on the <strong>Minute Hand</strong> (the long one).", targetValue: 'minute', feedbackCorrect: "Excellent! That's the long minute hand.", feedbackIncorrect: "Careful! The minute hand is the *long* one. Click the long hand." }
        ],
        currentCheckIndex: 0,
        setup: () => {
            highlightTarget = null;
            interactionTarget = { type: 'hand', value: subSteps[currentSubStep].checks[0].targetValue };
            subSteps[currentSubStep].currentCheckIndex = 0;
            interactionEnabled = false;
            handAnimationActive = false;

            // Define functions for the sequence
            const setupCheck1 = () => {
                 highlightTarget = null;
                 const checkInstruction = subSteps[currentSubStep].checks[0].instruction;
                 instructionElement.innerHTML = checkInstruction;
                 const checkAudioFile = getAudioFilename(1, 'check1');
                 currentAudioFilename = checkAudioFile;
                 playAudio(checkAudioFile); // Play check, don't wait
                 interactionEnabled = true; // Enable interaction now
                 nextButton.disabled = true;
                 if (p5Instance) { p5Instance.redraw(); }
            };
            const playInstruction3 = () => {
                instructionElement.innerHTML = subSteps[currentSubStep].instruction3;
                const audioFile3 = getAudioFilename(1, 'instruction3');
                currentAudioFilename = audioFile3;
                highlightTarget = { type: 'hand', value: 'both' }; 
                playAudio(audioFile3, setupCheck1); // <-- Pass callback
            };
            const playInstruction2 = () => {
                instructionElement.innerHTML = subSteps[currentSubStep].instruction2;
                const audioFile2 = getAudioFilename(1, 'instruction2');
                currentAudioFilename = audioFile2;
                highlightTarget = { type: 'hand', value: 'minute' };
                playAudio(audioFile2, playInstruction3); // <-- Pass callback
            };
            const playInstruction1 = () => {
                instructionElement.innerHTML = subSteps[currentSubStep].instruction1;
                const audioFile1 = getAudioFilename(1, 'instruction1');
                currentAudioFilename = audioFile1;
                highlightTarget = { type: 'hand', value: 'hour' };
                playAudio(audioFile1, playInstruction2); // <-- Pass callback
            };

            playInstruction1(); // Start the chain
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
        setup: () => {
            highlightTarget = null;
            interactionTarget = { type: 'direction', value: 'clockwise' };
            instructionElement.innerHTML = subSteps[currentSubStep].instruction;
            const instructionAudioFile = getAudioFilename(2, 'instruction');
            currentAudioFilename = instructionAudioFile;

            interactionEnabled = false;
            handAnimationActive = true; 
            handAngleOffset = 0;

            // Play instruction audio, setup check AFTER it finishes
            playAudio(instructionAudioFile, () => { // <-- Pass callback
                 handAnimationActive = false; // Stop animation
                 instructionElement.innerHTML = subSteps[currentSubStep].instructionCheck;
                 const checkAudioFile = getAudioFilename(2, 'check');
                 currentAudioFilename = checkAudioFile;
                 playAudio(checkAudioFile); // Play check audio, don't wait
                 createDirectionCheckButtons();
                 interactionEnabled = true;
                 nextButton.disabled = true;
                 if (p5Instance) { p5Instance.redraw(); }
            });
        }
    }
];

// --- p5.js Sketch ---
const sketch = (p) => {
    // --- Colors (Adjusted for new design) ---
    let rimColor, faceColor, numberColor, tickColor, centerColor, minuteNumColor;
    let hourHandColor, minuteHandColor;
    let backgroundColor; // Page background
    let highlightColor; // Keep for interactions
    let correctColor, incorrectColor; // For click feedback

    p.preload = () => {
        // Font loading removed previously
    }

    p.setup = () => {
        // --- Size based on CSS-constrained container ---
        const containerWidth = canvasContainer.offsetWidth;
        const containerHeight = canvasContainer.offsetHeight;
        if (containerWidth === 0 || containerHeight === 0) {
            console.error("Container dimensions are 0! Cannot setup canvas.");
            return;
        }
        const canvasSize = p.min(containerWidth, containerHeight); 
        const canvas = p.createCanvas(canvasSize, canvasSize); 
        canvas.parent(canvasContainer);
        clockDiameter = canvasSize * 0.85; // Adjust base diameter if needed, 85% seems okay
        // --- End Size Logic ---

        p.angleMode(p.DEGREES);
        p.textAlign(p.CENTER, p.CENTER);
        // Text size calculation might need adjustment based on new design
        // p.textSize(clockDiameter * 0.1);

        // --- Define Colors (New Design) ---
        rimColor = p.color('#0B4F6C'); // Dark Blue
        faceColor = p.color('#F5F5F0'); // Off-white
        numberColor = p.color('#0B4F6C'); // Blue hour numbers
        minuteNumColor = p.color('#D9534F'); // Red minute numbers
        tickColor = p.color(0); // Black ticks
        centerColor = p.color('#FFC107'); // Yellow center

        hourHandColor = p.color('#0B4F6C'); // Blue hour hand
        minuteHandColor = p.color('#D9534F'); // Red minute hand

        backgroundColor = p.color(240, 246, 255); // Keep light blue page background
        highlightColor = p.color(255, 255, 0); // Opaque yellow for testing
        correctColor = p.color(40, 204, 113, 180); // Green with alpha
        incorrectColor = p.color(255, 92, 92, 180); // Red with alpha

        console.log("p5 setup complete. Diameter:", clockDiameter, "Canvas Size:", canvasSize);
    };

    p.draw = () => {
        p.clear(); // Use clear() for transparent background

        // --- Hover Detection --- (Before translate)
        const mouseXRelative = p.mouseX - p.width / 2;
        const mouseYRelative = p.mouseY - p.height / 2;
        let currentlyHovered = null;
        if (interactionEnabled && interactionTarget?.type === 'number') { 
            for (let i = 1; i <= 12; i++) {
                const angle = i * 30 - 90;
                const radius = clockDiameter * 0.38;
                const numX = p.cos(angle) * radius;
                const numY = p.sin(angle) * radius;
                const numRadius = clockDiameter * 0.1; 
                if (p.dist(mouseXRelative, mouseYRelative, numX, numY) < numRadius) {
                    currentlyHovered = i;
                    break; 
                }
            }
        }
        hoveredNumber = currentlyHovered;
        // --- End Hover Detection ---

        p.translate(p.width / 2, p.height / 2);

        // Apply highlights first (drawn below clock elements)
        applyHighlights(p);

        // --- Draw New Clock Design --- 
        // 1. Blue Rim
        p.fill(rimColor);
        p.noStroke();
        p.ellipse(0, 0, clockDiameter * 1.1, clockDiameter * 1.1); // Outer diameter

        // 2. Off-white Face
        p.fill(faceColor);
        p.ellipse(0, 0, clockDiameter, clockDiameter);

        // 3. Ticks
        drawTicks(p);

        // 4. Hour Numbers (includes hover/click feedback)
        drawHourNumbers(p); 

        // 5. Minute Numbers
        // drawMinuteNumbers(p); // <-- Commented out this line

        // 6. Hands (drawn on top)
        let hourAngle, minuteAngle;
        if (handAnimationActive) {
            handAngleOffset += 0.5; 
            minuteAngle = (handAngleOffset * 6) % 360; 
            hourAngle = (minuteAngle / 12) % 360; 
        } else {
            if (currentSubStep === 1) {
                 hourAngle = 90; // 3 o'clock
                 minuteAngle = 0; // 12
             } else { // Default for step 0 (face)
                 // Set to 10:10 approx like reference image
                 minuteAngle = 60;
                 hourAngle = 300 + (minuteAngle/12);
             }
        }
        hourAngle -= 90;
        minuteAngle -= 90;

        drawHand(p, minuteAngle, clockDiameter * 0.4, 8, minuteHandColor, 'minute'); // Minute hand (long, red)
        drawHand(p, hourAngle, clockDiameter * 0.28, 8, hourHandColor, 'hour'); // Hour hand (short, blue)

        // 7. Center Dot
        p.fill(centerColor);
        p.ellipse(0, 0, clockDiameter * 0.08, clockDiameter * 0.08);
        // --- End New Clock Design ---
    };

    // --- Updated drawHourNumbers ---
    function drawHourNumbers(p) {
        p.textStyle(p.BOLD);
        for (let i = 1; i <= 12; i++) {
            const angle = i * 30 - 90; 
            const radius = clockDiameter * 0.38; 
            const x = p.cos(angle) * radius;
            const y = p.sin(angle) * radius;

            // --- Draw Feedback/Hover Highlight --- (Before text)
            p.noStroke();
            let feedbackApplied = false;
            // Check for click feedback first
            if (clickFeedback.number === i) {
                if (clickFeedback.correct) {
                    p.fill(correctColor); // Green
                } else {
                    p.fill(incorrectColor); // Red
                }
                p.ellipse(x, y, clockDiameter * 0.18, clockDiameter * 0.18);
                feedbackApplied = true;
            }
            // Else, check for hover feedback 
            else if (hoveredNumber === i && interactionTarget?.type === 'number') {
                p.fill(highlightColor); // Yellow hover
                p.ellipse(x, y, clockDiameter * 0.18, clockDiameter * 0.18);
            }
            // --- End Feedback/Hover Highlight ---

            // Draw the number text
            p.fill(numberColor); // Reset to default number color
            p.textSize(clockDiameter * 0.12); 
            p.text(i, x, y);
        }
        p.textStyle(p.NORMAL); 
    }

    // --- New function: drawTicks ---
    function drawTicks(p) {
        p.stroke(tickColor);
        for (let i = 0; i < 60; i++) {
            const angle = i * 6 - 90; // 6 degrees per minute tick
            const radius = clockDiameter * 0.5; // Outer edge of face
            let tickLength, strokeWeight;

            if (i % 5 === 0) { // Hour tick
                tickLength = clockDiameter * 0.06;
                strokeWeight = 3;
            } else { // Minute tick
                tickLength = clockDiameter * 0.03;
                strokeWeight = 1;
            }

            const x1 = p.cos(angle) * (radius - tickLength);
            const y1 = p.sin(angle) * (radius - tickLength);
            const x2 = p.cos(angle) * radius;
            const y2 = p.sin(angle) * radius;
            p.strokeWeight(strokeWeight);
            p.line(x1, y1, x2, y2);
        }
    }

    // --- New function: drawMinuteNumbers ---
    function drawMinuteNumbers(p) {
        p.fill(minuteNumColor);
        p.noStroke();
        p.textSize(clockDiameter * 0.055); 
        p.textStyle(p.BOLD);
        for (let i = 5; i <= 60; i += 5) {
            const hourNum = (i / 5); 
            const angle = hourNum * 30 - 90;
            
            // --- Calculate position relative to hour number ---
            const hourRadius = clockDiameter * 0.38; // Radius of the hour number
            const hourX = p.cos(angle) * hourRadius;
            const hourY = p.sin(angle) * hourRadius;
            
            // Apply a vertical offset downwards from the hour number position
            const offsetY = clockDiameter * 0.05; 
            const minuteX = hourX;
            const minuteY = hourY + offsetY;
            // --- End relative position calculation ---
            
            p.text(i === 60 ? '60' : i, minuteX, minuteY); 
        }
         p.textStyle(p.NORMAL); 
    }

    // --- Modified drawHand ---
     function drawHand(p, angle, length, weight, color, type) {
         let isHighlighted = false;
         // Highlighting logic remains same, but apply to new style
         if (highlightTarget && highlightTarget.type === 'hand' && (highlightTarget.value === type || highlightTarget.value === 'both')) {
             isHighlighted = true;
             // Maybe make highlight more prominent?
             weight += 2;
             length *= 1.05;
         }

         p.push();
         p.rotate(angle);
         p.strokeCap(p.ROUND); // Round hand ends
         p.strokeWeight(weight); 
         p.stroke(color);
         p.line(0, 0, length, 0);
         p.pop();
     }

     // --- Modified applyHighlights ---
     function applyHighlights(p) {
         if (!highlightTarget) return;

         // Subtle yellow circle for face highlight
         if (highlightTarget.type === 'numbers' && highlightTarget.value === 'all') {
             p.noStroke();
             p.fill(highlightColor); 
             p.ellipse(0, 0, clockDiameter, clockDiameter); // Highlight face area
         } 
         // Number highlight - adjust position if needed
         else if (highlightTarget.type === 'number' && highlightTarget.value >= 1 && highlightTarget.value <= 12) {
             p.noStroke();
             p.fill(highlightColor);
             const angle = highlightTarget.value * 30 - 90;
             const radius = clockDiameter * 0.38; // Match hour number radius
             const x = p.cos(angle) * radius;
             const y = p.sin(angle) * radius;
             p.ellipse(x, y, clockDiameter * 0.18, clockDiameter * 0.18); // Make highlight slightly larger
         }
         // Hand highlights applied in drawHand
     }


    p.mousePressed = () => {
        if (!interactionEnabled || !interactionTarget) return;

        const mouseVec = p.createVector(p.mouseX - p.width / 2, p.mouseY - p.height / 2);
        // Clear previous visual click feedback on new click attempt
        clickFeedback = { number: null, correct: null };

        if (interactionTarget.type === 'number') {
            let clickedNumber = null;
            // Find which number was clicked
            for (let i = 1; i <= 12; i++) {
                const angle = i * 30 - 90;
                const radius = clockDiameter * 0.38; 
                const numX = p.cos(angle) * radius;
                const numY = p.sin(angle) * radius;
                const numRadius = clockDiameter * 0.1; 
                if (p.dist(mouseVec.x, mouseVec.y, numX, numY) < numRadius) {
                    clickedNumber = i;
                    break;
                }
            }

            if (clickedNumber !== null) {
                const isCorrect = (clickedNumber === interactionTarget.value);
                // Store feedback state
                clickFeedback = { number: clickedNumber, correct: isCorrect };
                // Handle text feedback and button state
                handleInteractionResult(isCorrect);
            }
        } else if (interactionTarget.type === 'hand') {
             const targetHand = interactionTarget.value; 
             let hourAngle, minuteAngle;
             if (currentSubStep === 1) { 
                 hourAngle = 90 - 90; 
                 minuteAngle = 0 - 90; 
             } else { return; } 

             const hourLength = clockDiameter * 0.28;
             const minuteLength = clockDiameter * 0.4;
             
             // More robust check: distance to line segment
             const clickedHand = getClickedHand(p, mouseVec, hourAngle, hourLength, minuteAngle, minuteLength);

             if (clickedHand === targetHand) {
                 handleInteractionResult(true);
             } else if (clickedHand !== null) {
                 handleInteractionResult(false); 
             }
         }
    };
    
    // Helper for hand click detection
    function getClickedHand(p, mouseVec, hourAngle, hourLength, minuteAngle, minuteLength) {
        const threshold = clockDiameter * 0.05; // Click tolerance

        // Hour hand segment
        const hx1 = 0, hy1 = 0;
        const hx2 = p.cos(hourAngle) * hourLength;
        const hy2 = p.sin(hourAngle) * hourLength;
        const distHour = distToSegment(mouseVec, p.createVector(hx1, hy1), p.createVector(hx2, hy2));

        // Minute hand segment
        const mx1 = 0, my1 = 0;
        const mx2 = p.cos(minuteAngle) * minuteLength;
        const my2 = p.sin(minuteAngle) * minuteLength;
        const distMinute = distToSegment(mouseVec, p.createVector(mx1, my1), p.createVector(mx2, my2));
        
        if (distHour < threshold && distMinute < threshold) {
            // Overlapping - prioritize shorter hand (hour)? Or longer (minute)? Let's say minute.
             return 'minute'; 
        } else if (distHour < threshold) {
            return 'hour';
        } else if (distMinute < threshold) {
            return 'minute';
        } else {
            return null;
        }
    }

    // Helper function: point to line segment distance
    function distToSegment(p, v, w) {
        const l2 = p5.Vector.distSq(v, w);
        if (l2 === 0) return p5.Vector.dist(p, v);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projection = p5.Vector.add(v, p5.Vector.mult(p5.Vector.sub(w, v), t));
        return p5.Vector.dist(p, projection);
    }

    p.windowResized = () => {
        // --- Size based on CSS-constrained container ---
        console.log("Window Resized"); 
        const containerWidth = canvasContainer.offsetWidth;
        const containerHeight = canvasContainer.offsetHeight;
         if (containerWidth === 0 || containerHeight === 0) {
            console.warn("Container dimensions are 0 on resize! Skipping resize.");
            return; 
        }
        const canvasSize = p.min(containerWidth, containerHeight); 
        p.resizeCanvas(canvasSize, canvasSize); 
        clockDiameter = canvasSize * 0.90; 
        p.textSize(clockDiameter * 0.1); 
        console.log("Resized canvas. New Diameter:", clockDiameter, "New Size:", canvasSize);
       // --- End Resizing ---
    }
};

// --- Functions ---

function loadSubStep(index) {
    if (index >= subSteps.length) {
        // Move to next lesson section (Try It)
        window.location.href = 'try-it.html'; // Assuming next page
        return;
    }
    currentSubStep = index;
    const step = subSteps[index];

    titleElement.textContent = step.title;
    instructionElement.innerHTML = step.instruction || step.instruction1 || "";
    lessonCounterElement.textContent = `Step 2 of 5: Learn It (${index + 1}/${subSteps.length})`;

    feedbackArea.textContent = '';
    feedbackArea.className = 'feedback'; // Reset class
    checkArea.innerHTML = ''; // Clear previous checks
    nextButton.disabled = true; // Disable until check passed or skipped
    interactionEnabled = false; // Usually enabled by step.setup() after a delay
    clickFeedback = { number: null, correct: null }; // Reset click feedback
    hoveredNumber = null; // Reset hover

    stopAudio(true); // Stop and clear callbacks

    // Run specific setup for the step (handles highlights, interaction targets, delays)
    if (step.setup) {
        step.setup(); // Setup function will handle initial audio for the step
    } else {
         // Default if no setup: enable interaction immediately, assume check needed
         interactionEnabled = true;
         nextButton.disabled = true;
    }

    // --- Debugging --- 
    console.log("Attempting to load p5 sketch for sub-step:", index);
    console.log("Canvas container element:", canvasContainer);
    // --- End Debugging ---

    // --- Show Character Image --- 
    if(characterImageElement) {
        characterImageElement.style.display = 'block'; 
    }
    // --- End Show ---
}

function handleInteractionResult(isCorrect) {
    const step = subSteps[currentSubStep];
    interactionEnabled = false; 

    if (step.checkType === 'number' || step.checkType === 'direction') {
        stopAudio(); 
        if (isCorrect) {
            feedbackArea.textContent = step.feedbackCorrect;
            feedbackArea.className = 'feedback feedback-correct';
            nextButton.disabled = false; 
            playAudio(getAudioFilename(currentSubStep, 'feedback-correct')); 
        } else {
            feedbackArea.textContent = step.feedbackIncorrect;
            feedbackArea.className = 'feedback feedback-incorrect';
            playAudio(getAudioFilename(currentSubStep, 'feedback-incorrect')); 
            interactionEnabled = true; 
        }
    } else if (step.checkType === 'hand') {
         stopAudio(); 
         const check = step.checks[step.currentCheckIndex];
         if (isCorrect) {
             feedbackArea.textContent = check.feedbackCorrect;
             feedbackArea.className = 'feedback feedback-correct';
             // playAudio(getAudioFilename(currentSubStep, `check${step.currentCheckIndex}-feedback-correct`), () => { /* optional callback */ });

             step.currentCheckIndex++;
             if (step.currentCheckIndex >= step.checks.length) {
                 nextButton.disabled = false; 
                 highlightTarget = null;
                 currentAudioFilename = null; 
             } else {
                 // Use setTimeout for delay BEFORE showing next check instruction & audio
                 setTimeout(() => {
                     const nextCheck = step.checks[step.currentCheckIndex];
                     instructionElement.innerHTML = nextCheck.instruction;
                     currentAudioFilename = getAudioFilename(1, `check${step.currentCheckIndex + 1}`); 
                     playAudio(currentAudioFilename); // Play next instruction audio
                     interactionTarget = { type: 'hand', value: nextCheck.targetValue };
                     feedbackArea.textContent = '';
                     feedbackArea.className = 'feedback';
                     interactionEnabled = true; 
                      if (p5Instance) { p5Instance.redraw(); }
                 }, 1500); // Delay before next check appears
             }
         } else {
             feedbackArea.textContent = check.feedbackIncorrect;
             feedbackArea.className = 'feedback feedback-incorrect';
             // playAudio(getAudioFilename(currentSubStep, `check${step.currentCheckIndex}-feedback-incorrect`));
             
             // Re-enable interaction for retry after delay
             setTimeout(() => {
                  interactionEnabled = true;
                  feedbackArea.textContent = '';
                  feedbackArea.className = 'feedback';
                   if (p5Instance) { p5Instance.redraw(); }
             }, 2000);
         }
     }
}


function createDirectionCheckButtons() {
    checkArea.innerHTML = `
        <button id="clockwise-btn" class="btn direction-btn">↻</button>
        <button id="counter-clockwise-btn" class="btn direction-btn">↺</button>
    `;
    document.getElementById('clockwise-btn').addEventListener('click', () => {
        if (interactionEnabled && interactionTarget.type === 'direction') {
            handleInteractionResult(interactionTarget.value === 'clockwise');
        }
    });
    document.getElementById('counter-clockwise-btn').addEventListener('click', () => {
         if (interactionEnabled && interactionTarget.type === 'direction') {
             handleInteractionResult(interactionTarget.value !== 'clockwise'); // Correct if target is NOT clockwise
         }
    });
}

// --- Event Listeners ---
nextButton.addEventListener('click', () => {
    if (!nextButton.disabled) {
        stopAudio(true); // Clear callback on explicit navigation
        loadSubStep(currentSubStep + 1);
    }
});

skipButton.addEventListener('click', () => {
    stopAudio(true); // Clear callback on explicit navigation
    feedbackArea.textContent = 'Skipping step...';
    feedbackArea.className = 'feedback';
    loadSubStep(currentSubStep + 1);
});

// Add event listener to stop audio if user navigates away via prev button
prevButton.addEventListener('click', () => { stopAudio(true); }); // Clear callback

// Get buttons AFTER the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const footerAudioButton = document.getElementById('footer-audio-button');
    const startLessonButton = document.getElementById('start-lesson-button');
    const skipButtonActual = document.getElementById('skip-button'); // Get the real skip button
    const prevButtonActual = document.querySelector('.btn-prev-step'); // Use querySelector to get prev button
    const nextButtonActual = document.getElementById('next-step-button'); // Get next button
    const professorIntroImg = document.getElementById('professor-intro-img');
    const learnItContent = document.getElementById('learn-it-content');

    console.log("DOM Loaded.");
    // --- Adjust Start Button Logic ---
    if (startLessonButton && skipButtonActual && prevButtonActual && nextButtonActual && professorIntroImg && learnItContent) {
        console.log("Start, Skip, Prev, Next buttons, Intro Img, Content Div found.");
        startLessonButton.addEventListener('click', () => {
            console.log("Start button clicked.");
            startLessonButton.style.display = 'none'; 
            
            // --- Hide Intro Image, Show Content --- 
            professorIntroImg.classList.add('hidden'); // Hide intro image
            learnItContent.classList.remove('hidden'); // Show lesson content
            // --- End Hide/Show --- 
            
            // Show the actual navigation buttons
            skipButtonActual.style.display = 'inline-flex'; 
            prevButtonActual.style.display = 'inline-flex'; 
            nextButtonActual.style.display = 'inline-flex'; 

            // --- Create p5 Instance HERE --- 
            if (!p5Instance && p5) {
                console.log("Creating p5 instance on Start click.");
                try {
                    p5Instance = new p5(sketch);
                    console.log("p5 instance created successfully on Start click:", p5Instance);
                } catch (error) {
                    console.error("Error creating p5 instance on Start click:", error);
                     feedbackArea.textContent = "Error loading interactive element.";
                     feedbackArea.className = 'feedback feedback-incorrect';
                     return; // Don't proceed if instance fails
                }
            } else if (p5Instance) {
                 console.log("p5 instance already exists?"); 
                 p5Instance.loop(); // Ensure it's looping if it existed somehow
            } else {
                 console.error("p5 library not loaded?");
                 return;
            }
            // --- End Instance Creation ---
            
            loadSubStep(0); // Load the first sub-step AFTER instance exists
        });
    } else {
        console.error("One or more required elements not found!", 
            {start: startLessonButton, skip: skipButtonActual, prev: prevButtonActual, next: nextButtonActual, intro: professorIntroImg, content: learnItContent });
    }
    // --- End Adjust ---

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

// --- Initial Load --- 
// --- REMOVE initial loadSubStep call --- 
window.addEventListener('load', () => {
    console.log("Window loaded. Waiting for Start button click to initialize lesson.");
    // setTimeout(() => {
    //     console.log("Timeout finished, initializing sketch.");
    //     loadSubStep(0);
    // }, 100); 
}); 