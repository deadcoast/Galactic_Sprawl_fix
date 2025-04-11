# Galactic Sprawl – Progression System Project Plan

This document consolidates every progression-related element in your Galactic Sprawl project. It covers how the empire evolves over time, the visual and backend mechanisms that track and display growth, and the integration of progression across UI assets, in-game modules, and ship fleets.

---

## 1. Overview & Objectives

**Goal of Progression:**  
To create a continuously evolving galactic empire that rewards long-term growth through system development, technological upgrades, and fleet enhancements. Progression in Galactic Sprawl is multi-layered—driving both the visual transformation of your assets and the underlying gameplay mechanics.

**Key Objectives:**

- **Visual Feedback:**  
  Use visual progression representations (VPR) to convey asset upgrades and growth (e.g., expanding Ship Hanger, pulsing Habitable Worlds, evolving Mothership).

- **Incremental Unlocks:**  
  Progression is tied to the Tech Tree Research (TTR) that unlocks new tiers, advanced modules, and improved ship types as you gather resources and gain experience.

- **Gameplay Integration:**  
  Progression impacts automated processes such as auto-colonization, dynamic trade routes, and autonomous fleet behavior. It also ties into an experience and leveling system that improves ship and officer performance.

- **Back-End State Management:**  
  The empire’s progression is maintained by a persistent state system that updates resource levels, tech tree advancements, and module upgrades continuously—even when not in direct view.

---

## 2. Terminology & Core Concepts

### 2.1 Visual Progression Representation (VPR)

- **Definition:**  
  The visual cues and animations that represent the development and upgrades of in-game assets.
- **Examples:**
  - A Ship Hanger that expands with each tier upgrade.
  - Habitable Worlds that pulse or rotate more dynamically as their populations grow.
  - A Mothership that evolves visually to indicate advanced capabilities.

### 2.2 Tech Tree Research (TTR)

- **Definition:**  
  The research and development system that unlocks higher tiers of buildings, modules, and ship classes.
- **Tier Progression:**
  - **Tier 1:** Basic modules and ships are available.
  - **Tier 2:** Unlocks mid-level upgrades (improved hulls, advanced ship classes like Orion’s Frigate, and upgraded station modules).
  - **Tier 3:** Grants access to capital ships, advanced upgrades (e.g., Midway Carrier, Mother Earth’s Revenge), and enhanced automated functions.
- **Interdependency:**  
  Many progression upgrades require meeting resource thresholds, building prerequisites, and achieving specific tech milestones.

### 2.3 Experience & Leveling System

- **Definition:**  
  A system that tracks progress through in-game actions (combat, exploration, and mining) and rewards ships and officers with XP.
- **Outcomes:**
  - Faster reaction times and improved combat effectiveness for War Ships.
  - Enhanced mapping speeds and anomaly detection for Recon Ships.
  - Increased resource extraction efficiency for Mining Ships.
- **Visual Cues:**  
  Ships and officers display rank badges or visual effects to indicate their current level.

---

## 3. UI Assets and Visual Progression

### 3.1 Default VPR UI View

- **Purpose:**  
  The main star system screen that consolidates all visual progression cues.
- **Components:**
  - **Star System Backdrop:** A parallax star background that deepens as progress increases.
  - **Central Mothership VPR:** A dynamic, evolving centerpiece that visually expands with upgrades.
  - **Colony Star Station VPR:** Secondary nodes that grow as new modules and neighborhoods appear.
  - **Habitable World VPR:** Circular assets that change in appearance to reflect population growth.
  - **Additional Elements:** Indicators for population, trade routes, and development—using particle effects or animated rings to represent progress.

### 3.2 Tech Tree UI

- **Purpose:**  
  A dedicated window displaying the technology and upgrade path for modules, ships, and buildings.
- **Visual Layout:**
  - Three columns representing Tiers 1, 2, and 3.
  - Each asset’s unlocked state or pending upgrade is visually denoted.
- **Interactivity:**  
  Clicking on nodes reveals detailed upgrade information, prerequisites, and the impact on automated functions.

### 3.3 HUD and Submenu System

- **Components:**
  - Organized submenus for Mining, Dyson Sphere, Mothership, and Star Station Colony.
  - Color-coded buttons that indicate current resource levels and upgrade eligibility.
  - Responsive and collapsible menus that dynamically adjust as progression unlocks new features.
- **Feedback Mechanisms:**  
  Hover effects and tooltips display current tier, production rates, and automation status.

---

## 4. Back-End Functionality & State Management for Progression

### 4.1 Global State & Persistence

- **State Management:**
  - Use of Redux or React Context to track overall empire progress, including resource counts, tech tree status, and production queues.
  - Persistent state ensures that when a player revisits a star system, all progression (module upgrades, ship builds, colonization data) remains intact.
- **Automated Updates:**
  - Background tasks continuously update resource levels and population growth.
  - Automated triggers (e.g., reaching a population threshold) initiate transitions like auto-colonization or module upgrades.

### 4.2 Scheduling and Recurring Events

- **Mechanisms:**
  - Recurring update cycles for resource generation, XP gain, and trade route intensification.
  - Time-based events that progressively unlock new tiers or trigger visual transitions (e.g., new module appearances).
- **Integration with TTR:**
  - The tech tree acts as the central driver of progression—only after reaching specific milestones do advanced features and assets become available.

---

## 5. Module-Specific Progression

### 5.1 Mothership & Colony Star Station

- **Mothership Progression:**
  - The core hub that evolves visually and functionally as the empire grows.
  - Upgrades include Radar enhancements, Ship Hanger expansions, and Officer Academy improvements that are visually represented in the VPR.
- **Colony Star Station Progression:**
  - Acts as independent hubs that expand as the colony develops.
  - Additional modules (such as Exploration Hub and Mineral Processing Centre) are unlocked, each contributing to overall resource and population growth.

### 5.2 Individual Building Modules

- **Radar:**
  - Upgrades visually as it expands its detection range and complexity with each tier.
- **Ship Hanger:**
  - Expands to accommodate more ships; visual transitions signal new docking bays and ship silhouettes as upgrades occur.
- **Officer Academy:**
  - Evolves to indicate enhanced training capabilities, with animations showing squad leader ships in training.
- **Mineral Processing Centre:**
  - Transitions from basic extraction to advanced resource management; displays changing icons and visual cues for different mineral thresholds.
- **Exploration Hub:**
  - Upgrades to reflect improved mapping capabilities and the deployment of additional recon ships, with dynamic overlays in the UI.

### 5.3 Habitable Worlds

- **Progression Mechanics:**
  - Initial colonization is marked by a single habitable planet that grows over time.
  - Visual progression is represented by increased city lights, satellite animations, and expanding resource nodes.
  - Upgrades, such as “Biodome Crops,” further accelerate population and economic growth.

---

## 6. Ship and Fleet Progression

### 6.1 War Ships

- **Progression Impact:**
  - War Ships progress in capability as new tiers are unlocked.
  - **Examples:**
    - **Spitflares:** Basic units that gain improved weaponry and faster deployment as they level up.
    - **Star Schooner & Orion’s Frigate:** Evolve in their combat roles with upgrades that balance long-range support and medium-scale engagement.
    - **Harbringer Galleon & Midway Carrier:** Represent mid-to-high tier progression with enhanced durability, additional support functions, and automated fighter dispatch.
    - **Mother Earth’s Revenge:** The ultimate capital ship that becomes available only after achieving advanced TTR milestones, offering mobile repair, trade, and fleet support capabilities.

### 6.2 Recon Ships

- **Progression Impact:**
  - Their mapping speed, stealth capabilities, and data collection improve as they gain XP.
  - **Examples:**
    - **SC4 Comet:** Begins with basic mapping functions that evolve into more efficient scanning and anomaly detection.
    - **AC27G “Andromeda Cutter”:** Gains advanced stealth and mapping efficiencies, unlocking deeper galaxy insights.

### 6.3 Mining Ships

- **Progression Impact:**
  - As progression advances, mining ships extract resources more efficiently and refine materials onboard.
  - **Examples:**
    - **MS-RB12G “Rock Breaker”:** Initially extracts common ores, with upgrades unlocking the ability to mine rarer materials.
    - **MVVD “Void Dredger”:** Represents advanced progression by mining high-value resources and deploying automated mining drones for enhanced efficiency.

### 6.4 Experience & Leveling Integration

- **Gameplay Integration:**
  - Ships and officers gain experience from automated tasks (combat, exploration, mining).
  - Leveling up provides tangible benefits:
    - **War Ships:** Faster reaction times and enhanced damage.
    - **Recon Ships:** Reduced mapping cycles and increased survivability.
    - **Mining Ships:** Improved yields and lower operational costs.
- **Visual Indicators:**
  - Rank badges and progressive UI animations signal the upgrade state and level of each unit.

---

## 7. Gameplay and Strategic Impact

### 7.1 Auto-Colonization & Trade Routes

- **Auto-Colonization:**
  - Once a system’s growth reaches critical thresholds (driven by resource and population metrics), it can automatically colonize nearby star systems.
- **Dynamic Trade Routes:**
  - As systems progress, automated trade routes form and intensify, visibly represented by glowing particle effects and increased system brightness.
- **Interdependency:**
  - Progression in one system boosts overall empire growth through resource sharing and synchronized development between connected systems.

### 7.2 Tech Tree Influence

- **Central Role:**
  - The Tech Tree (TTR) governs the pace of progression by unlocking new tiers for modules, ships, and upgrades.
- **Strategic Decisions:**
  - Players must balance resource allocation between immediate upgrades and long-term research to optimize overall empire progression.
- **Visual & Functional Feedback:**
  - Each advancement in the Tech Tree is reflected in both UI (via updated tech tree nodes and progression animations) and backend functionality (enhanced automated processes).

---

## 8. Future Considerations for Progression

- **Expanded Tiers and Advanced Modules:**
  - Future updates could introduce additional tiers or specialized modules that further evolve the empire’s progression.
- **Enhanced Experience Systems:**
  - Refine the leveling and XP system to allow for more granular upgrades and customizations for ships and officers.
- **Integration with Multiplayer/Persistent Worlds:**
  - As progression becomes more complex, consider real-time synchronization across players or server-side persistence for a truly living galaxy.
- **Refined UI Feedback:**
  - Continue to develop dynamic visual cues (animations, tooltips, particle effects) that clearly communicate progression milestones to the player.

---

## Final Summary

This expanded project plan page unifies every aspect of progression in Galactic Sprawl:

- **Terminology & Core Concepts:** Detailed definitions of VPR, TTR, and the XP/leveling system.
- **UI Assets & Visual Feedback:** Comprehensive descriptions of the Default VPR UI, Tech Tree UI, and HUD elements that reflect progression.
- **Back-End Functionality:** An overview of global state management, persistence, and scheduling that drives ongoing progression.
- **Module & Ship Progression:** Specific details on how the Mothership, Colony Star Station, individual building modules, and various ship classes evolve over time.
- **Gameplay Integration:** How progression influences auto-colonization, trade routes, and overall strategic decision-making.

This document serves as your single, verbose reference for all progression-related components within the Galactic Sprawl build plan, ensuring every facet—from UI assets to backend functionality and gameplay integration—is clearly defined and interconnected.

---

Use this unified progression plan as a roadmap during development to guide updates, interface designs, and feature expansions that reinforce the evolving nature of your galactic empire.
