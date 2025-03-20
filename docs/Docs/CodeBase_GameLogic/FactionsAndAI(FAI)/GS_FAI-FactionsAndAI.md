# Factions & Enemy AI Build Plan

This section establishes how to integrate multiple enemy factions with distinct behaviors and fleets into *Galactic Sprawl*. It details how to spawn, manage, and drive the AI for the three key factions while outlining methods for territorial control and, optionally, diplomacy.

The Factions & AI Section is segmented into Seven parts.

---

## Faction Assets and Ship Classes

### Space Rats (Pirates)

- **Fleet Composition (10 Ship Classes):**
- **Behavior**: Attack on sight from the beginning.  
- **Banner**: Red & black with rat sigil.  
- **Lore**: Outlaws thriving off **{Galactic_Sprawl}**’s expansions—raiding merchant traders, miners, haulers.  
- **Fleet:**  
  1. **The Rat King** – Flagship in blood-red hues.  
  2. **Asteroid Marauder** – Scavenger prowling asteroid belts.  
  3. **Rogue Nebula** – Stealthy, vanishes in deep space.  
  4. **The Rat’s Revenge** – Notorious for brutal ambushes.  
  5. **Dark Sector Corsair** – Nimble raider in lawless regions.  
  6. **The Wailing Wreck** – Eerie-sounding patchwork vessel.  
  7. **Galactic Scourge** – Heavy cruiser sowing chaos.  
  8. **Plasma Fang** – Fast attack with scavenged plasma weapons.  
  9. **The Vermin Vanguard** – Leads fleets with patchwork firepower.  
  10. **Black Void Buccaneer** – Shadowy raider in uncharted voids.

### Lost Nova (Exiles)

- **Fleet Composition (10 Ship Classes):**
- **Origin:**  
  - Composed of exiled human scientists using forbidden technologies (genetic engineering, dark matter bombs, black hole simulations).
- **Behavior:**  
  - Attacks if provoked or threatened; otherwise remains elusive.
- **Fleet Composition (10 Ship Classes):**
  1. **Eclipse Scythe** – A sleek warship equipped with a dark matter engine.
  2. **Null’s Revenge** – A massive carrier emerging from the void.
  3. **Dark Matter Reaper** – A cruiser powered by forbidden technology.
  4. **Quantum Pariah** – A stealth infiltration ship.
  5. **Entropy’s Scale** – A battleship symbolizing their philosophy of balance.
  6. **Void Revenant** – A vessel that vanishes into Null Space after raids.
  7. **Scythe of Andromeda** – An advanced dreadnought with star-tearing weapons.
  8. **Nebular Persistence** – A ship built for long-term survival in desolate space.
  9. **Oblivion’s Wake** – A destroyer known for leaving devastation.
  10. **The Forbidden Vanguard** – Their flagship, bristling with outlawed tech.

### Equator Horizon (Ancient Civilization)

- **Fleet Composition (10 Ship Classes):**
- **Origin:**  
  - An ancient faction that resurfaces to enforce universal balance when your empire grows too powerful.
- **Behavior:**  
  - They appear only under specific conditions (e.g., when your empire reaches a certain Tier or expansion threshold) and act to quell unchecked growth.
- **Fleet Composition (10 Ship Classes, labeled #75–84):**
  1. **Celestial Arbiter** – The ultimate enforcer of universal balance.
  2. **Ethereal Galleon** – A silent, star-sailing vessel powered by ancient energy.
  3. **Stellar Equinox** – A cruiser embodying perfect harmony.
  4. **Chronos Sentinel** – A ship that manipulates time during battles.
  5. **Nebula’s Judgement** – A swift vessel delivering justice to disruptors.
  6. **Aetherial Horizon** – A mythic flagship from the time of First Contact.
  7. **Cosmic Crusader** – Deployed to quench rising threats.
  8. **Balancekeeper’s Wrath** – A dreadnought against unchecked greed.
  9. **Ecliptic Watcher** – An observation vessel with unmatched stealth.
  10. **Harmony’s Vanguard** – A spearhead delivering order to chaos.

---

## Faction Setup & Grouping

- **Factions:**  
  - **Space Rats (Pirates)**  
  - **Lost Nova (Exiles)**  
  - **Equator Horizon (Ancient Civilization)**
  
- **General Setup:**  
  - Each faction is managed as a separate AI group (using React Context or Redux to maintain independent state).
  - Use asynchronous event management (e.g., RxJS) to handle spawning, system triggers, and ongoing AI behavior updates.
  - Maintain a JSON or similar configuration file for each faction that includes:
    - **Banner & Colors:** (e.g., Space Rats: red & black with a rat sigil; Lost Nova: teal & purple; Equator Horizon: ancient/muted tones)
    - **Lore & Behavior Baselines:** Descriptions of each faction’s background and how they behave (e.g., always hostile, attack when provoked, or intervene only under certain conditions).
    - **Global AI States:** Aggressive, Defensive, Stealth, or Intervention modes.

- **Separate AI Logic Groups:**  
  - **Implementation:** Treat each faction as a distinct AI group managed via its own logic module.  
  - **Methods:**  
    - Use React Context or Redux to hold the state for each faction’s active fleets and behaviors.  
    - Consider RxJS for handling asynchronous events (e.g., periodic checks for player proximity or system triggers).

- **Data Structure:**  
  - Define a JSON (or similar) configuration for each faction detailing their unique properties, such as banner colors, logos, lore, and baseline behavior parameters.  
  - Example properties:  
    - **Space Rats:** Banner (red & black), always hostile, aggressive patrol routines.  
    - **Lost Nova:** Banner (teal & purple), defensive until provoked, uses stealth and ambush tactics.  
    - **Equator Horizon:** Banner (ancient, muted tones), activates only under specific conditions (e.g., when the player’s empire exceeds a defined size or Tier level).

---

## Faction Fleets & Behavior

- **Prefab Ships per Faction:**  
  - For each faction, create prefabs for key vessels (e.g., “The Rat King” for Space Rats, “Eclipse Scythe” for Lost Nova, “Celestial Arbiter” for Equator Horizon).  
  - **Implementation:**  
    - Each prefab should include ship stats, visual assets, and preset loadouts that match the faction’s theme.
    - Store these prefabs in a central asset repository accessible by the enemy AI system.

- **AI State Assignments:**  
  - **Space Rats:**  
    - **Behavior:** Always attack on sight. Use aggressive, close-range tactics and ambush patterns.
    - **Methods:**  
      - Set their AI state to “Aggressive” by default.  
      - Use behavior trees (e.g., with a library like Behavior3JS) to define sequences for patrol → detect → engage.
  - **Lost Nova:**  
    - **Behavior:** Remain elusive; attack only if provoked or when defending resource-rich systems.
    - **Methods:**  
      - Configure states such as “Patrol,” “Stealth,” “Engage on Threat,” and “Retreat.”  
      - Consider using XState to implement state machines that control transitions based on events (e.g., a player fleet approaching or resource levels changing).
  - **Equator Horizon:**  
    - **Behavior:** Appear only when the player’s empire reaches a critical mass; then, adopt a “Balance Enforcer” mode.
    - **Methods:**  
      - Set triggers (e.g., player reaches Tier 3 in multiple systems) to activate these fleets.
      - Use conditional checks in your game state (managed via React/Redux) to spawn Equator Horizon fleets and set their AI state to “Intervention.”
      - Their behavior includes a mix of defensive formations and high-damage, timed counterattacks.

- **Third-Party Library Recommendations:**  
  - **Behavior3JS:** For constructing behavior trees that drive enemy decision-making.  
  - **XState:** To manage complex AI state transitions for diplomacy or dynamic behavior adjustments.

---

## Territorial Spawning & Map Integration

- **Spawning Methods:**  
  - **Triggered Spawning:**  
    - Spawn faction fleets when the player enters designated star systems, or after a set time interval.  
    - Use event listeners in your React components to detect system changes (e.g., using React Router hooks or custom hooks for map navigation).
  - **Random Encounters:**  
    - Introduce randomness by spawning small enemy patrols in certain “hot zones” e.g., near resource-rich systems. (managed with Redux or RxJS streams).
    - Use probability functions tied to game state (which can be managed with Redux or RxJS streams) to determine encounter frequency.
  - **Pre-Occupied Systems:**  
    - Some star systems may be pre-assigned to enemy factions and visually indicated (using D3.js or React-Vis for map overlays).

- **Territorial Indicators:**  
  - On the Galaxy Map, enemy-controlled systems are color-coded (e.g., red for Space Rats, purple/teal for Lost Nova, a distinct tone for Equator Horizon).

- **Visual Indicators on the Galaxy Map:**  
  - Color-code enemy-controlled systems based on faction (red for Space Rats, purple/teal for Lost Nova, a distinct hue for Equator Horizon).
  - **Implementation:**  
    - Integrate with your map component using libraries like D3.js (for dynamic SVG overlays) or React-Vis for rendering and updating visual elements in real time.

- **Methodology:**  
  - Use a centralized spawning function that queries current game state and then dispatches enemy fleets accordingly.  
  - Maintain a “spawn zone” list per faction in your configuration files.

---

## Conflict & Diplomacy Variables

- **Hostility Settings:**  
  - **Space Rats:** Set as purely hostile with no diplomacy.  
  - **Lost Nova:** Configure as reactive; they attack if provoked, but can otherwise remain non-engaged.
  - **Equator Horizon:** Implement a conditional appearance; they intervene only when the player’s empire exceeds a threshold.
  
- **Diplomacy:**  
  - Develop a simple UI dialogue system (using libraries such as React Modal or Material-UI Dialog) to manage negotiations.
  - Use a state machine (XState) to handle negotiation flows—e.g., “Negotiation,” “Ceasefire,” “Setup Trade Route,” etc. Trade routes should harness a visual representation of faction ships delivering goods for Trade.
  - Define variables like “aggression level,” “diplomatic reputation,” and “resource demands” that influence enemy decisions.
  - Use i18next for localization.
  - Store diplomatic outcomes in your game state and update enemy AI behavior accordingly.
  
- **Implementation Considerations:**  
  - Decide whether to allow negotiation or to keep factions purely hostile.  
  - If negotiations are enabled, provide clear UI feedback and use localization libraries (e.g., i18next) for multi-language support.

---

## Enemy AI Behavior and Methods

- **Core AI Techniques:**  
  - **Behavior Trees:**  
    - Use Behavior3JS to construct behavior trees for each faction, defining nodes for patrolling, detecting, engaging, and retreating.
    - Structure trees for each faction to reflect their combat style.
  - **State Machines:**  
    - Use XState to manage complex AI state transitions (e.g., from stealth to engagement for Lost Nova or intervention for Equator Horizon).
  - **Pathfinding & Movement:**  
    - Integrate libraries such as PathFinding.js for smooth vector or grid-based movement.
    - Integrate steering behaviors (e.g., Reynolds' Boids) for fleet maneuvers.
  
- **AI Integration with UI:**  
  - Use React hooks to update enemy AI state and trigger re-renders in your .tsx components.
  - Display enemy status on the Galaxy Map with dynamic indicators (e.g., flashing icons for active engagements).

- **Testing & Tuning:**  
  - Set up debug overlays (using React Developer Tools and custom logging) to track AI decision paths.
  - Iteratively tune parameters such as engagement ranges, aggression thresholds, and retreat triggers.

---

## Summary of Key Implementations

- **Faction Setup:**  
  - Separate AI groups for Space Rats, Lost Nova, and Equator Horizon using Redux/React Context and asynchronous event management (RxJS).
- **Fleet Behavior:**  
  - Prefab enemy ships with distinct AI states (aggressive for Space Rats, reactive/stealthy for Lost Nova, interventionist for Equator Horizon).  
  - Utilize Behavior3JS and XState for behavior trees and state machines.
- **Territorial Spawning:**  
  - Trigger enemy spawns via player movement (React hooks/event listeners) and random encounters, with visual indicators on the Galaxy Map (using D3.js or React-Vis).
- **Conflict & Diplomacy:**  
  - Define hostility parameters for each faction; optionally, integrate a negotiation system with React UI components and XState.
- **Enemy AI Techniques:**  
  - Implement behavior trees, state machines, and pathfinding for dynamic and adaptive enemy AI.
  - Leverage third-party libraries for efficient AI management and visual debugging.

---

**Conclusion:**  
This detailed design plan for Factions & Enemy AI in *Galactic Sprawl* covers all aspects necessary for implementation—from AI grouping and behavior definitions to spawning mechanisms and optional diplomacy. It provides specific methods (such as using Behavior3JS, XState, and RxJS) and integration techniques for your Typescript/React project, ensuring that enemy fleets behave in distinct, dynamic ways and that faction-specific encounters are fully integrated into your Galaxy Map and overall game state.

This section of *Galactic Sprawl* ensures that all faction assets are fully defined—including each ship class for the Space Rats, Lost Nova, and Equator Horizon—and that comprehensive methods for enemy AI behavior, spawning, territorial control, and (optionally) diplomacy are included. By leveraging third-party libraries such as Behavior3JS, XState, and PathFinding.js within your Typescript/React project, you can implement a robust, dynamic enemy AI system that scales with the player’s empire and delivers varied, immersive interstellar conflict.

By following these guidelines, a robust, fully implemented Factions & Enemy AI system that enriches gameplay, creates dynamic interstellar conflict, and scales with the player’s empire.

---

## **Factions & Enemy AI Implementation Checklist**

### **Part 1: Faction Assets and Ship Classes**

- [ ] **Space Rats (Pirates)**
  - [ ] Define 10 ship classes:
    - The Rat King (Flagship)
    - Asteroid Marauder
    - Rogue Nebula
    - The Rat’s Revenge
    - Dark Sector Corsair
    - The Wailing Wreck
    - Galactic Scourge
    - Plasma Fang
    - The Vermin Vanguard
    - Black Void Buccaneer
  - [ ] Document behavior: Attack on sight (always hostile)
  - [ ] Specify banner/colors: Red & black with rat sigil
  - [ ] Include lore: Outlaws raiding merchants, miners, and haulers

- [ ] **Lost Nova (Exiles)**
  - [ ] Define 10 ship classes:
    - Eclipse Scythe
    - Null’s Revenge
    - Dark Matter Reaper
    - Quantum Pariah
    - Entropy’s Scale
    - Void Revenant
    - Scythe of Andromeda
    - Nebular Persistence
    - Oblivion’s Wake
    - The Forbidden Vanguard (Flagship)
  - [ ] Document origin: Exiled scientists using forbidden tech
  - [ ] Document behavior: Attacks if provoked; remains elusive otherwise
  - [ ] Specify banner/colors: Teal & purple with scythe and scale
  - [ ] Include lore: Use of genetic engineering, dark matter bombs, etc.

- [ ] **Equator Horizon (Ancient Civilization)**
  - [ ] Define 10 ship classes (labeled #75–84):
    - Celestial Arbiter
    - Ethereal Galleon
    - Stellar Equinox
    - Chronos Sentinel
    - Nebula’s Judgement
    - Aetherial Horizon
    - Cosmic Crusader
    - Balancekeeper’s Wrath
    - Ecliptic Watcher
    - Harmony’s Vanguard
  - [ ] Document origin: Ancient faction enforcing universal balance
  - [ ] Document behavior: Appear conditionally (e.g., when player empire is too powerful)
  - [ ] Specify banner/colors: Ancient/muted tones
  - [ ] Include lore: Focus on balance and intervention

---

#### **Part 2: Faction Setup & Grouping**

- [ ] Manage each faction (Space Rats, Lost Nova, Equator Horizon) as a separate AI group.
  - [ ] Use React Context or Redux for independent state management.
  - [ ] Employ RxJS for asynchronous event handling (e.g., system triggers, periodic checks).
- [ ] Create a JSON (or similar) configuration for each faction detailing:
  - [ ] Banner & color scheme
  - [ ] Lore and baseline behavior parameters
  - [ ] Global AI states (e.g., Aggressive, Defensive, Stealth, Intervention)

---

#### **Part 3: Faction Fleets & Behavior**

- [ ] Create prefabs for key vessels for each faction and store them in a central asset repository.
  - [ ] Ensure each prefab includes ship stats, visual assets, and preset loadouts.
- [ ] Assign AI state behaviors:
  - [ ] **Space Rats:** Set default state to “Aggressive” using behavior trees (e.g., Behavior3JS).
  - [ ] **Lost Nova:** Define states (Patrol, Stealth, Engage on Threat, Retreat) and manage transitions (consider XState for state machines).
  - [ ] **Equator Horizon:** Set triggers (e.g., player reaches Tier 3) to activate “Intervention” mode; mix defensive formations with timed counterattacks.
- [ ] Document third-party library recommendations:
  - [ ] Behavior3JS for behavior trees
  - [ ] XState for state management
- [ ]  Faction Ship Components
- [ ] Adaptive AI Behaviors

---

#### **Part 4: Territorial Spawning & Map Integration**

- [ ] Implement spawning methods:
  - [ ] **Triggered Spawning:** Spawn fleets when the player enters designated star systems (use React Router hooks or custom event listeners).
  - [ ] **Random Encounters:** Use probability functions (managed with Redux or RxJS) to spawn small enemy patrols in “hot zones.”
  - [ ] **Pre-Occupied Systems:** Mark some star systems as enemy-controlled.
- [ ] Set up territorial indicators on the Galaxy Map:
  - [ ] Color-code systems by faction (e.g., red for Space Rats, purple/teal for Lost Nova, distinct tone for Equator Horizon).
  - [ ] Use D3.js or React-Vis for dynamic SVG overlays and real-time updates.
- [ ] Establish a centralized spawning function and maintain a “spawn zone” list per faction in configuration files.

---

#### **Part 5: Conflict & Diplomacy Variables**

- [ ] Define hostility settings for each faction:
  - [ ] **Space Rats:** Purely hostile (no diplomacy).
  - [ ] **Lost Nova:** Reactive; engage if provoked.
  - [ ] **Equator Horizon:** Activate only when player empire exceeds a threshold.
- [ ] (Optional) Implement diplomacy:
  - [ ] Develop a UI dialogue system using React Modal or Material-UI Dialog.
  - [ ] Manage negotiation flows with XState (states like Negotiation, Ceasefire, Setup Trade Route).
  - [ ] Define key variables (aggression level, diplomatic reputation, resource demands).
  - [ ] Use i18next for localization.
  - [ ] Store diplomatic outcomes in the game state and update AI behavior accordingly.
  - [ ] Trade Route Visualization Behaviors.

---

#### **Part 6: Enemy AI Behavior and Methods**

- [ ] Implement core AI techniques:
  - [ ] Build behavior trees for each faction using Behavior3JS (nodes for patrol, detect, engage, retreat).
  - [ ] Manage state transitions using XState (e.g., transitioning from stealth to engagement).
  - [ ] Integrate pathfinding with PathFinding.js for smooth movement.
  - [ ] Use steering behaviors (e.g., Reynolds’ Boids) for fleet maneuvers.
- [ ] Integrate AI with UI:
  - [ ] Use React hooks to update enemy AI state and trigger re-renders in .tsx components.
  - [ ] Display dynamic status indicators on the Galaxy Map (e.g., flashing icons during engagements).
- [ ] Set up testing and tuning:
  - [ ] Use React Developer Tools and custom logging/debug overlays.
  - [ ] Iteratively tune AI parameters such as engagement ranges and aggression thresholds.

---

#### **Part 7: Summary of Key Implementations**

- [ ] Verify separate AI groups for each faction using Redux/React Context and RxJS.
- [ ] Ensure prefab enemy ships have distinct AI states and behavior configurations (Behavior3JS and XState).
- [ ] Confirm territorial spawning is triggered via player movement and random encounters, with visual map overlays (D3.js/React-Vis).
- [ ] Validate conflict and (optional) diplomacy systems are integrated with clear UI components and state management.
- [ ] Ensure enemy AI techniques (behavior trees, state machines, pathfinding) are implemented and debugged using the recommended libraries.
- [ ] Debug overlay system next for testing and tuning the AI.
