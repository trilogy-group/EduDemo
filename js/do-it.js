<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Do It: Clock Practice</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="lesson-container">
        <header class="lesson-header">
            <div class="header-left">
                 <img src="img/professor_tempo.png" alt="Professor Tempo" class="header-icon professor-icon">
                 <span class="header-title">TI Education</span>
            </div>
            <div class="header-right">
                <span class="user-name">Jimmy</span>
                <div class="avatar-initial">J</div>
            </div>
        </header>

        <div class="lesson-progress-area">
             <div class="lesson-info">
                 <h1 class="lesson-title" id="do-it-page-title">Time - Lesson 1: Meet the Clock!</h1>
                 <span class="lesson-counter" id="do-it-step-counter">Step 4 of 5: Do It</span>
             </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 60%;"></div>
            </div>
        </div>

        <main class="lesson-main">
            <div class="activity-area">
                 <div id="do-it-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
                     <h2 id="do-it-question-title">Question 1</h2>
                     <p class="instruction" id="do-it-instruction">Question text will appear here.</p>
                     <div id="canvas-container" class="clock-container" style="min-height: 250px; width: 90%; max-width: 400px; flex-grow: 1; display:flex; justify-content:center; align-items:center;">
                     </div>
                     <div id="embedded-check-area" style="margin-top: 15px; min-height: 50px;">
                     </div>
                 </div>
            </div>

            <div id="feedback-area" class="feedback"></div>

            <div class="navigation-buttons">
                <button class="btn btn-prev-step" id="prev-button"><i class="fas fa-arrow-left"></i> Previous</button>
                <button class="btn btn-primary btn-next-step" id="next-button" disabled><i class="fas fa-arrow-right"></i> Next</button>
            </div>
        </main>

        <footer class="lesson-footer">
            <div class="step-indicators">
                <button class="step-indicator completed" onclick="window.location.href='warm-up.html'"><i class="fas fa-check"></i> Warm-up</button>
                <button class="step-indicator completed" onclick="window.location.href='learn-it.html'"><i class="fas fa-check"></i> Learn It</button>
                <button class="step-indicator completed" onclick="window.location.href='try-it.html'"><i class="fas fa-check"></i> Try It</button>
                <button class="step-indicator active"><i class="fas fa-pencil-alt"></i> Do It</button>
                <button class="step-indicator locked"><i class="fas fa-lock"></i> Show It</button>
            </div>

            <div class="footer-controls">
                <button id="footer-audio-button" class="btn-icon" aria-label="Audio Control"><i class="fas fa-volume-mute"></i></button>
                <button class="btn-icon" aria-label="Closed Captions"><i class="fas fa-closed-captioning"></i></button>
                <button class="btn-icon" aria-label="Help"><i class="fas fa-question"></i></button>
                <button class="btn-icon" aria-label="Settings"><i class="fas fa-cog"></i></button>
            </div>
        </footer>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
    <script src="js/do-it.js"></script>
</body>
</html>
