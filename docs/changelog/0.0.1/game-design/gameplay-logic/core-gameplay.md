# Build the Core Gameplay Logic (Mothership & Basic Assets)

This document is designed to be a standalone reference for your development in TypeScript, React, and .tsx. It outlines exactly what each module does, how it should integrate with your overall design, and which libraries and methods to employ to achieve polished interactivity, animation, and data visualization.

---

## OVERVIEW & DESIGN PHILOSOPHY

**Galactic Sprawl** is structured as a modular, component-based simulation where your empire grows from a central Mothership outward. Every module (Mothership, Colony, Mining, Exploration, Tech Tree, etc.) operates both autonomously and in concert with a centralized global state and event system. Core gameplay mechanics emphasize:

- **Progression & Upgrades:** Modules unlock additional functionality (e.g., scanning range, faster ship production) as the Tech Tree advances.
- **Automation:** Each system (e.g., trade cycles, mining dispatch, recon mapping) runs on timers and reacts to global events.
- **Visual Feedback:** Dynamic Visual Progression Representations (VPR) give immediate feedback on growth, upgrades, and inter-system interactions.
- **Interconnectivity:** A centralized Mothership acts as the primary hub, while Colonies, Mining Nodes, and Recon Operations provide additional layers that feed back into the overall empire’s state.

Every module is designed with a robust Menu UI that is both interactive and visually engaging. The UI must be responsive, easily navigable, and clearly communicate the state of each asset. The following sections detail each module’s design along with concrete examples of third-party libraries and methods to implement them.

---

## GLOBAL ARCHITECTURE & EVENT SYSTEM

### Global State Management

- **Approach:**
  - Use **React Context** or **Redux** to store and manage global variables (resources, population, fleet statuses, module levels, etc.).
  - Define TypeScript interfaces for every asset type to ensure strict typing and maintainability.
- **Third-Party Examples:**
  - **Redux Toolkit:** For structured state management and easy integration with React.
  - **React Context API:** For lightweight, context-based state propagation if you prefer a simpler solution.

### Centralized Event Bus & Automation

- **Purpose:**
  - Ensure that every module (e.g., Radar scans, Colony trade cycles, Recon deployments) can dispatch and listen to events.
  - Automate processes using a centralized timer or game loop.
- **Implementation Recommendations:**
  - Use a custom event dispatcher built atop React Context.
  - For more advanced event handling and asynchronous flows, consider **RxJS** to manage event streams.
- **Library Example:**
  - **RxJS:** It provides operators to debounce, throttle, and transform events, which is particularly useful for global automation routines.

---

## MODULES & UI DESIGN

Each module includes detailed UI elements and interactivity. The following sections describe the modules, recommended third-party libraries, and implementation methods to enhance the Menu UI and overall interactivity.

### Modular Menu System

- **Design Considerations:**
  - Each module (Mothership, Colony, Mining, Exploration, Tech Tree, etc.) should have its own collapsible menu within the main UI.
  - Menus should be color-coded, with disabled states (grayed-out) when prerequisites or resources are lacking.
  - A custom-styled scrollbar (using CSS or a library such as **react-custom-scrollbars**) can be used if content overflows.
- **Interaction Patterns:**
  - Hover effects reveal tooltips with detailed module information.
  - Click or tap to expand detailed views or sub-modules.
  - Use **react-hotkeys** for enabling keyboard shortcuts (e.g., toggling between main modules, opening the Tech Tree).

### Animation & Visual Feedback

- **Methods:**
  - Utilize **Framer Motion** and **react-spring** for state transitions, hover animations, and module upgrade animations.
  - Integrate **GSAP** for more complex, timeline-based animations, especially for Tech Tree upgrades and galaxy map transitions.
  - Use **react-konva** for 2D canvas animations (e.g., drawing trade routes or a star system backdrop with parallax scrolling).

### MOTHERSHIP CORE

- **Functionality & Role:**
  - Serves as the main hub for your empire.
  - Tracks global resources (minerals, currency, population, energy, etc.) and overall progress.
  - Hosts primary interactive build/upgrade menus.
- **Mechanics & Features:**
  - **Global State Integration:** Centralized data nodes track asset counts and resource flows.
  - **Dynamic HUD:** Displays live resource stats, module statuses, and upgrade prompts.
  - **Automation Hooks:** Initiates global events (e.g., resource generation, scanning, trade cycles) that ripple through all attached modules.
  - **Upgrade Visuals:** As upgrades are applied via the Tech Tree, the Mothership’s visual elements (e.g., animated superstructure expansion) update accordingly.
  - **Design Methods:**
    - Use TypeScript interfaces to define asset data structures.
    - Leverage React Context for cross-component state sharing.
  - **Recommended libraries:**
    - Framer Motion or react-spring for smooth upgrade animations.
    - Styled-components for consistent theming (dark backgrounds with glowing cyan accents).
  - Acts as the central hub for global resource tracking, upgrade management, and initiating core events (trade cycles, scanning, etc.).
  - Displays a dynamic HUD with real-time statistics, build/upgrade buttons, and VPR elements that update with each module upgrade.
- **Menu UI Details:**
  - **Layout:**
    - Use a modular panel design that organizes sections into collapsible menus (e.g., Resources, Upgrades, Modules).
    - Ensure one category is open at a time with smooth transitions.
  - **Visual Styling:**
    - Implement a dark theme with glowing cyan accents using **Styled Components** or **Emotion**.
  - **Interactive Elements:**
    - Buttons should be color-coded and animate (e.g., pulse, scale) on hover.
    - Use **Framer Motion** for transition animations when modules upgrade or when new modules are attached.
- **Third-Party Library Examples:**
  - **Framer Motion:** To animate module expansions or the visual “growth” of the Mothership.
  - **Styled Components:** For dynamic theming and responsive layouts.

### COLONY STAR STATION

- **Functionality & Role:**
  - Acts as an outpost that extends your empire’s reach beyond the Mothership.
  - Each Colony functions autonomously with its own population, resource pool, and sub-modules.
- **Mechanics & Features:**
  - **Acquisition & Setup:**
    - Purchased via the Mothership UI.
    - Spawns as an independent object with a starting population and minimal build.
  - **Population Growth:**
    - Automated population increase over time, influenced by local upgrades and “Biodome Crops” (to be expanded via the Tech Tree).
  - **Resource Trading:**
    - Conducts automated trade cycles (e.g., every 5 seconds) with the Mothership.
    - Visualized by animated trade routes and dynamic resource counters.
  - **Expandable Sub-Building Modules:**
    - Although minimal at Tier 1, Colonies are designed to later support local Radar, Ship Hanger, Officer Academy, and additional modules.
  - **Design Methods:**
    - Implement Colony components with local state management for population and trade cycles.
    - Utilize timers (or a centralized game loop) to trigger automated trade and growth events.
    - **Recommended libraries:**
      - react-particles-js for visualizing trade routes.
      - D3.js (or similar) for dynamic data visualization in the Colony UI.
  - Each Colony operates as a semi-autonomous hub with its own population, resource pools, and sub-modules.
  - Responsible for inter-system trade, localized growth, and acts as a secondary building block for empire expansion.
- **Menu UI Details:**
  - **Acquisition:**
    - The Colony is purchased via the Mothership’s build menu. Once purchased, a new Colony panel appears.
  - **UI Components:**
    - Include a dashboard that shows population growth, resource exchange rates, and visual representations (e.g., a map of trade routes using particle effects).
    - Offer expandable sub-menus for future local modules like Colony Radar or local Ship Hanger.
  - **Visual Effects:**
    - Use **react-particles-js** to show animated trade routes and dynamic population rings.
    - Include progress bars and counters that update in real time.
- **Third-Party Library Examples:**
  - **D3.js:** For creating interactive, real-time graphs that show Colony resource flows and population growth.
  - **react-particles-js:** To animate trade route flows and visually indicate active trade cycles.

### RADAR MODULE

- **Functionality & Role:**
  - Provides initial exploration capability by revealing nearby resources, anomalies, and enemy ships.
  - Serves as the foundation for later, more sophisticated scanning systems.
- **Mechanics & Features:**
  - **Tier 1 Functionality:**
    - Detects objects within a set radius around the Mothership or Colony.
    - Communicates scan results to trigger subsequent events (e.g., ship dispatch for defense).
  - **UI & VPR:**
    - A visible antenna or satellite dish element with an animated radar sweep.
    - UI feedback indicates active scanning and alerts upon detection.
  - **Progression:**
    - Future upgrades (Tier 2/Tier 3) will extend scan range and incorporate galaxy-wide monitoring.
  - **Design Methods:**
    - Use SVG or Canvas (via react-konva) for drawing the radar element.
    - Animate transitions with Framer Motion for a seamless upgrade experience.
  - Provides initial scanning of nearby objects (resources, enemy ships, anomalies) with a set detection radius.
  - Serves as the foundation for unlocking higher-tier scanning and detection in the Tech Tree.
- **Menu UI Details:**
  - **Visual Component:**
    - A visible radar dish or satellite icon attached to the Mothership.
    - Animated radar sweeps (a “pulse” effect) that indicate active scanning.
  - **Interactivity:**
    - On hover, display a tooltip with the current scan range and detection status.
    - Use a collapsible panel to show details such as scan history or detected objects.
- **Third-Party Library Examples:**
  - **react-konva:** For drawing 2D animated shapes (like the radar sweep) on a canvas element.
  - **Framer Motion:** For animating the radar’s pulsing and transition effects during upgrades.

### SHIP HANGER MODULE

- **Functionality & Role:**
  - Functions as the production hub for all ship types (War, Recon, Mining).
  - Responsible for queuing, building, and visually spawning new ships near the Mothership or Colony.
- **Mechanics & Features:**
  - **Production Interface:**
    - A dedicated UI menu with color-coded, collapsible buttons for different ship types.
    - Displays current build queues and production timers.
  - **Visual Representation:**
    - An expanding docking bay that evolves visually as upgrades are applied.
    - Shows docked ship silhouettes that increase in number with higher tiers.
  - **Automation Integration:**
    - Automatically triggers ship production based on global events (e.g., Radar detects threats, mining demand).
  - **Design Methods:**
    - Use component state to manage production queues.
    - Integrate with the global event system so that production reacts to in-game triggers.
  - **Recommended libraries:**
    - react-spring for easing animations during ship spawn transitions.
  - Acts as the production hub for all ship types, managing queues and dispatching ships automatically based on triggers from the Radar or resource needs.
  - Visualizes the current production status and available ship types (War, Recon, Mining) with upgrade-dependent visuals.
- **Menu UI Details:**
  - **Build Menu:**
    - Create a dedicated Ship Hanger interface with collapsible sections for each ship type.
    - Each ship type’s button should indicate resource cost and current availability (using grayed-out or highlighted states).
  - **Visual Feedback:**
    - Use animated transitions to show the “spawning” of a ship, such as scaling effects and fade-ins.
    - Include a dashboard that displays active build queues and countdown timers.
- **Third-Party Library Examples:**
  - **react-spring:** For creating smooth easing animations when ships are produced and docked.
  - **Framer Motion:** To handle state transitions within the build queue UI, ensuring a dynamic and responsive user experience.

### OFFICER ACADEMY

- **Functionality & Role:**
  - Allows the hiring and training of officers who command ship fleets.
  - Officers gain experience, which enhances various aspects of ship performance (e.g., combat efficiency, mining speed).
- **Mechanics & Features:**
  - **UI Panel:**
    - Integrated within the Mothership/Colony interface with clear “Hire Officer” and “Train Officer” buttons.
    - Displays current officer count, XP progress, and potential benefits.
  - **Training Automation:**
    - Officers automatically accumulate experience over time or through successful engagements.
    - Upgrades via the Tech Tree further accelerate XP gains.
  - **Visual & VPR Elements:**
    - Simple building sprites that evolve with higher tiers (e.g., additional animated training simulations).
  - **Design Methods:**
    - Maintain officer data in the global state to facilitate integration with combat and production systems.
    - Use animated progress bars and tooltips (via libraries such as react-tooltip) to display officer stats.
  - Provides recruitment and training for officers that command your fleets.
  - Officers earn XP over time and improve fleet efficiency in combat, mining, or recon.
- **Menu UI Details:**
  - **Dashboard Interface:**
    - An interface that displays current officer count, XP progress bars, and available training/upgrade options.
    - Use tooltips and detailed modals for officer statistics (e.g., XP, rank, and skill benefits).
  - **Interactive Hiring:**
    - Buttons for hiring or training should update dynamically based on available resources.
    - Visual indicators (such as animated badges or level-up overlays) signal when an officer levels up.
- **Third-Party Library Examples:**
  - **React Tooltip:** For contextual pop-ups that display officer details on hover.
  - **Framer Motion:** To animate progress bars and level-up animations for officer XP.

### MINERAL PROCESSING CENTRE (MINING)

- **Functionality & Role:**
  - Central hub for managing resource extraction from discovered mineral nodes.
  - Coordinates mining ship deployment and resource threshold management.
- **Mechanics & Features:**
  - **Resource Filtering & UI:**
    - Presents a filtered map showing discovered minerals (Copper, Iron, Titanium, etc.) with unique icons.
    - Offers priority settings for each mineral, including minimum/maximum thresholds and a master “MINE ALL” toggle.
  - **Automation:**
    - Automatically dispatches Mining Ships (e.g., Rock Breaker) when resource levels drop below set thresholds.
    - Pauses extraction if resource levels exceed maximum thresholds.
  - **Visual Feedback:**
    - Animated icons and progress indicators that update as mining operations occur.
  - **Design Methods:**
    - Integrate with the global state so that resource levels update in real time.
    - Use Framer Motion for transitions that reflect changes in mining activity.
  - **Recommended libraries:**
    - D3.js for dynamic graphing of resource flows.
- **Menu UI Details:**
  - **Resource Dashboard:**
    - A detailed panel that lists minerals with their current quantities, min/max thresholds, and priority levels.
    - Includes a “MINE ALL” master toggle for bulk resource extraction.
  - **Interactive Controls:**
    - Sliders or input fields to set threshold values, along with visual indicators (e.g., progress rings) for current mining status.
    - Animated status changes when a mineral’s threshold is reached or when mining is paused/resumed.
- **Third-Party Library Examples:**
  - **D3.js:** For creating interactive charts or gauges that show real-time mining rates and resource levels.
  - **Framer Motion:** To animate transitions when toggling between individual and master mining modes.

### EXPLORATION HUB & RECON OPERATIONS

- **Functionality & Role:**
  - Manages galaxy exploration by deploying Recon Ships to scan unmapped sectors.
  - Reveals anomalies, lost technology, habitable worlds, and resource-rich areas.
- **Mechanics & Features:**
  - **Recon Ship Deployment:**
    - Production of Tier 1 Recon units (e.g., SC4 Comet) through the Ship Hanger.
    - Automated assignment of destinations to unmapped sectors.
  - **Mapping & Data Feedback:**
    - Gradually transforms dark zones on the galaxy map into illuminated regions.
    - Anomalies and discoveries trigger updates in dedicated UI panels.
  - **Progression:**
    - Upgrades unlock enhanced recon capabilities (shorter mapping cycles, stealth features) via the Tech Tree.
  - **Visual Elements:**
    - A dedicated Exploration Hub UI that overlays the galaxy map with color-coded sectors, recon ship icons, and mapping progress indicators.
  - **Design Methods:**
    - Implement the Exploration Hub as an independent React component with real-time updates.
    - Use react-three-fiber if a 3D mapping experience is desired, or D3.js for sophisticated 2D visualizations.
    - Integrate with react-hotkeys for keyboard controls (e.g., toggling the galaxy map with the M key).
- **Menu UI Details:**
  - **Exploration Dashboard:**
    - A dedicated UI panel that overlays the galaxy map. This panel highlights unmapped “dark zones,” newly discovered anomalies, and active Recon Ship positions.
    - Filters and zoom controls enable users to focus on specific sectors or view overall mapping progress.
  - **Interactive Mapping:**
    - Clicking on a sector can open a detailed modal with statistics (e.g., mapping progress, detected anomalies).
    - Use animated overlays (such as pulsating circles or glowing boundaries) to indicate active recon areas.
- **Third-Party Library Examples:**
  - **react-three-fiber:** For integrating 3D mapping elements if you decide to give the galaxy map depth and parallax effects.
  - **D3.js:** For constructing interactive 2D maps with real-time data updates.
  - **react-hotkeys:** To allow quick toggling of the Exploration Hub via keyboard shortcuts (e.g., “M” for the galaxy map).

### TECH TREE INTEGRATION & AUTOMATED PROGRESSION

- **Functionality & Role:**
  - Provides a structured pathway for upgrading all core modules.
  - Unlocks advanced functionalities, enhanced automation, and visually distinct improvements.
- **Mechanics & Features:**
  - Tiered Upgrades:
    - Modules (Mothership, Radar, Ship Hanger, Officer Academy, Mineral Processing Centre, Exploration Hub) each correspond to specific tiers (Tier 1 through Tier 3).
    - Upgrading modules improves functionality (e.g., increased scanning range, faster ship production, accelerated officer training) and triggers visual changes.
- **Research & Resource Requirements:**
  - Unlocking new tiers involves resource investment, research time, and sometimes prerequisites (e.g., combined building levels).
- **Visual & Interaction Feedback:**
  - The Tech Tree UI (designed as a top-down, three-column layout) highlights available upgrades, requirements, and progression benefits.
- **Design Methods:**
  - The Tech Tree should be implemented as its own React component with state tied to global resources.
  - Use GSAP (GreenSock Animation Platform) for timeline-based animations when upgrades are applied.
  - Integrate with the module UIs so that upgrades automatically update visual representations and automation parameters.
  - Provides the research and upgrade path for every core module (Mothership, Radar, Ship Hanger, Officer Academy, Mining, Exploration).
  - Each upgrade affects not only performance but also the visual representation of the module.
- **Menu UI Details:**
  - **Tech Tree Layout:**
    - Design a top-down, three-column UI that categorizes upgrades by Tier (Tier 1, Tier 2, Tier 3).
    - Clearly mark prerequisites, resource costs, and benefits for each upgrade.
    - Use visual cues (e.g., glowing icons or progress animations) to signal when an upgrade is available.
  - **Interactivity:**
    - Hovering over an upgrade shows a detailed tooltip or modal with further information.
    - A responsive design that adapts to different screen sizes ensures the Tech Tree remains legible and navigable.
- **Third-Party Library Examples:**
  - **GSAP (GreenSock Animation Platform):** For timeline-based animations that visually transition between upgrade states.
  - **Framer Motion:** For smooth layout transitions and interactive state changes as upgrades are applied.
  - **Styled Components:** To enforce a consistent visual style across the Tech Tree and integrate theme changes when new upgrades are unlocked.

### HABITABLE WORLDS & ENVIRONMENTAL GROWTH

- **Purpose & Role:**
  - Represents planets within colonized systems that continue to grow autonomously.
  - Provides additional resource generation and trade opportunities.
- **Mechanics & Features:**
  - Auto-Spawn & Growth:
    - The first colonized system spawns with a habitable world.
    - Autonomous population growth and visual development (e.g., increasing city lights, satellite deployment) occur over time.
  - **Economic Integration:**
    - Habitable worlds export unique resources and support tourism/trade with Colonies.
    - Trade flows are automatically routed to boost overall resource levels.
- **UI & VPR:**
  - Each habitable world is represented by a unique circular asset with accompanying statistics (population, resource yields, anomalies).
  - **Planet Dashboard:**
    - A circular asset representation with real-time statistics (population, resource yields, anomalies).
    - Visual progressions such as expanding city lights or satellite overlays to indicate growth.
  - **Interactive Modals:**
    - Clicking on a habitable world brings up a detailed panel with growth graphs, resource export rates, and environmental factors.
- **Design Methods:**

  - Use a dedicated React component that periodically updates growth metrics.
  - Visual progression can be achieved with react-spring for subtle pulsing and expansion effects.
  - Provide detailed modals (on click/hover) for in-depth statistics and growth graphs.

- **Functionality:**

  - Represents autonomous planetary growth within colonized systems.
  - Provides additional resource generation and acts as an economic booster via tourism/trade.

- **Third-Party Library Examples:**
  - **react-spring:** For subtle pulsing effects and growth animations.
  - **D3.js:** To create interactive graphs and data visualizations that track planetary development.

### STARSHIP FLEET & COMBAT/OPERATIONAL SYSTEMS

- **Functionality & Role:**
  - Manages the production, deployment, and operation of War, Recon, and Mining ships.
  - Ensures that fleet responses are automated based on triggers from Radar, Mining thresholds, and Recon mapping.
- **Menu UI Details:**
  - **Fleet Dashboard:**
    - Displays current ship counts for each category, active build queues, and officer assignments.
    - Visual indicators (such as badges or icons) display ship levels and XP, tied to the Experience & Leveling system.
  - **Interactive Controls:**
    - Collapsible panels allow for detailed views of each fleet type, with options to manually dispatch or upgrade ships if desired.
- **Third-Party Library Examples:**
  - **Framer Motion** or **react-spring:** For animating ship launches and transitions between build states.
  - **React Tooltip:** For displaying detailed ship statistics on hover.
  - **react-hotkeys:** For quick commands in combat or during fleet management.

### EXPERIENCE & LEVELING SYSTEM

- **Functionality & Role:**
  - Rewards progression by allowing ships and officers to gain experience from tasks in War, Recon, and Mining.
  - Directly impacts performance improvements such as faster reaction times, enhanced weapon systems, and reduced operating costs.
- **Mechanics & Features:**
  - **Experience Acquisition:**
    - Ships and officers earn XP through automated engagements (combat, exploration, mining).
    - The Officer Academy enhances XP growth and levels up officers to boost fleet performance.
  - **Level Benefits:**
    - War XP improves combat efficiency.
    - Recon XP reduces mapping cycle durations and enhances anomaly detection.
    - Mining XP results in better resource yields and faster extraction cycles.
  - **Visual Indicators:**
    - Rank badges on ships and progress bars within the Officer Academy UI.
  - **Design Methods:**
    - Centralize XP calculations in the global state to ensure consistent application across systems.
    - Visual updates should be subtle yet clear—use animated overlays to indicate level-ups.
    - Tie XP gains into Tech Tree unlocks for enhanced, cumulative benefits.
  - Tracks XP gains from combat, exploration, and mining across ships and officers.
  - Provides visual feedback (e.g., level-up animations, rank badges) that enhance the sense of progression.
- **Menu UI Details:**
  - **Experience Dashboard:**
    - Integrate a small overlay in the Officer Academy UI and Ship Hanger that shows XP progress and levels.
    - Use animated progress bars that update in real time.
- **Third-Party Library Examples:**
  - **Framer Motion:** For animating progress bars and level-up events.
  - **Styled Components:** For consistent, themed displays of XP and rank badges.

---

### UI, VPR, and Automation Integration

- **Menu & Module UI Design**
  - **Organized Submenu System:**
    - Build menus are categorized (Mothership, Colonies, Mining, Exploration, Officer Academy, Tech Tree).
    - Only one category is open at a time, with collapsible sub-menus and color-coded buttons.
    - A custom-styled, cyan-themed scrollbar ensures a smooth experience on overflow.
  - **VPR UI View:**
    - The default view integrates all visual progression elements of the star system (e.g., Central Mothership, Colony Star Station, Habitable Worlds).
    - Visual cues (size, brightness, animations) denote progression and current status.
    - Interactivity is achieved via hover effects and clickable modules that reveal detailed statistics.
- **Automation & Global Event Handling**
  - **Centralized Event Bus:**
    - Every module dispatches and listens to events (e.g., “SCAN_COMPLETE”, “SHIP_PRODUCED”, “TRADE_CYCLE”).
    - This architecture enables responsive automation: Radar scans trigger ship deployments; low resource levels trigger mining operations.
  - **Timers and Game Loops:**
    - Each module (Mothership, Colony, Mining, Exploration) is updated on a periodic tick.
    - Automation routines ensure that growth, trade, and combat happen seamlessly in the background.
  - **Progression Milestones:**
    - Automated triggers (e.g., reaching a population threshold) unlock new modules and enable system-to-system expansion.
    - Visual feedback (expanding rings, glowing trade routes) reinforces the dynamic state of the empire.
- **Recommended Implementation Methods & Third-Party Libraries**
  - **State Management:**
    - React Context or Redux to manage global resources, asset registries, and automation events.
  - **UI & Animation:**
    - Framer Motion and react-spring for fluid, interactive animations during module upgrades and ship deployments.
    - Styled-components or Emotion for dynamic theming and responsive layouts.
  - **Visual & Data Representation:**
    - react-konva for 2D canvas-based animations (e.g., drawing the star system backdrop and dynamic module upgrades).
    - react-three-fiber for any 3D elements (e.g., the central Mothership or galaxy map with parallax effects).
    - D3.js for real-time data visualization in trade and resource dashboards.
    - react-particles-js for particle effects to visualize trade routes and dynamic space environments.
  - **Interaction Enhancements:**
    - react-hotkeys for keyboard shortcuts (e.g., toggling the Galaxy Map with M, Sprawl View with S).
    - React Tooltip for contextual pop-ups and module details on hover.

---

## SUMMARY & NEXT STEPS

This expanded Core Gameplay Mechanics document details every key asset—from the central Mothership and Colony management to Mining, Exploration, Tech Tree integration, Starship Fleet operations, and the Experience system. It includes specific guidance on designing a robust modules Menu UI and recommends concrete third-party libraries for animations, state management, data visualization, and interactivity.

Your implementation in TypeScript, React, and .tsx should follow these guidelines:

- **Use React Context/Redux** for global state and event management.
- **Implement UI components** using Styled Components or Emotion for consistent theming.
- **Enhance animations and transitions** with Framer Motion, react-spring, and GSAP.
- **Integrate data visualization** using D3.js and react-konva for dynamic, interactive representations.
- **Enable keyboard shortcuts** and interactive tooltips with react-hotkeys and React Tooltip.

By following this comprehensive plan, you’ll create a fully functioning, automated, and visually engaging Galactic Sprawl experience that not only meets the core gameplay requirements but also provides a rich, expandable foundation for future upgrades and detailed interactivity.
