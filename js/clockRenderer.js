/*
 * Clock Renderer using p5.js
 * Handles all visual rendering for the clock and interactions
 */

let clockWidth = 250;  // Default size, will be adjusted based on canvas size
let clockCenterX;      // Center X position of the clock
let clockCenterY;      // Center Y position of the clock
let hourHandLength;    // Length of the hour hand
let minuteHandLength;  // Length of the minute hand
let numberRadius;      // Distance of numbers from center
let isClockInitialized = false;

// Animation variables
let animationInProgress = false;
let animationStartTime = 0;
let animationDuration = 1000; // milliseconds
let numberHighlightIndex = 0;
let numberHighlightInterval;
let clockwiseAnimationAngle = 0;

// Clock state
let clockState = {
    hour: 3,
    minute: 0,
    hourHandHighlighted: false,
    minuteHandHighlighted: false,
    clockFaceHighlighted: false,
    hourHandColor: "#5c6ac4", // Default blue
    minuteHandColor: "#ff6b6b", // Default red
    showClockwiseArrow: false,
    showCounterClockwiseArrow: false,
    showClockwiseMotion: false,
    showHandComparison: false
};

// Interactive elements
let clockElements = {
    hourHand: { x1: 0, y1: 0, x2: 0, y2: 0, width: 8 },
    minuteHand: { x1: 0, y1: 0, x2: 0, y2: 0, width: 4 },
    numbers: [],
    clockwiseArrow: { x: 0, y: 0, radius: 0 },
    counterClockwiseArrow: { x: 0, y: 0, radius: 0 }
};

// p5.js setup function
function setup() {
    // Create canvas that fills the container
    const container = document.getElementById('canvas-container');
    const canvas = createCanvas(container.offsetWidth, 400);
    canvas.parent('canvas-container');
    
    // Initialize clock
    initializeClock();
    
    // Set text settings
    textAlign(CENTER, CENTER);
    textSize(24);
    
    // Set animation mode
    angleMode(DEGREES);
}

// p5.js draw function - called continuously
function draw() {
    background(240, 246, 255); // Light blue background matching the app
    
    // Draw the clock
    drawClock();
    
    // Handle animations if needed
    if (clockState.showClockwiseMotion) {
        animateClockwiseMotion();
    }
    
    if (clockState.showHandComparison) {
        drawHandComparison();
    }
}

// Initialize clock sizes and positions
function initializeClock() {
    // Calculate dimensions based on canvas size
    clockCenterX = width / 2;
    clockCenterY = height / 2;
    clockWidth = min(width * 0.7, height * 0.7);
    
    // Set hand lengths
    hourHandLength = clockWidth * 0.25;
    minuteHandLength = clockWidth * 0.35;
    
    // Set number positions
    numberRadius = clockWidth * 0.4;
    calculateNumberPositions();
    
    // Set arrow positions
    clockElements.clockwiseArrow.x = clockCenterX + clockWidth * 0.25;
    clockElements.clockwiseArrow.y = clockCenterY - clockWidth * 0.25;
    clockElements.clockwiseArrow.radius = clockWidth * 0.1;
    
    clockElements.counterClockwiseArrow.x = clockCenterX - clockWidth * 0.25;
    clockElements.counterClockwiseArrow.y = clockCenterY - clockWidth * 0.25;
    clockElements.counterClockwiseArrow.radius = clockWidth * 0.1;
    
    isClockInitialized = true;
}

// Calculate positions of all 12 numbers
function calculateNumberPositions() {
    clockElements.numbers = [];
    
    for (let i = 1; i <= 12; i++) {
        // Calculate angle (in degrees) - 12 at top, then clockwise
        let angle = map(i, 1, 12, 30, 360);
        
        // Convert to radians for sin/cos
        let radians = radians(angle);
        
        // Calculate position
        let x = clockCenterX + numberRadius * sin(angle);
        let y = clockCenterY - numberRadius * cos(angle);
        
        // Store number data
        clockElements.numbers.push({
            number: i,
            x: x,
            y: y,
            highlighted: false,
            visible: true
        });
    }
}

// Draw the clock face and all elements
function drawClock() {
    push();
    
    // Draw clock face background
    fill(255);
    if (clockState.clockFaceHighlighted) {
        stroke(106, 79, 237, 200);
        strokeWeight(3);
    } else {
        stroke(240, 198, 116);
        strokeWeight(10);
    }
    
    ellipse(clockCenterX, clockCenterY, clockWidth, clockWidth);
    
    // Draw center dot
    fill(50);
    noStroke();
    ellipse(clockCenterX, clockCenterY, 10, 10);
    
    // Draw numbers
    textSize(24);
    for (let i = 0; i < clockElements.numbers.length; i++) {
        const numObj = clockElements.numbers[i];
        
        if (numObj.visible) {
            if (numObj.highlighted) {
                fill(106, 79, 237); // Purple for highlighted
                textSize(28);
            } else {
                fill(51);
                textSize(24);
            }
            text(numObj.number, numObj.x, numObj.y);
        } else {
            // Draw input box for missing numbers
            stroke(200);
            fill(255);
            rectMode(CENTER);
            rect(numObj.x, numObj.y, 40, 40, 8);
        }
    }
    
    // Calculate hand positions based on current time
    updateHandPositions();
    
    // Draw hour hand
    stroke(clockState.hourHandColor);
    strokeWeight(clockElements.hourHand.width);
    if (clockState.hourHandHighlighted) {
        strokeWeight(clockElements.hourHand.width + 4);
        stroke(lerpColor(color(clockState.hourHandColor), color(255), 0.3));
    }
    line(clockElements.hourHand.x1, clockElements.hourHand.y1, 
         clockElements.hourHand.x2, clockElements.hourHand.y2);
    
    // Draw minute hand
    stroke(clockState.minuteHandColor);
    strokeWeight(clockElements.minuteHand.width);
    if (clockState.minuteHandHighlighted) {
        strokeWeight(clockElements.minuteHand.width + 4);
        stroke(lerpColor(color(clockState.minuteHandColor), color(255), 0.3));
    }
    line(clockElements.minuteHand.x1, clockElements.minuteHand.y1, 
         clockElements.minuteHand.x2, clockElements.minuteHand.y2);
    
    // Draw clockwise arrow if needed
    if (clockState.showClockwiseArrow) {
        drawArrow(clockElements.clockwiseArrow.x, clockElements.clockwiseArrow.y, 
                 clockElements.clockwiseArrow.radius, true);
    }
    
    // Draw counter-clockwise arrow if needed
    if (clockState.showCounterClockwiseArrow) {
        drawArrow(clockElements.counterClockwiseArrow.x, clockElements.counterClockwiseArrow.y, 
                 clockElements.counterClockwiseArrow.radius, false);
    }
    
    pop();
}

// Update positions of hour and minute hands based on time
function updateHandPositions() {
    // Hour hand
    let hourAngle = map(clockState.hour % 12 + clockState.minute / 60, 0, 12, 0, 360) - 90;
    clockElements.hourHand.x1 = clockCenterX;
    clockElements.hourHand.y1 = clockCenterY;
    clockElements.hourHand.x2 = clockCenterX + hourHandLength * cos(hourAngle);
    clockElements.hourHand.y2 = clockCenterY + hourHandLength * sin(hourAngle);
    
    // Minute hand
    let minuteAngle = map(clockState.minute, 0, 60, 0, 360) - 90;
    clockElements.minuteHand.x1 = clockCenterX;
    clockElements.minuteHand.y1 = clockCenterY;
    clockElements.minuteHand.x2 = clockCenterX + minuteHandLength * cos(minuteAngle);
    clockElements.minuteHand.y2 = clockCenterY + minuteHandLength * sin(minuteAngle);
}

// Draw an arrow (clockwise or counter-clockwise)
function drawArrow(x, y, radius, isClockwise) {
    push();
    translate(x, y);
    
    // Arrow settings
    let arrowColor = color(106, 79, 237); // Purple
    if (!isClockwise) {
        arrowColor = color(255, 107, 107); // Red
    }
    
    // Draw arrow
    fill(arrowColor);
    noStroke();
    
    // Draw arrow body (arc)
    beginShape();
    let startAngle = isClockwise ? 0 : 180;
    let endAngle = isClockwise ? 270 : 90;
    
    // Create arc points
    for (let angle = startAngle; angle <= endAngle; angle += 5) {
        let radian = radians(angle);
        let xPos = radius * cos(radian);
        let yPos = radius * sin(radian);
        vertex(xPos, yPos);
    }
    endShape();
    
    // Draw arrowhead
    translate(isClockwise ? 0 : 0, isClockwise ? radius : -radius);
    rotate(isClockwise ? 90 : -90);
    
    triangle(0, -10, -7, 5, 7, 5);
    
    pop();
}

// Animation for highlighting numbers sequentially
function startNumberHighlightAnimation() {
    // Clear any existing interval
    if (numberHighlightInterval) {
        clearInterval(numberHighlightInterval);
    }
    
    // Reset all number highlights
    resetNumberHighlights();
    
    // Start new interval
    numberHighlightIndex = 0;
    numberHighlightInterval = setInterval(() => {
        // Reset previous highlight
        if (numberHighlightIndex > 0) {
            clockElements.numbers[numberHighlightIndex - 1].highlighted = false;
        } else if (numberHighlightIndex === 0) {
            clockElements.numbers[11].highlighted = false; // Last number (12)
        }
        
        // Highlight current number
        clockElements.numbers[numberHighlightIndex].highlighted = true;
        
        // Move to next number
        numberHighlightIndex = (numberHighlightIndex + 1) % 12;
        
        // Stop after one full cycle
        if (numberHighlightIndex === 0) {
            clearInterval(numberHighlightInterval);
            numberHighlightInterval = null;
            setTimeout(resetNumberHighlights, 500);
        }
    }, 500); // 500ms delay between highlights
}

// Reset all number highlights
function resetNumberHighlights() {
    for (let i = 0; i < clockElements.numbers.length; i++) {
        clockElements.numbers[i].highlighted = false;
    }
}

// Animate clockwise motion
function animateClockwiseMotion() {
    // Update clock time to show motion
    clockwiseAnimationAngle += 0.5;
    if (clockwiseAnimationAngle >= 360) {
        clockwiseAnimationAngle = 0;
    }
    
    // Convert animation angle to clock time
    clockState.minute = Math.floor(map(clockwiseAnimationAngle, 0, 360, 0, 60));
    clockState.hour = Math.floor(map(clockwiseAnimationAngle, 0, 360, 0, 12));
}

// Draw hand comparison explanation
function drawHandComparison() {
    push();
    textSize(18);
    fill(51);
    
    // Labels for hands
    text("Hour Hand (Short)", clockCenterX - 100, clockCenterY + clockWidth * 0.45);
    text("Minute Hand (Long)", clockCenterX + 100, clockCenterY + clockWidth * 0.45);
    
    // Draw arrows pointing to hands
    stroke(51);
    strokeWeight(2);
    
    // Arrow to hour hand
    line(clockCenterX - 100, clockCenterY + clockWidth * 0.4,
         clockElements.hourHand.x2 - 20, clockElements.hourHand.y2 - 20);
         
    // Arrow to minute hand
    line(clockCenterX + 100, clockCenterY + clockWidth * 0.4,
         clockElements.minuteHand.x2 + 20, clockElements.minuteHand.y2 - 20);
    
    pop();
}

// Apply state changes from lesson steps
function updateClockState(newState) {
    // Apply the new state properties to current state
    if (newState.clockTime) {
        clockState.hour = newState.clockTime.hour;
        clockState.minute = newState.clockTime.minute;
    }
    
    if (newState.hourHandColor) {
        clockState.hourHandColor = newState.hourHandColor;
    }
    
    if (newState.minuteHandColor) {
        clockState.minuteHandColor = newState.minuteHandColor;
    }
    
    // Update highlight states
    clockState.hourHandHighlighted = !!newState.highlightHourHand;
    clockState.minuteHandHighlighted = !!newState.highlightMinuteHand;
    clockState.clockFaceHighlighted = !!newState.highlightClockFace;
    
    // Update arrow visibility
    clockState.showClockwiseArrow = !!newState.showClockwiseArrow;
    clockState.showCounterClockwiseArrow = !!newState.showCounterClockwiseArrow;
    
    // Update animation states
    clockState.showClockwiseMotion = !!newState.showClockwiseMotion;
    clockState.showHandComparison = !!newState.showHandComparison;
    
    // Start number animation if requested
    if (newState.highlightNumbers) {
        startNumberHighlightAnimation();
    }
    
    // Handle missing numbers for the warmup
    if (newState.missingNumbers) {
        for (let i = 0; i < clockElements.numbers.length; i++) {
            if (newState.missingNumbers.includes(clockElements.numbers[i].number)) {
                clockElements.numbers[i].visible = false;
            } else {
                clockElements.numbers[i].visible = true;
            }
        }
    } else {
        // Make all numbers visible
        for (let i = 0; i < clockElements.numbers.length; i++) {
            clockElements.numbers[i].visible = true;
        }
    }
}

// Handle user interaction with the clock
function isMouseOverHourHand() {
    // Calculate distance from mouse to hour hand line
    return distToSegment(mouseX, mouseY, 
                        clockElements.hourHand.x1, clockElements.hourHand.y1,
                        clockElements.hourHand.x2, clockElements.hourHand.y2) < 15;
}

function isMouseOverMinuteHand() {
    // Calculate distance from mouse to minute hand line
    return distToSegment(mouseX, mouseY, 
                        clockElements.minuteHand.x1, clockElements.minuteHand.y1,
                        clockElements.minuteHand.x2, clockElements.minuteHand.y2) < 15;
}

function isMouseOverNumber(num) {
    // Find the number object
    const numObj = clockElements.numbers.find(n => n.number === num);
    if (!numObj) return false;
    
    // Check if mouse is over the number
    return dist(mouseX, mouseY, numObj.x, numObj.y) < 20;
}

function isMouseOverClockwiseArrow() {
    return dist(mouseX, mouseY, 
               clockElements.clockwiseArrow.x, clockElements.clockwiseArrow.y) < 
               clockElements.clockwiseArrow.radius + 15;
}

function isMouseOverCounterClockwiseArrow() {
    return dist(mouseX, mouseY, 
               clockElements.counterClockwiseArrow.x, clockElements.counterClockwiseArrow.y) < 
               clockElements.counterClockwiseArrow.radius + 15;
}

// Helper function to calculate distance from point to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = dist(x1, y1, x2, y2) * dist(x1, y1, x2, y2);
    if (l2 === 0) return dist(px, py, x1, y1);
    
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    
    return dist(px, py, projX, projY);
}

// Window resize handler
function windowResized() {
    const container = document.getElementById('canvas-container');
    resizeCanvas(container.offsetWidth, 400);
    
    // Reinitialize clock with new dimensions
    initializeClock();
} 