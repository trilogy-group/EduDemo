/*
 * Lesson Data for "Meet the Clock" - Lesson 1
 * Contains all the steps, states, and content for the lesson
 */

// Global glossary of terms introduced in this lesson
const glossary = {
    "Clock Face": "The round part of a clock where the numbers and hands are located.",
    "Hour Hand": "The short hand on a clock that shows the hour.",
    "Minute Hand": "The long hand on a clock that shows the minutes.",
    "Clockwise": "The direction that clock hands move, going from left to right in a circle, passing through 1, 2, 3..."
};

// Lesson steps - each step represents a distinct part of the lesson
const lessonSteps = [
    // Warm-up: "Clock Number Check"
    {
        id: "warmup",
        title: "Warm-up: Clock Number Check",
        instruction: "Welcome, time explorers! Let's quickly check this clock. A few numbers are missing! Can you type the correct number in each empty box?",
        taskDescription: "Fill in the missing numbers on the clock face.",
        state: {
            type: "number-input",
            missingNumbers: [2, 5, 11], // These numbers will be missing
            correctAnswers: {
                "input-2": 2,
                "input-5": 5,
                "input-11": 11
            },
            showKeypad: true
        }
    },
    
    // Learn It - Chunk 1: The Face & Numbers
    {
        id: "learn-face",
        title: "Learn It: Clock Parts Explorer - The Face",
        instruction: "This is a clock face! It helps us tell time. Look at the numbers. They go in order all the way around, starting from 1, then 2, 3... up to 12 at the very top.",
        taskDescription: "Watch how the numbers go around the clock face.",
        state: {
            type: "animation",
            highlightNumbers: true, // Sequentially highlight numbers 1-12
            highlightClockFace: true,
            addToGlossary: ["Clock Face"]
        }
    },
    
    // Embedded Check for Chunk 1
    {
        id: "check-face",
        title: "Quick Check",
        instruction: "Quick check! The numbers go in order. Click the number that comes right after the number 8.",
        taskDescription: "Click the number that comes after 8.",
        state: {
            type: "click-target",
            correctTarget: 9, // The number to click
            feedback: {
                correct: "Correct! The numbers go in order: 7, 8, 9...",
                incorrect: "Think about counting! What number comes after 8? Find it on the clock face and click it."
            }
        }
    },
    
    // Learn It - Chunk 2: The Hands
    {
        id: "learn-hands",
        title: "Learn It: Clock Parts Explorer - The Hands",
        instruction: "See these pointers? They are called hands! This short, blue hand is the Hour Hand. It tells us the hour.",
        taskDescription: "Look at the hour hand (the short, blue one).",
        state: {
            type: "animation",
            highlightHourHand: true,
            hourHandColor: "#5c6ac4", // Blue
            minuteHandColor: "#ff6b6b", // Red
            clockTime: { hour: 3, minute: 0 }, // 3:00
            addToGlossary: ["Hour Hand"]
        }
    },
    
    // Learn It - Chunk 2 continued
    {
        id: "learn-hands-2",
        title: "Learn It: Clock Parts Explorer - The Hands",
        instruction: "This long, red hand is the Minute Hand. It tells us the minutes.",
        taskDescription: "Look at the minute hand (the long, red one).",
        state: {
            type: "animation",
            highlightMinuteHand: true,
            hourHandColor: "#5c6ac4", // Blue
            minuteHandColor: "#ff6b6b", // Red
            clockTime: { hour: 3, minute: 0 }, // 3:00
            addToGlossary: ["Minute Hand"]
        }
    },
    
    // Learn It - Chunk 2 continued
    {
        id: "learn-hands-3",
        title: "Learn It: Clock Parts Explorer - The Hands",
        instruction: "Easy way to remember: Hour hand is short, Minute hand is long!",
        taskDescription: "Remember: Hour hand = short, Minute hand = long.",
        state: {
            type: "animation",
            showHandComparison: true,
            hourHandColor: "#5c6ac4", // Blue
            minuteHandColor: "#ff6b6b", // Red
            clockTime: { hour: 3, minute: 0 } // 3:00
        }
    },
    
    // Embedded Check for Hour Hand
    {
        id: "check-hour-hand",
        title: "Quick Check",
        instruction: "Click on the Hour Hand (the short one).",
        taskDescription: "Click the Hour Hand (the short hand).",
        state: {
            type: "click-hand",
            correctHand: "hour",
            hourHandColor: "#5c6ac4", // Blue
            minuteHandColor: "#ff6b6b", // Red
            clockTime: { hour: 3, minute: 0 }, // 3:00
            feedback: {
                correct: "Correct! The hour hand is the short one.",
                incorrect: "Oops! Remember, the hour hand is the short one. Click the short hand."
            }
        }
    },
    
    // Embedded Check for Minute Hand
    {
        id: "check-minute-hand",
        title: "Quick Check",
        instruction: "Now, click on the Minute Hand (the long one).",
        taskDescription: "Click the Minute Hand (the long hand).",
        state: {
            type: "click-hand",
            correctHand: "minute",
            hourHandColor: "#5c6ac4", // Blue
            minuteHandColor: "#ff6b6b", // Red
            clockTime: { hour: 3, minute: 0 }, // 3:00
            feedback: {
                correct: "Correct! The minute hand is the long one.",
                incorrect: "Careful! The minute hand is the long one. Click the long hand."
            }
        }
    },
    
    // Learn It - Chunk 3: Clockwise Direction
    {
        id: "learn-direction",
        title: "Learn It: Clock Parts Explorer - Clockwise Direction",
        instruction: "Watch how the hands move! They always go around in the same direction, past 1, 2, 3... This special direction is called Clockwise.",
        taskDescription: "Watch the hands move in the clockwise direction.",
        state: {
            type: "animation",
            showClockwiseMotion: true,
            showClockwiseArrow: true,
            hourHandColor: "#5c6ac4", // Blue
            minuteHandColor: "#ff6b6b", // Red
            addToGlossary: ["Clockwise"]
        }
    },
    
    // Embedded Check for Clockwise Direction
    {
        id: "check-direction",
        title: "Quick Check",
        instruction: "Which arrow shows the clockwise direction?",
        taskDescription: "Click the arrow that shows clockwise direction.",
        state: {
            type: "click-arrow",
            showClockwiseArrow: true,
            showCounterClockwiseArrow: true,
            correctArrow: "clockwise",
            feedback: {
                correct: "Correct! That's the clockwise direction.",
                incorrect: "Clockwise follows the numbers 1, 2, 3... Try again!"
            }
        }
    },
    
    // Try It: Hand Spotting - Hour Hand
    {
        id: "try-hour-hand",
        title: "Try It: Guided Hand Spotting",
        instruction: "Find the Hour Hand. Remember, it's the short one. Click it!",
        taskDescription: "Click on the Hour Hand (the short one).",
        state: {
            type: "click-hand",
            correctHand: "hour",
            hourHandColor: "#5c6ac4", // Blue
            minuteHandColor: "#ff6b6b", // Red
            clockTime: { hour: 6, minute: 0 }, // 6:00
            feedback: {
                correct: "You got it! That's the short hour hand.",
                incorrect: "Hmm, that's the long hand. The hour hand is the shorter one. Click the short hand."
            }
        }
    },
    
    // Try It: Hand Spotting - Minute Hand
    {
        id: "try-minute-hand",
        title: "Try It: Guided Hand Spotting",
        instruction: "Now, find the Minute Hand. It's the long one. Click it!",
        taskDescription: "Click on the Minute Hand (the long one).",
        state: {
            type: "click-hand",
            correctHand: "minute",
            hourHandColor: "#5c6ac4", // Blue
            minuteHandColor: "#ff6b6b", // Red
            clockTime: { hour: 9, minute: 0 }, // 9:00
            feedback: {
                correct: "Perfect! That's the long minute hand.",
                incorrect: "That's the hour hand (short one). The minute hand is the longer one. Click the long hand."
            }
        }
    },
    
    // Try It: Direction
    {
        id: "try-direction",
        title: "Try It: Guided Hand Spotting",
        instruction: "Are these hands moving Clockwise? Click Yes or No.",
        taskDescription: "Determine if the hands are moving clockwise.",
        state: {
            type: "yes-no",
            showClockwiseMotion: true,
            correctAnswer: "yes",
            feedback: {
                correct: "Correct! They are moving clockwise.",
                incorrect: "Look closely! They are following the numbers 1, 2, 3... That is clockwise."
            }
        }
    },
    
    // Try It: Direction with Arrow
    {
        id: "try-direction-arrow",
        title: "Try It: Guided Hand Spotting",
        instruction: "Which way is clockwise? Drag the arrow around the clock in the clockwise direction.",
        taskDescription: "Drag the arrow to show the clockwise direction.",
        state: {
            type: "drag-arrow",
            correctDirection: "clockwise",
            feedback: {
                correct: "Perfect! That's clockwise!",
                incorrect: "Not quite. Remember, clockwise follows the numbers around..."
            }
        }
    }
];

// Current state of the lesson
let currentStepIndex = 0;
let lessonProgress = {
    completedSteps: [],
    currentScore: 0,
    maxScore: lessonSteps.length
};

// Function to get the current step
function getCurrentStep() {
    return lessonSteps[currentStepIndex];
}

// Function to advance to the next step
function goToNextStep() {
    if (currentStepIndex < lessonSteps.length - 1) {
        currentStepIndex++;
        return true;
    }
    return false; // No more steps
}

// Function to go back to the previous step
function goToPreviousStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        return true;
    }
    return false; // Already at the first step
}

// Function to mark the current step as completed
function completeCurrentStep() {
    const currentStep = getCurrentStep();
    if (!lessonProgress.completedSteps.includes(currentStep.id)) {
        lessonProgress.completedSteps.push(currentStep.id);
        lessonProgress.currentScore++;
    }
} 