# UI Plan for Interactive Math Lessons (Grade 3)

**Version:** 1.0
**Date:** 3 Apr 
**Based On:** 
*   `LessonFrameworkTemplate.md` V1
*   `Lesson1_MeetTheClock.md`
*   `HowToBuild.md`
*   `SampleImage.png`
*   Web research on UI/UX for 8-9 year olds

## 1. Objective

To define the User Interface (UI) structure, style, and interaction patterns for interactive math lessons targeting Grade 3 students (8-9 years old), ensuring consistency, engagement, and adherence to the core lesson framework.

## 2. Target Audience Analysis (Grade 3 / 8-9 Years Old)

*   **Cognitive Stage:** Concrete Operational (Piaget). Capable of logical thought but benefit from concrete examples and visuals.
*   **Reading Level:** Developing readers. Prefer concise instructions, visuals over dense text. [Source: NNGroup]
*   **Motor Skills:** Comfortable with standard touch gestures (tap, drag, swipe) and mouse interaction. Still benefit from larger targets. [Source: NNGroup, Medium]
*   **Engagement:** Respond well to bright colors, positive feedback, and interactive elements. May find overly simplistic designs "babyish". [Source: Medium]

## 3. Guiding Principles

*   **Clarity:** Unambiguous layout, instructions, and feedback.
*   **Engagement:** Visually appealing, interactive, and rewarding.
*   **Simplicity:** Avoid clutter and overly complex interactions. Focus on the learning task.
*   **Consistency:** Uniform layout, navigation, and visual style across all lessons.
*   **Feedback:** Immediate, clear, and explanatory feedback for interactions and answers.
*   **Accessibility:** Adhere to WCAG AA standards for contrast, use large fonts and targets.

## 4. Layout Structure (Adhering to Framework 1.1)

The UI will follow the mandatory three-section layout:

*   **4.1. Top Banner:**
    *   **Content:** Character Guide prompts (positioned left or right, non-intrusive), Lesson Title / Step Name (centered), Glossary & Help Icons (right).
    *   **Appearance:** Consistent background, potentially slightly different shade than the main stage. Clear separation.
*   **4.2. Center Stage:**
    *   **Content:** Primary area for all interactive content (e.g., clock face, questions, activities). Maximize available space.
    *   **Appearance:** Clean background (light, friendly color like `#F0F6FF` suggested in `HowToBuild.md`). Content centered or arranged logically for the specific task.
*   **4.3. Bottom Navigation Bar (Adhering to Framework 1.2 & 1.3):**
    *   **Content (Left to Right):** Home Button, Previous Button, Visual Progress Tracker, Next Button, Reset Activity Button, Audio Controls (Play/Pause, Volume).
    *   **Appearance:** Distinct background color. Buttons clearly delineated and spaced. Progress tracker visually prominent.

## 5. Key UI Elements & Styling (Adhering to Framework 4 & HowToBuild)

*   **5.1. Typography (Framework 4.2):**
    *   **Font Family:** Open Sans (or similar readable, friendly sans-serif).
    *   **Sizes:** Headings (\~28px), Sub-Headings (\~22px), Body/Instructions (18px min), Button Labels (16px min).
*   **5.2. Color Palette (Framework 4.3):**
    *   **Primary:** Bright, engaging color (e.g., Purple `#6a4fed` from `HowToBuild`).
    *   **Secondary:** Contrasting color for accents, secondary buttons (e.g., Green `#24c486` from `HowToBuild`).
    *   **Feedback:** Green (`#28cc71` Correct), Red (`#ff5c5c` Incorrect), Yellow/Blue (Hints/Info).
    *   **Text:** Dark grey/Black for high contrast on light backgrounds.
    *   **Contrast:** Must meet WCAG AA (4.5:1). Use online checkers for verification.
*   **5.3. Buttons (Medium, HowToBuild):**
    *   **Size:** Large touch/click targets (min 44x44px). Padding (\~12px 20px).
    *   **Style:** Rounded corners (\~15px radius). Clear visual states (default, hover, active, disabled). Use primary/secondary colors.
    *   **Labels:** Clear text labels, potentially accompanied by icons.
*   **5.4. Icons (HowToBuild, Font Awesome):**
    *   **Style:** Simple, universally recognizable (e.g., Font Awesome solid style).
    *   **Examples:** `fa-star` (reward), `fa-check` (correct), `fa-redo` (reset), `fa-arrow-left` (prev), `fa-arrow-right` (next), `fa-home` (home), `fa-volume-up` (audio), `fa-question-circle` (help), `fa-book` (glossary).
    *   **Accessibility:** Include `aria-label` for screen readers.
*   **5.5. Graphics & Illustrations (Framework 4.4):**
    *   **Style:** High-quality, clear, consistent style. Friendly and engaging, appropriate for age 8-9 (avoiding overly simplistic or complex styles).
    *   **Purpose:** Must directly support learning objectives.
*   **5.6. Interactive Elements:**
    *   **Highlighting:** Clear visual cues (e.g., border, background change) for selected/active elements.
    *   **Drag & Drop:** Obvious draggable items and clear drop targets (snap-to functionality where appropriate).
    *   **Input Fields:** Large, clear fields with legible font size.
*   **5.7. Progress Tracker (Framework 1.3):**
    *   **Style:** Segmented horizontal bar. Use color fills (e.g., primary color) for completed steps, a distinct highlight for the current step, and a neutral fill for upcoming steps. Tooltips on hover (desktop) showing section names.

## 6. Interaction & Feedback (Adhering to Framework 5 & Medium)

*   **6.1. Visual Feedback:** Immediate response to clicks/taps (e.g., button depression animation, color change). Use standard feedback colors for correct/incorrect indicators (checks, crosses, borders). Keep animations short (<500ms).
*   **6.2. Explanatory Feedback (Framework 5.4):** Crucial for practice/assessment. Provide clear, concise text explaining *why* an answer is correct or incorrect, using positive framing.
*   **6.3. Instructions (Framework 6):**
    *   Delivered via Top Banner text and/or Character Guide (Text + Audio).
    *   Simple, direct language (Grade 3 level).
    *   Provide contextually, just before the action is needed.
    *   Use short animations to demonstrate new interaction types (Framework 6.4).
*   **6.4. Celebratory Feedback (Framework 1.6):** Short, non-disruptive animations or sound effects for completing sections or achieving mastery (e.g., star animation).

## 7. Specific Lesson Considerations (`Lesson1_MeetTheClock.md`)

*   **Clock:** Large, easily readable analog clock face as the central element.
*   **Hands:** Clearly distinguishable by length. Use initial color-coding (Blue/Red as suggested) for `Learn It` / `Try It`, potentially fade/remove color for `Do It` / `Show It` to test differentiation by length alone. Ensure hands are easily clickable targets.
*   **Numbers:** Clear, legible numbers around the face. Input boxes in Warm-up should be large and trigger a simple number pad overlay.
*   **Direction Arrows:** Use clear ↻ and ↺ symbols. Drag interaction for the arrow in `Try It` needs a smooth path and clear visual feedback.

## 8. Accessibility

*   Ensure WCAG 2.1 AA compliance (contrast, keyboard navigation if applicable).
*   Use semantic HTML where possible.
*   Provide ARIA labels for icon-only buttons.
*   Ensure audio narration is available for all textual instructions.
*   Use large, clear fonts and sufficient target sizes.

## 9. Technology Stack Hints (from `HowToBuild.md`)

*   **Rendering:** p5.js suitable for interactive canvas elements (like the clock).
*   **Layout:** HTML/CSS (potentially with Bootstrap grid for structure, customized for child-friendly appearance).
*   **Icons:** Font Awesome library.
*   **State Management:** JavaScript variables/objects to track lesson progress and current step state.

--- 