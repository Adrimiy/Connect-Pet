---
trigger: always_on
---

# Responsive Design & Multi-Device Compatibility

Always enforce a strict mobile-first design pattern using Tailwind CSS utility prefixes (`sm:`, `md:`, `lg:`, `xl:`).

## Core Requirements
- **Mobile-First Layouts**: Design for mobile viewports (down to 320px) first, scaling up progressively to tablets and desktops.
- **Fluid Dimensions**: Never use hardcoded pixel widths or heights (`w-[500px]`, `h-[400px]`) on layout containers. Use responsive wrappers such as `w-full`, `max-w-*`, `min-h-*`, and responsive CSS grids (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **No Overflow**: Prevent unintended horizontal scrolling (`overflow-x-hidden` or well-contained flex/grid layouts) and text truncation issues across all screen sizes.
- **Adaptive Components**: 
  - Navigation bars and filter panels must collapse into mobile-friendly drawers/sheets on smaller screens.
  - Pet cards, grids, and dialog modals must reflow and stack cleanly without content collision.
- **Touch Targets**: Ensure all interactive elements (buttons, inputs, links) maintain a touch-accessible hit area of at least 44x44px (`min-h-[44px]` or adequate padding) on mobile viewports.
