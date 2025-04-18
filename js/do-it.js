// --- DOM References ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Do It page loaded.");

    const titleElement = document.getElementById('do-it-question-title');
    const instructionElement = document.getElementById('do-it-instruction');
    const canvasContainer = document.getElementById('canvas-container');
    const checkArea = document.getElementById('embedded-check-area');
    const feedbackArea = document.getElementById('feedback-area');
    const nextButton = document.getElementById('next-button');
    const prevButton = document.getElementById('prev-button');
    const audioButton = document.getElementById('footer-audio-button');
    const lessonCounterElement = document.getElementById('do-it-step-counter');
    
    // New intro elements
    const introSection = document.getElementById('do-it-intro-section');
    const startButton = document.getElementById('start-do-it-button');
    const doItContent = document.getElementById('do-it-content');
    const professorImage = document.getElementById('professor-image'); // Added in HTML

    let narrationAudio = new Audio();
    let currentAudioFilename = null;
    let p5Instance = null;
    
    // --- State Variables ---
    let currentProblemIndex = 0;
    let currentP5Instance = null;
    let currentAudio = null;
    let lastInstructionAudio = null; 

    // Color definitions (Adjusted based on target image)
    const bgColor = '#FFFFFF'; // Used for clear() essentially
    const clockFaceColor = '#FDF8E1'; // Creamy yellow background
    const clockRimColor = '#0077CC'; // Blue rim
    const numberColor = '#005999'; // Dark Blue for numbers
    const centerDotColor = '#FFA500'; // Orange/Yellow center
    const hourHandColor = '#0077CC'; // Blue hour hand (matching rim)
    const minuteHandColor = '#E63946'; // Red minute hand
    const tickColor = '#005999'; // Dark Blue for ticks
    const highlightColor = '#FDB813'; // Yellow for hover/highlight
    const correctColor = '#5CB85C'; // Green
    const incorrectColor = '#E63946'; // Red (match minute hand)

    // Dimension constants (Adjusted based on target image)
    const hourHandLength = 0.30; // Slightly longer hour hand
    const minuteHandLength = 0.42; // Slightly longer minute hand
    const hourHandWidth = 11; // Slightly thicker hour hand
    const minuteHandWidth = 7; // Slightly thinner minute hand
    const centerDotSize = 0.06; // Smaller center dot
    const numberSizeMultiplier = 0.10; // Slightly larger numbers
    const numberRadiusMultiplier = 0.38; // Numbers closer to center

    // --- Problem Set Definition (Based on Lesson1_MeetTheClock.md Section 2.4 - 8 Examples) ---
    const problems = [
        { // Problem 1 (MCQ) - MD Example 1
            type: 'mcq',
            questionText: "Which is the Hour Hand?",
            audio: 'which_is_the_hour_hand.mp3', 
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 3, m: 0 }, animateHands: false },
            options: ['Short hand', 'Long hand'],
            correctAnswer: 'Short hand',
            feedbackCorrect: "That's right! The hour hand is the shorter hand.",
            feedbackIncorrect: "Not quite. Remember, the hour hand is the *shorter* one.",
            audioCorrect: 'correct.mp3', 
            audioIncorrect: 'not_quite_right_try_again.mp3' 
        },
        { // Problem 2 (Click/Tap Hand) - MD Example 2
            type: 'clickTapHand',
            questionText: "Click the Minute Hand.",
            audio: 'click_the_minute_hand.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 3, m: 15 }, animateHands: false },
            correctAnswer: 'minute',
            feedbackCorrect: "Correct! The minute hand is the longer hand.",
            feedbackIncorrect: "Oops! That's the shorter hour hand. Click the *longer* hand.",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'not_quite_right_try_again.mp3'
        },
        { // Problem 3 (Click/Tap Hand) - MD Example 3
            type: 'clickTapHand',
            questionText: "Click the Hour Hand.",
            audio: 'click_the_hour_hand.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 9, m: 0 }, animateHands: false },
            correctAnswer: 'hour',
            feedbackCorrect: "Yes! The hour hand is the shorter one.",
            feedbackIncorrect: "Careful, that's the longer minute hand. The hour hand is *shorter*.",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'not_quite_right_try_again.mp3'
        },
        { // Problem 4 (True/False) - MD Example 4
            type: 'trueFalse',
            questionText: "True or False: The longer hand is the Minute Hand.", 
            audio: 'the_red_hand_is_the_minute.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 5, m: 30 }, animateHands: false },
            options: ['True', 'False'], 
            correctAnswer: 'True',
            feedbackCorrect: "You got it! The longer hand always shows the minutes.",
            feedbackIncorrect: "Actually, that statement is true. The longer hand *is* the minute hand.",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'not_quite_right_try_again.mp3'
        },
        { // Problem 5 (Click/Tap Hand) - MD Example 5
            type: 'clickTapHand',
            questionText: "Click the Hour Hand.",
            audio: 'click_the_hour_hand.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 1, m: 30 }, animateHands: false },
            correctAnswer: 'hour',
            feedbackCorrect: "Correct! You found the short hour hand.",
            feedbackIncorrect: "Try again! Click the *shorter* hand.",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'not_quite_right_try_again.mp3'
        },
        { // Problem 6 (Click/Tap Hand) - MD Example 6
            type: 'clickTapHand',
            questionText: "Click the Minute Hand.",
            audio: 'click_the_minute_hand.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 7, m: 0 }, animateHands: false },
            correctAnswer: 'minute',
            feedbackCorrect: "Yes, that's the long minute hand!",
            feedbackIncorrect: "Remember, the minute hand is the *longer* one. Click it!",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'not_quite_right_try_again.mp3'
        },
        { // Problem 7 (Yes/No - Animation) - MD Example 7
            type: 'yesNo',
            questionText: "Are these hands moving Clockwise?",
            audio: 'are_these_hands_moving_clockwise.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 12, m: 0 }, animateHands: true },
            options: ['Yes', 'No'],
            correctAnswer: 'Yes',
            feedbackCorrect: "Correct! They are moving clockwise, following 1, 2, 3...",
            feedbackIncorrect: "Look again! They are moving past 1, 2, 3... That *is* clockwise.",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'not_quite_right_try_again.mp3'
        },
        { // Problem 8 (Click/Tap Direction) - MD Example 8
            type: 'mcq',
            questionText: "Click the arrow that shows Clockwise.",
            audio: 'click_the_arrow_that_shows_clockwise.mp3',
            p5config: { 
                showNumbers: true,    
                showHands: true,    
                initialTime: { h: 7, m: 0 },
                animateHands: false
            }, 
            options: ['Left Arrow (↺)', 'Right Arrow (↻)'],
            correctAnswer: 'Right Arrow (↻)',
            feedbackCorrect: "Perfect! That's the clockwise direction.",
            feedbackIncorrect: "Not quite. Clockwise follows the numbers 1, 2, 3... like the arrow on the right (↻).",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'not_quite_right_try_again.mp3'
        }
    ];
    
    // --- Helper Functions ---
    function playAudio(filename, onEndedCallback = null) {
        // Don't play if filename is empty
        if (!filename) {
            console.log("No audio filename provided.");
            if (typeof onEndedCallback === 'function') {
                onEndedCallback();
            }
            return;
        }
        
        // Check if audio is enabled (check if the icon is muted)
        const audioIcon = audioButton ? audioButton.querySelector('i') : null;
        const isAudioMuted = audioIcon && audioIcon.className.includes('mute');
        if (isAudioMuted) {
            console.log("Audio is muted. Skipping playback.");
            if (typeof onEndedCallback === 'function') {
                onEndedCallback();
            }
            return;
        }
        
        const audioPath = `voice/${filename}`;
        console.log(`Playing audio: ${audioPath}`);
        
        // Store current audio filename for potential replay
        currentAudioFilename = filename;
        
        // Stop any playing audio
        if (narrationAudio && !narrationAudio.paused) {
            narrationAudio.pause();
            narrationAudio.currentTime = 0;
        }
        
        // Clear existing listeners
        narrationAudio.onended = null;
        narrationAudio.onerror = null;
        
        // Set up new listeners
        narrationAudio.onended = () => {
            console.log("Audio ended:", filename);
            if (typeof onEndedCallback === 'function') {
                onEndedCallback();
            }
        };
        
        narrationAudio.onerror = (e) => {
            console.error("Audio error:", filename, e);
            if (typeof onEndedCallback === 'function') {
                onEndedCallback();
            }
        };
        
        // Set source and play
        narrationAudio.src = audioPath;
        narrationAudio.currentTime = 0;
        
        const playPromise = narrationAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.error("Audio play failed:", e);
                if (typeof onEndedCallback === 'function') {
                    onEndedCallback();
                }
            });
        }
    }

    // Function to create clock sketch
    function createClockSketch(p5config) {
        console.log("Creating clock sketch with config:", p5config);
        let sketchInstance = null;
        
        try {
            // Create a p5 sketch function
            const sketch = function(p) {
                // Local variables for the sketch
                let clockDiameter;
                let currentHour = p5config.initialTime ? p5config.initialTime.h : 3;
                let currentMinute = p5config.initialTime ? p5config.initialTime.m : 0;
                let hoveredHand = null;
                let clickFeedback = null;
                let handAngleOffset = 0;
                let hoveredArrow = null;
                
                // Initialize the sketch
                p.setup = function() {
                    console.log("Clock sketch setup running");
                    const container = document.getElementById('canvas-container');
                    const w = container.offsetWidth;
                    const h = container.offsetHeight || 300;
                    
                    // Use the smaller dimension to ensure the clock fits
                    const size = Math.min(w, h);
                    const canvas = p.createCanvas(size, size);
                    canvas.parent(container);
                    
                    // Calculate clock size based on canvas
                    clockDiameter = size * 0.85;
                    
                    p.angleMode(p.DEGREES);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.strokeCap(p.ROUND);
                    
                    // If not animating, no need to loop
                    if (!p5config.animateHands) {
                        p.noLoop();
                    }
                };
                
                // Main draw function
                p.draw = function() {
                    p.background(bgColor);
                    p.translate(p.width/2, p.height/2);
                    
                    // Draw clock components
                    drawClockFace();
                    
                    if (p5config.showHands) {
                        let hAngle, mAngle;
                        
                        if (p5config.animateHands) {
                            // Calculate angles for animation
                            const speed = 0.5;
                            handAngleOffset += speed;
                            mAngle = (handAngleOffset % 360) * 6 - 90;
                            hAngle = ((handAngleOffset / 12) % 360) * 30 - 90;
                        } else {
                            // Calculate angles for static display
                            mAngle = p.map(currentMinute, 0, 60, 0, 360) - 90;
                            hAngle = p.map(currentHour % 12 + currentMinute / 60, 0, 12, 0, 360) - 90;
                        }
                        
                        // Draw hour hand (shorter) first so minute hand appears on top
                        drawHand('hour', hAngle, hourHandColor, hourHandLength, hourHandWidth);
                        drawHand('minute', mAngle, minuteHandColor, minuteHandLength, minuteHandWidth);
                    }
                    
                    // Always draw center dot on top
                    drawCenterDot();
                };
                
                // Draw clock face with rim and numbers
                function drawClockFace() {
                    // Draw outer rim
                    p.stroke(clockRimColor);
                    p.strokeWeight(clockDiameter * 0.04);
                    p.fill(clockFaceColor);
                    p.ellipse(0, 0, clockDiameter);
                    
                    // Draw tick marks
                    const tickRadius = clockDiameter * 0.45;
                    p.stroke(tickColor);
                    
                    for (let i = 0; i < 60; i++) {
                        const angle = p.map(i, 0, 60, -90, 270);
                        const isHourMark = (i % 5 === 0);
                        
                        const tickStartRadius = tickRadius * (isHourMark ? 0.92 : 0.96);
                        const tickEndRadius = tickRadius;
                        const tickWeight = isHourMark ? 3 : 1;
                        
                        const x1 = p.cos(angle) * tickStartRadius;
                        const y1 = p.sin(angle) * tickStartRadius;
                        const x2 = p.cos(angle) * tickEndRadius;
                        const y2 = p.sin(angle) * tickEndRadius;
                        
                        p.strokeWeight(tickWeight);
                        p.line(x1, y1, x2, y2);
                    }
                    
                    // Draw numbers if enabled
                    if (p5config.showNumbers) {
                        drawHourNumbers();
                    }
                }
                
                // Draw center dot
                function drawCenterDot() {
                    p.noStroke();
                    p.fill(centerDotColor);
                    p.ellipse(0, 0, clockDiameter * centerDotSize);
                }
                
                // Draw a clock hand (hour or minute)
                function drawHand(handType, angle, color, lengthMultiplier, weight) {
                    const handLength = clockDiameter * lengthMultiplier;
                    const isHovered = handType === hoveredHand;
                    const isClickFeedback = clickFeedback && clickFeedback.type === handType;
                    const isCorrect = isClickFeedback && clickFeedback.correct;
                    
                    // Calculate hand coordinates for hover detection
                    const endX = Math.cos(p.radians(angle)) * handLength;
                    const endY = Math.sin(p.radians(angle)) * handLength;
                    
                    // Determine appropriate color based on state
                    let handColor = color;
                    if (isClickFeedback) {
                        handColor = isCorrect ? correctColor : incorrectColor;
                    } else if (isHovered) {
                        handColor = highlightColor;
                    }
                    
                    // Draw the hand
                    p.push();
                    p.rotate(angle);
                    p.stroke(handColor);
                    p.strokeWeight(isHovered ? weight + 2 : weight);
                    p.line(0, 0, handLength, 0);
                    p.pop();
                    
                    // Explicitly draw a debugging circle at the end of each hand (helpful but optional)
                    p.fill(handColor);
                    p.noStroke();
                    p.ellipse(endX, endY, weight);
                    
                    // Draw invisible hit area for easier clicking
                    if (problems[currentProblemIndex].type === 'clickTapHand') {
                        // Check for hover on this hand
                        const mouseX = p.mouseX - p.width/2;
                        const mouseY = p.mouseY - p.height/2;
                        
                        // Use a much more generous detection method:
                        // 1. Check distance to line segment
                        // 2. With a much higher threshold for hour hand (shorter but harder to click)
                        // 3. Make sure we're not too far from the center or beyond the hand length
                        
                        const hitThreshold = handType === 'hour' ? 20 : 15;  // Larger threshold for hour hand
                        const maxDistFromCenter = handLength * 1.2; // Allow a bit beyond the hand length
                        
                        // Check if mouse is within the rectangular region around the hand
                        const dist = distToSegment(mouseX, mouseY, 0, 0, endX, endY);
                        
                        if (dist < hitThreshold && p.dist(0, 0, mouseX, mouseY) < maxDistFromCenter) {
                            if (hoveredHand !== handType) {
                                hoveredHand = handType;
                                p.cursor(p.HAND);
                                console.log("Hovering over", handType, "hand");
                                p.redraw(); // Force redraw when hover state changes
                            }
                        } else if (hoveredHand === handType) {
                            hoveredHand = null; 
                            p.cursor(p.ARROW);
                            p.redraw(); // Force redraw when hover state changes
                        }
                    }
                }
                
                // Improved helper function to calculate distance from point to line segment
                function distToSegment(px, py, x1, y1, x2, y2) {
                    const A = px - x1;
                    const B = py - y1;
                    const C = x2 - x1;
                    const D = y2 - y1;
                    
                    const dot = A * C + B * D;
                    const lenSq = C * C + D * D;
                    let param = -1;
                    
                    if (lenSq !== 0) // in case of 0 length line
                        param = dot / lenSq;
                    
                    let xx, yy;
                    
                    if (param < 0) {
                        xx = x1;
                        yy = y1;
                    } else if (param > 1) {
                        xx = x2;
                        yy = y2;
                    } else {
                        xx = x1 + param * C;
                        yy = y1 + param * D;
                    }
                    
                    const dx = px - xx;
                    const dy = py - yy;
                    
                    return Math.sqrt(dx * dx + dy * dy);
                }
                
                // Draw hour numbers around the clock
                function drawHourNumbers() {
                    const numberRadius = clockDiameter * numberRadiusMultiplier;
                    p.textSize(clockDiameter * numberSizeMultiplier);
                    p.textStyle(p.BOLD);
                    p.fill(numberColor);
                    p.noStroke();
                    
                    for (let i = 1; i <= 12; i++) {
                        const angle = i * 30 - 90;
                        const x = p.cos(angle) * numberRadius;
                        const y = p.sin(angle) * numberRadius;
                        p.text(i, x, y);
                    }
                }
                
                // Draw direction arrows for clockwise/counterclockwise selection
                function drawDirectionArrows() {
                    const arrowOffset = clockDiameter * 0.25;
                    const arrowSize = clockDiameter * 0.10;
                    
                    // Draw clockwise arrow (right)
                    drawArrow(arrowOffset, 0, arrowSize, 'clockwise');
                    
                    // Draw counterclockwise arrow (left)
                    drawArrow(-arrowOffset, 0, arrowSize, 'counterclockwise');
                }
                
                // Draw an individual direction arrow
                function drawArrow(x, y, size, direction) {
                    const isHovered = direction === hoveredArrow;
                    const isClickFeedback = clickFeedback && clickFeedback.type === direction;
                    const isCorrect = isClickFeedback && clickFeedback.correct;
                    
                    // Determine arrow color based on state
                    let arrowColor = direction === 'clockwise' ? hourHandColor : minuteHandColor;
                    if (isClickFeedback) {
                        arrowColor = isCorrect ? correctColor : incorrectColor;
                    } else if (isHovered) {
                        arrowColor = highlightColor;
                    }
                    
                    p.push();
                    p.translate(x, y);
                    
                    // Draw arrow background
                    p.fill(240, 240, 240, 200);
                    p.noStroke();
                    p.ellipse(0, 0, size * 2.2);
                    
                    // Draw arrow
                    p.stroke(arrowColor);
                    p.strokeWeight(size * 0.15);
                    p.noFill();
                    
                    if (direction === 'clockwise') {
                        // Clockwise arrow (↻)
                        p.arc(0, 0, size * 1.5, size * 1.5, -135, 135);
                        p.line(size * 0.8, 0, size * 0.4, -size * 0.4);
                        p.line(size * 0.8, 0, size * 0.4, size * 0.4);
                    } else {
                        // Counterclockwise arrow (↺)
                        p.arc(0, 0, size * 1.5, size * 1.5, 45, 315);
                        p.line(-size * 0.8, 0, -size * 0.4, -size * 0.4);
                        p.line(-size * 0.8, 0, -size * 0.4, size * 0.4);
                    }
                    
                    p.pop();
                    
                    // Check for hover
                    if (problems[currentProblemIndex].type === 'clickTapDirection') {
                        const d = p.dist(p.mouseX - p.width/2, p.mouseY - p.height/2, x, y);
                        if (d < size * 2.2) { // Increased hit area to match the background circle size
                            if (hoveredArrow !== direction) {
                                hoveredArrow = direction;
                                p.cursor(p.HAND);
                                console.log("Hovering over", direction, "arrow");
                                p.redraw(); // Force redraw when hover state changes
                            }
                        } else if (hoveredArrow === direction) {
                            hoveredArrow = null;
                            p.cursor(p.ARROW);
                            p.redraw(); // Force redraw when hover state changes
                        }
                    }
                }
                
                // Handle mouse clicks
                p.mouseClicked = function() {
                    console.log("Mouse clicked in p5 canvas");
                    
                    // Make sure click is within canvas
                    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) {
                        console.log("Click outside canvas bounds");
                        return;
                    }
                    
                    const currentProblem = problems[currentProblemIndex];
                    console.log("Current problem type:", currentProblem.type);
                    
                    // If the problem is clickTapHand but no hand is currently hovered,
                    // let's do a direct hit test at click time
                    if (currentProblem.type === 'clickTapHand' && !hoveredHand) {
                        // Get mouse position relative to clock center
                        const mouseX = p.mouseX - p.width/2;
                        const mouseY = p.mouseY - p.height/2;
                        
                        // Check distance from clock center
                        const distFromCenter = Math.sqrt(mouseX*mouseX + mouseY*mouseY);
                        
                        // If we're clicking within the clock face radius
                        if (distFromCenter <= clockDiameter/2) {
                            // Calculate angles and positions for both hands
                            let hourAngle, minuteAngle, hourEndX, hourEndY, minuteEndX, minuteEndY;
                            
                            // Get time from current problem config
                            const time = currentProblem.p5config.initialTime;
                            const h = time.h || 12;
                            const m = time.m || 0;
                            
                            // Hour hand position
                            hourAngle = p.map(h % 12 + m / 60, 0, 12, 0, 360) - 90;
                            hourEndX = Math.cos(p.radians(hourAngle)) * (clockDiameter * hourHandLength);
                            hourEndY = Math.sin(p.radians(hourAngle)) * (clockDiameter * hourHandLength);
                            
                            // Minute hand position
                            minuteAngle = p.map(m, 0, 60, 0, 360) - 90;
                            minuteEndX = Math.cos(p.radians(minuteAngle)) * (clockDiameter * minuteHandLength);
                            minuteEndY = Math.sin(p.radians(minuteAngle)) * (clockDiameter * minuteHandLength);
                            
                            // Check distances to both hands
                            const hourDist = distToSegment(mouseX, mouseY, 0, 0, hourEndX, hourEndY);
                            const minuteDist = distToSegment(mouseX, mouseY, 0, 0, minuteEndX, minuteEndY);
                            
                            // Set very generous thresholds - we want clicking to be easy
                            const hourThreshold = 25;
                            const minuteThreshold = 20;
                            
                            // Determine which hand was clicked (if any)
                            if (hourDist < hourThreshold && minuteDist < minuteThreshold) {
                                // If both hands are close, choose the closest one
                                const clickedHand = hourDist < minuteDist ? 'hour' : 'minute';
                                console.log("Both hands close, choosing:", clickedHand);
                                
                                const isCorrect = clickedHand === currentProblem.correctAnswer;
                                clickFeedback = { type: clickedHand, correct: isCorrect };
                                handleAnswer(isCorrect);
                                p.redraw();
                            } else if (hourDist < hourThreshold) {
                                console.log("Direct click on hour hand detected");
                                const isCorrect = 'hour' === currentProblem.correctAnswer;
                                clickFeedback = { type: 'hour', correct: isCorrect };
                                handleAnswer(isCorrect);
                                p.redraw();
                            } else if (minuteDist < minuteThreshold) {
                                console.log("Direct click on minute hand detected");
                                const isCorrect = 'minute' === currentProblem.correctAnswer;
                                clickFeedback = { type: 'minute', correct: isCorrect };
                                handleAnswer(isCorrect);
                                p.redraw();
                            }
                        }
                    }
                    // Default hover-based click handling
                    else if (currentProblem.type === 'clickTapHand' && hoveredHand) {
                        console.log("Processing click on hovered hand:", hoveredHand);
                        const isCorrect = hoveredHand === currentProblem.correctAnswer;
                        console.log("Is correct answer:", isCorrect);
                        clickFeedback = { type: hoveredHand, correct: isCorrect };
                        handleAnswer(isCorrect);
                        p.redraw();
                    }
                    
                    // Handle direction arrow clicks
                    if (currentProblem.type === 'clickTapDirection') {
                        if (hoveredArrow) {
                            // If an arrow is already hovered, use that
                            console.log("Processing click on hovered arrow:", hoveredArrow);
                            const isCorrect = hoveredArrow === currentProblem.correctAnswer;
                            console.log("Is correct answer:", isCorrect);
                            clickFeedback = { type: hoveredArrow, correct: isCorrect };
                            handleAnswer(isCorrect);
                            p.redraw();
                        } else {
                            // If no arrow is hovered, check direct clicks on the arrows
                            const mouseX = p.mouseX - p.width/2;
                            const mouseY = p.mouseY - p.height/2;
                            
                            // Calculate positions for both arrows
                            const arrowOffset = clockDiameter * 0.25;
                            const arrowSize = clockDiameter * 0.10;
                            
                            // Check distance to each arrow
                            const clockwiseDistance = p.dist(mouseX, mouseY, arrowOffset, 0);
                            const counterclockwiseDistance = p.dist(mouseX, mouseY, -arrowOffset, 0);
                            
                            // Use very generous threshold for arrow clicks
                            const arrowThreshold = arrowSize * 2.2;
                            
                            if (clockwiseDistance < arrowThreshold) {
                                console.log("Direct click on clockwise arrow detected");
                                const isCorrect = 'clockwise' === currentProblem.correctAnswer;
                                clickFeedback = { type: 'clockwise', correct: isCorrect };
                                handleAnswer(isCorrect);
                                p.redraw();
                            } else if (counterclockwiseDistance < arrowThreshold) {
                                console.log("Direct click on counterclockwise arrow detected");
                                const isCorrect = 'counterclockwise' === currentProblem.correctAnswer;
                                clickFeedback = { type: 'counterclockwise', correct: isCorrect };
                                handleAnswer(isCorrect);
                                p.redraw();
                            }
                        }
                    }
                };
                
                // Add mouse moved handler to improve hover responsiveness
                p.mouseMoved = function() {
                    // Only process if within canvas and for problems that need hover detection
                    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) {
                        return;
                    }
                    
                    const currentProblem = problems[currentProblemIndex];
                    
                    // For hand click problems, force redraw on mouse move to ensure hover effects update
                    if (currentProblem.type === 'clickTapHand' || currentProblem.type === 'clickTapDirection') {
                        // We don't need to do anything special here - the hover detection happens in drawHand
                        // Just need to force a redraw to make sure hover state is checked
                        if (!currentProblem.p5config.animateHands) {  // Only redraw for static hands, animated ones already redraw
                            p.redraw();
                        }
                    }
                };
                
                // Public methods for the sketch
                p.startAnimation = function() {
                    p.loop();
                };
                
                p.stopAnimation = function() {
                    p.noLoop();
                };
                
                p.resetFeedback = function() {
                    clickFeedback = null;
                    p.redraw();
                };
            };
            
            // Create the sketch instance
            sketchInstance = new p5(sketch, canvasContainer);
            console.log("P5 instance created successfully");
            return sketchInstance;
        } catch (error) {
            console.error("Error creating p5 sketch:", error);
            return null;
        }
    }

    // --- Button Creation Functions ---
    function createMCQButtons(options) {
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'mcq-button-container';
        
        // Add button container right after the instruction element
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'option-button';
            button.addEventListener('click', () => handleMCQAnswer(index));
            buttonContainer.appendChild(button);
        });
        
        // Clear any existing button containers first
        const existingContainers = document.querySelectorAll('.mcq-button-container');
        existingContainers.forEach(container => container.remove());
        
        // Add the button container after the instruction element
        if (instructionElement && instructionElement.parentNode) {
            // Insert after instruction element
            instructionElement.parentNode.insertBefore(buttonContainer, instructionElement.nextSibling);
        }
    }
    
    function createTrueFalseButtons() {
        return createMCQButtons(['True', 'False']);
    }
    
    function createYesNoButtons() {
        return createMCQButtons(['Yes', 'No']);
    }
    
    // --- Answer Handlers ---
    function handleMCQAnswer(selectedIndex) {
        const currentProblem = problems[currentProblemIndex];
        const selectedOption = currentProblem.options[selectedIndex];
        const isCorrect = selectedOption === currentProblem.correctAnswer;
        
        // Apply visual feedback to the button
        const buttons = document.querySelectorAll('.mcq-button-container .option-button');
        buttons.forEach((button, index) => {
            if (index === selectedIndex) {
                button.classList.add(isCorrect ? 'correct-answer-highlight' : 'incorrect-answer-flash');
            }
        });
        
        handleAnswer(isCorrect);
    }
    
    function handleAnswer(isCorrect) {
        const currentProblem = problems[currentProblemIndex];
        
        // Display feedback
        feedbackArea.textContent = isCorrect ? currentProblem.feedbackCorrect : currentProblem.feedbackIncorrect;
        feedbackArea.className = `feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
        
        // Play feedback audio
        playAudio(isCorrect ? currentProblem.audioCorrect : currentProblem.audioIncorrect);
        
        // If correct, enable next button after a delay
        if (isCorrect) {
            setTimeout(() => {
                nextButton.disabled = false;
            }, 1000);
        }
    }
    
    // --- Problem Loading ---
    function loadProblem(index) {
        if (index < 0 || index >= problems.length) return;
        
        currentProblemIndex = index;
        const problem = problems[index];
        const instructionText = problem.questionText || ""; // Store text

        // Stop previous audio
        if (narrationAudio && !narrationAudio.paused) {
            narrationAudio.pause();
            narrationAudio.currentTime = 0;
        }
        
        // Update counter
        if (lessonCounterElement) {
            lessonCounterElement.textContent = `Problem ${index + 1} of ${problems.length}`;
        }

        // Update title
        if (titleElement) {
            titleElement.textContent = `Question ${index + 1}`;
        }
        
        // Update instruction - hide initially
        if (instructionElement) {
            instructionElement.innerHTML = '';
            instructionElement.style.visibility = 'hidden';
        }
        
        // Clear feedback area
        if (feedbackArea) {
            feedbackArea.textContent = '';
            feedbackArea.className = 'feedback';
        }
        
        // Disable next button until correct answer
        if (nextButton) {
            nextButton.disabled = true;
        }

        // Enable/disable previous button
        if (prevButton) {
            prevButton.disabled = (index === 0); 
        }
        
        // Always clear check area - it gets repopulated
        if (checkArea) {
            checkArea.innerHTML = '';
        }
        
        // Remove any existing button containers from previous questions
        const existingContainers = document.querySelectorAll('.mcq-button-container');
        existingContainers.forEach(container => container.remove());
        
        // --- Create/Update p5 Instance Immediately ---
        if (problem.p5config) {
            if (p5Instance) {
                try { p5Instance.remove(); } catch (e) { console.error("Error removing previous p5:", e); }
                p5Instance = null;
            }
            // Clear container explicitly
            if (canvasContainer) { 
                const existingCanvases = canvasContainer.querySelectorAll('canvas');
                existingCanvases.forEach(canvas => canvas.remove());
                canvasContainer.innerHTML = '';
            } else {
                console.error("Canvas container not found before p5 creation!");
                // Optionally stop if container is critical
            }
            
            // Use a minimal timeout just to ensure DOM is ready for p5
            setTimeout(() => { 
                if (canvasContainer && currentProblemIndex === index) { // Check if still on the same problem
                    p5Instance = createClockSketch(problem.p5config);
                    // Start animation immediately after creation if needed
                    if (problem.p5config.animateHands && p5Instance && typeof p5Instance.startAnimation === 'function') {
                        console.log("Starting animation immediately after p5 creation.");
                        p5Instance.startAnimation(); 
                    }
                }
            }, 10); // Minimal delay
        } else {
             // If no p5 needed, ensure previous instance is removed and container is clear
            if (p5Instance) {
                try { p5Instance.remove(); } catch (e) { console.error("Error removing previous p5:", e); }
                p5Instance = null;
            }
             if (canvasContainer) canvasContainer.innerHTML = '';
        }
        // --- End p5 Instance Creation ---
        
        // Define callback to show text and create buttons (p5 already handled)
        const showTextAndSetupCallback = () => {
            // Check if we are still on the intended question index
            if (currentProblemIndex !== index) {
                console.log(`Callback for problem ${index} ignored, current index is ${currentProblemIndex}`);
                return;
            }
            
            if (instructionElement) {
                 instructionElement.innerHTML = instructionText;
                 instructionElement.style.visibility = 'visible';
                 console.log("Instruction text visible for problem:", index);
            }
            
            // Create relevant buttons *after* text is visible
            setTimeout(() => { // Use timeout to ensure DOM updates
                 // Check index again inside timeout
                 if (currentProblemIndex === index) {
                     switch (problem.type) {
                        case 'mcq':
                            createMCQButtons(problem.options);
                            break;
                        case 'trueFalse':
                            createTrueFalseButtons();
                            break;
                        case 'yesNo':
                            createYesNoButtons();
                            break;
                    }
                } else {
                    console.log(`Button creation for problem ${index} skipped, current index is ${currentProblemIndex}`);
                }
             }, 10);
             
             // REMOVED p5 creation logic from here
        };

        // Play audio instruction if available
        if (problem.audio) {
            currentAudioFilename = problem.audio; // Store for replaying
            playAudio(problem.audio, showTextAndSetupCallback);
        } else {
             console.log("No audio for problem:", index);
             // If no audio, run callback immediately
             setTimeout(showTextAndSetupCallback, 0);
        }
    }
    
    // --- Event Listeners ---

    // Check if intro elements exist
    if (startButton && introSection && doItContent && professorImage && prevButton && nextButton) {
        // Start Button Listener - Only use if the intro elements exist
        startButton.addEventListener('click', () => {
            console.log('Start Practice button clicked');
            introSection.classList.add('hidden');
            if (professorImage) professorImage.classList.add('hidden'); // Hide professor in header
            doItContent.classList.remove('hidden');
            
            // Hide start button, show real nav buttons
            startButton.style.display = 'none';
            prevButton.style.display = 'inline-flex';
            nextButton.style.display = 'inline-flex';
            
            // Also show skip button
            const skipButton = document.getElementById('skip-button');
            if (skipButton) {
                skipButton.style.display = 'inline-flex';
            }
            
            prevButton.disabled = true; // Prev should be disabled initially
            nextButton.disabled = true; // Next is disabled until first answer
            
            // Load the first problem and play its audio
            loadProblem(0); 
        });
    } else {
        console.log('Intro elements not found. Loading first problem automatically.');
        // Auto-initialize since intro elements don't exist
        if (doItContent) {
            doItContent.classList.remove('hidden');
        }
        
        // Show navigation buttons
        if (prevButton) {
            prevButton.style.display = 'inline-flex';
            prevButton.disabled = true; // Prev should be disabled initially
        }
        
        if (nextButton) {
            nextButton.style.display = 'inline-flex';
            nextButton.disabled = true; // Next is disabled until first answer
        }
        
        // Also show skip button
        const skipButton = document.getElementById('skip-button');
        if (skipButton) {
            skipButton.style.display = 'inline-flex';
        }
        
        // Load the first problem and play its audio
        loadProblem(0);
    }

    // Navigation Button Listeners
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            console.log('Next button clicked. Current index:', currentProblemIndex);
            if (currentProblemIndex < problems.length - 1) {
                loadProblem(currentProblemIndex + 1);
            } else {
                // Last problem - Redirect to 'Show It' section
                console.log('Last problem completed. Redirecting to show-it.html');
                // alert('Congratulations! You have completed all the practice problems.'); // Removed alert
                window.location.href = 'show-it.html'; // Redirect to next page
            }
        });
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentProblemIndex > 0) {
                loadProblem(currentProblemIndex - 1);
            }
        });
    }
    
    // Skip Button Listener
    const skipButton = document.getElementById('skip-button');
    if (skipButton) {
        skipButton.addEventListener('click', () => {
            console.log('Skip button clicked. Current index:', currentProblemIndex);
            if (currentProblemIndex < problems.length - 1) {
                loadProblem(currentProblemIndex + 1);
            } else {
                // Last problem - Redirect to 'Show It' section
                console.log('Last problem completed. Redirecting to show-it.html');
                window.location.href = 'show-it.html'; // Redirect to next page
            }
        });
    }
    
    // Audio Button Listener
    if (audioButton) {
        audioButton.addEventListener('click', () => {
            const icon = audioButton.querySelector('i');
            if (narrationAudio.paused) {
                // Resume audio if there's a current track
                if (currentAudioFilename) {
                    playAudio(currentAudioFilename);
                }
                icon.className = 'fas fa-volume-up';
            } else {
                // Pause audio
                narrationAudio.pause();
                icon.className = 'fas fa-volume-mute';
            }
        });
    }

    // Initial setup - don't load problem here, wait for start button
    // loadProblem(0); 

    console.log("Do It page initialization complete.");
});