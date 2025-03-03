# Resource Conversion Efficiency System

## Overview

The Resource Conversion Efficiency System enhances the resource management mechanics by introducing variable efficiency factors that affect resource conversion processes. This document provides detailed information about the implementation, usage, and integration of this feature.

## Key Components

### Efficiency Factors

The system considers multiple factors that influence conversion efficiency:

1. **Base Efficiency**: The fundamental efficiency of a converter, determined by its tier and technology level.

2. **Quality Modifier**: A modifier based on the quality of input resources.

3. **Technology Modifier**: A modifier based on the player's research and technology level.

4. **Environmental Modifier**: A modifier based on environmental conditions (location, hazards, etc.).

### EfficiencyCalculator

The `EfficiencyCalculator` utility handles efficiency calculations:

```typescript
class EfficiencyCalculator {
  public static calculateEfficiency(
    baseEfficiency: number,
    qualityModifier: number,
    techModifier: number,
    environmentalModifier: number
  ): number {
    return baseEfficiency * qualityModifier * techModifier * environmentalModifier;
  }

  public static calculateCompoundEfficiency(efficiencies: number[]): number {
    if (efficiencies.length === 0) return 1.0;

    // Calculate compound efficiency
    return efficiencies.reduce((compound, efficiency) => compound * efficiency, 1.0);
  }

  public static getQualityModifier(resourceQuality: ResourceQuality): number {
    // Quality modifiers range from 0.5 (poor) to 1.5 (exceptional)
    switch (resourceQuality) {
      case 'poor':
        return 0.5;
      case 'standard':
        return 1.0;
      case 'good':
        return 1.2;
      case 'excellent':
        return 1.35;
      case 'exceptional':
        return 1.5;
      default:
        return 1.0;
    }
  }

  public static getTechModifier(techLevel: number): number {
    // Tech level provides up to 50% bonus
    return 1.0 + techLevel * 0.05;
  }

  public static getEnvironmentalModifier(environmentFactors: EnvironmentFactor[]): number {
    // Start with neutral modifier
    let modifier = 1.0;

    // Apply each environmental factor
    for (const factor of environmentFactors) {
      modifier *= factor.efficiencyImpact;
    }

    return modifier;
  }
}
```

### ResourceConversionProcess Interface

The `ResourceConversionProcess` interface has been enhanced to include efficiency tracking:

```typescript
interface ResourceConversionProcess {
  processId: string;
  converterId: string;
  recipeId: string;
  startTime: number;
  duration: number;
  status: 'in-progress' | 'completed' | 'failed';
  inputResources: ResourceQuantity[];
  expectedOutputs: ResourceQuantity[];
  expectedByproducts: ResourceQuantity[];
  baseEfficiency: number;
  appliedEfficiency: number; // The actual efficiency used in the conversion
  qualityModifier: number;
  techModifier: number;
  environmentalModifier: number;
}
```

## Implementation Details

### Efficiency Calculation

The efficiency calculation process follows these steps:

1. **Base Efficiency Determination**:

   - Each converter has a base efficiency value
   - Higher tier converters have better base efficiency
   - Base efficiency ranges from 0.6 (tier 1) to 1.0 (tier 5)

2. **Quality Modifier Calculation**:

   - Input resource quality affects conversion efficiency
   - Poor quality resources reduce efficiency (0.5x)
   - Exceptional quality resources improve efficiency (1.5x)
   - For multiple inputs, a weighted average is used

3. **Technology Modifier Application**:

   - Research and technology level provide bonuses
   - Each tech level adds a 5% efficiency bonus
   - Maximum tech bonus is 50% (at level 10)

4. **Environmental Modifier Application**:

   - Environmental factors can positively or negatively affect efficiency
   - Hazards typically reduce efficiency
   - Specialized environments can boost efficiency for certain processes

5. **Final Efficiency Calculation**:
   - All modifiers are multiplied together to get the final efficiency
   - `finalEfficiency = baseEfficiency * qualityModifier * techModifier * environmentalModifier`

### Compound Efficiency for Multi-Step Processes

For multi-step production chains, compound efficiency is calculated:

1. **Step Efficiency Calculation**:

   - Each step's efficiency is calculated independently
   - All relevant modifiers are applied to each step

2. **Compound Efficiency Calculation**:

   - The efficiencies of all steps are multiplied together
   - `compoundEfficiency = efficiency1 * efficiency2 * ... * efficiencyN`

3. **Efficiency Loss Mitigation**:
   - Direct transfers between chain steps reduce efficiency loss
   - Specialized converters can have efficiency bonuses for specific chains

## Integration with ResourceFlowManager

The ResourceFlowManager has been updated to incorporate efficiency calculations:

### startConversionProcess Method

```typescript
public startConversionProcess(
  converterId: string,
  recipeId: string,
  inputOverrides?: ResourceQuantity[]
): ResourceConversionResult {
  // ... existing validation code ...

  // Get converter and recipe
  const converter = this.getConverter(converterId);
  const recipe = this.getRecipe(recipeId);

  // Calculate efficiency factors
  const baseEfficiency = this.getConverterBaseEfficiency(converter);
  const qualityModifier = this.calculateQualityModifier(inputResources);
  const techModifier = this.calculateTechModifier(converter, recipe);
  const environmentalModifier = this.calculateEnvironmentalModifier(converter);

  // Calculate applied efficiency
  const appliedEfficiency = EfficiencyCalculator.calculateEfficiency(
    baseEfficiency,
    qualityModifier,
    techModifier,
    environmentalModifier
  );

  // Create conversion process
  const process: ResourceConversionProcess = {
    processId: `process-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    converterId,
    recipeId,
    startTime: Date.now(),
    duration: recipe.baseDuration,
    status: 'in-progress',
    inputResources,
    expectedOutputs: recipe.outputs,
    expectedByproducts: recipe.byproducts || [],
    baseEfficiency,
    appliedEfficiency,
    qualityModifier,
    techModifier,
    environmentalModifier
  };

  // ... rest of the method ...
}
```

### completeConversionProcess Method

```typescript
public completeConversionProcess(processId: string): ResourceConversionResult {
  // ... existing validation code ...

  // Get process
  const process = this.activeProcesses.get(processId);

  // Calculate actual outputs based on efficiency
  const outputsProduced = this.calculateOutputsWithEfficiency(
    process.expectedOutputs,
    process.appliedEfficiency
  );

  const byproductsProduced = this.calculateOutputsWithEfficiency(
    process.expectedByproducts,
    process.appliedEfficiency
  );

  // ... rest of the method ...
}
```

### calculateOutputsWithEfficiency Method

```typescript
private calculateOutputsWithEfficiency(
  resources: ResourceQuantity[],
  efficiency: number
): ResourceQuantity[] {
  return resources.map(resource => ({
    resourceId: resource.resourceId,
    quantity: Math.floor(resource.quantity * efficiency)
  }));
}
```

## UI Integration

The efficiency system is integrated with the UI to provide feedback to the player:

1. **Efficiency Indicators**:

   - Visual indicators show the current efficiency of converters
   - Color coding indicates efficiency levels (red for low, green for high)
   - Tooltips provide detailed breakdown of efficiency factors

2. **Resource Quality Display**:

   - Resource quality is displayed in inventory and storage views
   - Quality affects resource value and conversion efficiency

3. **Technology Effects**:

   - Research tree shows efficiency bonuses from technologies
   - Technology descriptions include efficiency impacts

4. **Environmental Effects**:
   - Map overlays show environmental factors affecting efficiency
   - Building placement guides highlight optimal locations

## Usage Examples

### Basic Efficiency Calculation

```typescript
// Calculate efficiency for a standard conversion
const baseEfficiency = 0.8; // Tier 3 converter
const qualityModifier = EfficiencyCalculator.getQualityModifier('good'); // 1.2
const techModifier = EfficiencyCalculator.getTechModifier(5); // 1.25
const environmentalModifier = 1.0; // Neutral environment

const efficiency = EfficiencyCalculator.calculateEfficiency(
  baseEfficiency,
  qualityModifier,
  techModifier,
  environmentalModifier
);

// efficiency = 0.8 * 1.2 * 1.25 * 1.0 = 1.2
// This means the process is 20% more efficient than baseline
```

### Compound Efficiency for a Chain

```typescript
// Calculate compound efficiency for a 3-step chain
const step1Efficiency = 0.9;
const step2Efficiency = 1.1;
const step3Efficiency = 0.95;

const compoundEfficiency = EfficiencyCalculator.calculateCompoundEfficiency([
  step1Efficiency,
  step2Efficiency,
  step3Efficiency,
]);

// compoundEfficiency = 0.9 * 1.1 * 0.95 = 0.9405
// The overall chain is about 94% efficient
```

## Performance Considerations

1. **Calculation Overhead**: Efficiency calculations add computational overhead to conversion processes.

2. **Caching Strategy**: Efficiency factors that don't change frequently (like base efficiency) are cached.

3. **Batch Processing**: For large-scale operations, efficiency calculations are batched.

4. **Optimization Techniques**:
   - Precalculate common efficiency combinations
   - Use integer math where possible
   - Limit recalculation of environmental factors

## Future Enhancements

1. **Dynamic Efficiency**: Efficiency that changes over time based on converter wear and maintenance.

2. **Efficiency Upgrades**: Components and modifications that can improve converter efficiency.

3. **Specialized Converters**: Converters with high efficiency for specific recipes but lower for others.

4. **Efficiency Balancing**: Game mechanics that balance high efficiency against other factors like speed or resource cost.

5. **Advanced Visualization**: More detailed visualization of efficiency factors and their impacts.
