# Galactic Sprawl Development Roadmap

This roadmap is organized into clear phases and sections to guide you step-by-step through development—from the initial project setup to advanced gameplay systems and late-game scaling. Use this as your “development-only” blueprint (excluding testing and release/rollout) to ensure every required asset and mechanic is built in the proper order.

> **Objective:** Build a complete and cohesive game by following these development phases, starting with the simplest core elements (e.g., the Mothership and Tier 1 modules) and layering on more advanced systems (e.g., Tech Tree, automation, enemy AI, and late-game structures).

---

## Table of Contents

1. [Project Skeleton & Core Setup]
2. [HUD, Maps & UI Views]
   - [2.1 Default VPR UI View] - [[GS_MV-VisualProgressRepresentationUIView]]
   - [2.2 Global HUD & Module UI Elements] - [[GS_GUI-GlobalUIImplementations]]
   - [2.3 Civilization Sprawl UI View] - [[GS_MV-CivilizationSprawlView]]
   - [2.4 Tech Tree UI] - [[GS_TTR-TechTree]]
   - [2.5 Local Galaxy Map & Travel Mechanics] - [[GS_MV-LocalGalaxyMap]]
   - [2.6 Mothership & Colony Star Station UIs] - [[GS_UIM-MothershipAndColonyUIMenu]]
   - [2.7 Exploration Hub & Mineral Processing Centre UIs] - [[GS_UIM-ExplorationAndMining]]
   - [2.8 Officer Academy & Ship Hanger UIs] - [[GS_UIM-OfficersAcademyAndShipHanger]]
   - [2.9 Habitable World UI] - [[GS_UIM-HabitableWorlds]]
   - [2.10 Experience & Leveling UI]
3. [Core Gameplay Logic & Tier 1 Modules] - [[GS_GL-CoreGameplayLogic]]
4. [Galaxy Map & Travel Mechanics] - [[GS_MV-LocalGalaxyMap]]
5. [Advanced Gameplay Layers]
   - [5.1 Civilization Sprawl View] - [[GS_MV-CivilizationSprawlView]]
   - [5.2 Mining & Exploration UIs (Automation)] - [[GS_UIM-ExplorationAndMining]]
   - [5.3 Additional Star Station & Habitable World Mechanics] - [[GS_UIM-HabitableWorlds]]
6. [Ship Arsenal & Combat Systems] - [[GS_SC-ShipsAndCombat]]
7. [Factions & Enemy AI] - [[GS_FAI-FactionsAndAI]]
8. [Scaling, Visual Enhancements & Balancing] - [[GS_SV-ScalingAndVisuals]]
9. [Final Development Order Summary]
10. [Future Enhancements](#10-future-enhancements)

---

## 1. Project Skeleton & Core Setup

**Goal:** Establish the game’s foundational structure and set up the initial project environment.

- **Create a New Project:**
  - Set up an initial “Gameplay” scene/world with the Mothership as the central hub.
  - Prepare the base **Main Menu UI** for empire naming and banner creation.
  - Create at least one **Game World** (the “local system”) where the Mothership is placed.

- **Empire Naming & Banner Creation:**
  - **UI Input:** Add a text field for players to enter an empire name.
  - **Dynamic Text:** Replace placeholders (e.g., `{Galactic_Sprawl}`) with the chosen empire name throughout the UI.
  - **Banner Selection:** Implement a sprite selection or color customization tool for banners.

- **Basic Camera & Player Control:**
  - Establish a stationary camera view centered on the Mothership.
  - Add interactive camera actions (e.g., zooming into specific assets like the Colony Star Port).
  - Ensure the scene is large enough for future expansions (star stations, ships, etc.).

_At the end of this phase, you will have a fundamental game shell: Menu → Empire Naming → Initial Game World with the central Mothership._

---

## 2. HUD, Maps & UI Views

This section covers all on-screen UI elements and interactive maps that form the player’s interface to the game’s mechanics. Each subsection explains design, implementation techniques, and recommended third-party libraries using TypeScript, React, and .tsx.

### 2.1 Default VPR UI View - [[GS_MV-VisualProgressRepresentationUIView]]

**Purpose:** Consolidate all Visual Progression Representation (VPR) assets into a cohesive “Star System Screen” that dynamically shows the current state of the star system.

- **Core Visual Components:**
  - **Star System Backdrop:**
    - Create a parallax star background (using CSS effects or [react-three-fiber](https://github.com/pmndrs/react-three-fiber) for 3D).
    - _Library Suggestion:_ [react-parallax](https://www.npmjs.com/package/react-parallax)
  - **Central Mothership VPR:**
    - Render as the central, evolving structure with animations (use SVG or [react-konva](https://konvajs.org/docs/react/)).
    - Add hover effects and click interactivity for detailed stats or upgrades.
  - **Colony Star Station, Habitable World, Exploration Hub, Mineral Processing Centre, Officer Academy & Ship Hanger VPRs:**
    - Each component should have its own animations and interactive elements (e.g., easing animations via [react-spring](https://www.react-spring.io/) or [Framer Motion](https://www.framer.com/motion/)).
  - **Additional VPR Elements:**
    - Visual cues for population, trade routes, and upgrade transitions (using [react-particles-js](https://www.npmjs.com/package/react-particles-js) or GSAP for complex sequences).

- **Component Architecture & Technical Implementation:**
  - **Hierarchy:** A top-level `<VPRStarSystemView />` with child components for each module.
  - **State Management:** Use React Context/Redux for global state (tier levels, resource counts) and local state for individual animations.
  - **Styling & Responsiveness:** Utilize CSS-in-JS (e.g., styled-components) for consistent themes (dark backgrounds, cyan accents).

- **Implementation Summary:**
  - Integrate dynamic data to update visuals in real time.
  - Optimize performance with memoization and lazy loading.
  - Include interactive hooks (hover, click, hotkeys) for a seamless player experience.

---

### 2.2 Global HUD & Module UI Elements - [[GS_GUI-GlobalUIImplementations]]

**Purpose:** Build the central overlay that gives players access to core gameplay functions via an organized, color-coded submenu system.

- **Structure & Layout:**
  - **Container Component:** Create a `HUDContainer` to manage global state and active submenus.
  - **Submenu Components:** Develop separate components for Mining, Exploration, Mothership, and Colony Star Station.
  - **Collapsible Panels:** Implement an accordion-style mechanism so that only one submenu is open at a time.
  - **Theming:** Use unique color schemes (e.g., bronze for Mining, teal for Recon, cyan for Mothership) via a theming solution like styled-components’ ThemeProvider.

- **Scrolling & Custom Scrollbars:**
  - Wrap overflow content in a scrollable container.
  - _Library Suggestion:_ [react-scrollbars-custom](https://www.npmjs.com/package/react-scrollbars-custom) for a custom-styled scrollbar (cyan thumb on a dark track).

- **Keyboard Shortcuts & Interactivity:**
  - Integrate hotkeys (e.g., **S** for toggling the Civilization Sprawl View) using [react-hotkeys](https://www.npmjs.com/package/react-hotkeys).
  - Enhance UI responsiveness with smooth transition animations (via [react-spring](https://www.react-spring.io/) or [Framer Motion](https://www.framer.com/motion/)).

---

### 2.3 Civilization Sprawl UI View [[GS_MV-CivilizationSprawlView]]

**Purpose:** Present a master overview of the player’s empire with stylized visuals that include parallax backgrounds, zone indicators, and interactive system markers.

- **Key Elements:**
  - **Sprawl View Button:**
    - Labeled dynamically with the custom empire name (e.g., “Nova Imperium Map”).
    - Hotkey **S** toggles the view.
  - **Visual Components:**
    - **Parallax Star Background:** Provides depth.
    - **Zone Indicators:**
      - Dark Zones for unexplored areas.
      - Hostile Zones with red, pulsing overlays.
    - **Colonized Systems:** Displayed as glowing cyan orbs with expanding auras.
    - **Trade Routes:** Animated particle flows connecting systems.
  - **Interactivity:**
    - Hovering/clicking on systems reveals detailed stats or triggers travel actions.
    - Use tooltip libraries (e.g., [react-tooltip](https://www.npmjs.com/package/react-tooltip)) for additional info.

- **Implementation:**
  - Build a dedicated `<SprawlView />` component.
  - Use conditional rendering for different layers and filters (colonies, minerals, exploration).

---

### 2.4 Tech Tree UI [[GS_TTR-TechTree]]

**Purpose:** Integrate the research/progression system where each technology or upgrade node is linked to a specific Tier (1, 2, or 3).

- **Core Features:**
  - **Tech Tree Scene/UI:**
    - Create a dedicated “Research” overlay showing three scrollable vertical columns for War, Recon, and Mining.
    - Display Tier 1 nodes at the top, Tier 2 in the middle, and Tier 3 at the bottom.
    - Mark locked items with lock icons or grayed-out buttons.
  - **Tier Unlock Requirements:**
    - Define criteria for unlocking nodes (resource cost, time, existing buildings, etc.).
    - Tie upgrade logic to visual changes (e.g., a larger radar dish when upgraded).
- **Component & Data Architecture:**
  - Build a `<TechTree />` component with subcomponents like `<TierColumn tier={1} />`.
  - Use dynamic data and interactive elements (tooltips, progress indicators).
  - _Library Suggestions:_
    - [react-d3-tree](https://github.com/bkrem/react-d3-tree) or custom d3.js layouts.
    - [react-spring](https://www.react-spring.io/) for smooth transitions.

---

### 2.5 Local Galaxy Map & Travel Mechanics [[GS_MV-LocalGalaxyMap]]

**Purpose:** Create an interactive map of local star systems with travel and colonization options.

- **Map Layout & Visuals:**
  - Develop a `<GalaxyMap />` component that renders an SVG or Canvas-based map.
  - Distribute star systems in a spiral pattern using a layout algorithm (e.g., d3-force).
  - Color-code systems based on state (gray for locked, blue for unlocked, red for enemy/faction).

- **Interactivity & Controls:**
  - Add clickable buttons on unlocked systems to trigger “Travel” or “Colonize” actions.
  - Implement zoom and pan controls (e.g., using [d3-zoom](https://github.com/d3/d3-zoom)).
  - Include tooltip and detail popups for additional star system information.

---

### 2.6 Mothership & Colony Star Station UIs - [[GS_UIM-MothershipAndColonyUIMenu]]

**Purpose:** Develop the main build menus and control interfaces for the Mothership and its associated Colony Star Stations.

- **Mothership UI (Build Menu):**
  - Create a `<MothershipBuildMenu />` component that displays upgrade icons (Radar, Ship Hanger, Officer Academy, etc.) in a grid or list.
  - Use CSS Grid/Flexbox for layout and incorporate state-dependent button styling (enabled/disabled based on resources).
  - _Library Suggestion:_ Consider a UI framework (e.g., [Material-UI](https://mui.com/)) for consistent styling and use [react-spring](https://www.react-spring.io/) for animated transitions.

- **Colony Star Station UI (Map & Build Menu):**
  - Develop a `<ColonyStationMap />` component using SVG or Canvas (via [react-konva](https://konvajs.org/docs/react/)) to render the colony layout.
  - Dynamically display modules as the colony grows with animated “expansion” of neighborhoods.
  - Integrate detailed module interactions (click-to-view stats, upgrades, and trading logic).

---

### 2.7 Exploration Hub & Mineral Processing Centre UIs - [[GS_UIM-ExplorationAndMining]]

**Purpose:** Provide dedicated windows for managing galaxy exploration and mineral resource processing.

- **Exploration Hub UI:**
  - Build an `<ExplorationHub />` component that displays recon ship positions and exploration progress.
  - Render a filtered, dynamic map (similar to the Galaxy Map) focused on exploration data.
  - Use libraries like [react-d3-graph](https://github.com/danielcaldas/react-d3-graph) or [react-three-fiber](https://github.com/pmndrs/react-three-fiber) for 3D overlays.
  - Add hover interactions (via [react-tooltip](https://www.npmjs.com/package/react-tooltip)) to show detailed system stats.

- **Mineral Processing Centre UI:**
  - Create a `<MineralMap />` component that displays icons for various minerals (Copper, Iron, Titanium, etc.).
  - Include a sidebar or overlay for setting priority levels, min/max thresholds, and a “Mine All” toggle.
  - _Library Suggestions:_ Use charting libraries such as [Recharts](https://recharts.org/en-US/) or [Victory](https://formidable.com/open-source/victory/) for data visualization and [react-spring](https://www.react-spring.io/) for animated state changes.

---

### 2.8 Officer Academy & Ship Hanger UIs - [[GS_UIM-OfficersAcademyAndShipHanger]]

**Purpose:** Manage the training and deployment of officers and ship construction.

- **Officer Academy UI:**
  - Create an `<OfficerAcademy />` component displaying available officers, training progress bars, and animated training sequences.
  - Use [Framer Motion](https://www.framer.com/motion/) for advanced animations and optionally [react-progressbar.js](https://github.com/kimmobrunfeldt/react-progressbar.js) for XP indicators.

- **Ship Hanger UI:**
  - Develop a `<ShipHanger />` component that shows available ship classes and visually represents docking bay expansions.
  - Use dynamic SVG illustrations with animations (via [react-spring](https://www.react-spring.io/)) to indicate tier progress.
  - Ensure a responsive layout that adapts to different screen sizes.

---

### 2.9 Habitable World UI - [[GS_UIM-HabitableWorlds]]

**Purpose:** Display a unique, circular representation of a habitable planet along with its key statistics (population, minerals, lost technology, anomalies).

- **Component Structure:**
  - Build a `<HabitableWorld />` component rendered as a modal or separate window.
  - Use SVG or Canvas (via [D3.js](https://d3js.org/) or [react-vis](https://github.com/uber/react-vis)) for a dynamic, animated planet representation.
  - Integrate clickable elements and tooltips for in-depth statistical views.

---

### 2.10 Experience & Leveling UI

**Purpose:** Visually represent player progression through XP gains and level-ups.

- **Component Structure:**
  - Create an `<ExperiencePanel />` accessible via the HUD.
  - Display XP progress bars (for ships and roles) and level-up animations.
  - _Library Suggestions:_ [React-ProgressBar.js](https://github.com/kimmobrunfeldt/react-progressbar.js) and [Framer Motion](https://www.framer.com/motion/) for smooth transitions.

---

## 3. Core Gameplay Logic & Tier 1 Modules - [[GS_GL-CoreGameplayLogic]]

**Purpose:** Implement the core mechanics for the Mothership and its basic modules (Tier 1).

- **Mothership Core Logic:**
  - Set up resource counters (minerals, population, etc.) and use global or scene-level variables.
  - Add buy/build buttons for initial modules (e.g., Star Station Colony, Radar, Ship Hanger).

- **Tier 1 Module Implementations:**
  - **Radar (Tier 1):**
    - Attach a “satellite dish” or antenna model to the Mothership.
    - Write automation logic to reveal local resources or nearby ships.
    - Provide UI feedback indicating Radar activation.
  - **Ship Hanger (Tier 1):**
    - Place a docking bay near the Mothership.
    - Create UI elements for building basic ships (War, Recon, Mining).
    - Implement auto-spawn of ships (e.g., Spitflare or Rock Breaker) near the hanger.
  - **Officer Academy (Tier 1):**
    - Build a basic Academy UI with a “Hire” button.
    - Track available officer counts and display a simple building sprite.
  - **Star Station Colony (Tier 1):**
    - Add logic to purchase a Colony from the Mothership.
    - Implement basic population growth and a timer-based trading logic (e.g., every 5 seconds).

_At the end of this phase, the Mothership with all Tier 1 modules and a basic Colony should be functional in your environment._

---

## 4. Galaxy Map & Travel Mechanics - [[GS_MV-LocalGalaxyMap]]

**Purpose:** Allow players to navigate between star systems and colonize new territories.

- **Galaxy Map Implementation:**
  - Create a separate world/scene for the Galaxy Map (activated via a hotkey or UI button).
  - Layout star systems in a spiral distribution and color-code them (locked vs. unlocked).
- **Colonization Logic:**
  - For unlocked systems, add a button/node to trigger “Colonize.”
  - Implement logic to spawn a Pilgrim Ship that travels from the Mothership to establish a Colony Starport.
- **Transition Effects:**
  - Handle smooth transitions between systems (using UI buttons or portal-like effects).

---

## 5. Advanced Gameplay Layers

Once the core mechanics and basic navigation are in place, expand with advanced UI layers and automation systems.

### 5.1 Civilization Sprawl View - [[GS_MV-CivilizationSprawlView]]

**Purpose:** Provide a high-level, stylized overview of the entire empire.

- **Visual Elements:**
  - Use a parallax star background.
  - Render dark (unexplored) zones and hostile (red, pulsing) zones.
  - Mark colonized systems with glowing cyan orbs and population indicators (expanding rings).
  - Animate trade routes (particle lines) connecting systems.
- **Interactivity:**
  - Allow hovering/clicking on systems to reveal stats.
  - Include a toggle/exit button to return to the main game.

---

### 5.2 Mining & Exploration UIs (Automation) - [[GS_UIM-ExplorationAndMining]]

**Purpose:** Automate resource collection and exploration as part of the game’s economy.

- **Mining – Mineral Processing Centre & Mining Map:**
  - Place a purchase option under the Mothership or Colony for the Mineral Processing Centre.
  - Build an overlay or tab displaying discovered resource nodes.
  - Implement priority settings (min/max thresholds, “Mine All” toggle) linked to mining ships.
  - Automate resource deduction from nodes and deposits to the Mothership/Colony.
- **Exploration Hub (Recon):**
  - Unlock a hub (Tier 1 basic or Tier 2 advanced) that spawns recon ships.
  - Overlay a partial galaxy map that updates as recon ships explore unmapped sectors.
  - Automate XP gain for recon ships upon discovering new systems.

---

### 5.3 Additional Star Station & Habitable World Mechanics - [[GS_UIM-HabitableWorlds]]

**Purpose:** Enhance the colony system with habitable planets and automated expansion.

- **Habitable World Generation:**
  - In each colonized system, optionally spawn a “Habitable Planet” object.
  - Animate city lights or population growth over time.
- **Food/Crop Synergy & Expansion:**
  - Tie biodome crops or advanced modules to boost planet growth.
  - Animate trade ships (with distinctive golden livery) traveling between the planet and the colony.
  - Implement automated expansion logic at advanced Tiers to colonize adjacent star systems based on population/resource criteria.

---

## 6. Ship Arsenal & Combat Systems - [[GS_SC-ShipsAndCombat]]

**Purpose:** Introduce combat mechanics and a variety of ship classes for warfare.

- **War Ship Prefabs:**
  - Create or import ships (e.g., Spitflare, Star Schooner, Orion’s Frigate, Harbringer Galleon, Midway Carrier, Mother Earth’s Revenge).
  - For each ship, attach core stats (Weapon, Armor, Speed) and ensure visual differences between Tiers.
- **Ship Tier Upgrades:**
  - Link each ship’s upgrade path (e.g., upgrading Orion’s Frigate requires Tier 2 Ship Hanger) with visual representation changes.
- **Weapon Systems:**
  - Implement weapons (Machine Guns, Gauss Cannon, Rail Gun, MGSS, Rockets, etc.) with proper behaviors (bullets, collision, damage triggers).
- **Combat Automation:**
  - When Radar detects an enemy or a system is flagged as “threat,” automate war ship interception.
  - Script engagement ranges and combat decision logic.
- **Recon & Mining Ships:**
  - Finalize recon (AC27G “Andromeda Cutter”) and mining ships (Void Dredger) for Tier 2/3 with proper attributes.

---

## 7. Factions & Enemy AI - [[GS_FAI-FactionsAndAI]]

**Purpose:** Integrate enemy factions and AI behavior to provide conflict dynamics.

- **Factions Setup:**
  - Implement separate AI logic groups for each faction: Space Rats (always hostile), Lost Nova (reactive hostility), and Equator Horizon (conditional appearance based on empire size or Tier).
- **Faction Fleets & Behavior:**
  - Create prefab ships for each faction (e.g., “The Rat King,” “Eclipse Scythe,” etc.) and assign them AI states.
- **Territorial Spawning:**
  - Script logic to spawn enemy fleets when players enter specific star systems or after a set time.
  - Mark enemy systems on the Galaxy Map (red or purple indicators).
- **Conflict & Diplomacy (Optional):**
  - Decide whether to allow negotiation or if the factions remain purely hostile.

---

## 8. Scaling, Visual Enhancements & Balancing - [[GS_SV-ScalingAndVisuals]]

**Purpose:** Prepare for late-game complexity and ensure the game scales up to 50+ star systems with robust visuals and balanced mechanics.

- **Auto-Scaling:**
  - Ensure resource counters, system switching, and save/load logic handle a large number of star systems.
- **Visual Enhancements:**
  - Add background visuals for advanced systems (e.g., star lanes, denser trade lines, animated population ships).
  - Update building upgrade visuals (e.g., Radar T3, Mining Centre T3) with unique states or color changes.
- **Final Asset Integrations:**
  - Revisit the Tech Tree to integrate final Tier 3 items (such as capital ships).
- **Internal Balancing:**
  - Fine-tune resource flow, ship stats, and faction difficulty through variable adjustments and code refinements.

---

## 9. Final Development Order Summary

Follow this sequential order to systematically implement **Galactic Sprawl**:

1. **Project Skeleton & Empire Naming**
2. **HUD & Organized Submenu System**
3. **Core Mothership Assets (Tier 1 Modules)**
4. **Implement Tech Tree & Tier Logic**
5. **Local Galaxy Map & Travel Mechanics**
6. **Civilization Sprawl View**
7. **Mining & Exploration UIs (Automation Systems)**
8. **Star Stations & Habitable World Mechanics**
9. **Ship Arsenal & Combat Systems**
10. **Factions & AI Behavior**
11. **Late-Game Structures (Dyson Spheres) & High-Level Scaling**
12. **Balancing & Finishing Touches**

---

## 10. Future Enhancements

- **Dyson Sphere Construction:**
  - Treat the Dyson Sphere as a multi-stage “building” linked to Tier 3 or advanced Tech.
  - Visually represent it as a partial ring around a star that fills in as more segments are built.
- **Additional Advanced Modules:**
  - Consider additional automation, enhanced diplomacy, or more complex trade routes as you expand the game.
