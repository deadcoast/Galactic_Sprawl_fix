import { Database } from "lucide-react";

interface TradeRoute {
  id: string;
  source: {
    id: string;
    name: string;
    position: { x: number; y: number };
  };
  target: {
    id: string;
    name: string;
    position: { x: number; y: number };
  };
  volume: number;
  resources: {
    type: string;
    amount: number;
  }[];
  status: "active" | "disrupted" | "establishing";
}

interface TradeRouteVisualizerProps {
  routes: TradeRoute[];
  onRouteClick?: (routeId: string) => void;
}

export function TradeRouteVisualizer({
  routes,
  onRouteClick,
}: TradeRouteVisualizerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="absolute inset-0">
        <defs>
          <linearGradient id="route-gradient" x1="0" y1="0" x2="100%" y2="0">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.1)" />
          </linearGradient>

          {/* Flow Animation */}
          <pattern
            id="flow-pattern"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="10" cy="10" r="2" fill="rgba(99, 102, 241, 0.5)">
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </pattern>
        </defs>

        {/* Trade Routes */}
        {routes.map((route) => {
          const startX = route.source.position.x;
          const startY = route.source.position.y;
          const endX = route.target.position.x;
          const endY = route.target.position.y;

          // Calculate control points for curved path
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const curvature = 50; // Adjust for desired curve

          // Path data for curved line
          const path = `
            M ${startX} ${startY}
            Q ${midX} ${midY - curvature} ${endX} ${endY}
          `;

          return (
            <g key={route.id} onClick={() => onRouteClick?.(route.id)}>
              {/* Base Route Line */}
              <path
                d={path}
                stroke={
                  route.status === "disrupted"
                    ? "rgba(239, 68, 68, 0.3)"
                    : "url(#route-gradient)"
                }
                strokeWidth={2 + route.volume * 2}
                fill="none"
                strokeDasharray={route.status === "disrupted" ? "5,5" : "none"}
                className="transition-all duration-300"
              />

              {/* Flow Animation */}
              <path
                d={path}
                stroke="url(#flow-pattern)"
                strokeWidth={4 + route.volume * 2}
                fill="none"
                className={route.status === "active" ? "animate-flow" : ""}
                style={{
                  animation:
                    route.status === "active"
                      ? "flow 2s linear infinite"
                      : "none",
                }}
              />

              {/* Route Indicators */}
              <g transform={`translate(${midX}, ${midY - curvature})`}>
                <circle
                  r={10 + route.volume * 5}
                  fill={
                    route.status === "active"
                      ? "rgba(99, 102, 241, 0.2)"
                      : route.status === "disrupted"
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(234, 179, 8, 0.2)"
                  }
                  className="animate-pulse"
                />
                <Database className="w-4 h-4 text-indigo-400 transform -translate-x-2 -translate-y-2" />
              </g>
            </g>
          );
        })}
      </svg>

      {/* Route Labels */}
      {routes.map((route) => {
        const midX = (route.source.position.x + route.target.position.x) / 2;
        const midY = (route.source.position.y + route.target.position.y) / 2;

        return (
          <div
            key={`label-${route.id}`}
            className="absolute pointer-events-auto cursor-pointer"
            style={{
              left: midX,
              top: midY - 40,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => onRouteClick?.(route.id)}
          >
            <div
              className={`px-3 py-1 rounded-full text-xs backdrop-blur-sm ${
                route.status === "active"
                  ? "bg-indigo-900/80 text-indigo-200"
                  : route.status === "disrupted"
                    ? "bg-red-900/80 text-red-200"
                    : "bg-yellow-900/80 text-yellow-200"
              }`}
            >
              {route.resources.map((r) => `${r.amount} ${r.type}`).join(", ")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
