# UI Interactive Menu: Ship Hanger & Officers Academy

This section defines a comprehensive interactive menu for two critical modules in *Galactic Sprawl*: the **Ship Hanger** and the **Officers Academy**. Both modules are designed to be visually engaging, dynamically interactive, and seamlessly integrated with the overall game UI. The following breakdown covers their purposes, detailed UI components, interactivity, and recommended implementation techniques.

For these two systems, this section explains the purpose and functionality of each component, and recommends specific implementation methods and third-party libraries to achieve a polished, responsive experience in your TypeScript/React (.tsx) project.

## Integration & Best Practices

Interactive Menu assets for the **Ship Hanger** and **Officers Academy** modules.

### Consistent Theming & Interaction

- **Global Styling:**  
  - Use a CSS-in-JS solution (styled-components or Emotion) to maintain a consistent visual style (dark backgrounds, neon accents, sci-fi fonts) across both modules.
- **Interaction Patterns:**  
  - Maintain consistent hover effects, modals, and tooltips across the Officers Academy and Ship Hanger.
- **Keyboard Navigation:**  
  - Integrate react-hotkeys for accessibility and improved user navigation through the UI.

### State & Data Management

- **Centralized State:**  
  - Use Redux or the React Context API to share state between modules, such as available resources, current tech tier, and build queues.
- **Real-Time Updates:**  
  - Ensure that both modules update dynamically in response to game events (e.g., training completion, ship construction progress) with minimal latency.

### Performance & Optimization

- **Memoization & Lazy Loading:**  
  - Apply React.memo and React.lazy where applicable to optimize rendering.
- **Animation Performance:**  
  - Use requestAnimationFrame and optimize animated components with libraries like Framer Motion or react-spring.

### Prototyping & Testing

- **Storybook:**  
  - Develop individual components (officer cards, ship cards, modals) in Storybook to refine their look and feel before integrating them into the main game UI.
- **Cross-Device Testing:**  
  - Test the UI across various screen sizes and devices to ensure responsiveness and performance.

---

## Officers Academy UI

### Overview & Purpose

The **Officers Academy** is the central hub for hiring, training, and managing the leadership of your fleet. It is designed to:

- **Hire and train** Squad Leaders and Ship Captains.
- Display **training progress** and **XP growth** through dynamic, animated visual cues.
- Allow for manual intervention (swapping or reassigning officers) as well as automated assignments.
- Reflect tiered functionality:
  - **Tier 1:** Basic hiring and training.
  - **Tier 2 (Refugee Market):** Unlocks pilot hiring from other factions.
  - **Tier 3 (Indoctrination):** Allows conversion of captured leaders.

### Functional Requirements

- **Officer List Display:**  
  - Render a list or grid of officer “cards” that show:
    - Portrait/icon (SVG or animated image).
    - Current level and XP progress.
    - Role (e.g., Squad Leader, Captain).
    - Status (e.g., in training, assigned, available for hire).
  
- **Hiring Process:**  
  - Provide an interactive panel where new officers can be recruited.
  - Display hiring requirements (resources, tier prerequisites) and enable a “Hire” button.
  
- **Training & Progress Visualization:**  
  - Show training progress bars on each officer card.
  - Use animated sequences (e.g., subtle looping animations of a training exercise icon or a progress meter) to indicate ongoing training.
  - Display XP breakdowns per role (War, Recon, Mining) on hover or within a modal.
  
- **Interactivity & Detail Views:**  
  - Clicking on an officer card should bring up a detailed view with more statistics (e.g., skill multipliers, historical XP gains).
  - Enable tooltips to quickly relay key stats on hover.
  - Provide a manual override to reassign officers to different squads.

### UI Components & Layout

- **Main Container:**  
  - A top-level `<OfficerAcademy />` component acting as a dashboard.
  
- **Officer Cards/Grid:**  
  - Each card represents an officer with a portrait, level badge, progress bar, and action buttons (e.g., “Hire”, “Assign”).
  - Cards should be responsive and animated to update when an officer levels up or completes training.
  
- **Detail Modal/Panel:**  
  - A modal view (or slide-out panel) for in-depth statistics when a card is clicked.
  - The modal can include graphs (e.g., XP trends) and additional interactive controls for manual reassignment.
  
- **Hiring Panel:**  
  - A dedicated subcomponent that lists potential candidates, including resource costs and tier requirements.
  - Integrate filtering (by role, cost, or level) for an improved user experience.

### 1.4 Implementation Techniques & Recommendations

- **Animations & Transitions:**  
  - **Framer Motion:** For smooth, continuous animations (e.g., officer level-up, card transitions, training progress).
  - **React-ProgressBar.js:** To display animated progress indicators on officer cards.
  
- **Interactivity:**  
  - **React-Tooltip:** To provide on-hover details and stats.
  - **React Hotkeys:** To enable keyboard shortcuts for navigating between officers or quickly opening the hiring panel.
  
- **State Management:**  
  - Use React Context or Redux to manage the list of officers, their training states, and XP progress.  
  - Ensure that any state updates (such as leveling up) are immediately reflected in the UI with minimal latency.
  
- **Layout & Styling:**  
  - Consider using Material-UI or styled-components to build a consistent, responsive grid of officer cards.
  - CSS-in-JS solutions help maintain the sci-fi theme with custom fonts, color schemes (e.g., neon/cyan accents on dark backgrounds), and transition effects.

### 1.5 Additional Considerations

- **Responsive Design:**  
  - Ensure that officer cards and modals adapt to different screen sizes and orientations.
  
- **Accessibility:**  
  - Implement ARIA roles and keyboard navigation (tab-indexing, hotkeys) to ensure the UI is accessible.
  
- **Performance:**  
  - Utilize memoization (React.memo) to avoid unnecessary re-renders, especially when handling animations.
  
- **Prototyping & Testing:**  
  - Use Storybook for isolating and testing individual officer card components before integration into the full UI.

---

## Ship Hanger UI

The **Ship Hanger** serves as the build selection interface for constructing and upgrading various ship classes. Its design goals are to:

- Allow players to select and construct a wide range of ship types (e.g., War, Recon, Mining).
- Visualize the expansion of the docking bays as the player's shipyard upgrades through tiers.
- Provide detailed information on each ship type, including stats, tier requirements, and build progress.
- Offer a fluid, visually engaging interface that reflects the evolving nature of the Star System’s fleet.

### 2.2 Functional Requirements

- **Ship Listing & Categories:**  
  - Display different ship categories (War, Recon, Mining) in a tabbed or sidebar navigation.
  - List available ship types as “cards” or grid items, each showing:
    - An icon or SVG illustration.
    - Ship name and class.
    - Basic stats (e.g., speed, armor, weapon type).
    - Tier level and prerequisites for unlocking higher tiers.
  
- **Detailed Build Menu:**  
  - Clicking on a ship card opens a detailed view (modal or expanded panel) showing:
    - Detailed statistics and upgrade paths.
    - Build time, resource cost, and tech tree integration.
    - A “Build” or “Queue” button to start ship construction.
  
- **Docking Bay Visualization:**  
  - A dynamic visual representation of the docking bay that expands as new tiers are reached.
  - Docking bays should visually “unlock” additional space using animated SVGs or canvas elements.
  - The current state of the hangar (number of bays available, queued ships) should be clearly indicated.
  
- **Interactivity & Feedback:**  
  - Hover effects on ship cards to show quick stats or build previews.
  - Animated transitions when a new ship is added to the build queue.
  - Visual cues (e.g., glowing outlines or particle effects) to indicate active ship construction or completed upgrades.

### 2.3 UI Components & Layout

- **Main Container:**  
  - A `<ShipHanger />` component that serves as the primary UI for ship construction.
  
- **Category Navigation:**  
  - A sidebar or top navigation bar to filter ships by category (War, Recon, Mining).
  
- **Ship Cards/Grid:**  
  - Cards displaying ship icons, names, tier information, and basic stats.
  - Use a responsive grid layout that adapts to screen size and provides clear visual separation between ship categories.
  
- **Detailed Ship View Modal:**  
  - An overlay or modal window that appears when a ship card is clicked.
  - Contains detailed information, a “Build” button, and optional customization options.
  
- **Docking Bay Display:**  
  - A visual panel that shows the current state of the docking bay.
  - Incorporate scalable, animated SVG elements or a canvas-rendered scene (using react-konva) to illustrate bay expansion and ship docking.
  - Include progress indicators for ongoing ship builds.

### 2.4 Implementation Techniques & Recommendations

- **Animations & Transitions:**  
  - **React-Spring / Framer Motion:** Use either library to animate the expansion of docking bays and smooth transitions between ship cards and detail modals.
  - **React-Konva:** For advanced, canvas-based visuals if you want to create a more detailed, interactive docking bay representation.
  
- **Interactivity:**  
  - **React-Tooltip:** For on-hover quick information on ship stats.
  - **Material-UI (or similar):** For consistent card layouts and modal components.
  
- **State Management:**  
  - Use a centralized store (Redux or Context API) to manage the build queue, ship selection, and docking bay state.
  - Maintain local state within ship card components for temporary animation states (e.g., “hovered” state).
  
- **Layout & Styling:**  
  - Employ CSS Grid or Flexbox for the ship card grid.
  - Use styled-components or Emotion to enforce a consistent sci-fi visual theme with neon accents and dark backgrounds.
  
- **Additional Features:**  
  - Enable filtering and sorting of ship types by tier, role, or build cost.
  - Display dynamic progress overlays on ship cards during construction.
  - Ensure the detailed modal provides links or references to the Tech Tree for upgrade requirements.

### 2.5 Additional Considerations

- **Responsiveness:**  
  - Ensure that the ship hangar UI scales gracefully across desktop and mobile devices.
  
- **User Feedback:**  
  - Provide clear visual feedback (e.g., animations, progress bars, color changes) when a ship is queued or built.
  
- **Performance Optimization:**  
  - Use lazy loading for high-resolution SVGs or canvas elements to improve initial render times.
  
- **Testing & Prototyping:**  
  - Utilize Storybook to build and test ship card components and docking bay visuals independently before integration.

---

## Summary

This expanded design plan provides a detailed roadmap for creating an interactive UI for the **Officers Academy** and **Ship Hanger** modules. It covers:

- **Officers Academy:**  
  - A dynamic, animated hiring and training dashboard with officer cards, progress bars, detailed modals, and tooltips.
  - Implementation methods using Framer Motion, React-ProgressBar.js, and React-Tooltip.
  
- **Ship Hanger:**  
  - An interactive build selection interface that features categorized ship cards, a detailed ship view modal, and a visually dynamic docking bay representation.
  - Implementation techniques using React-Spring/Framer Motion, Material-UI, and react-konva for advanced visualizations.
  
- **Global Considerations:**  
  - Consistent theming, centralized state management, responsive design, accessibility, and performance optimizations.

By following this plan, you will create a cohesive, immersive, and highly interactive UI experience for managing fleet construction and officer training in your game, ensuring that both modules feel integrated and visually engaging within the broader sci-fi aesthetic of *Galactic Sprawl*.
