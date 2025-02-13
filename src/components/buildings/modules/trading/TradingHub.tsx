import { AlertTriangle, BarChart2, RefreshCw, Ship, TrendingUp } from "lucide-react";
import { BaseModule } from "../../../../types/buildings/ModuleTypes";

interface TradeRoute {
  id: string;
  source: string;
  destination: string;
  resource: string;
  amount: number;
  frequency: number; // in minutes
  profit: number;
  status: "active" | "paused" | "failed";
  lastDelivery?: Date;
  ships: string[]; // IDs of assigned trade ships
}

interface MarketPrice {
  resource: string;
  buyPrice: number;
  sellPrice: number;
  trend: "up" | "down" | "stable";
  volume: number;
}

interface TradingHubProps {
  module: BaseModule & {
    tradeRoutes: TradeRoute[];
    marketPrices: MarketPrice[];
    tradingLevel: number;
    maxRoutes: number;
    profitBonus: number;
  };
  onCreateRoute: (source: string, destination: string, resource: string, amount: number) => void;
  onDeleteRoute: (routeId: string) => void;
  onToggleRoute: (routeId: string) => void;
  onAssignShip: (routeId: string, shipId: string) => void;
  onUnassignShip: (routeId: string, shipId: string) => void;
}

export function TradingHub({
  module,
  onCreateRoute,
  onDeleteRoute,
  onToggleRoute,
  onAssignShip,
  onUnassignShip,
}: TradingHubProps) {
  const activeRoutes = module.tradeRoutes.filter(r => r.status === "active");
  
  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Trading Hub
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <span>Level: {module.tradingLevel}</span>
          </div>
          <div className="text-sm text-gray-400">
            <span>Profit Bonus: +{module.profitBonus}%</span>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <BarChart2 className="w-5 h-5" />
          Market Prices
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {module.marketPrices.map(price => (
            <div key={price.resource} className="bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-300">
                  {price.resource}
                </div>
                <div className={`text-xs ${
                  price.trend === "up" ? "text-green-400" :
                  price.trend === "down" ? "text-red-400" :
                  "text-gray-400"
                }`}>
                  {price.trend === "up" ? "↑" : price.trend === "down" ? "↓" : "→"}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Buy: {price.buyPrice}</span>
                <span>Sell: {price.sellPrice}</span>
                <span>Vol: {price.volume}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Routes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Trade Routes ({activeRoutes.length}/{module.maxRoutes})
        </h3>
        <div className="space-y-3">
          {module.tradeRoutes.map(route => (
            <div key={route.id} className="bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {route.status === "failed" && (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-300">
                      {route.source} → {route.destination}
                    </div>
                    <div className="text-xs text-gray-500">
                      {route.resource} ({route.amount} units)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleRoute(route.id)}
                    className={`px-3 py-1 text-xs ${
                      route.status === "active"
                        ? "text-green-400 hover:text-green-300"
                        : route.status === "failed"
                          ? "text-red-400 hover:text-red-300"
                          : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    {route.status === "active" ? "Active" : route.status === "failed" ? "Failed" : "Paused"}
                  </button>
                  <button
                    onClick={() => onDeleteRoute(route.id)}
                    className="px-3 py-1 text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Assigned Ships */}
              <div className="mt-2">
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Ship className="w-4 h-4" />
                  Assigned Ships ({route.ships.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {route.ships.map(shipId => (
                    <div
                      key={shipId}
                      className="text-xs bg-gray-700 px-2 py-1 rounded flex items-center gap-1"
                    >
                      <span>{shipId}</span>
                      <button
                        onClick={() => onUnassignShip(route.id, shipId)}
                        className="text-red-400 hover:text-red-300 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => onAssignShip(route.id, "new-ship-id")}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-blue-400"
                  >
                    + Assign Ship
                  </button>
                </div>
              </div>

              {/* Route Stats */}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Profit: +{route.profit}/cycle</span>
                <span>Frequency: {route.frequency}min</span>
                {route.lastDelivery && (
                  <span>Last: {new Date(route.lastDelivery).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create New Route */}
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Create New Route
        </h3>
        <button
          onClick={() => onCreateRoute("", "", "", 0)}
          disabled={activeRoutes.length >= module.maxRoutes}
          className={`w-full p-3 rounded-lg text-sm ${
            activeRoutes.length >= module.maxRoutes
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
          }`}
        >
          + New Trade Route
        </button>
      </div>
    </div>
  );
} 