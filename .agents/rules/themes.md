---
trigger: always_on
---

# Dual Theme Synchronization (Light & Dark Mode)

Whenever any UI design, layout, or visual component is created or modified, changes MUST be implemented simultaneously for both Light Mode and Dark Mode. Never update styles for only one theme.

## Core Rules
- **Color Variables**: Use semantic theme tokens from Tailwind CSS and shadcn/ui (such as `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`) instead of hardcoded hex codes or static palette colors (like raw `bg-white` or `bg-gray-900`).
- **Dark Mode Variants**: When custom color overrides are required, always pair default light classes with explicit dark variants using the `dark:` prefix (e.g., `bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100`).
- **Contrast & Legibility**: Verify that text, icons, badges, borders, and button states maintain compliant accessibility contrast in both visual modes.
- **Surface Elevation**: Ensure interactive components (cards, dialogs, dropdowns, and pet adoption cards) remain clearly distinct from the page background in both themes.
- **Images & SVG Icons**: Adapt icon fills, strokes, and decorative visual elements so they remain fully visible against both light and dark backgrounds.