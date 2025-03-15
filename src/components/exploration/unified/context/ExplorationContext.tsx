/**
 * ExplorationContext
 * 
 * A unified context for exploration data management.
 * This context provides a central repository for all exploration-related data,
 * including sectors, systems, anomalies, resources, and analysis results.
 */

import * as React from "react";
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  ExplorationState,
  ExplorationContextType,
  Sector,
  StarSystem,
  Planet,
  Anomaly,
  ResourceDeposit,
  AnalysisResult,
  ExplorationActivity,
  createEmptyExplorationState
} from '../../../../types/exploration/unified';

// Action types
enum ActionType {
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  SET_SECTORS = 'SET_SECTORS',
  SET_SYSTEMS = 'SET_SYSTEMS',
  SET_PLANETS = 'SET_PLANETS',
  SET_RESOURCES = 'SET_RESOURCES',
  SET_ANOMALIES = 'SET_ANOMALIES',
  SET_TRADE_ROUTES = 'SET_TRADE_ROUTES',
  SET_ACTIVITIES = 'SET_ACTIVITIES',
  SET_ANALYSIS_RESULTS = 'SET_ANALYSIS_RESULTS',
  ADD_SECTOR = 'ADD_SECTOR',
  UPDATE_SECTOR = 'UPDATE_SECTOR',
  ADD_SYSTEM = 'ADD_SYSTEM',
  UPDATE_SYSTEM = 'UPDATE_SYSTEM',
  ADD_PLANET = 'ADD_PLANET',
  UPDATE_PLANET = 'UPDATE_PLANET',
  ADD_ANOMALY = 'ADD_ANOMALY',
  UPDATE_ANOMALY = 'UPDATE_ANOMALY',
  ADD_RESOURCE = 'ADD_RESOURCE',
  UPDATE_RESOURCE = 'UPDATE_RESOURCE',
  ADD_ANALYSIS_RESULT = 'ADD_ANALYSIS_RESULT',
  ADD_ACTIVITY = 'ADD_ACTIVITY'
}

// Action types
type Action =
  | { type: ActionType.SET_LOADING; payload: boolean }
  | { type: ActionType.SET_ERROR; payload: string | null }
  | { type: ActionType.SET_SECTORS; payload: Sector[] }
  | { type: ActionType.SET_SYSTEMS; payload: StarSystem[] }
  | { type: ActionType.SET_PLANETS; payload: Planet[] }
  | { type: ActionType.SET_RESOURCES; payload: ResourceDeposit[] }
  | { type: ActionType.SET_ANOMALIES; payload: Anomaly[] }
  | { type: ActionType.SET_TRADE_ROUTES; payload: any[] }
  | { type: ActionType.SET_ACTIVITIES; payload: ExplorationActivity[] }
  | { type: ActionType.SET_ANALYSIS_RESULTS; payload: AnalysisResult[] }
  | { type: ActionType.ADD_SECTOR; payload: Sector }
  | { type: ActionType.UPDATE_SECTOR; payload: Sector }
  | { type: ActionType.ADD_SYSTEM; payload: StarSystem }
  | { type: ActionType.UPDATE_SYSTEM; payload: StarSystem }
  | { type: ActionType.ADD_PLANET; payload: Planet }
  | { type: ActionType.UPDATE_PLANET; payload: Planet }
  | { type: ActionType.ADD_ANOMALY; payload: Anomaly }
  | { type: ActionType.UPDATE_ANOMALY; payload: Anomaly }
  | { type: ActionType.ADD_RESOURCE; payload: ResourceDeposit }
  | { type: ActionType.UPDATE_RESOURCE; payload: ResourceDeposit }
  | { type: ActionType.ADD_ANALYSIS_RESULT; payload: AnalysisResult }
  | { type: ActionType.ADD_ACTIVITY; payload: ExplorationActivity };

// Reducer function
function explorationReducer(state: ExplorationState, action: Action): ExplorationState {
  switch (action.type) {
    case ActionType.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionType.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ActionType.SET_SECTORS:
      return { ...state, sectors: action.payload };
    
    case ActionType.SET_SYSTEMS:
      return { ...state, systems: action.payload };
    
    case ActionType.SET_PLANETS:
      return { ...state, planets: action.payload };
    
    case ActionType.SET_RESOURCES:
      return { ...state, resources: action.payload };
    
    case ActionType.SET_ANOMALIES:
      return { ...state, anomalies: action.payload };
    
    case ActionType.SET_TRADE_ROUTES:
      return { ...state, tradeRoutes: action.payload };
    
    case ActionType.SET_ACTIVITIES:
      return { ...state, activities: action.payload };
    
    case ActionType.SET_ANALYSIS_RESULTS:
      return { ...state, analysisResults: action.payload };
    
    case ActionType.ADD_SECTOR:
      return { ...state, sectors: [...state.sectors, action.payload] };
    
    case ActionType.UPDATE_SECTOR:
      return {
        ...state,
        sectors: state.sectors.map(sector =>
          sector.id === action.payload.id ? action.payload : sector
        )
      };
    
    case ActionType.ADD_SYSTEM:
      return { ...state, systems: [...state.systems, action.payload] };
    
    case ActionType.UPDATE_SYSTEM:
      return {
        ...state,
        systems: state.systems.map(system =>
          system.id === action.payload.id ? action.payload : system
        )
      };
    
    case ActionType.ADD_PLANET:
      return { ...state, planets: [...state.planets, action.payload] };
    
    case ActionType.UPDATE_PLANET:
      return {
        ...state,
        planets: state.planets.map(planet =>
          planet.id === action.payload.id ? action.payload : planet
        )
      };
    
    case ActionType.ADD_ANOMALY:
      return { ...state, anomalies: [...state.anomalies, action.payload] };
    
    case ActionType.UPDATE_ANOMALY:
      return {
        ...state,
        anomalies: state.anomalies.map(anomaly =>
          anomaly.id === action.payload.id ? action.payload : anomaly
        )
      };
    
    case ActionType.ADD_RESOURCE:
      return { ...state, resources: [...state.resources, action.payload] };
    
    case ActionType.UPDATE_RESOURCE:
      return {
        ...state,
        resources: state.resources.map(resource =>
          resource.id === action.payload.id ? action.payload : resource
        )
      };
    
    case ActionType.ADD_ANALYSIS_RESULT:
      return { ...state, analysisResults: [...state.analysisResults, action.payload] };
    
    case ActionType.ADD_ACTIVITY:
      return { ...state, activities: [...state.activities, action.payload] };
    
    default:
      return state;
  }
}

// Create context
const ExplorationContext = createContext<ExplorationContextType | undefined>(undefined);

// Provider props
interface ExplorationProviderProps {
  children: React.ReactNode;
  initialData?: Partial<ExplorationState>;
  /**
   * Optional function to fetch data from a remote source.
   * If provided, will be called on mount and when refreshData is called.
   */
  dataFetcher?: () => Promise<Partial<ExplorationState>>;
}

/**
 * ExplorationProvider component
 */
export const ExplorationProvider: React.FC<ExplorationProviderProps> = ({
  children,
  initialData,
  dataFetcher
}) => {
  // Initial state
  const initialState: ExplorationState = {
    ...createEmptyExplorationState(),
    ...initialData
  };
  
  // Create reducer
  const [state, dispatch] = useReducer(explorationReducer, initialState);
  
  // Helper functions
  const getSectors = useCallback(() => {
    return state.sectors;
  }, [state.sectors]);
  
  const getSectorById = useCallback((id: string) => {
    return state.sectors.find(sector => sector.id === id);
  }, [state.sectors]);
  
  const updateSector = useCallback((sector: Sector) => {
    const existing = state.sectors.find(s => s.id === sector.id);
    if (existing) {
      dispatch({ type: ActionType.UPDATE_SECTOR, payload: sector });
    } else {
      dispatch({ type: ActionType.ADD_SECTOR, payload: sector });
    }
  }, [state.sectors]);
  
  const getSystemsBySectorId = useCallback((sectorId: string) => {
    return state.systems.filter(system => system.sectorId === sectorId);
  }, [state.systems]);
  
  const getSystemById = useCallback((id: string) => {
    return state.systems.find(system => system.id === id);
  }, [state.systems]);
  
  const updateSystem = useCallback((system: StarSystem) => {
    const existing = state.systems.find(s => s.id === system.id);
    if (existing) {
      dispatch({ type: ActionType.UPDATE_SYSTEM, payload: system });
    } else {
      dispatch({ type: ActionType.ADD_SYSTEM, payload: system });
    }
  }, [state.systems]);
  
  const getPlanetsBySystemId = useCallback((systemId: string) => {
    return state.planets.filter(planet => planet.systemId === systemId);
  }, [state.planets]);
  
  const getPlanetById = useCallback((id: string) => {
    return state.planets.find(planet => planet.id === id);
  }, [state.planets]);
  
  const updatePlanet = useCallback((planet: Planet) => {
    const existing = state.planets.find(p => p.id === planet.id);
    if (existing) {
      dispatch({ type: ActionType.UPDATE_PLANET, payload: planet });
    } else {
      dispatch({ type: ActionType.ADD_PLANET, payload: planet });
    }
  }, [state.planets]);
  
  const getAnomaliesBySectorId = useCallback((sectorId: string) => {
    // Find all anomalies within systems in this sector
    const systemIds = state.systems
      .filter(system => system.sectorId === sectorId)
      .map(system => system.id);
    
    return state.anomalies.filter(anomaly => {
      const coords = anomaly.coordinates;
      
      // Check if the anomaly has a direct sector reference
      if (coords.sector === sectorId) return true;
      
      // Check if the anomaly is within any system in this sector
      // This is a simplified check - in a real implementation,
      // you might use more complex spatial calculations
      return systemIds.some(systemId => {
        const system = state.systems.find(s => s.id === systemId);
        if (!system) return false;
        
        // Calculate distance between anomaly and system
        const dx = coords.x - system.coordinates.x;
        const dy = coords.y - system.coordinates.y;
        const dz = (coords.z || 0) - (system.coordinates.z || 0);
        
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Consider the anomaly part of the system if it's within a certain distance
        // This value would be adjusted based on your game's scale
        return distance < 100;
      });
    });
  }, [state.anomalies, state.systems]);
  
  const getAnomalyById = useCallback((id: string) => {
    return state.anomalies.find(anomaly => anomaly.id === id);
  }, [state.anomalies]);
  
  const updateAnomaly = useCallback((anomaly: Anomaly) => {
    const existing = state.anomalies.find(a => a.id === anomaly.id);
    if (existing) {
      dispatch({ type: ActionType.UPDATE_ANOMALY, payload: anomaly });
    } else {
      dispatch({ type: ActionType.ADD_ANOMALY, payload: anomaly });
    }
  }, [state.anomalies]);
  
  const getResourcesByEntityId = useCallback((entityId: string) => {
    // First check if it's a sector
    const sector = state.sectors.find(s => s.id === entityId);
    if (sector) {
      return state.resources.filter(r => {
        const coords = r.coordinates;
        return coords.sector === entityId;
      });
    }
    
    // Then check if it's a system
    const system = state.systems.find(s => s.id === entityId);
    if (system) {
      // Get resources close to this system
      return state.resources.filter(r => {
        const coords = r.coordinates;
        
        // Calculate distance between resource and system
        const dx = coords.x - system.coordinates.x;
        const dy = coords.y - system.coordinates.y;
        const dz = (coords.z || 0) - (system.coordinates.z || 0);
        
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Consider the resource part of the system if it's within a certain distance
        return distance < 50;
      });
    }
    
    // Then check if it's a planet
    const planet = state.planets.find(p => p.id === entityId);
    if (planet) {
      return planet.resources || [];
    }
    
    // If none of the above, return an empty array
    return [];
  }, [state.sectors, state.systems, state.planets, state.resources]);
  
  const updateResource = useCallback((resource: ResourceDeposit) => {
    const existing = state.resources.find(r => r.id === resource.id);
    if (existing) {
      dispatch({ type: ActionType.UPDATE_RESOURCE, payload: resource });
    } else {
      dispatch({ type: ActionType.ADD_RESOURCE, payload: resource });
    }
  }, [state.resources]);
  
  const getAnalysisResultsByEntityId = useCallback((entityId: string) => {
    return state.analysisResults.filter(result => result.entityIds.includes(entityId));
  }, [state.analysisResults]);
  
  const createAnalysis = useCallback((config: Omit<AnalysisResult, 'id' | 'createdAt'>) => {
    const id = `analysis-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const analysis: AnalysisResult = {
      ...config,
      id,
      createdAt: Date.now()
    };
    
    dispatch({ type: ActionType.ADD_ANALYSIS_RESULT, payload: analysis });
    
    return id;
  }, []);
  
  const recordActivity = useCallback((activity: Omit<ExplorationActivity, 'id' | 'timestamp'>) => {
    const id = `activity-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newActivity: ExplorationActivity = {
      ...activity,
      id,
      timestamp: Date.now()
    };
    
    dispatch({ type: ActionType.ADD_ACTIVITY, payload: newActivity });
    
    return id;
  }, []);
  
  const getActivitiesByEntityId = useCallback((entityId: string) => {
    return state.activities.filter(activity => activity.entityId === entityId);
  }, [state.activities]);
  
  // Fetch data on mount if dataFetcher is provided
  const refreshData = useCallback(async () => {
    if (!dataFetcher) return;
    
    try {
      dispatch({ type: ActionType.SET_LOADING, payload: true });
      dispatch({ type: ActionType.SET_ERROR, payload: null });
      
      const data = await dataFetcher();
      
      // Update state with fetched data
      if (data.sectors) dispatch({ type: ActionType.SET_SECTORS, payload: data.sectors });
      if (data.systems) dispatch({ type: ActionType.SET_SYSTEMS, payload: data.systems });
      if (data.planets) dispatch({ type: ActionType.SET_PLANETS, payload: data.planets });
      if (data.resources) dispatch({ type: ActionType.SET_RESOURCES, payload: data.resources });
      if (data.anomalies) dispatch({ type: ActionType.SET_ANOMALIES, payload: data.anomalies });
      if (data.tradeRoutes) dispatch({ type: ActionType.SET_TRADE_ROUTES, payload: data.tradeRoutes });
      if (data.activities) dispatch({ type: ActionType.SET_ACTIVITIES, payload: data.activities });
      if (data.analysisResults) dispatch({ type: ActionType.SET_ANALYSIS_RESULTS, payload: data.analysisResults });
    } catch (error) {
      dispatch({ type: ActionType.SET_ERROR, payload: String(error) });
    } finally {
      dispatch({ type: ActionType.SET_LOADING, payload: false });
    }
  }, [dataFetcher]);
  
  // Fetch data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  // Create context value
  const contextValue: ExplorationContextType = {
    state,
    getSectors,
    getSectorById,
    updateSector,
    getSystemsBySectorId,
    getSystemById,
    updateSystem,
    getPlanetsBySystemId,
    getPlanetById,
    updatePlanet,
    getAnomaliesBySectorId,
    getAnomalyById,
    updateAnomaly,
    getResourcesByEntityId,
    updateResource,
    getAnalysisResultsByEntityId,
    createAnalysis,
    recordActivity,
    getActivitiesByEntityId,
    refreshData
  };
  
  return (
    <ExplorationContext.Provider value={contextValue}>
      {children}
    </ExplorationContext.Provider>
  );
};

/**
 * Custom hook to use the exploration context
 */
export function useExploration(): ExplorationContextType {
  const context = useContext(ExplorationContext);
  
  if (context === undefined) {
    throw new Error('useExploration must be used within an ExplorationProvider');
  }
  
  return context;
}

export default ExplorationContext;