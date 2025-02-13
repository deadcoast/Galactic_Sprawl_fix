import { AlertTriangle, Database, Star, Users } from "lucide-react";
import { useState } from "react";

interface ColonyModule {
  id: string;
  type: "residential" | "commercial" | "industrial";
  population: number;
  efficiency: number;
  status: "active" | "constructing" | "damaged";
}

interface ColonyStarStationProps {
  name: string;
  tier: 1 | 2 | 3;
  modules: ColonyModule[];
  population: number;
  maxPopulation: number;
  resourceOutput: number;
  quality: "low" | "medium" | "high";
  onClick?: () => void;
}

export function ColonyStarStation({
  name,
  tier,
  modules,
  population,
  maxPopulation,
  resourceOutput,
  quality,
  onClick,
}: ColonyStarStationProps) {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const particleCount = quality === "high" ? 12 : quality === "medium" ? 8 : 4;

  return (
    <div className="relative w-80 h-80 cursor-pointer group" onClick={onClick}>
      {/* Core Station */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Central Hub */}
          <div className="w-32 h-32 bg-gray-800/80 rounded-lg border-4 border-cyan-500/30 flex items-center justify-center transform rotate-45">
            <div className="w-20 h-20 bg-cyan-900/50 rounded-lg flex items-center justify-center transform -rotate-45">
              <Star className="w-10 h-10 text-cyan-400" />
            </div>
          </div>

          {/* Module Ring */}
          <div className="absolute inset-0 transform scale-150">
            {modules.map((module, index) => {
              const angle = (index / modules.length) * Math.PI * 2;
              const x = Math.cos(angle) * 60;
              const y = Math.sin(angle) * 60;

              return (
                <div
                  key={module.id}
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  }}
                  onMouseEnter={() => setHoveredModule(module.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                >
                  <div
                    className={`w-16 h-16 rounded-lg transition-all duration-300 ${
                      module.status === "active"
                        ? "bg-cyan-500/20"
                        : module.status === "constructing"
                          ? "bg-yellow-500/20"
                          : "bg-red-500/20"
                    } ${
                      hoveredModule === module.id ? "scale-110" : "scale-100"
                    }`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {module.type === "residential" && (
                        <Users className="w-6 h-6 text-cyan-400" />
                      )}
                      {module.type === "commercial" && (
                        <Database className="w-6 h-6 text-cyan-400" />
                      )}
                      {module.type === "industrial" && (
                        <Star className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>

                    {/* Module Status Indicator */}
                    <div
                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        module.status === "active"
                          ? "bg-green-500"
                          : module.status === "constructing"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      } animate-pulse`}
                    />
                  </div>

                  {/* Module Tooltip */}
                  {hoveredModule === module.id && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800/90 rounded-lg border border-gray-700 whitespace-nowrap z-10">
                      <div className="text-sm font-medium text-white">
                        {module.type.charAt(0).toUpperCase() +
                          module.type.slice(1)}{" "}
                        Module
                      </div>
                      <div className="text-xs text-gray-400">
                        Population: {module.population.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Efficiency: {Math.round(module.efficiency * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Energy Field */}
          <div
            className="absolute inset-0 rounded-full border-2 border-cyan-500/20"
            style={{
              transform: `scale(${2 + tier * 0.5})`,
              animation: "pulse 4s infinite",
            }}
          />

          {/* Particle Effects */}
          {Array.from({ length: particleCount }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.5 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {/* Station Info */}
      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 space-y-2 w-48">
        <div className="text-center">
          <div className="text-cyan-200 font-medium">{name}</div>
          <div className="text-cyan-300/70 text-sm">
            Tier {tier} • {modules.length} Modules
          </div>
        </div>

        {/* Population Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Population</span>
            <span className="text-gray-300">
              {Math.round((population / maxPopulation) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: `${(population / maxPopulation) * 100}%` }}
            />
          </div>
        </div>

        {/* Resource Output */}
        <div className="text-xs text-center text-gray-400">
          Output: {resourceOutput.toLocaleString()}/cycle
        </div>
      </div>

      {/* Warnings */}
      {modules.some((m) => m.status === "damaged") && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-red-900/80 border border-red-700 rounded-full flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-red-400" />
          <span className="text-xs text-red-200">Module Damage Detected</span>
        </div>
      )}
    </div>
  );
}
