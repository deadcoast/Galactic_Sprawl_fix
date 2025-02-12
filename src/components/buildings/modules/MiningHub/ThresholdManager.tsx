import { ThresholdPresetsPanel } from "./ThresholdPresetsPanel";
import { ThresholdStatusIndicator } from "./ThresholdStatusIndicator";
import { useThreshold } from "../../../../contexts/ThresholdContext";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Database, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface ThresholdManagerProps {
  resourceId: string;
  resourceName: string;
  resourceType: "mineral" | "gas" | "exotic";
  currentAmount: number;
  maxCapacity: number;
}

export function ThresholdManager({
  resourceId,
  resourceName,
  resourceType,
  currentAmount,
  maxCapacity,
}: ThresholdManagerProps) {
  const { state, dispatch } = useThreshold();
  const resource = state.resources[resourceId];

  const [isEditing, setIsEditing] = useState(false);
  const [showPresetsPanel, setShowPresetsPanel] = useState(false);
  const [minThreshold, setMinThreshold] = useState(
    resource?.thresholds.min || 0,
  );
  const [maxThreshold, setMaxThreshold] = useState(
    resource?.thresholds.max || maxCapacity,
  );

  // Initialize threshold if not exists
  useEffect(() => {
    if (!resource) {
      dispatch({
        type: "ADD_RESOURCE",
        payload: {
          id: resourceId,
          name: resourceName,
          type: resourceType,
          currentAmount: 0,
          maxCapacity,
          thresholds: {
            min: minThreshold,
            max: maxThreshold,
          },
          autoMine: false,
        },
      });
    }
  }, [
    resourceId,
    dispatch,
    resource,
    resourceName,
    resourceType,
    maxCapacity,
    minThreshold,
    maxThreshold,
  ]);

  const handleSaveThresholds = () => {
    dispatch({
      type: "SET_THRESHOLD",
      payload: {
        resourceId,
        min: minThreshold,
        max: maxThreshold,
      },
    });
    setIsEditing(false);
  };

  const toggleAutoMine = () => {
    dispatch({
      type: "TOGGLE_AUTO_MINE",
      payload: { resourceId },
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Database className="text-indigo-400" size={20} />
          <h3 className="text-lg font-semibold text-white">{resourceName}</h3>
          {resource?.autoMine && (
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
              Auto
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAutoMine}
            className={`px-3 py-1 rounded text-sm ${
              resource?.autoMine
                ? "bg-blue-500 text-white"
                : "bg-gray-600 text-gray-300"
            }`}
          >
            {resource?.autoMine ? "Auto On" : "Auto Off"}
          </button>
          <button
            onClick={() => setShowPresetsPanel(true)}
            className="p-2 hover:bg-gray-700 rounded"
            title="Manage Presets"
          >
            <Bookmark size={16} className="text-gray-400" />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <Settings size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Threshold Status Indicator */}
      <ThresholdStatusIndicator
        currentAmount={currentAmount}
        minThreshold={resource?.thresholds.min || 0}
        maxThreshold={resource?.thresholds.max || maxCapacity}
        maxCapacity={maxCapacity}
        extractionRate={resource?.autoMine ? 10 : 0} // TODO: Get actual extraction rate
        showDetails={isEditing}
      />

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 mt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Minimum Threshold
                </label>
                <input
                  type="number"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(Number(e.target.value))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Maximum Threshold
                </label>
                <input
                  type="number"
                  value={maxThreshold}
                  onChange={(e) => setMaxThreshold(Number(e.target.value))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveThresholds}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPresetsPanel && (
          <ThresholdPresetsPanel onClose={() => setShowPresetsPanel(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
