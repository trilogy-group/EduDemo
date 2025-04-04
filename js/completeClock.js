/**
 * Complete Clock Rendering
 * Shows a fully labeled clock face for the introduction page
 */

const clockSketch = (p) => {
    let clockSize;
    let clockCenterX;
    let clockCenterY;
    
    p.setup = function() {
        // Create and position the canvas
        const container = document.getElementById('clock-container');
        const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
        canvas.parent('clock-container');
        
        // Set up the clock dimensions
        clockSize = Math.min(p.width, p.height) * 0.85;
        clockCenterX = p.width / 2;
        clockCenterY = p.height / 2;
        
        // Set angle mode to degrees for easier calculations
        p.angleMode(p.DEGREES);
    };
    
    p.draw = function() {
        p.background(255);
        
        // Draw the clock face
        drawClockFace();
        
        // Draw clock hands showing 1:00
        drawClockHands();
    };

    // Draw a complete clock face with all numbers
    function drawClockFace() {
        // Draw the outer circle
        p.stroke(70);
        p.strokeWeight(3);
        p.fill(250, 250, 250);
        p.circle(clockCenterX, clockCenterY, clockSize);
        
        // Draw the center dot
        p.fill(70);
        p.noStroke();
        p.circle(clockCenterX, clockCenterY, 10);
        
        // Draw the hour ticks and numbers
        for (let i = 1; i <= 12; i++) {
            const angle = -90 + (i * 30); // Start at 12 o'clock (-90 degrees) and move 30 degrees per hour
            const tickLength = clockSize * 0.05;
            
            // Calculate positions
            const outerX = clockCenterX + (clockSize/2 - 5) * p.cos(angle);
            const outerY = clockCenterY + (clockSize/2 - 5) * p.sin(angle);
            const innerX = clockCenterX + (clockSize/2 - tickLength) * p.cos(angle);
            const innerY = clockCenterY + (clockSize/2 - tickLength) * p.sin(angle);
            
            // Draw tick marks
            p.stroke(70);
            p.strokeWeight(2);
            p.line(innerX, innerY, outerX, outerY);
            
            // Position for numbers (slightly inward from the ticks)
            const numX = clockCenterX + (clockSize * 0.4) * p.cos(angle);
            const numY = clockCenterY + (clockSize * 0.4) * p.sin(angle);
            
            // Draw all numbers (no missing numbers in this view)
            p.noStroke();
            p.fill(0);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(20);
            p.text(i, numX, numY);
        }
    }
    
    // Draw hour and minute hands for 1:00
    function drawClockHands() {
        // Hour hand (shorter and thicker)
        const hourAngle = -90 + (1 * 30); // 1 o'clock = 30 degrees from 12
        const hourHandLength = clockSize * 0.25;
        const hourHandWidth = 6;
        
        p.push();
        p.stroke(40, 40, 40);
        p.strokeWeight(hourHandWidth);
        p.strokeCap(p.ROUND);
        p.line(
            clockCenterX, 
            clockCenterY, 
            clockCenterX + hourHandLength * p.cos(hourAngle), 
            clockCenterY + hourHandLength * p.sin(hourAngle)
        );
        p.pop();
        
        // Minute hand (longer and thinner)
        const minuteAngle = -90; // 12 o'clock position (0 minutes)
        const minuteHandLength = clockSize * 0.35;
        const minuteHandWidth = 3;
        
        p.push();
        p.stroke(40, 40, 40);
        p.strokeWeight(minuteHandWidth);
        p.strokeCap(p.ROUND);
        p.line(
            clockCenterX, 
            clockCenterY, 
            clockCenterX + minuteHandLength * p.cos(minuteAngle), 
            clockCenterY + minuteHandLength * p.sin(minuteAngle)
        );
        p.pop();
        
        // Draw a center cap over the hands
        p.push();
        p.fill(40, 40, 40);
        p.noStroke();
        p.circle(clockCenterX, clockCenterY, 8);
        p.pop();
    }
};

// Initialize the p5 sketch
new p5(clockSketch); 