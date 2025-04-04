// --- DOM References ---
document.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.getElementById('do-it-question-title');
    const instructionElement = document.getElementById('do-it-instruction');
    const canvasContainer = document.getElementById('canvas-container');
    const checkArea = document.getElementById('embedded-check-area');
    const feedbackArea = document.getElementById('feedback-area');
    const nextButton = document.getElementById('next-button');
    const prevButton = document.getElementById('prev-button');
    const audioButton = document.getElementById('footer-audio-button');
    const lessonCounterElement = document.getElementById('do-it-step-counter');
    
    let narrationAudio = new Audio();
    let currentAudioFilename = null;
    let p5Instance = null;
    
    // --- State Variables ---
    let currentProblemIndex = 0;
    let currentP5Instance = null;
    let currentAudio = null;
    let lastInstructionAudio = null; 

    // --- Problem Set Definition (Based on Lesson1_MeetTheClock.md Section 2.4 - 8 Examples) ---
    const problems = [
        { // Problem 1 (MCQ) - MD Example 1
            type: 'mcq',
            questionText: "Which is the Hour Hand?",
            audio: 'which_is_the_hour_hand.mp3', 
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 2, m: 30 }, animateHands: false },
            options: ['Short hand', 'Long hand'],
            correctAnswer: 'Short hand',
            feedbackCorrect: "That's right! The hour hand is the shorter hand.",
            feedbackIncorrect: "Not quite. Remember, the hour hand is the *shorter* one.",
            audioCorrect: 'correct.mp3', 
            audioIncorrect: 'try_again.mp3' 
        },
        { // Problem 2 (Click/Tap Hand) - MD Example 2
            type: 'clickTapHand',
            questionText: "Click the Minute Hand.",
            audio: 'click_the_minute_hand.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 8, m: 15 }, animateHands: false },
            correctAnswer: 'minute',
            feedbackCorrect: "Correct! The minute hand is the longer hand.",
            feedbackIncorrect: "Oops! That's the shorter hour hand. Click the *longer* hand.",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'try_again.mp3'
        },
        { // Problem 3 (Click/Tap Hand) - MD Example 3
            type: 'clickTapHand',
            questionText: "Click the Hour Hand.",
            audio: 'click_the_hour_hand.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 10, m: 50 }, animateHands: false },
            correctAnswer: 'hour',
            feedbackCorrect: "Yes! The hour hand is the shorter one.",
            feedbackIncorrect: "Careful, that's the longer minute hand. The hour hand is *shorter*.",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'try_again.mp3'
        },
        { // Problem 4 (True/False) - MD Example 4
            type: 'trueFalse',
            // Changed wording slightly from MD to be more direct T/F
            questionText: "True or False: The longer hand is the Minute Hand.", 
            audio: 'the_red_hand_is_the_minute.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 4, m: 45 }, animateHands: false },
            options: ['True', 'False'], 
            correctAnswer: 'True',
            feedbackCorrect: "You got it! The longer hand always shows the minutes.",
            feedbackIncorrect: "Actually, that statement is true. The longer hand *is* the minute hand.",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'try_again.mp3'
        },
        { // Problem 5 (Click/Tap Hand) - MD Example 5
            type: 'clickTapHand',
            questionText: "Click the Hour Hand.",
            audio: 'click_the_hour_hand.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 1, m: 20 }, animateHands: false },
            correctAnswer: 'hour',
            feedbackCorrect: "Correct! You found the short hour hand.",
            feedbackIncorrect: "Try again! Click the *shorter* hand.",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'try_again.mp3'
        },
        { // Problem 6 (Click/Tap Hand) - MD Example 6
            type: 'clickTapHand',
            questionText: "Click the Minute Hand.",
            audio: 'click_the_minute_hand.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 7, m: 5 }, animateHands: false },
            correctAnswer: 'minute',
            feedbackCorrect: "Yes, that's the long minute hand!",
            feedbackIncorrect: "Remember, the minute hand is the *longer* one. Click it!",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'try_again.mp3'
        },
        { // Problem 7 (Yes/No - Animation) - MD Example 7
            type: 'yesNo',
            questionText: "Are these hands moving Clockwise?",
            audio: 'are_these_hands_moving_clockwise.mp3',
            p5config: { showNumbers: true, showHands: true, initialTime: { h: 1, m: 0 }, animateHands: true }, // Animation starts
            options: ['Yes', 'No'],
            correctAnswer: 'Yes',
            feedbackCorrect: "Correct! They are moving clockwise, following 1, 2, 3...",
            feedbackIncorrect: "Look again! They are moving past 1, 2, 3... That *is* clockwise.",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'try_again.mp3'
        },
        { // Problem 8 (Click/Tap Direction) - MD Example 8
            type: 'clickTapDirection',
            questionText: "Click the arrow that shows Clockwise.",
            audio: 'click_the_arrow_that_shows_clockwise.mp3',
            p5config: { showNumbers: false, showHands: false, animateHands: false, showDirectionArrows: true }, // Only show arrows
            correctAnswer: 'clockwise',
            feedbackCorrect: "Perfect! That's the clockwise direction.",
            feedbackIncorrect: "Not quite. Clockwise follows the numbers 1, 2, 3... like the arrow on the right (↻).",
            audioCorrect: 'correct.mp3',
            audioIncorrect: 'try_again.mp3'
        }
    ];
    
    // --- Helper Functions ---
    function playAudio(filename, onEndedCallback = null) {
        if (!filename) {
            if (typeof onEndedCallback === 'function') {
                onEndedCallback();
            }
            return;
        }
        
        const audioPath = `voice/${filename}`;
        console.log(`Playing audio: ${audioPath}`);
        
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
    
    // --- Initial Load Function ---
    function loadProblem(index) {
        // Implementation to be added: Load problem based on index
        // This will create UI elements, set up the p5 sketch, and more
        console.log("Loading problem:", index);
        
        // For now, just update the UI with the problem data
        const problem = problems[index];
        titleElement.textContent = `Question ${index + 1}`;
        instructionElement.innerHTML = problem.questionText;
        
        // Play instruction audio
        currentAudioFilename = problem.audio;
        playAudio(problem.audio);
        
        // Update counter
        lessonCounterElement.textContent = `Do It - Problem ${index + 1} of ${problems.length}`;
    }
    
    // --- Event Listeners ---
    // Audio button
    if (audioButton) {
        audioButton.addEventListener('click', () => {
            playAudio(currentAudioFilename);
        });
    }
    
    // Navigation
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (currentProblemIndex < problems.length - 1) {
                currentProblemIndex++;
                loadProblem(currentProblemIndex);
            } else {
                // Navigate to Show It page
                window.location.href = 'show-it.html';
            }
        });
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentProblemIndex > 0) {
                currentProblemIndex--;
                loadProblem(currentProblemIndex);
            } else {
                // Navigate to Try It page
                window.location.href = 'try-it.html';
            }
        });
    }
    
    // Start with first problem
    loadProblem(0);
});
