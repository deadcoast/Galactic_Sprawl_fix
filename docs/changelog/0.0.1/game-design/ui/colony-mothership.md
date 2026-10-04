# Mothership UI & Build Menu

The **Mothership** is the foundational Galactic Star Station that begins the **{Galactic_Sprawl}** Empire. It is the **main hub** leading to advancements.

- The following are **upgrades** and **buildings** attachable to the Mothership:
  - Radar
  - Ship Hanger
  - Officer Academy
  - Colony Star Station: Purchased at Mothership, but not attached to the Mothership.
  - Colony Star Stations act as Independant Hubs for Humans to Develop Star Systems.
- **UI Asset**: Build Menu with the Purchasable Upgrades.
- **VPR**: Massive Star Station Super Structure Asset

## Mothership UI Build Menu

- **Overview**:
  - Provides a central hub for purchasing upgrades (Radar, Ship Hanger, Officer Academy, etc.).
- **Implementation Details**:
  - Create a `<MothershipBuildMenu />` component.
  - Display upgrade icons in a grid or list, with buttons that change state (enabled/disabled) based on resource availability.
  - Use CSS Grid or Flexbox for layout.
- **Recommended Libraries**:
  - Consider a UI framework like [Material-UI](https://mui.com/) for consistent button styling.
  - Use [react-spring](https://www.react-spring.io/) for transition effects when upgrades are purchased.

## Colony Star Station UI Map & Build Menu

The Colony Star Station is Purchased from Mothership. It is the main control centre for Human Colonization Efforts.

- **Attachable Modules:**
  - Radar
  - Ship Hanger
  - Officer Academy
  - Exploration Hub
  - Mineral Processing Centre
  - Officers Academy
  - Trading Hub
- **Purpose**: Provides a base hub for humans to live in, on the Mothership itself.
- **UI Asset:** Colony UI Map Overview, Colony Build Menu for Attachable Modules.
- **VPR**:
  - Visual star station for humans to live in. As population grows, additional station “homes” or “neighborhoods” appear.
  - Network of Trading Cargo ships travelling from other colonies and the mothership.
- **TTR**: Upgradable to Tier 2, Tier 3 Colony.
- **AP**:
  - Automates ship building if a Ship Hanger is built here.
  - Dispatches all ships automatically.
  - Houses local population.
  - Colonies trade goods every 5 seconds, shuttling resources that boost population and produce synergy with any **Habitable World** in the system.
- **Developmental Buildings** _within_ this colony hud module it can include the production of seperated independant modules:
  - **Ship Hanger** (main terminal for building ships)
  - **Radar** (for local or system-wide scanning)
  - **Officer Academy** (to train officers)
  - **Exploration Hub Terminal** (for Recon Map Window)
  - **Mineral Processing Centre** (for Mining Map Window)

### Colony Star Station UI Build Menu

- **Overview**:
  - Visual representation of the colony layout (modules, neighborhoods) and a build menu for attachable modules.
- **Implementation Details**:
  - Create a `<ColonyStationMap />` component that uses SVG or a canvas-based library (like [react-konva](https://konvajs.org/docs/react/) for canvas interactions).
  - Dynamically render modules as the colony grows. Use animations to “expand” neighborhoods.
- **Additional Functionality**:
  - Detailed interactions (click on a module to view its stats and upgrades).
  - Integration with trade route visuals (animated cargo ships).
