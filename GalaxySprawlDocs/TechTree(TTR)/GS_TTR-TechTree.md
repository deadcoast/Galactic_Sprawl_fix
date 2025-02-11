# Consolidated Tech Tree Build Section

The **Galactic Sprawl Tech Tree** is organized into five major branches. Each branch features three primary tiers and Tier 4 “epic” nodes (for rare and unique upgrade projects) that unlock progressively more advanced systems, upgrades, and automation features. This unified view helps you plan strategic progression across your empire’s core systems, fleet technologies, weapon and defense systems, unique projects, and cross-domain enhancements.

---

## Overall Structure

### Visual & Interactive Implementation

- **Tree Layout:**  
  The Tech Tree is arranged into distinct columns (Infrastructure, Fleet, Weapons/Defense, Special Projects, and Synergies). Each column is segmented by Tier (top: Tier 1, middle: Tier 2, bottom: Tier 3, with optional epic nodes in a separate section).

- **Interactive Nodes:**  
  Clicking on a node displays detailed prerequisites, resource costs, benefits, and integration notes (e.g., how a radar upgrade might boost both reconnaissance and mining operations).

- **Dynamic Feedback:**  
  As nodes are unlocked, the UI highlights subsequent available upgrades and shows how cross-domain synergies (like AI Logistics or Quantum Communications) amplify your empire’s efficiency.

- **Tier 1 – Foundational Technologies:**  
  Basic modules, initial ship classes, and essential systems for immediate play (e.g., standard radar, basic ship hanger, entry-level officers, and simple mining/refinement setups).

- **Tier 2 – Intermediate Enhancements:**  
  Expanded functionalities, improved automation, and mid-level assets (e.g., galaxy-wide radar, additional ship variants, improved mining yields, and first automation AIs).

- **Tier 3 – Advanced Systems & Capital Assets:**  
  Major upgrades unlocking capital ships, high-level automation, advanced combat and defense capabilities, and fully automated colony and trade hubs.

- **Tier 4 – Unique/Epic Projects:**  
  - Special projects that provide one-of-a-kind bonuses or game-changing abilities.
    - Command Nexus for fleet-wide buffs.
    - Unique Dyson Sphere Megastructure automation node.

### Implementing the Tech Tree

Now that you have Tier 1 modules, integrate the **Tech Tree** system and tie each object to the correct Tier. This is crucial for **progression**.

1. **Tech Tree Scene/UI**  
   - Create a dedicated “Research” UI or overlay where you show three columns (War, Recon, Mining).  
   - You can do this as a **scrollable** layout, with Tier 1 items at the top, Tier 2 in the middle, Tier 3 at the bottom.  
   - Mark locked items with a lock icon or a grayed-out button.  

2. **Tier Unlock Requirements**  
   - Each Tier or node in the Tech Tree might require some combination of: resources, time-based research, number of existing buildings, or other criteria.  
   - Use  variables/timers to handle these.  

3. **Upgrade Logic**  
   - When a Tier 2 module is unlocked, it should directly affect how the module is rendered or how it functions. For instance, upgrading the Radar from Tier 1 → Tier 2 might increase detection radius and show a bigger, fancier antenna.  
   - Link these **Tier states** to your Ship Hanger, Officer Academy, Mining Centre, and so on.

**Result**: All Tiers (1, 2, 3) are now *structured* in your Tech Tree, and you can unlock advanced ships/buildings in the future steps.

### Implementation Details

- **Component Structure**:  
  - Create a `<TechTree />` component that renders three vertical columns.
  - Each column can be a scrollable subcomponent (e.g., `<TierColumn tier={1} />`).
- **Data & Interactivity**:  
  - Each node represents an upgrade or building.  
  - Use icons, tooltips, and lock overlays (for locked nodes).  
  - Nodes can be clicked to reveal more information (pop-up modal) or to begin research.
- **Recommended Libraries**:  
  - [react-d3-tree](https://github.com/bkrem/react-d3-tree) or a custom implementation with [d3.js](https://d3js.org/) for dynamic hierarchical layouts.
  - [react-spring](https://www.react-spring.io/) for smooth transitions as nodes unlock.
  - [react-tooltip](https://www.npmjs.com/package/react-tooltip) for node details on hover.

### Additional Functionality

- **Progress Indicators**:  
  - Display progress bars or timers on nodes that are in the process of being unlocked.
- **Conditional Rendering**:  
  - Lock/unlock nodes based on resource and tier requirements.

---

## Infrastructure & Base Tech Tree Upgrades (Mothership & Colony)

### Mothership Core Systems

- **Tier 1:**  
  - **Basic Mothership Functions:**  
    • Standard Radar (local system scanning)  
    • Basic Ship Hanger (enables production of Spitflares and Rock Breaker)  
    • Entry Officer Academy (standard officer recruitment)  
    • Basic Colony Station (initial trade and population hub)

- **Tier 2:**  
  - **Advanced Infrastructure:**  
    • **Advanced Radar:** Unlocks galaxy-wide monitoring (enemy detection and mineral spotting)  
    • **Expanded Ship Hanger:** Adds mid-tier ships (Star Schooner, Orion’s Frigate) and unlocks ship upgrades  
    • **Officer Academy – Refugee Market:** Access new officer types from allied or neutral factions  
    • **Colony Expansion:** Unlocks additional modules (local trading post, improved population management)  
    • **Mineral Processing Centre (Tier 2):** Enhanced mining automation and faster resource refinement

- **Tier 3:**  
  - **Capital Infrastructure:**  
    • **Ultra-Advanced Radar:** Full-spectrum scanning that detects anomalies, hidden tech, and habitable worlds  
    • **Mega Ship Hanger:** Enables construction of capital ships (Harbringer Galleon, Midway Carrier)  
    • **Officer Academy – Indoctrination:** Convert enemy or captured officers for bonus synergy  
    • **Fully Automated Colony:** Dynamic expansion that integrates with Habitable Worlds and optimizes trade routes  
    • **Dyson Sphere Integration:** Advanced energy and resource bonuses through segmented automation

- **Additional Nodes:**  
  - **Quantum Communications Hub (Tier 2):** Improves inter-system data sharing and speeds up command decisions.  
  - **AI Logistics Core (Tier 3):** Automates trade routes, reduces resource latency, and improves mining/refining efficiency.  
  - **Modular Expansion Interface (Tier 3):** Allows colonies to scale visually and functionally as population grows.

---

## Fleet Technologies

### War Fleet Technologies (AP: War)

- **Weapon Systems & Ship Upgrades:**  
  - **Tier 1:**  
    • Basic weapon systems (Machine Gun, Rockets, Gauss Cannon)  
    • Light Hull Armor & Shields  
  - **Tier 2:**  
    • **Weapon Enhancements:** Upgrade Machine Guns to Plasma Rounds; add EMPR/Swarm Rocket variants; introduce Gauss Planer  
    • Medium Hull Armor & Shields  
    • Basic fleet coordination for auto-deployment  
  - **Tier 3:**  
    • **Advanced Weaponry:** Unlock Spark Rounds, Big Bang Rockets, Recirculating Gauss, and advanced Rail Gun variants (e.g., Maurader)  
    • Heavy Hull Armor & Shields with reactive systems (kinetic energy absorption, smart countermeasures)  
    • **Fleet Command AI:** Enhances reaction times and tactical coordination (benefiting Midway Carrier and Mother Earth’s Revenge)

### Recon Fleet Technologies (AP: Recon)

- **Sensor & Data Systems:**  
  - **Tier 1:**  
    • Basic sensor arrays (as fitted on SC4 Comet)  
  - **Tier 2:**  
    • Enhanced sensor modules for improved mapping and stealth detection (enabling AC27G “Andromeda Cutter”)  
    • Initial data processing improvements for faster mapping cycles  
  - **Tier 3:**  
    • **Quantum Recon Systems:** Accelerates mapping, improves anomaly detection, and integrates fully with the Exploration Hub  
    • Advanced cloaking and mobility upgrades for increased survivability in hostile zones

### Mining Fleet Technologies (AP: Mining)

- **Extraction & Automation Improvements:**  
  - **Tier 1:**  
    • Standard Mining Lasers and onboard refinement (baseline for MS-RB12G “Rock Breaker”)  
  - **Tier 2:**  
    • Improved extraction rates and better resource yield probabilities  
    • Enhanced processing algorithms integrated into the Mineral Processing Centre  
  - **Tier 3:**  
    • **Exotic Mining Techniques:** Unlock rare resource extraction (Dark Matter Crystals, Helium-3)  
    • **Automated Mining Drones:** AI-assisted systems that dynamically adjust extraction based on local deposit conditions  
    • Upgraded MVVD “Void Dredger” prerequisites for deep-space mining

---

## Weapons, Defense & Combat Enhancements

### Direct Weapon Upgrades

- **Tier 1:**  
  • Base models (Machine Gun, Rockets, Gauss Cannon, Rail Gun)
- **Tier 2:**  
  • Specialized variants (Plasma Rounds, EMPR & Swarm Rockets, Gauss Planer)  
- **Tier 3:**  
  • Maximum-damage upgrades (Spark Rounds, Big Bang Rockets, Recirculating Gauss, Maurader Rail Gun)  
- **New Implementations:**  
  - **Laser Beam Technology (Tier 3):** A continuous-damage weapon effective against multiple targets simultaneously.  
  - **Particle Accelerator Cannons (Tier 3):** High-damage, energy-draining weapons designed to penetrate advanced hull armors.

### Defensive Systems

- **Tier 1:**  
  • Basic Light Shields and minimal hull armor
- **Tier 2:**  
  • Medium shields with regenerative properties, reactive armor systems  
- **Tier 3:**  
  • Heavy shields with layered defense mechanisms, smart countermeasures, and point-defense systems  
- **New Implementations:**  
  - **Energy Dissipation Field (Tier 3):** Temporarily reduces incoming energy-based damage.  
  - **Automated Repair Drones (Tier 2/3):** Deployed on capital ships (e.g., Midway Carrier) for rapid in-combat hull repairs.

---

## Unique Projects & Special Technologies

### Officer Academy Special Projects

- **Refugee Market (Tier 2):**  
  • Broadens your recruitment pool by attracting skilled officers from other factions.
- **Indoctrination Program (Tier 3):**  
  • Converts enemy or captured officers to enhance fleet performance.
- **Advanced Training Simulations (New, Tier 3):**  
  • Boosts officer XP gain and tactical proficiency, accelerating combat readiness.

### Capital Ship & Command Technologies

- **Mother Earth’s Revenge Requirements (Tier 3):**  
  • Integration of Tier 2 Mothership, Tier 2 Ship Yard, plus a dedicated Captain node.
- **Command Nexus (New, Tier 3/4):**  
  • Acts as a mobile command center that improves fleet coordination, repair speeds, and trade operations when docked with capital ships.
- **Orbital Docking Enhancements (New, Tier 2):**  
  • Speeds up repair and resupply operations across multiple ships simultaneously.

### Resource & Trade Innovations

- **Interstellar Trade Network (New, Tier 2):**  
  • Automates and optimizes resource flow between systems and colonies.
- **Dyson Sphere Automation (New, Tier 3):**  
  • Enhances energy production and resource accumulation via segmented, automated management of Dyson Sphere constructs.
- **Advanced Refinement Processes (New, Tier 2/3):**  
  • Reduces material waste and boosts production efficiency in the Mineral Processing Centre.

### Exploration & Recon Innovations

- **Stellar Cartography (New, Tier 2):**  
  • Improves accuracy in mapping anomalies, habitable worlds, and strategic resource nodes.
- **Anomaly Research Labs (New, Tier 3):**  
  • Uncover hidden bonuses or one-off technologies upon full anomaly research.
- **Automated Recon Dispatch (New, Tier 2):**  
  • Uses AI to schedule and direct recon ships for maximum coverage and efficiency.

---

## Cross-Domain Enhancements & Synergies

### Integrated AI and Automation Core (New, Tier 3)

- Provides bonus effects across War, Recon, and Mining branches by improving overall automation efficiency, reducing research times, and synchronizing multi-system operations.

### Quantum Communications & Data Transfer (New, Tier 2)

- Reduces time delays between systems and improves real-time updates on the Civilization Sprawl View, enhancing decision-making speed.

### Modular Tech Convergence (New, Tier 3)

- Allows technology and bonus synergies between modules (e.g., linking Officer Academy training bonuses directly to fleet combat performance or colony productivity).

---

## Summary

This consolidated Tech Tree for **Galactic Sprawl** merges all current tech pathways—from basic Mothership functions and fleet upgrades to advanced combat, exploration, mining, and unique projects—while introducing several new implementations:

- **Advanced Automation & AI Nodes** for streamlined operations.
- **Enhanced Trade & Resource Networks**.
- **Specialized Recon & Weapon Technologies** that add depth to gameplay.
- **Cross-domain synergies** that encourage strategic planning across every aspect of your growing empire.
