// --- Global Variables & Constants ---
const titleElement = document.getElementById('show-it-title');
const instructionElement = document.getElementById('show-it-instruction');
const canvasContainer = document.getElementById('canvas-container');
const checkArea = document.getElementById('embedded-check-area');
const feedbackArea = document.getElementById('feedback-area');
const nextButton = document.getElementById('next-step-button');
const prevButton = document.querySelector('.btn-prev-step');
const skipButton = document.getElementById('skip-button');
const lessonCounterElement = document.querySelector('.lesson-counter');
const resultsArea = document.getElementById('results-area');
const scoreDisplay = document.getElementById('score-display');
const remediationMessage = document.getElementById('remediation-message');

// --- Quiz Assessment State ---
let currentQuestion = 0;
let userScore = 0;
let userAnswers = [];
let p5Instance = null;
let narrationAudio = new Audio();
let currentAudioFilename = null;
let clockDiameter;

// Color definitions
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

// Dimension constants
const hourHandLength = 0.28; // Hour hand length
const minuteHandLength = 0.40; // Minute hand length
const hourHandWidth = 10; // Hour hand width
const minuteHandWidth = 8; // Minute hand width

// --- Audio Filename Map ---
const audioFilenameMap = {
    'intro': 'show_it_welcome_to_clock_expert.mp3',
    '0-instruction': 'click_the_hour_hand.mp3',
    '0-feedback-correct': 'correct.mp3',
    '0-feedback-incorrect': 'incorrect.mp3',
    
    '1-instruction': 'click_the_minute_hand.mp3',
    '1-feedback-correct': 'correct.mp3',
    '1-feedback-incorrect': 'incorrect.mp3',
    
    '2-instruction': 'which_hand_is_longer.mp3',
    '2-feedback-correct': 'correct.mp3',
    '2-feedback-incorrect': 'incorrect.mp3',
    
    '3-instruction': 'is_this_clockwise.mp3',
    '3-feedback-correct': 'correct.mp3',
    '3-feedback-incorrect': 'incorrect.mp3',
    
    'results-good': 'great_job_you_know_your_clock.mp3',
    'results-needs-work': 'lets_review_clock_parts_again.mp3'
};

// --- Assessment Questions (Show It) ---
const questions = [
    {
        title: "Question 1: Hour Hand",
        instruction: "Click the Hour Hand.",
        type: 'hand',
        correctAnswer: 'hour',
        p5config: {
            stepIndex: 0,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 5, m: 0 },
            animateHands: false,
            interactionTarget: { type: 'hand', value: 'hour' }
        },
        feedbackCorrect: "Correct! You identified the Hour Hand.",
        feedbackIncorrect: "Incorrect. The Hour Hand is the short one."
    },
    {
        title: "Question 2: Minute Hand",
        instruction: "Click the Minute Hand.",
        type: 'hand',
        correctAnswer: 'minute',
        p5config: {
            stepIndex: 1,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 8, m: 0 },
            animateHands: false,
            interactionTarget: { type: 'hand', value: 'minute' }
        },
        feedbackCorrect: "Correct! You identified the Minute Hand.",
        feedbackIncorrect: "Incorrect. The Minute Hand is the long one."
    },
    {
        title: "Question 3: Hand Length",
        instruction: "Which hand is LONGER?",
        type: 'choice',
        choices: [
            { id: 'hour', text: "Hour Hand" },
            { id: 'minute', text: "Minute Hand" }
        ],
        correctAnswer: 'minute',
        p5config: {
            stepIndex: 2,
            showNumbers: true, 
            showHands: true,
            initialTime: { h: 12, m: 0 },
            animateHands: false,
            interactionTarget: null // We use buttons for this one
        },
        feedbackCorrect: "Correct! The Minute Hand is longer.",
        feedbackIncorrect: "Incorrect. The Minute Hand is the longer one."
    },
    {
        title: "Question 4: Clockwise Direction",
        instruction: "Is this clockwise?",
        type: 'yes-no',
        correctAnswer: 'yes',
        p5config: {
            stepIndex: 3,
            showNumbers: true,
            showHands: true,
            initialTime: { h: 12, m: 0 },
            animateHands: true,
            interactionTarget: null // We use buttons for this one
        },
        feedbackCorrect: "Correct! The hands move clockwise.",
        feedbackIncorrect: "Incorrect. The hands are moving clockwise."
    }
];

// --- Helper Functions (Audio, etc.) ---
function getAudioFilename(questionIndex, partKey) {
    const key = `${questionIndex}-${partKey}`;
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
        if (typeof onEndedCallback === 'function') {
            console.log("Executing onEndedCallback.");
            onEndedCallback();
        }
    };
    
    const handleAudioError = (e) => {
        console.error("Audio error:", filename, e);
        cleanupListeners();
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

    if (!filename) {
        console.log("No audio filename provided or available for current question.");
        if (typeof onEndedCallback === 'function') {
            console.log("No audio, executing callback immediately.");
            onEndedCallback();
        }
        return;
    }
    
    const audioPath = `voice/${filename}`;
    console.log(`Attempting to play audio:`, audioPath);

    stopAudio(false);
    cleanupListeners();
    narrationAudio.onended = handleAudioEnd;
    narrationAudio.onerror = handleAudioError;
    narrationAudio.src = audioPath;
    narrationAudio.currentTime = 0;

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
function loadQuestion(questionIndex) {
    if (questionIndex < 0 || questionIndex >= questions.length) {
        console.error("Invalid question index:", questionIndex);
        showResults();
        return;
    }

    console.log(`Loading question: ${questionIndex}`);
    currentQuestion = questionIndex;
    const question = questions[currentQuestion];

    // Remove previous p5 instance
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
    }
    
    // Get layout elements
    const showItContent = document.getElementById('show-it-content');
    const contentLeft = showItContent.querySelector('.content-left');
    const contentRight = showItContent.querySelector('.content-right');
    
    // Clear containers but preserve structure
    const container = document.getElementById('canvas-container');
    if (container) container.innerHTML = '';
    else { console.error("Canvas container not found!"); return; }
    
    // Ensure content-right is displayed properly
    contentRight.style.display = 'block';
    
    // Reset layout structure first
    contentLeft.innerHTML = '';
    contentLeft.appendChild(container);
    contentLeft.appendChild(checkArea);

    stopAudio(true);
    
    // Update UI elements
    titleElement.textContent = question.title;
    instructionElement.innerHTML = question.instruction;
    feedbackArea.textContent = '';
    feedbackArea.className = 'feedback';
    checkArea.innerHTML = '';
    if (lessonCounterElement) {
        lessonCounterElement.textContent = `Show It - Question ${questionIndex + 1} of ${questions.length}`;
    }

    // Update progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const progressPercentage = (currentQuestion / questions.length) * 20 + 80; // 80% to 100%
        progressBar.style.width = `${progressPercentage}%`;
    }

    // Create new p5 instance for clock
    if (question.p5config && typeof p5 !== 'undefined') {
        console.log("Creating new p5 instance with config:", question.p5config);
        try {
            p5Instance = new p5(sketch(question.p5config));
            console.log("p5 instance created successfully:", p5Instance);

            // Add choice buttons for multiple choice and yes/no questions
            if (question.type === 'choice' || question.type === 'yes-no') {
                // Add a wrapper for better layout
                const wrapper = document.createElement('div');
                wrapper.className = 'canvas-check-wrapper';
                
                // Rebuild structure
                contentLeft.innerHTML = '';
                contentLeft.appendChild(wrapper);
                wrapper.appendChild(container);
                wrapper.appendChild(checkArea);
                
                // Now add the appropriate buttons
                if (question.type === 'choice') {
                    createChoiceButtons(question.choices);
                    } else {
                    createYesNoButtons();
                }
            }
            
            // Play audio instruction
            setTimeout(() => {
                const instructionAudioFile = getAudioFilename(currentQuestion, 'instruction');
                currentAudioFilename = instructionAudioFile;
                playAudio(instructionAudioFile);
            }, 500);
            
            // Enable interaction for hand questions
            if (question.type === 'hand' && p5Instance && question.p5config.interactionTarget) {
                p5Instance.setInteraction(true, question.p5config.interactionTarget);
            }
            
            // Start animation if needed
            if (question.p5config.animateHands && p5Instance) {
                p5Instance.startAnimation();
            }
            
        } catch (error) {
            console.error(`Error creating p5 instance for question ${currentQuestion}:`, error);
            p5Instance = null;
            feedbackArea.textContent = "Error loading interactive element.";
            feedbackArea.className = 'feedback feedback-incorrect';
        }
    }

    // Enable next button only for navigation between questions, not for indicating answers
    nextButton.disabled = false;
    
    // Show navigation buttons - this is a test, but we still need navigation
    prevButton.style.display = 'inline-flex'; 
    skipButton.style.display = 'inline-flex';
}

function createChoiceButtons(choices) {
    checkArea.innerHTML = '';
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'direction-buttons-wrapper'; // Use direction buttons wrapper for consistent styling
    
    choices.forEach(choice => {
        // Create container for each button (like in learn-it)
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'direction-btn-container';
        
        const button = document.createElement('button');
        button.id = `${choice.id}-btn`;
        button.className = 'direction-btn'; // Use direction button class for consistent styling
        button.innerHTML = choice.text; // Set text directly
        button.setAttribute('aria-label', choice.text);
        button.addEventListener('click', () => {
            handleAnswer(choice.id);
        });
        
        buttonContainer.appendChild(button);
        buttonsWrapper.appendChild(buttonContainer);
    });
    
    checkArea.appendChild(buttonsWrapper);
}

function createYesNoButtons() {
    checkArea.innerHTML = '';
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'direction-buttons-wrapper'; // Use direction buttons wrapper for consistent styling
    
    // Create Yes button with container
    const yesContainer = document.createElement('div');
    yesContainer.className = 'direction-btn-container';
    
    const yesButton = document.createElement('button');
    yesButton.id = 'yes-btn';
    yesButton.className = 'direction-btn'; // Use direction button class for consistent styling
    yesButton.innerHTML = '<i class="fas fa-check"></i>'; // Use icon for Yes
    yesButton.setAttribute('aria-label', 'Yes');
    yesButton.addEventListener('click', () => {
        handleAnswer('yes');
    });
    
    // Create No button with container
    const noContainer = document.createElement('div');
    noContainer.className = 'direction-btn-container';
    
    const noButton = document.createElement('button');
    noButton.id = 'no-btn';
    noButton.className = 'direction-btn'; // Use direction button class for consistent styling
    noButton.innerHTML = '<i class="fas fa-times"></i>'; // Use icon for No
    noButton.setAttribute('aria-label', 'No');
    noButton.addEventListener('click', () => {
        handleAnswer('no');
    });
    
    // Add buttons to containers and wrapper
    yesContainer.appendChild(yesButton);
    noContainer.appendChild(noButton);
    buttonsWrapper.appendChild(yesContainer);
    buttonsWrapper.appendChild(noContainer);
    
    checkArea.appendChild(buttonsWrapper);
}

function handleAnswer(answer) {
    if (currentQuestion < 0 || currentQuestion >= questions.length) return;
    
    const question = questions[currentQuestion];
    const isCorrect = (answer === question.correctAnswer);
    
    // Save the user's answer without showing feedback
    userAnswers[currentQuestion] = {
        question: currentQuestion,
        userAnswer: answer,
        isCorrect: isCorrect
    };
    
    // Update score
    if (isCorrect) {
        userScore++;
    }
    
    // Disable interaction - no visual feedback during test
    if (p5Instance && question.type === 'hand') {
        p5Instance.setInteraction(false, null);
    }
    
    // Mark selected button without showing if it's correct
    if (question.type === 'choice') {
        const hourBtn = document.getElementById('hour-btn');
        const minuteBtn = document.getElementById('minute-btn');
        
        if (answer === 'hour' && hourBtn) {
            hourBtn.style.backgroundColor = '#5240c9';
            hourBtn.style.color = 'white';
            minuteBtn.disabled = true;
            minuteBtn.style.opacity = '0.5';
        } else if (answer === 'minute' && minuteBtn) {
            minuteBtn.style.backgroundColor = '#5240c9';
            minuteBtn.style.color = 'white';
            hourBtn.disabled = true;
            hourBtn.style.opacity = '0.5';
        }
    } else if (question.type === 'yes-no') {
        const yesBtn = document.getElementById('yes-btn');
        const noBtn = document.getElementById('no-btn');
        
        if (answer === 'yes' && yesBtn) {
            yesBtn.style.backgroundColor = '#5240c9';
            yesBtn.style.color = 'white';
            noBtn.disabled = true;
            noBtn.style.opacity = '0.5';
        } else if (answer === 'no' && noBtn) {
            noBtn.style.backgroundColor = '#5240c9';
            noBtn.style.color = 'white';
            yesBtn.disabled = true;
            yesBtn.style.opacity = '0.5';
        }
    }
    
    // Move to next question automatically after a short delay
            setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
            loadQuestion(currentQuestion + 1);
        } else {
            showResults();
        }
    }, 1000);
}

function showResults() {
    console.log("Showing assessment results");
    
    // Remove p5 instance
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
    }
    
    // Switch to results-specific class that allows overflow
    const activityArea = document.querySelector('.activity-area');
    activityArea.classList.add('activity-area-results');
    
    // Hide question content
    document.getElementById('show-it-content').classList.add('hidden');
    
    // Show results
    resultsArea.classList.remove('hidden');
    resultsArea.style.width = '100%';
    
    // Display score
    const totalQuestions = questions.length;
    const scorePercent = Math.round((userScore / totalQuestions) * 100);
    const passed = userScore >= 3; // Pass threshold is 3 out of 4
    
    // Create a more professional, compact results display
    scoreDisplay.innerHTML = `
        <div class="results-card ${passed ? 'results-passed' : 'results-failed'}" style="
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 10px;
            border: 1px solid #e0e0e0;
            background-color: #fefefe;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        ">
            <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 1.4rem; text-align: center; color: #333333;">
                Assessment Complete
            </h2>
            
            <div style="display: flex; align-items: center; justify-content: center; gap: 30px; padding: 5px 0;">
                <div style="
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background-color: white;
                    border-radius: 50%;
                    width: 70px;
                    height: 70px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    border: 2px solid #6a4fed;
                ">
                    <span style="font-size: 1.5rem; font-weight: bold; color: #6a4fed;">${userScore}/${totalQuestions}</span>
                    <span style="font-size: 0.8rem; color: #666666;">${scorePercent}%</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 5px; align-items: flex-start;">
                    <div style="
                        display: inline-block;
                        font-weight: bold;
                        font-size: 1rem;
                        padding: 5px 15px;
                        border-radius: 4px;
                        background-color: ${passed ? 'rgba(40, 204, 113, 0.15)' : 'rgba(255, 202, 40, 0.15)'};
                        color: ${passed ? '#28cc71' : '#ffca28'};
                        border: 1px solid ${passed ? '#28cc71' : '#ffca28'};
                    ">
                        ${passed ? 'PASS' : 'NEEDS REVIEW'}
                    </div>
                    <div style="
                        font-size: 0.9rem;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        color: ${passed ? '#28cc71' : '#ffca28'};
                    ">
                        <i class="fas ${passed ? 'fa-trophy' : 'fa-info-circle'}"></i>
                        ${passed ? 'Clock Expert Badge Earned!' : 'More practice needed'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add a separate scrollable container for question review
    const reviewContainer = document.createElement('div');
    reviewContainer.style.cssText = `
        padding: 15px;
        background-color: #f9f9f9;
        border-radius: 8px;
        margin-bottom: 15px;
        border: 1px solid #e0e0e0;
        max-height: 300px;
        display: flex;
        flex-direction: column;
        position: relative;
        width: 100%;
        box-sizing: border-box;
    `;
    
    // Create header
    const reviewHeader = document.createElement('div');
    reviewHeader.style.cssText = `
        margin-bottom: 15px;
        flex-shrink: 0;
        position: sticky;
        top: 0;
        background-color: #f9f9f9;
        z-index: 10;
        padding-bottom: 5px;
        border-bottom: 1px solid #e0e0e0;
    `;
    reviewHeader.innerHTML = `
        <h3 style="margin: 0; color: #333333; font-size: 1.2rem;">Question Review</h3>
        ${passed ? '' : '<p style="color: #666666; font-size: 0.8rem; margin: 5px 0 0 0; font-style: italic;">Review these questions to improve your understanding</p>'}
    `;
    
    // Create scrollable content
    const questionList = document.createElement('div');
    questionList.style.cssText = `
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 10px;
        -webkit-overflow-scrolling: touch;
    `;
    
    // Add question cards
    questionList.innerHTML = userAnswers.map((answer, index) => {
        const question = questions[index];
        return `
        <div style="
            background-color: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            border-left: 3px solid ${answer.isCorrect ? '#28cc71' : '#ff5c5c'};
            margin-bottom: 12px;
        ">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background-color: #f5f5f5;
                border-bottom: 1px solid #eee;
            ">
                <span style="font-weight: bold; font-size: 0.9rem; color: #333333;">Q${index + 1}</span>
                <span style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    font-size: 0.8rem;
                    background-color: ${answer.isCorrect ? '#28cc71' : '#ff5c5c'};
                    color: white;
                ">
                    ${answer.isCorrect ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}
                </span>
            </div>
            
            <div style="padding: 12px;">
                <div style="font-weight: bold; margin-bottom: 8px; font-size: 0.95rem; color: #333333;">
                    ${question.title.replace(/^Question \d+: /, '')}
                </div>
                <div style="font-size: 0.85rem; color: #666666;">
                    <div style="margin-bottom: 4px;">
                        Your answer: <strong>${getAnswerText(answer.userAnswer, question.type)}</strong>
                    </div>
                    ${answer.isCorrect ? '' : 
                        `<div style="margin-bottom: 4px; color: #28cc71;">
                            Correct: <strong>${getAnswerText(question.correctAnswer, question.type)}</strong>
                        </div>`
                    }
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Assemble the review container
    reviewContainer.appendChild(reviewHeader);
    reviewContainer.appendChild(questionList);
    
    // Add the scroll hint
    const scrollHint = document.createElement('div');
    scrollHint.innerHTML = '<i class="fas fa-arrow-down"></i> Scroll to see all questions';
    scrollHint.style.cssText = `
        text-align: center;
        color: #666;
        font-size: 0.8rem;
        padding: 5px;
        background-color: rgba(255, 255, 255, 0.8);
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        border-top: 1px solid #eee;
    `;
    reviewContainer.appendChild(scrollHint);
    
    // Clear and update the score display with our scrollable container
    remediationMessage.innerHTML = '';
    remediationMessage.appendChild(reviewContainer);
    
    // Add remediation buttons if needed
    if (!passed) {
        const actionPrompt = document.createElement('div');
        actionPrompt.style.cssText = `
            text-align: center;
            padding: 15px;
            margin-top: 10px;
        `;
        
        actionPrompt.innerHTML = `
            <p style="margin-top: 0; color: #666666; font-size: 0.9rem;">Choose an option to continue:</p>
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 10px;">
                <button class="btn btn-secondary" onclick="window.location.href='learn-it.html'">
                    <i class="fas fa-book-open"></i> Review Lesson
                </button>
                <button class="btn btn-secondary" onclick="window.location.href='try-it.html'">
                    <i class="fas fa-dumbbell"></i> Practice More
                </button>
            </div>
        `;
        
        remediationMessage.appendChild(actionPrompt);
    }
    
    // Update navigation buttons
    const navigationButtons = document.querySelector('.navigation-buttons');
    navigationButtons.innerHTML = '';
    
    // Try Again button on left
    const tryAgainButton = document.createElement('button');
    tryAgainButton.className = 'btn btn-secondary';
    tryAgainButton.innerHTML = '<i class="fas fa-redo"></i> Try Again';
    tryAgainButton.addEventListener('click', () => {
        // Reset the quiz
        userScore = 0;
        userAnswers = [];
        
        // Hide results and remove results-specific class
        resultsArea.classList.add('hidden');
        activityArea.classList.remove('activity-area-results');
        
        // Load first question
        loadQuestion(0);
    });
    
    // Finish button on right
    const finishButton = document.createElement('button');
    finishButton.className = 'btn btn-primary';
    finishButton.innerHTML = '<i class="fas fa-flag-checkered"></i> Finish Lesson';
    finishButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Add buttons to navigation area
    navigationButtons.appendChild(tryAgainButton);
    navigationButtons.appendChild(finishButton);
    
    // Hide previous/skip buttons
    prevButton.style.display = 'none';
    skipButton.style.display = 'none';
}

// Helper function to get readable text for answers
function getAnswerText(answerValue, questionType) {
    if (questionType === 'hand') {
        return answerValue === 'hour' ? 'Hour Hand' : 'Minute Hand';
    } else if (questionType === 'yes-no') {
        return answerValue === 'yes' ? 'Yes' : 'No';
    }
    return answerValue;
}

// --- p5 sketch Function ---
function sketch(config) {
    return function(p) {
        // --- Local Sketch State ---
        let stepConfig = config;
        let localHighlightTarget = null;
        let localInteractionTarget = config.interactionTarget || null;
        let localInteractionEnabled = false;
        let localHandAnimationActive = config.animateHands || false;
        let localHandAngleOffset = 0;
        let localHoveredNumber = null;
        let localHoveredHand = null;
        let localHoveredArrow = null;
        let localClickFeedback = { number: null, hand: null, correct: null };
        let currentHour = config.initialTime ? config.initialTime.h : 10;
        let currentMinute = config.initialTime ? config.initialTime.m : 10;

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
            
            console.log(`Container size: ${containerWidth}x${containerHeight}, Canvas size: ${canvasSize}`);
            
            let canvas = p.createCanvas(canvasSize, canvasSize);
            canvas.parent('canvas-container');
            clockDiameter = canvasSize * 0.95;
            
            p.angleMode(p.DEGREES);
            p.textAlign(p.CENTER, p.CENTER);
            p.textFont('Arial');
            console.log(`p5 setup for question ${stepConfig.stepIndex}. Animation: ${localHandAnimationActive}`);
            if (!localHandAnimationActive) p.noLoop(); else p.loop();
            p.redraw();
        };

        // --- p5.js Draw ---
        p.draw = () => {
            p.background(bgColor);
            p.translate(p.width / 2, p.height / 2);
            drawClockFace(p);
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
                drawHand(p, 'minute', mAngle, minuteHandColor, minuteHandLength, minuteHandWidth, localHighlightTarget, localHoveredHand, localClickFeedback);
                drawHand(p, 'hour', hAngle, hourHandColor, hourHandLength, hourHandWidth, localHighlightTarget, localHoveredHand, localClickFeedback);
            }
             drawCenterDot(p);
        };

        // --- p5.js Event Handlers ---
        p.mouseMoved = () => {
            if (!localInteractionEnabled) return;
            
            let prevHoverNumber = localHoveredNumber;
            let prevHoverHand = localHoveredHand;
            localHoveredNumber = null;
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
                
                  let mAngle = p.map(currentMinute, 0, 60, 0, 360) - 90;
                  let hAngle = p.map(currentHour % 12 + currentMinute / 60, 0, 12, 0, 360) - 90;
                
                 if (checkHandHover('minute', mAngle, minuteHandLength)) {
                     localHoveredHand = 'minute';
                 } else if (checkHandHover('hour', hAngle, hourHandLength)) {
                      localHoveredHand = 'hour';
                 }
             }

            // Redraw if hover state changed
            if (prevHoverNumber !== localHoveredNumber || prevHoverHand !== localHoveredHand) {
                if (!localHandAnimationActive) p.redraw();
            }
            
            // Update cursor
            let cursorType = p.ARROW;
            if (localHoveredHand && localInteractionTarget?.type === 'hand') {
                 cursorType = p.HAND;
            }
            p.cursor(cursorType);
        };

        p.mousePressed = () => {
            if (!localInteractionEnabled) return;

            // Clear previous feedback
            if (feedbackArea.textContent) {
                 feedbackArea.textContent = '';
                 feedbackArea.className = 'feedback';
            }

            // Process hand click for hand questions
            if (localHoveredHand && localInteractionTarget?.type === 'hand') {
                console.log(`Clicked ${localHoveredHand} hand`);
                handleAnswer(localHoveredHand);
            }
        };

        // --- External Control Methods ---
        p.updateHighlight = (newTarget) => {
            if (JSON.stringify(localHighlightTarget) !== JSON.stringify(newTarget)) {
                localHighlightTarget = newTarget;
                if (!localHandAnimationActive) p.redraw();
            }
        };
        
        p.setInteraction = (enabled, target) => {
            if (localInteractionEnabled !== enabled || JSON.stringify(localInteractionTarget) !== JSON.stringify(target)) {
                 localInteractionEnabled = enabled;
                 localInteractionTarget = target || null;
                localClickFeedback = { number: null, hand: null, correct: null };
                 localHoveredNumber = null;
                 localHoveredHand = null;
                console.log(`p5 setInteraction for question ${stepConfig.stepIndex}. Enabled: ${enabled}, Target:`, localInteractionTarget);
                 if (!localHandAnimationActive) p.redraw();
             }
        };
        
        p.startAnimation = () => {
            if (!localHandAnimationActive) {
                localHandAnimationActive = true;
                console.log(`p5 startAnimation for question ${stepConfig.stepIndex}`);
                p.loop();
            }
        };
        
        p.stopAnimation = (setTime) => {
            if (localHandAnimationActive) {
                localHandAnimationActive = false;
                console.log(`p5 stopAnimation for question ${stepConfig.stepIndex}`);
                if (setTime) {
                   currentHour = setTime.h;
                   currentMinute = setTime.m;
                }
                p.noLoop();
                p.redraw();
            }
        };
        
        p.setClickFeedback = (hand, correct) => {
            localClickFeedback = { 
                number: null, 
                hand: hand, 
                correct: correct 
            };
            if (!localHandAnimationActive) p.redraw();
        };

        // --- Cleanup ---
        p.remove = () => {
            console.log(`Removing p5 instance for question ${stepConfig.stepIndex}.`);
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

function drawHand(p, handType, angle, color, lengthMultiplier, weight, highlightTarget, hoveredHand, clickFeedback) {
    p.push();
    p.rotate(angle);
    let finalWeight = weight;
    let finalColor = color;

    // Apply hover state
    if (hoveredHand === handType) {
        finalColor = highlightColor;
        finalWeight = weight + 2;
    }
    
    // Apply highlight state
    if (highlightTarget && highlightTarget.type === 'hand' && (highlightTarget.value === handType || highlightTarget.value === 'both')) {
        finalColor = highlightColor;
        finalWeight = weight + 4;
    }
    
    // Apply click feedback state
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

function drawHourNumbers(p, hoveredNumber, clickFeedback, highlightTarget, interactionTarget) {
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

        if (clickFeedback.number === i) {
            highlightFill = clickFeedback.correct ? correctColor : incorrectColor;
            isHighlighted = true;
        }
        else if (highlightTarget && highlightTarget.type === 'number' && highlightTarget.value === i) {
            highlightFill = highlightColor;
            isHighlighted = true;
        }
        else if (!isHighlighted && hoveredNumber === i && interactionTarget?.type === 'number') {
            highlightFill = highlightColor;
            isHighlighted = true;
        }

        if (isHighlighted && highlightFill) {
            p.fill(highlightFill);
            p.ellipse(x, y, clockDiameter * 0.18, clockDiameter * 0.18);
        }

        p.fill(numberColor);
        p.text(i, x, y);
    }
    p.textStyle(p.NORMAL);
}

// --- Utility function for hand hover ---
function distPointLine(x, y, x1, y1, x2, y2) {
  const L2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (L2 === 0) return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
  let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / L2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));
}

// --- DOMContentLoaded setup ---
document.addEventListener('DOMContentLoaded', () => {
    const footerAudioButton = document.getElementById('footer-audio-button');
    const startButton = document.getElementById('start-lesson-button');
    const skipButtonActual = document.getElementById('skip-button');
    const prevButtonActual = document.querySelector('.btn-prev-step');
    const nextButtonActual = document.getElementById('next-step-button');
    const professorImg = document.getElementById('professor-img');
    const showItContent = document.getElementById('show-it-content');
    const initialTitle = document.getElementById('initial-lesson-title');
    const initialIntro = document.getElementById('initial-lesson-intro');

    console.log("DOM Loaded.");

    // --- Start Button Listener ---
    if (startButton && nextButtonActual && professorImg && showItContent && initialTitle && initialIntro) {
        console.log("Attaching Start button listener.");
        startButton.addEventListener('click', () => {
            console.log("Start button clicked.");
            startButton.style.display = 'none'; 
            initialTitle.classList.add('hidden'); 
            initialIntro.classList.add('hidden'); 
            professorImg.classList.add('hidden');
            showItContent.classList.remove('hidden'); 
            
            // Show navigation buttons
            prevButtonActual.style.display = 'inline-flex';
            skipButtonActual.style.display = 'inline-flex'; 
            nextButtonActual.style.display = 'inline-flex';
            loadQuestion(0);
        });
        
        // Setup next button
        nextButtonActual.addEventListener('click', () => {
            if (nextButtonActual.disabled) return;
            
            stopAudio(true);
            
            // If results are showing, finish the lesson
            if (!resultsArea.classList.contains('hidden')) {
                window.location.href = 'index.html'; // Return to home/next lesson
                return;
            }
            
            // Move to next question
            if (currentQuestion < questions.length - 1) {
                loadQuestion(currentQuestion + 1);
            } else {
                showResults();
            }
        });
        
        // Setup previous button
        prevButtonActual.addEventListener('click', () => {
            if (currentQuestion > 0) {
                stopAudio(true);
                loadQuestion(currentQuestion - 1);
                } else {
                // If on first question, go back to intro
                showItContent.classList.add('hidden');
                resultsArea.classList.add('hidden');
                initialTitle.classList.remove('hidden');
                initialIntro.classList.remove('hidden');
                professorImg.classList.remove('hidden');
                startButton.style.display = 'inline-flex';
                prevButtonActual.style.display = 'none';
                skipButtonActual.style.display = 'none';
                nextButtonActual.style.display = 'none';
            }
        });
        
        // Setup skip button
         skipButtonActual.addEventListener('click', () => {
             stopAudio(true);
            // Skip to next question
            if (currentQuestion < questions.length - 1) {
                loadQuestion(currentQuestion + 1);
    } else {
                showResults();
            }
        });
        
        // Footer Audio Button Listener
    if (footerAudioButton) {
        console.log("Attaching Footer audio button listener.");
        footerAudioButton.addEventListener('click', () => {
            console.log("Footer audio button clicked.");
            console.log("Current audio filename to play:", currentAudioFilename);
            stopAudio(true);
            playAudio(currentAudioFilename);
        });
        }
    } else {
        console.error("One or more required elements not found!");
    }
}); 