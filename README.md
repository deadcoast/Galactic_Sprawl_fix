# Galactic Sprawl

## Overview

Galactic Sprawl is an immersive space empire management game where players expand their influence from a central Mothership outward through colonization, resource management, and strategic development. The game emphasizes automated processes, visual progression, and interconnected systems that create a living, evolving galaxy.

## Prompting to Setup files

```
1. Review the @.cursorrules file in full, it is the core of your new comprehensive workflow. It **MUST** be adhered to during the CodeBase Restructuring.
2. Begin setting up `System Documents` with proper context from the CodeBase. The Core files you will be using as the AI Developer are: @CodeBase_Docs/System_Integration.md and @CodeBase_Docs/System_Architecture.md .
3. Review the `System Documents` and being providing the proper context to ensure the files are using the code base specifications. Currently they are general specifications, they need to be updated with the CodeBase Context. **DO NOT** Remove any of these workflows, only implement them with our CodeBase for smooth transition and graceful handling with future implementations.
```

### Prompting A New Conversation

```
1. Review the @.cursorrules file, you must adhere to the strict workflow to ensure CodeBase consistency. Ensure you are updating and reviewing the `Cursor System Documents` and seeking Context in the `Codebase Context Documents`
2. Continue to the next Task on the [`Scratchpad`](`System_Scratchpad`)
```

## Key Features

### Core Systems

- **Modular Empire Building**: Expand from a central Mothership through interconnected colonies and stations
- **Automated Operations**: Self-sustaining systems for mining, exploration, and colony management
- **Tech Tree Progression**: Three-tiered research system unlocking advanced capabilities
- **Dynamic Economy**: Complex resource management with automated trade routes

### Exploration & Development

- **Dynamic Galaxy**: 50+ explorable star systems with unique characteristics
- **Habitable Worlds**: Colonizable planets with evolving populations and infrastructure
- **Resource Management**: Advanced mining operations with automated resource extraction
- **Colony Development**: Expandable colonies with multiple specialization options

### Combat & Factions

- **Three Distinct Factions**:
  - Space Rats: Aggressive pirates focused on raiding
  - Lost Nova: Exiled scientists using forbidden technology
  - Equator Horizon: Ancient civilization enforcing universal balance
- **Fleet Management**: Multiple ship classes with unique capabilities
- **Strategic Combat**: Dynamic engagement systems with AI-driven behavior

### Visual Progression

- **Real-time Feedback**: Visual representation of growth and development
- **Dynamic UI**: Responsive interface with context-sensitive controls
- **High-fidelity Assets**: Detailed visuals for ships, stations, and effects

## Core Gameplay Flow

```mermaid
graph TD
    A[Mothership] --> B[Colony Expansion]
    A --> C[Resource Management]
    A --> D[Fleet Operations]

    B --> E[Habitable Worlds]
    B --> F[Star Stations]

    C --> G[Mining Operations]
    C --> H[Trade Routes]

    D --> I[Combat]
    D --> J[Exploration]

    E --> K[Population Growth]
    E --> L[Infrastructure]

    F --> M[Module Development]
    F --> N[Defense Systems]

    G --> O[Resource Extraction]
    G --> P[Processing]

    H --> Q[Economic Growth]

    I --> R[Faction Encounters]

    J --> S[Galaxy Mapping]
    J --> T[Anomaly Discovery]
```

### Empire Development Cycle

```mermaid
flowchart LR
    A((Start)) --> B[Establish Colony]
    B --> C[Resource Gathering]
    C --> D[Tech Research]
    D --> E[Fleet Expansion]
    E --> F[New Territories]
    F --> B

    style A fill:#f96,stroke:#333,stroke-width:4px
    style B fill:#58f,stroke:#333,stroke-width:2px
    style C fill:#5b5,stroke:#333,stroke-width:2px
    style D fill:#a5f,stroke:#333,stroke-width:2px
    style E fill:#f55,stroke:#333,stroke-width:2px
    style F fill:#5ff,stroke:#333,stroke-width:2px
```

### Module Interaction Flow

```mermaid
graph LR
    A[Mothership] --> B[Colony Hub]
    A[Mothership] --> C[Ship Hanger]
    A[Mothership] --> D[Research Lab]

    B --> E[Population]
    B --> F[Resources]

    C --> G[War Ships]
    C --> H[Recon Ships]
    C --> I[Mining Ships]

    D --> J[Tech Tree]

    E --> K[Growth]
    F --> L[Economy]

    G --> M[Defense]
    H --> N[Exploration]
    I --> O[Extraction]

    J --> P[Upgrades]

    style A fill:#f96,stroke:#333,stroke-width:4px
    style B,C,D fill:#58f,stroke:#333,stroke-width:2px
    style E,F,G,H,I fill:#5b5,stroke:#333,stroke-width:2px
    style J,K,L,M,N,O,P fill:#a5f,stroke:#333,stroke-width:2px
```

### Automation Systems

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Scanning: Auto-detect
    Scanning --> ResourceFound: Minerals
    Scanning --> ThreatDetected: Enemies
    Scanning --> AnomalyFound: Exploration

    ResourceFound --> Mining: Auto-mine
    ThreatDetected --> Combat: Auto-defend
    AnomalyFound --> Investigation: Auto-explore

    Mining --> Processing: Auto-refine
    Combat --> Idle: Threat eliminated
    Investigation --> Idle: Analysis complete

    Processing --> Storage: Auto-store
    Storage --> Distribution: Auto-trade
    Distribution --> Idle: Cycle complete
```

### Visual Progression Representation (VPR)

```mermaid
graph TD
    A[Tier 1] --> B[Tier 2]
    B --> C[Tier 3]

    subgraph "Mothership Evolution"
    A1[Basic Hub] --> B1[Advanced Station]
    B1 --> C1[Capital Complex]
    end

    subgraph "Colony Growth"
    A2[Outpost] --> B2[Settlement]
    B2 --> C2[Metropolis]
    end

    subgraph "Fleet Development"
    A3[Scout Ships] --> B3[Cruisers]
    B3 --> C3[Capital Ships]
    end

    style A1,A2,A3 fill:#58f,stroke:#333,stroke-width:2px
    style B1,B2,B3 fill:#5b5,stroke:#333,stroke-width:2px
    style C1,C2,C3 fill:#f55,stroke:#333,stroke-width:2px
```

## Technical Architecture

### Core Technologies

- TypeScript
- React
- Redux/Context for state management
- WebGL for advanced graphics

### Key Libraries

- Framer Motion / react-spring: Animations
- react-three-fiber: 3D rendering
- D3.js: Data visualization
- RxJS: Event handling

### Performance Optimizations

- Efficient resource management for 50+ star systems
- Optimized rendering with React.memo and useMemo
- Lazy loading for non-critical components

## Getting Started

### Prerequisites

```bash
node >= 14.0.0
npm >= 6.0.0
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/galactic-sprawl.git

# Install dependencies
cd galactic-sprawl
npm install

# Start development server
npm run dev
```

## Module Documentation

### Core Modules

- **Mothership**: Central hub for empire management
- **Colony Star Station**: Secondary development centers
- **Exploration Hub**: Manages galaxy exploration
- **Mineral Processing**: Handles resource extraction
- **Ship Hanger**: Fleet construction and management
- **Officer Academy**: Personnel development

### Smart Automation Systems

- War ship automated defense
- Recon ship exploration patterns
- Mining ship resource extraction
- Colony growth and development
- Trade route establishment

### Progression Systems

- Tech Tree Research (TTR)
- Experience and leveling
- Visual Progression Representation (VPR)
- Building upgrades and development

## Development

### Project Structure

```plaintext
src/
├── components/          # React components
├── types/              # TypeScript definitions
├── config/             # Configuration files
├── effects/            # Visual effects
├── hooks/              # Custom React hooks
├── lib/               # Core game logic
├── utils/             # Utility functions
└── styles/            # CSS/SCSS files
```

### Key Concepts

- **VPR (Visual Progression Representation)**: System for displaying growth and development
- **TTR (Tech Tree Research)**: Technology advancement system
- **Automation Purpose (AP)**: Defines automated behavior patterns

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch
3. Implement changes
4. Submit a pull request

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent naming conventions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React and TypeScript communities
- Contributors and testers
- Inspiration from classic space strategy games

---

For more detailed information about specific systems, please refer to the documentation in the `GalaxySprawlDocs` directory.
