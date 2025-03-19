import { EventEmitter } from '../../lib/events/EventEmitter';
import {
  EnvironmentalFactors,
  ScannerClass,
  calculateScanRadius,
  getDistance,
} from '../../utils/combat/scanRadiusUtils';

/**
 * Events emitted by the ObjectDetectionSystem
 */
export enum ObjectDetectionEvent {
  OBJECT_DETECTED = 'OBJECT_DETECTED',
  OBJECT_LOST = 'OBJECT_LOST',
  SCAN_COMPLETED = 'SCAN_COMPLETED',
  ENVIRONMENTAL_CHANGE = 'ENVIRONMENTAL_CHANGE',
}

export interface DetectionEventData {
  detector: string; // ID of the detecting unit
  detected: string; // ID of the detected unit
  confidence: number; // 0-1, how confident the detection is
  distance: number; // Distance between detector and detected object
  bearing: number; // Angle in degrees from detector to detected
  timestamp: number; // When the detection occurred
}

export interface ScanCompletedEventData {
  scannerId: string;
  detectedObjects: string[];
  scanDuration: number;
  scanRadius: number;
  timestamp: number;
}

export interface EnvironmentalChangeEventData {
  previousFactors: EnvironmentalFactors;
  newFactors: EnvironmentalFactors;
  timestamp: number;
}

export interface ObjectLostEventData {
  detector: string;
  lost: string;
  lastConfidence: number;
  timestamp: number;
}

// Event map for the detection system
export interface ObjectDetectionEventMap extends Record<string, unknown> {
  [ObjectDetectionEvent.OBJECT_DETECTED]: DetectionEventData;
  [ObjectDetectionEvent.OBJECT_LOST]: ObjectLostEventData;
  [ObjectDetectionEvent.SCAN_COMPLETED]: ScanCompletedEventData;
  [ObjectDetectionEvent.ENVIRONMENTAL_CHANGE]: EnvironmentalChangeEventData;
}

/**
 * Interface for units that can detect other objects
 */
export interface DetectorUnit {
  id: string;
  position: { x: number; y: number };
  scannerClass: ScannerClass;
  techLevel: number; // Technological level affecting scanning capability
  faction: string;
  isActive: boolean;
}

/**
 * Interface for objects that can be detected
 */
export interface DetectableObject {
  id: string;
  position: { x: number; y: number };
  type: string;
  faction: string;
  signature: number; // How easy it is to detect (0-1)
  isActive: boolean;
}

export interface ObjectDetectionSystem {
  registerDetector(detector: DetectorUnit): void;
  unregisterDetector(detectorId: string): void;
  registerDetectable(object: DetectableObject): void;
  unregisterDetectable(objectId: string): void;
  performScan(detectorId: string): Promise<string[]>;
  getDetectedObjects(detectorId: string): string[];
  getDetectionConfidence(detectorId: string, objectId: string): number;
  updateEnvironmentalFactors(factors: EnvironmentalFactors): void;
  on<K extends ObjectDetectionEvent>(
    event: K,
    callback: (data: ObjectDetectionEventMap[K]) => void
  ): void;
  off<K extends ObjectDetectionEvent>(
    event: K,
    callback: (data: ObjectDetectionEventMap[K]) => void
  ): void;
}

/**
 * Implementation of the ObjectDetectionSystem
 * Handles detection of objects in space based on scanner capabilities
 * and environmental factors
 */
export class ObjectDetectionSystemImpl implements ObjectDetectionSystem {
  private detectors: Map<string, DetectorUnit> = new Map();
  private detectables: Map<string, DetectableObject> = new Map();
  private detectedObjectsCache: Map<string, Set<string>> = new Map();
  private detectionConfidenceCache: Map<string, Map<string, number>> = new Map();
  private environmentalFactors: EnvironmentalFactors = {};
  private eventEmitter = new EventEmitter<ObjectDetectionEventMap>();
  private scanLoopActive = false;

  // Configuration
  private readonly PASSIVE_SCAN_INTERVAL = 5000; // ms
  private readonly ACTIVE_SCAN_DURATION = 1000; // ms
  private readonly DETECTION_THRESHOLD = 0.3; // Minimum confidence to register a detection
  private readonly FORGET_THRESHOLD = 0.1; // Below this confidence, object is forgotten

  constructor(environmentalFactors: EnvironmentalFactors = {}) {
    this.environmentalFactors = environmentalFactors;
    this.startScanLoop();
  }

  /**
   * Register a unit that can detect other objects
   */
  public registerDetector(detector: DetectorUnit): void {
    this.detectors.set(detector.id, detector);
    this.detectedObjectsCache.set(detector.id, new Set());
    this.detectionConfidenceCache.set(detector.id, new Map());
  }

  /**
   * Remove a detector from the system
   */
  public unregisterDetector(detectorId: string): void {
    this.detectors.delete(detectorId);
    this.detectedObjectsCache.delete(detectorId);
    this.detectionConfidenceCache.delete(detectorId);
  }

  /**
   * Register an object that can be detected
   */
  public registerDetectable(object: DetectableObject): void {
    this.detectables.set(object.id, object);
  }

  /**
   * Remove a detectable object from the system
   */
  public unregisterDetectable(objectId: string): void {
    this.detectables.delete(objectId);

    // Remove from all detection caches
    for (const detectedSet of this.detectedObjectsCache.values()) {
      detectedSet.delete(objectId);
    }

    for (const confidenceMap of this.detectionConfidenceCache.values()) {
      confidenceMap.delete(objectId);
    }
  }

  /**
   * Update environmental factors affecting detection
   */
  public updateEnvironmentalFactors(factors: EnvironmentalFactors): void {
    this.environmentalFactors = { ...this.environmentalFactors, ...factors };

    this.eventEmitter.emit(ObjectDetectionEvent.ENVIRONMENTAL_CHANGE, {
      previousFactors: this.environmentalFactors,
      newFactors: factors,
      timestamp: Date.now(),
    });
  }

  /**
   * Begin continuous passive scanning
   */
  private startScanLoop(): void {
    if (this.scanLoopActive) {
      return;
    }

    this.scanLoopActive = true;

    const runScanCycle = () => {
      if (!this.scanLoopActive) {
        return;
      }

      // Only run passive scans for active detectors
      for (const detector of this.detectors.values()) {
        if (detector.isActive) {
          this.runPassiveScan(detector);
        }
      }

      setTimeout(runScanCycle, this.PASSIVE_SCAN_INTERVAL);
    };

    runScanCycle();
  }

  /**
   * Stop continuous passive scanning
   */
  public stopScanLoop(): void {
    this.scanLoopActive = false;
  }

  /**
   * Perform a single passive scan for a detector
   */
  private runPassiveScan(detector: DetectorUnit): void {
    const effectiveScanRadius = calculateScanRadius(
      detector.scannerClass,
      1 + detector.techLevel * 0.1, // 10% bonus per tech level
      this.environmentalFactors
    );

    const detectedObjectIds = this.detectedObjectsCache.get(detector.id) || new Set<string>();
    const confidenceMap =
      this.detectionConfidenceCache.get(detector.id) || new Map<string, number>();

    // Check all detectable objects
    for (const object of this.detectables.values()) {
      // Skip objects of the same faction (assumed to share IFF)
      if (object.faction === detector.faction) {
        continue;
      }

      // Skip inactive objects
      if (!object.isActive) {
        continue;
      }

      const distance = getDistance(detector.position, object.position);

      // Calculate detection probability
      const detectionProbability = this.calculateDetectionProbability(
        detector,
        object,
        distance,
        effectiveScanRadius
      );

      // Update confidence based on current detection
      let currentConfidence = confidenceMap.get(object.id) ?? 0;

      if (Math.random() < detectionProbability) {
        // Successful detection increases confidence
        currentConfidence = Math.min(1.0, currentConfidence + 0.2);
      } else {
        // Failed detection decreases confidence
        currentConfidence = Math.max(0.0, currentConfidence - 0.1);
      }

      // Update confidence map
      confidenceMap.set(object.id, currentConfidence);

      // Check if object should be added to or removed from detected set
      if (currentConfidence >= this.DETECTION_THRESHOLD) {
        if (!detectedObjectIds.has(object.id)) {
          // New detection
          detectedObjectIds.add(object.id);

          // Calculate bearing
          const bearing = this.calculateBearing(detector.position, object.position);

          // Emit detection event
          this.eventEmitter.emit(ObjectDetectionEvent.OBJECT_DETECTED, {
            detector: detector.id,
            detected: object.id,
            confidence: currentConfidence,
            distance,
            bearing,
            timestamp: Date.now(),
          });
        }
      } else if (currentConfidence <= this.FORGET_THRESHOLD && detectedObjectIds.has(object.id)) {
        detectedObjectIds.delete(object.id);

        // Emit lost event
        this.eventEmitter.emit(ObjectDetectionEvent.OBJECT_LOST, {
          detector: detector.id,
          lost: object.id,
          lastConfidence: currentConfidence,
          timestamp: Date.now(),
        });
      }
    }

    // Update caches
    this.detectedObjectsCache.set(detector.id, detectedObjectIds);
    this.detectionConfidenceCache.set(detector.id, confidenceMap);
  }

  /**
   * Perform an active scan, which has higher accuracy but takes time and may reveal the scanner
   */
  public performScan(detectorId: string): Promise<string[]> {
    return new Promise(resolve => {
      const detector = this.detectors.get(detectorId);

      if (!detector || !detector.isActive) {
        resolve([]);
        return;
      }

      // Active scans have better detection capability
      const scannerBoost = 1.5;

      const effectiveScanRadius = calculateScanRadius(
        detector.scannerClass,
        (1 + detector.techLevel * 0.1) * scannerBoost,
        this.environmentalFactors
      );

      const startTime = Date.now();

      // Simulate scan taking time
      setTimeout(() => {
        const detectedObjects: string[] = [];

        // Check all detectable objects with boosted detection probability
        for (const object of this.detectables.values()) {
          // Skip objects of the same faction (assumed to share IFF)
          if (object.faction === detector.faction) {
            continue;
          }

          // Skip inactive objects
          if (!object.isActive) {
            continue;
          }

          const distance = getDistance(detector.position, object.position);

          // Apply scan boost
          const detectionProbability =
            this.calculateDetectionProbability(detector, object, distance, effectiveScanRadius) *
            scannerBoost;

          // Active scan has higher chance of detection
          if (Math.random() < detectionProbability) {
            detectedObjects.push(object.id);

            // Update confidence to maximum for detected objects
            const confidenceMap =
              this.detectionConfidenceCache.get(detector.id) || new Map<string, number>();
            confidenceMap.set(object.id, 1.0);
            this.detectionConfidenceCache.set(detector.id, confidenceMap);

            // Add to detected set
            const detectedSet = this.detectedObjectsCache.get(detector.id) || new Set<string>();
            if (!detectedSet.has(object.id)) {
              detectedSet.add(object.id);
              this.detectedObjectsCache.set(detector.id, detectedSet);

              // Calculate bearing
              const bearing = this.calculateBearing(detector.position, object.position);

              // Emit detection event
              this.eventEmitter.emit(ObjectDetectionEvent.OBJECT_DETECTED, {
                detector: detector.id,
                detected: object.id,
                confidence: 1.0,
                distance,
                bearing,
                timestamp: Date.now(),
              });
            }
          }
        }

        const scanDuration = Date.now() - startTime;

        // Emit scan completed event
        this.eventEmitter.emit(ObjectDetectionEvent.SCAN_COMPLETED, {
          scannerId: detector.id,
          detectedObjects,
          scanDuration,
          scanRadius: effectiveScanRadius,
          timestamp: Date.now(),
        });

        resolve(detectedObjects);
      }, this.ACTIVE_SCAN_DURATION);
    });
  }

  /**
   * Get the list of objects currently detected by a detector
   */
  public getDetectedObjects(detectorId: string): string[] {
    const detectedSet = this.detectedObjectsCache.get(detectorId);
    return detectedSet ? Array.from(detectedSet) : [];
  }

  /**
   * Get the current confidence level for a detected object
   */
  public getDetectionConfidence(detectorId: string, objectId: string): number {
    const confidenceMap = this.detectionConfidenceCache.get(detectorId);
    return confidenceMap ? (confidenceMap.get(objectId) ?? 0) : 0;
  }

  /**
   * Calculate detection probability based on detector, object, and environmental factors
   */
  private calculateDetectionProbability(
    detector: DetectorUnit,
    object: DetectableObject,
    distance: number,
    scanRadius: number
  ): number {
    // Base probability from scan radius utils
    let probability = this.calculateBaseProbability(distance, scanRadius, object.signature);

    // Additional factors based on detector tech level
    probability *= 1 + detector.techLevel * 0.05;

    return Math.min(0.99, Math.max(0.01, probability));
  }

  /**
   * Calculate basic detection probability based on distance, radius, and signature
   */
  private calculateBaseProbability(
    distance: number,
    scanRadius: number,
    targetSignature: number
  ): number {
    if (distance <= scanRadius * 0.5) {
      // Objects within 50% of scan radius are almost certainly detected
      return Math.min(0.95, targetSignature * 1.5);
    }

    if (distance > scanRadius) {
      // Objects beyond scan radius have minimal chance of detection
      return Math.max(0.01, targetSignature * 0.1 * (scanRadius / distance));
    }

    // Linear falloff between 50% and 100% of scan radius
    const distanceRatio = (scanRadius - distance) / (scanRadius * 0.5);
    return Math.max(0.05, targetSignature * distanceRatio);
  }

  /**
   * Calculate bearing from source to target in degrees (0-359)
   */
  private calculateBearing(
    source: { x: number; y: number },
    target: { x: number; y: number }
  ): number {
    const deltaX = target.x - source.x;
    const deltaY = target.y - source.y;

    // Calculate angle in radians
    const angleRad = Math.atan2(deltaY, deltaX);

    // Convert to degrees and ensure 0-359 range
    let angleDeg = ((angleRad * 180) / Math.PI) % 360;
    if (angleDeg < 0) {
      angleDeg += 360;
    }

    return angleDeg;
  }

  /**
   * Register event listener
   */
  public on<K extends ObjectDetectionEvent>(
    event: K,
    callback: (data: ObjectDetectionEventMap[K]) => void
  ): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Remove event listener
   */
  public off<K extends ObjectDetectionEvent>(
    event: K,
    callback: (data: ObjectDetectionEventMap[K]) => void
  ): void {
    this.eventEmitter.off(event, callback);
  }
}
