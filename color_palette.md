# Color Palette for Learning Buddy

A child-friendly color palette for our educational application, designed to be engaging, accessible, and cohesive.

## Primary Colors
These are our main brand/theme colors:

| Color Name | Hex Code | RGB | Description | Usage |
|------------|----------|-----|-------------|-------|
| Primary Purple | `#6a4fed` | rgb(106, 79, 237) | Main theme purple | Headers, progress bar, active elements |
| Secondary Teal | `#24c486` | rgb(36, 196, 134) | Supporting green | Primary buttons, success actions |

## Secondary/Accent Colors
Used for highlights, secondary actions, and visual variation:

| Color Name | Hex Code | RGB | Description | Usage |
|------------|----------|-----|-------------|-------|
| Accent Pink | `#ff6b9d` | rgb(255, 107, 157) | Vibrant pink | Highlighting elements, secondary actions |
| Accent Yellow | `#ffca28` | rgb(255, 202, 40) | Sunny yellow | Stars, decorative elements, warnings |
| Accent Blue | `#46c0ff` | rgb(70, 192, 255) | Sky blue | Secondary buttons, informational elements |

## Neutral Colors
For backgrounds, text, and subtle variations:

| Color Name | Hex Code | RGB | Description | Usage |
|------------|----------|-----|-------------|-------|
| Background Light | `#f0f6ff` | rgb(240, 246, 255) | Soft blue background | Main page background |
| Card Background | `#ffffff` | rgb(255, 255, 255) | Pure white | Card backgrounds, content areas |
| Text Primary | `#333333` | rgb(51, 51, 51) | Dark gray | Main text color |
| Text Secondary | `#666666` | rgb(102, 102, 102) | Medium gray | Secondary text, descriptions |
| Border Light | `#e0e0e0` | rgb(224, 224, 224) | Light gray | Subtle borders, dividers |

## Feedback Colors
For system feedback, alerts, and status indicators:

| Color Name | Hex Code | RGB | Description | Usage |
|------------|----------|-----|-------------|-------|
| Success | `#28cc71` | rgb(40, 204, 113) | Green | Completed actions, correct answers |
| Warning | `#ffca28` | rgb(255, 202, 40) | Yellow | Warnings, partial success |
| Error | `#ff5c5c` | rgb(255, 92, 92) | Red | Error messages, incorrect answers |
| Info | `#46c0ff` | rgb(70, 192, 255) | Blue | Help, information |

## Opacity Variants
When needed, use these alpha/opacity variants:

- 90% opacity: For hover states
- 50% opacity: For disabled states
- 20% opacity: For very subtle backgrounds

## Accessibility Considerations
- Text on colored backgrounds maintains a minimum contrast ratio of 4.5:1
- Interactive elements have distinct focus states
- No color is used as the sole means of conveying information

## Button Styling
| Button Type | Background | Text | Border | Hover Background | Pressed State |
|-------------|------------|------|--------|------------------|---------------|
| Primary (Next) | Secondary Teal `#24c486` | White | None | `#1da16f` (darker) | Scale 0.98 |
| Previous | Accent Blue `#46c0ff` | White | None | `#2e9ad9` (darker) | Scale 0.98 |
| Skip | White | Accent Pink `#ff6b9d` | Accent Pink `#ff6b9d` | Light pink `#fff0f5` | Scale 0.98 |
| Disabled | Light gray `#e0e0e0` | `#999999` | None | No change | No change | 