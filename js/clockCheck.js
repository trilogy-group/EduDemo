/**
 * ClockNumberCheck - Interactive clock number learning module for children
 * Allows students to fill in missing numbers on a clock face
 */

// Configuration options that can be customized by implementers
const CONFIG = {
    // Anchor numbers that will always be displayed (generally the quarters and 1 & 12)
    anchorNumbers: [1, 12, 3, 6, 9],
    // Number of numbers to hide/test (1-3 recommended for young children)
    missingNumberCount: 3,
    // Animation durations
    animations: {
        correctFeedbackDuration: 1000,
        incorrectFeedbackDuration: 1500,
        completionDelay: 500
    },
    // Styling 
    colors: {
        clockFill: [250, 250, 250],
        activeBoxFill: [230, 242, 255],
        correctBoxFill: [235, 255, 235],
        emptyBoxFill: [250, 250, 250]
    }
};

/**
 * ClockActivity class - Manages the state and behavior of the clock activity
 */
class ClockActivity {
    constructor() {
        this.missingNumbers = [];
        this.correctAnswers = [];
        this.userAnswers = [];
        this.activeBoxIndex = -1;
        this.boxes = [];
        this.allCompleted = false;
        this.clockSize = 0;
        this.clockCenterX = 0;
        this.clockCenterY = 0;
        this.hintElement = null;
        
        // Initialize the activity
        this.setupMissingNumbers();
        this.setupEventListeners();
        this.createHintElement();
    }
    
    /**
     * Create a hint element for showing guidance
     */
    createHintElement() {
        this.hintElement = document.createElement('div');
        this.hintElement.className = 'hint-message';
        this.hintElement.style.display = 'none';
        this.hintElement.style.position = 'absolute';
        this.hintElement.style.top = '10px';
        this.hintElement.style.left = '0';
        this.hintElement.style.right = '0';
        this.hintElement.style.textAlign = 'center';
        this.hintElement.style.padding = '8px 15px';
        this.hintElement.style.backgroundColor = 'rgba(255, 240, 150, 0.9)';
        this.hintElement.style.borderRadius = '8px';
        this.hintElement.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
        this.hintElement.style.fontSize = '18px';
        this.hintElement.style.fontWeight = 'bold';
        this.hintElement.style.color = '#333';
        this.hintElement.style.zIndex = '1002';
        this.hintElement.style.maxWidth = '80%';
        this.hintElement.style.margin = '0 auto';
        
        const clockContainer = document.getElementById('clock-container');
        clockContainer.appendChild(this.hintElement);
    }
    
    /**
     * Set up which numbers will be missing from the clock
     * Ensures no adjacent numbers are both missing
     */
    setupMissingNumbers() {
        // Keep configured anchors
        const anchors = CONFIG.anchorNumbers;
        
        // Determine which numbers can be hidden
        const possibleMissing = [];
        for (let i = 1; i <= 12; i++) {
            if (!anchors.includes(i)) {
                possibleMissing.push(i);
            }
        }
        
        // Shuffle possible missing numbers
        this.shuffleArray(possibleMissing);
        
        // Select non-adjacent numbers
        const selected = [];
        for (let i = 0; i < possibleMissing.length && selected.length < CONFIG.missingNumberCount; i++) {
            const num = possibleMissing[i];
            
            // Check if this number is adjacent to any already selected number
            let isAdjacent = false;
            for (let j = 0; j < selected.length; j++) {
                const diff = Math.abs(num - selected[j]);
                if (diff === 1 || diff === 11) { // Adjacent on the clock (11 and 12 are adjacent)
                    isAdjacent = true;
                    break;
                }
            }
            
            if (!isAdjacent) {
                selected.push(num);
            }
        }
        
        this.missingNumbers = selected;
        this.correctAnswers = [...selected]; 
        this.userAnswers = new Array(selected.length).fill(null);
        
        return selected;
    }
    
    /**
     * Set up global document click listener to dismiss numpad when clicking elsewhere
     */
    setupEventListeners() {
        // Listener to close keypad when clicking outside
        document.addEventListener('click', (event) => {
            // If clicking on keypad or its children, do nothing
            if (event.target.closest('#number-keypad')) {
                return;
            }
            
            // If clicking on an input box, it will be handled by the canvas click handler
            // Check if we're clicking elsewhere, outside the active box
            const activeBoxElement = document.querySelector('.incorrect-box-highlight');
            if (!event.target.closest('#clock-container') && !activeBoxElement) {
                this.hideNumberKeypad();
                this.hideHint();
                this.activeBoxIndex = -1;
            }
        });
    }
    
    /**
     * Handle a click on the clock canvas
     * @param {number} mouseX - X position of click relative to canvas
     * @param {number} mouseY - Y position of click relative to canvas
     */
    handleClockClick(mouseX, mouseY) {
        if (this.allCompleted) return;
        
        // Check if clicked on an input box
        let clickedOnBox = false;
        if (this.boxes && this.boxes.length > 0) {
            for (let i = 0; i < this.boxes.length; i++) {
                const box = this.boxes[i];
                if (box) {
                    if (mouseX > box.x - box.size/2 && mouseX < box.x + box.size/2 &&
                        mouseY > box.y - box.size/2 && mouseY < box.y + box.size/2) {
                        // Box clicked, show number keypad
                        this.activeBoxIndex = i;
                        this.showNumberKeypad(box.x, box.y);
                        clickedOnBox = true;
                        return;
                    }
                }
            }
        }
        
        // If clicked elsewhere on the canvas, hide keypad and hint
        if (!clickedOnBox) {
            this.hideNumberKeypad();
            this.hideHint();
            this.activeBoxIndex = -1;
        }
    }
    
    /**
     * Show a hint for the current missing number
     * @param {number} missingNumber - The number that's currently missing
     */
    showHintForNumber(missingNumber) {
        // Find the numbers before and after the missing number
        const before = missingNumber === 1 ? 12 : missingNumber - 1;
        const after = missingNumber === 12 ? 1 : missingNumber + 1;
        
        // Check if before/after numbers are also missing
        const beforeIsMissing = this.missingNumbers.includes(before);
        const afterIsMissing = this.missingNumbers.includes(after);
        
        let hintText = '';
        
        // Create appropriate hint based on whether adjacent numbers are missing
        if (!beforeIsMissing && !afterIsMissing) {
            hintText = `What number comes between ${before} and ${after} on the clock?`;
        } else if (!beforeIsMissing) {
            hintText = `What number comes after ${before} on the clock?`;
        } else if (!afterIsMissing) {
            hintText = `What number comes before ${after} on the clock?`;
        } else {
            // This shouldn't happen with our non-adjacent rule, but just in case
            hintText = `Try to find the missing number here.`;
        }
        
        this.hintElement.textContent = hintText;
        this.hintElement.style.display = 'block';
    }
    
    /**
     * Hide the hint element
     */
    hideHint() {
        if (this.hintElement) {
            this.hintElement.style.display = 'none';
        }
    }
    
    /**
     * Show the number keypad near the clicked input box
     * @param {number} x - X position of the clicked box
     * @param {number} y - Y position of the clicked box
     */
    showNumberKeypad(x, y) {
        const keypad = document.getElementById('number-keypad');
        
        // First make keypad visible to get its dimensions
        keypad.style.opacity = '0';
        keypad.style.pointerEvents = 'none';
        keypad.style.display = 'grid';
        
        // Get the dimensions after it's visible
        const keypadRect = keypad.getBoundingClientRect();
        const clockContainer = document.getElementById('clock-container');
        const containerRect = clockContainer.getBoundingClientRect();
        
        // Calculate position - center horizontally below the box
        let keypadX = containerRect.left + x - (keypadRect.width / 2);
        let keypadY = containerRect.top + y + 20; // Position below the clicked point with some spacing
        
        // Ensure the keypad stays within the viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (keypadX < 0) keypadX = 10;
        if (keypadX + keypadRect.width > viewportWidth) keypadX = viewportWidth - keypadRect.width - 10;
        if (keypadY < 0) keypadY = 10;
        if (keypadY + keypadRect.height > viewportHeight) keypadY = containerRect.top + y - keypadRect.height - 20;
        
        // Apply the position
        keypad.style.position = 'fixed';
        keypad.style.left = keypadX + 'px';
        keypad.style.top = keypadY + 'px';
        keypad.style.opacity = '1';
        keypad.style.pointerEvents = 'auto';
        keypad.style.zIndex = '1000';
        
        // Set up event listeners for keypad buttons if they don't already have them
        const buttons = keypad.querySelectorAll('.keypad-button');
        buttons.forEach(button => {
            // Remove previous listeners to avoid duplicates
            button.removeEventListener('click', this.handleNumberInput);
            // Add the event listener with the correct context
            button.addEventListener('click', (e) => this.handleNumberInput(e));
        });
    }
    
    /**
     * Hide the number keypad
     */
    hideNumberKeypad() {
        const keypad = document.getElementById('number-keypad');
        keypad.style.display = 'none';
    }
    
    /**
     * Handle a number input from the keypad
     * @param {Event} event - Click event from keypad button
     */
    handleNumberInput(event) {
        const value = parseInt(event.target.getAttribute('data-value'), 10);
        
        if (this.activeBoxIndex !== -1) {
            // Get the correct answer for this position
            const correctAnswer = this.correctAnswers[this.activeBoxIndex];
            
            // Check if answer is correct
            if (value === correctAnswer) {
                // Correct answer
                this.userAnswers[this.activeBoxIndex] = value;
                this.hideHint();
                this.hideNumberKeypad();
            } else {
                // Incorrect answer - now show a helpful hint about which number is missing
                const boxValue = this.boxes[this.activeBoxIndex].value;
                this.showHintForNumber(boxValue);
                
                // Add a prefix to indicate it was wrong and style the hint as an error
                const originalHint = this.hintElement.textContent;
                this.hintElement.textContent = `That's not right. ${originalHint}`;
                this.hintElement.style.backgroundColor = 'rgba(255, 200, 200, 0.9)';
                
                // Return the hint to normal after a delay
                setTimeout(() => {
                    if (this.activeBoxIndex !== -1) {
                        this.hintElement.style.backgroundColor = 'rgba(255, 240, 150, 0.9)';
                    }
                }, 1500);
            }
        }
    }
    
    /**
     * Check if all boxes are completed with correct answers
     */
    checkCompletion() {
        if (this.allCompleted) return;
        
        // Check if all answers are provided and correct
        const allAnswered = this.userAnswers.every(answer => answer !== null);
        
        if (allAnswered) {
            this.allCompleted = true;
            this.hideHint();
            
            // Show completion message and enable next button after a short delay
            setTimeout(() => {
                this.showCompletionMessage();
                this.enableNextButton();
            }, CONFIG.animations.completionDelay);
        }
    }
    
    /**
     * Show completion success message
     */
    showCompletionMessage() {
        const instruction = document.querySelector('.instruction');
        instruction.textContent = "Perfect! All numbers accounted for. Now let's learn about the parts of the clock!";
        
        // Show the completion instruction box
        document.getElementById('completion-instruction').style.display = 'block';
        
        // Add a quick success animation to the clock
        const clockContainer = document.getElementById('clock-container');
        clockContainer.classList.add('success-animation');
    }
    
    /**
     * Enable the next button
     */
    enableNextButton() {
        const nextButton = document.getElementById('next-button');
        nextButton.disabled = false;
    }
    
    /**
     * Shuffle an array randomly (Fisher-Yates algorithm)
     * @param {Array} array - Array to shuffle
     * @returns {Array} - Shuffled array
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Create global instance of the activity
const clockActivity = new ClockActivity();

/**
 * p5.js clock drawing module
 */
const clockSketch = (p) => {
    p.setup = function() {
        // Create and position the canvas
        const container = document.getElementById('clock-container');
        const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
        canvas.parent('clock-container');
        
        // Set up the clock dimensions
        clockActivity.clockSize = Math.min(p.width, p.height) * 0.85;
        clockActivity.clockCenterX = p.width / 2;
        clockActivity.clockCenterY = p.height / 2;
        
        // Set angle mode to degrees for easier calculations
        p.angleMode(p.DEGREES);
        
        // Add click listener to canvas
        canvas.mousePressed(() => {
            clockActivity.handleClockClick(p.mouseX, p.mouseY);
        });
    };
    
    p.draw = function() {
        p.background(255);
        
        // Draw the clock face
        drawClockFace(p);
        
        // Draw clock hands showing 1:00
        drawClockHands(p);
        
        // Check if all answers are correct
        clockActivity.checkCompletion();
    };

    /**
     * Draw the clock face with numbers or input boxes
     * @param {p5} p - p5.js instance
     */
    function drawClockFace(p) {
        // Draw the outer circle
        p.stroke(70);
        p.strokeWeight(3);
        p.fill(...CONFIG.colors.clockFill);
        p.circle(clockActivity.clockCenterX, clockActivity.clockCenterY, clockActivity.clockSize);
        
        // Draw the center dot
        p.fill(70);
        p.noStroke();
        p.circle(clockActivity.clockCenterX, clockActivity.clockCenterY, 10);
        
        // Draw the hour ticks and numbers
        for (let i = 1; i <= 12; i++) {
            const angle = -90 + (i * 30); // Start at 12 o'clock (-90 degrees) and move 30 degrees per hour
            const tickLength = clockActivity.clockSize * 0.05;
            
            // Calculate positions
            const outerX = clockActivity.clockCenterX + (clockActivity.clockSize/2 - 5) * p.cos(angle);
            const outerY = clockActivity.clockCenterY + (clockActivity.clockSize/2 - 5) * p.sin(angle);
            const innerX = clockActivity.clockCenterX + (clockActivity.clockSize/2 - tickLength) * p.cos(angle);
            const innerY = clockActivity.clockCenterY + (clockActivity.clockSize/2 - tickLength) * p.sin(angle);
            
            // Draw tick marks
            p.stroke(70);
            p.strokeWeight(2);
            p.line(innerX, innerY, outerX, outerY);
            
            // Position for numbers (slightly inward from the ticks)
            const numX = clockActivity.clockCenterX + (clockActivity.clockSize * 0.4) * p.cos(angle);
            const numY = clockActivity.clockCenterY + (clockActivity.clockSize * 0.4) * p.sin(angle);
            
            // Check if this number should be an input box
            const missingIndex = clockActivity.missingNumbers.indexOf(i);
            if (missingIndex !== -1) {
                // Draw input box
                const boxSize = 40;
                p.stroke(100);
                p.strokeWeight(2);
                
                // Highlight active box or filled box
                if (clockActivity.activeBoxIndex === missingIndex) {
                    p.fill(...CONFIG.colors.activeBoxFill);
                } else if (clockActivity.userAnswers[missingIndex] !== null) {
                    p.fill(...CONFIG.colors.correctBoxFill);
                } else {
                    p.fill(...CONFIG.colors.emptyBoxFill);
                }
                
                p.rectMode(p.CENTER);
                p.rect(numX, numY, boxSize, boxSize, 8); // Rounded corners
                
                // If user has provided an answer, show it
                if (clockActivity.userAnswers[missingIndex] !== null) {
                    p.noStroke();
                    p.fill(0);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(20);
                    p.text(clockActivity.userAnswers[missingIndex], numX, numY);
                }
                
                // Store the box position for click detection
                if (!clockActivity.boxes) clockActivity.boxes = [];
                clockActivity.boxes[missingIndex] = {
                    x: numX,
                    y: numY,
                    size: boxSize,
                    value: i
                };
            } else {
                // Draw regular number
                p.noStroke();
                p.fill(0);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(20);
                p.text(i, numX, numY);
            }
        }
    }
    
    /**
     * Draw hour and minute hands for 1:00
     * @param {p5} p - p5.js instance
     */
    function drawClockHands(p) {
        // Hour hand (shorter and thicker)
        const hourAngle = -90 + (1 * 30); // 1 o'clock = 30 degrees from 12
        const hourHandLength = clockActivity.clockSize * 0.25;
        const hourHandWidth = 6;
        
        p.push();
        p.stroke(40, 40, 40);
        p.strokeWeight(hourHandWidth);
        p.strokeCap(p.ROUND);
        p.line(
            clockActivity.clockCenterX, 
            clockActivity.clockCenterY, 
            clockActivity.clockCenterX + hourHandLength * p.cos(hourAngle), 
            clockActivity.clockCenterY + hourHandLength * p.sin(hourAngle)
        );
        p.pop();
        
        // Minute hand (longer and thinner)
        const minuteAngle = -90; // 12 o'clock position (0 minutes)
        const minuteHandLength = clockActivity.clockSize * 0.35;
        const minuteHandWidth = 3;
        
        p.push();
        p.stroke(40, 40, 40);
        p.strokeWeight(minuteHandWidth);
        p.strokeCap(p.ROUND);
        p.line(
            clockActivity.clockCenterX, 
            clockActivity.clockCenterY, 
            clockActivity.clockCenterX + minuteHandLength * p.cos(minuteAngle), 
            clockActivity.clockCenterY + minuteHandLength * p.sin(minuteAngle)
        );
        p.pop();
        
        // Draw a center cap over the hands
        p.push();
        p.fill(40, 40, 40);
        p.noStroke();
        p.circle(clockActivity.clockCenterX, clockActivity.clockCenterY, 8);
        p.pop();
    }
};

// Initialize the p5 sketch
new p5(clockSketch); 