# Implementation Plan - Harmonize Landing Page Card Aesthetics

The user reported that the background colors for "Dynamic Branching" and "Get in Touch" sections feel "off". Investigation revealed inconsistent styling between siblings and potentially incorrect CSS variable scoping for dark mode.

## Proposed Changes

### 1. Fix CSS Variable Scoping in `src/index.css`
- Update the dark mode selector for Claude theme variables to work with just the `.dark` class, ensuring `var(--bg-card)` and `var(--bg-primary)` are correctly updated even if `data-theme` is not explicitly set.

### 2. Harmonize Card Components in `src/components/LandingPage.tsx`
- Refactor "Dynamic Branching", "Spatial Intelligence", and "Get in Touch" boxes to use a consistent, premium style.
- Use shadcn/ui `Card` or a unified class list that handles both themes elegantly.
- Introduce subtle glassmorphism or consistent background transparency for a more "premium" look.

### 3. Aesthetics Enhancements
- Apply a consistent `backdrop-blur` and subtle border-gradient or glow effect to these feature boxes to make them stand out.
- Ensure the "Dynamic Branching" and "Spatial Intelligence" boxes look like a matched pair.

## Detailed Steps

1.  **Modify `src/index.css`**: 
    - Change `:root.dark [data-theme="claude"]` to `:root.dark, :root.dark [data-theme="claude"]` (or similar) to ensure defaults are applied.
2.  **Modify `src/components/LandingPage.tsx`**:
    - Standardize the background and border classes for the two feature boxes in the Overview section.
    - Standardize the Contact form container background.
    - Use `bg-card/50 backdrop-blur-sm` or similar for a more modern feel.

## Verification Plan

- Toggle between Light and Dark mode on the Landing Page.
- Visually inspect the "Dynamic Branching", "Spatial Intelligence", and "Get in Touch" sections.
- Verify that the background colors are consistent and feel "premium".
