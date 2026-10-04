# Expanded UI Interactive Menu: Exploration Hub & Mineral Processing Centre

This section details the design and functionality for the Exploration Hub and Mineral Processing Centre modules. These two interfaces are essential for managing the exploration of galaxies and controlling mining operations, respectively. Each module is designed with real-time data updates, interactive visualizations, and user-friendly controls that allow players to quickly assess and act on in-game information.

This document consolidates all UI assets and interaction details into a single reference page, providing a roadmap for a fully functioning UI for the allocated Modules in the project. The plan is written for a TypeScript/React (.tsx) implementation and includes recommended methods, techniques, and third-party libraries to help you achieve a polished, responsive, and interactive experience.

The **Mining UI** & **Exploration UI** serve as the backbone for automated resource gathering and galaxy mapping in **Galactic Sprawl**. Two dedicated windows—the **Mineral Processing Centre & Mining Map Window** and the **Exploration Hub (Recon)**—allow players to manage mining priorities, dispatch specialized ships, and monitor the discovery of new resources and systems.

---

## Exploration Hub UI

### Overview & Purpose

The **Exploration Hub** is the primary interface for monitoring galaxy exploration progress. Its main objectives are to:

- Display the overall progress of exploration through a filtered map that highlights:
  - **Mapped regions:** As recon ships update the galaxy.
  - **Unmapped (dimmed) areas:** Indicating regions that are yet to be explored.
  - **Recon ship positions:** Real-time positions of active recon units.
- Provide interactive access to detailed system information and anomaly data.
- Act as a control center where players can adjust exploration settings and quickly access newly discovered sectors.

### Functional Requirements

- **Filtered Map Display:**
  - Render a map that distinguishes between fully mapped, partially mapped, and unmapped sectors.
  - Use visual cues such as brightness, opacity, and color overlays (e.g., dimmed for unexplored, highlighted for recently discovered areas).
- **Real-Time Updates:**

  - Integrate live updates so that as recon ships gather data, the map reflects changes in real time.
  - Display the current position and trajectory of recon ships using animated icons or markers.

- **Interactive Elements:**

  - **Tooltips & Popovers:** On hovering over a system, show key details (e.g., discovered anomalies, resource potential, and system name).
  - **Click-to-Detail:** Allow users to click a system to open a detailed view or modal containing further exploration data, including possible routes, anomalies, or hidden tech discoveries.
  - **Filtering Controls:** Provide UI controls (such as checkboxes, sliders, or dropdown menus) to filter the map by criteria like exploration progress, anomaly presence, or recon ship activity.

- **Additional Information & Alerts:**
  - Integrate notification elements (e.g., badges or alerts) to inform players when new areas are fully mapped or when anomalies are detected.
  - Allow toggling between a “heat map” view (indicating the density of exploration data) and a standard view.

### UI Components & Layout

- **Main Container: `<ExplorationHub />`**
  - Acts as the central dashboard.
  - Contains a header with filtering options and a real-time status indicator.
- **Map View Panel:**
  - Utilize an SVG or Canvas-based component to render the exploration map.
  - Use layered rendering to separate background (galaxy starfield), mapping overlays, and recon ship icons.
- **Control Sidebar/Overlay:**

  - A collapsible sidebar that holds filtering controls and a legend explaining the map’s visual cues.
  - Contains a “Refresh” or “Auto-Update” toggle to control real-time updates.

- **Detail Modal/Popover:**
  - A modal or popover component that is triggered when a system is clicked.
  - Displays detailed system data (e.g., resource potential, discovered anomalies, connected systems) and any relevant exploration notes.

### Implementation Techniques

- **Rendering & Animations:**

  - **react-d3-graph / d3.js:** Use for rendering dynamic graphs or network layouts that can represent galaxy sectors.
  - **react-three-fiber:** If a 3D overlay is desired, use this library for rendering recon ship icons or creating subtle depth effects.
  - **react-spring / Framer Motion:** To animate transitions on the map (e.g., fading in mapped regions or smoothly moving recon ship markers).

- **Interactivity:**

  - **react-tooltip:** Implement tooltips for system details on hover.
  - **react-hotkeys:** For keyboard shortcuts (e.g., to toggle between heat map and standard views or to quickly focus on a specific system).

- **State Management:**

  - Use React Context or Redux to manage real-time exploration data and UI states (filters, selected system, auto-update status).

- **Data Integration:**

  - Implement a polling or subscription mechanism (e.g., via WebSocket or an API polling service) to update exploration data continuously.
  - Ensure that data visualization components update efficiently by memoizing components where possible.

- **Responsive Design:**
  - Ensure the exploration hub is usable on both desktop and mobile devices by employing responsive design techniques (e.g., CSS Grid/Flexbox and media queries).
- **Performance Optimization:**
  - Use lazy loading for detailed system views and heavy graphics.
  - Optimize SVG and Canvas rendering to maintain smooth interactivity even with large datasets.

## Exploration Hub Map View Window (Recon)

### Exploration Hub Building

- **Integration & Access:**

  - **Placement:**  
    The Exploration Hub can be constructed on the Mothership or within a Colony. It is designed as a central control node for recon missions.
  - **Tiered Functionality:**
    - **Tier 1:** Basic hub with limited recon ship deployment and simple mapping of nearby sectors.
    - **Tier 2:** Advanced capabilities such as faster recon ship dispatch, improved mapping resolution, and additional data layers (e.g., anomalies, resource hotspots).

- **Visual Representation:**
  - A compact hub icon or building model integrated into your base’s interface.
  - Animated elements such as spinning radar dishes or glowing data screens that imply continuous scanning.

### Exploration Map View UI Window

- **Layout & Structure:**

  - **Overlay Map:**  
    The Exploration Window overlays a partial “galaxy map” showing both mapped and unmapped sectors.
    - **Mapped Sectors:**  
      Clearly delineated with visible resource nodes and known system details.
    - **Unmapped Sectors:**  
      Appear as dimmed areas or “fog of war” zones, indicating potential for discovery.
  - **Interactive Sectors:**  
    Clicking on an unmapped sector highlights it and displays basic expected data (e.g., likelihood of habitable worlds, resource potential).

- **Automation & Recon Dispatch:**

  - **Automatic Recon Ship Deployment:**  
    Recon ships are automatically dispatched from the Exploration Hub to investigate unmapped sectors.
    - **Path Animation:**  
      Visualized by animated vector lines or radar sweeps that indicate the path of each recon ship.
  - **Experience & Data Collection:**
    - As recon ships complete their missions, the system automatically updates the Mining Map and the global Galaxy Map with new information.
    - Recon ships gain XP during missions, which is displayed in the UI as progress bars or numerical values.

- **Interactive Anomaly Markers:**  
  When recon ships detect anomalies or unique features, these are highlighted on the map with distinct icons. Clicking these markers can provide bonus information or trigger side quests.
- **Mission History & Logs:**  
  A side panel that logs recent recon missions, discoveries, and any alerts (e.g., hostile encounters during exploration).
- **Filter & Search Options:**  
  Allow players to filter exploration data (e.g., show only sectors with high resource potential or marked anomalies) and quickly search for specific systems.
- **Real-Time Data Integration:**  
  Ensure that as recon ships gather new data, both the Exploration Window and Mining Map update dynamically, reflecting the evolving nature of the galaxy.

---

## Mineral Processing Centre UI

The **Mineral Processing Centre** is designed as the command center for managing all discovered mineral nodes. Its key objectives are to:

- Provide a filtered, icon-based map displaying mineral nodes (such as Copper, Iron, Titanium, etc.) as discovered by recon ships or radar scans.
- Enable players to set and adjust priority levels, minimum and maximum thresholds, and to toggle a “Mine All” function.
- Serve as the central point for managing mining operations and resource flows.

- **Mineral Map Display:**

  - Render a map or grid view that shows icons representing different mineral nodes.
  - Each mineral type should have a unique visual icon that is both thematic and easily recognizable.
  - Display visual cues (such as color coding or blinking outlines) to indicate node status (e.g., high priority, below threshold, or currently active for mining).

- **Control Panel & Sidebar:**
  - Provide an interactive sidebar or overlay for setting mining parameters:
    - **Priority Levels:** Allow users to set a priority ranking for each mineral (e.g., from 1 to 4).
    - **Threshold Settings:** Input fields or sliders for setting minimum and maximum resource thresholds.
    - **“Mine All” Toggle:** A button that overrides individual settings to enable full-scale extraction.
- **Data Visualization:**
  - Use charts or progress bars to represent current stockpiles, extraction rates, and the overall efficiency of the mining operations.
  - Provide real-time feedback as mining ships extract resources and update resource pools.
- **Interactivity & Feedback:**

  - Enable tooltips on mineral icons to quickly display key metrics (e.g., current stock, extraction rate).
  - Animate changes when thresholds are reached or when the “Mine All” mode is activated, such as pulsing or glowing effects on the relevant icons.
  - Allow users to filter or sort the mineral list by type, priority, or current yield.

- **Main Container: `<MineralMap />`**
  - The primary component that contains both the mineral map and the control panel.
- **Mineral Icon Grid/Map:**
  - A dynamic, scrollable grid or overlay map that displays each mineral node with its unique icon.
  - Icons should be interactive (hover to reveal details, click to open detailed view or adjust settings).
- **Control Sidebar/Overlay:**
  - A dedicated sidebar for input controls:
    - **Priority Selectors:** Dropdowns or buttons for each mineral type.
    - **Threshold Sliders/Inputs:** Use slider components for easy adjustment of min/max values.
    - **“Mine All” Button:** A prominent toggle that overrides individual settings.
  - May also include summary charts (using charting libraries) to display overall mining performance.
- **Detail Modal/Expanded View:**

  - When a mineral icon is clicked, open a modal with detailed information:
    - Historical yield data, extraction efficiency, and comparisons with other minerals.
    - Graphs (e.g., line charts or bar charts) to visualize resource accumulation over time.

- **Rendering & Animations:**

  - **Recharts / Victory:** Use for data visualization to create responsive charts that update in real time.
  - **react-spring:** To animate changes in threshold values, icon states, or the activation of the “Mine All” mode.
  - **CSS-in-JS (styled-components or Emotion):** For consistent theming and smooth UI transitions.

- **Interactivity:**

  - **React-Tooltip:** For quick mineral stats on hover.
  - **Material-UI:** For prebuilt components such as sliders, dropdowns, and buttons that can be customized for the sci-fi theme.
  - **React Hotkeys:** For keyboard shortcuts to quickly toggle the “Mine All” mode or navigate between mineral types.

- **State Management:**

  - Utilize React Context or Redux to manage the state of mining priorities, threshold values, and the build queue for mining ships.
  - Ensure that the UI updates in real time as recon data updates the list of mineral nodes.

- **Data Integration:**

  - Implement a polling mechanism or WebSocket connection to continuously fetch updated mineral data.
  - Optimize data visualization components using memoization to prevent unnecessary re-renders.

- **Responsive Layout:**
  - Ensure that both the mineral icon grid and the control sidebar adapt gracefully to different screen sizes.
- **User Feedback:**
  - Provide immediate visual feedback (animations, color changes) when threshold values are updated or when a mineral node changes status.
- **Performance:**
  - Use lazy loading for detailed charts and heavy graphical components to maintain UI responsiveness.
- **Testing & Prototyping:**
  - Use Storybook to develop and test individual mineral components and control panels before integrating them into the full Mineral Processing Centre UI.

## Mineral Processing Centre & Mining Map Window

### Mineral Processing Centre Building

- **Integration & Access:**

  - **Purchase & Placement:**  
    The Mineral Processing Centre can be purchased as an upgrade option from the Mothership or any established Colony. It appears as an upgrade tile or building in your colony’s management UI.
  - **Tiered Capabilities:**
    - **Tier 1:** Provides basic refining and resource deposit functions.
    - **Tier 2:** Unlocks advanced processing capabilities (e.g., faster refining, increased storage, and automated sorting).
    - **Tier 3:** Adds specialized processing for rare materials and integrates with the overall automation systems (e.g., dynamic allocation between Mothership and Colony pools).

- **Visual Representation:**
  - A distinct building model or icon that reflects its industrial nature.
  - Status indicators (e.g., progress bars for refining, alerts for overflows or resource surpluses).

### Mining Map Window

- **Overview & Layout:**

  - **Dedicated Overlay/Tab:**  
    The Mining Map is a separate overlay that can be toggled from the main HUD or accessed via a dedicated button within the Mineral Processing Centre module.
  - **Resource Node Display:**  
    Discovered resource nodes (asteroids, planet-based minerals, etc.) appear as icons or nodes on a simplified map. Each node displays basic information such as mineral type, abundance, and distance from the current system.

- **Priority & Control Settings:**

  - **Priority Sliders & Thresholds:**  
    Allow players to set minimum and maximum thresholds for each mineral type. For example:
    - _Copper:_ Min: 3,000 units, Max: 10,000 units.
    - A “Mine All” toggle for rapid resource extraction.
  - **Interactive Node Controls:**  
    Clicking on a resource node brings up a detailed panel with additional data (e.g., extraction rate, estimated depletion time) and a confirmation button to set or adjust mining priorities.

- **Automation & Feedback:**

  - **Automated Dispatching:**  
    Once priorities are set, the system automatically dispatches the appropriate mining ships (e.g., Rock Breaker or Void Dredger) to the resource nodes.
    - **Dynamic Routing:**  
      The system determines optimal routes and dispatch sequences, based on resource proximity and urgency.
  - **Real-Time Updates:**  
    As mining ships extract resources, the nodes visually deplete and progress indicators update in real time.
  - **Resource Transfer:**  
    Extracted resources are automatically deducted from the source and deposited into the corresponding storage (Mothership or Colony).

- **Resource Filtering & Sorting:**  
  Implement filters to allow players to sort resource nodes by type, abundance, distance, or extraction priority.
- **Alert Notifications:**  
  Pop-up notifications or subtle UI cues when a node reaches a critical low threshold or when storage is nearly full.
- **Tech Tree Synergy:**  
  Integrate UI feedback that shows how Tech Tree upgrades (e.g., Advanced Refinement Processes) are impacting mining efficiency and throughput.
- **Interactive Tutorials:**  
  An onboarding guide for first-time players explaining how to set priorities, adjust thresholds, and manage the mining fleet.

---

## Overall Integration & Best Practices

### Consistent Theming & Visual Style

- Use a consistent sci-fi theme across both modules with dark backgrounds, neon or glowing accents, and futuristic fonts.
- Employ CSS-in-JS libraries (styled-components or Emotion) to ensure uniform styling and ease of maintenance.

### Centralized State Management

- Consider a centralized state (using Redux or React Context) that holds exploration data, mineral node status, and mining control settings.
- Ensure that both modules update dynamically in response to in-game events (e.g., recon ship discoveries, mining operations).

### Animations & Interactivity

- Use animation libraries like **react-spring** and **Framer Motion** to create smooth transitions, pulsing effects, and interactive feedback.
- Integrate tooltips and modals (via **react-tooltip** and Material-UI components) to provide additional detail without cluttering the main UI.

### Performance & Responsiveness

- Optimize rendering of SVG/Canvas elements for real-time updates.
- Use lazy loading (React.lazy) for non-critical components and memoization (React.memo) for performance-intensive elements.

---

## Summary

This expanded design plan provides a comprehensive roadmap for implementing interactive menus for the **Exploration Hub** and **Mineral Processing Centre** modules in your game:

- **Exploration Hub UI:**
  - Features a dynamic, filtered map that displays exploration progress, recon ship positions, and interactive system details.
  - Utilizes libraries such as **react-d3-graph**, **react-three-fiber**, and **react-spring** for rich, real-time visualizations and animations.
- **Mineral Processing Centre UI:**
  - Provides a mineral node map with unique icons, interactive control panels for setting mining priorities and thresholds, and real-time data visualization using **Recharts** or **Victory**.
  - Uses **react-spring** and Material-UI components to animate threshold changes and manage user interactions.

By following this design plan, you can build a polished and fully interactive UI that enables players to manage exploration and mining operations seamlessly, with real-time updates, responsive design, and engaging visual feedback—all integrated into your TypeScript/React (.tsx) project.

By consolidating the **Mining & Exploration UIs** into two cohesive modules—the **Mineral Processing Centre & Mining Map Window** and the **Exploration Hub (Recon)**—the game ensures that players have intuitive control over automated resource extraction and galaxy mapping. Key features include:

- **Clear Visual Feedback:**  
  Detailed node displays, dynamic progress indicators, and interactive controls that inform players of current resource levels and exploration statuses.
- **Robust Automation:**  
  Automated dispatch of mining and recon ships based on user-defined priorities, ensuring efficient resource management without micromanagement.
- **Dynamic Integration:**  
  Seamless updating of resource nodes and exploration data that integrates with both the Galaxy Map and Tech Tree, reinforcing the interconnected nature of your empire’s growth.
- **Enhanced User Experience:**  
  Filters, alerts, and interactive tutorials help new and experienced players alike optimize their mining and exploration strategies.

This consolidated approach ensures that the backbone of automated resource gathering and galaxy mapping in **Galactic Sprawl** is both comprehensive and easy to use, providing a satisfying blend of strategy and automation for players as they expand their interstellar empire.
