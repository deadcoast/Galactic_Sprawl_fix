import { ResourceType } from '../../types/resources/ResourceTypes';
/**
 * Test file with string literals for ResourceType
 */

const MINERALS_STR = ResourceType.MINERALS;
const GAS_STR = ResourceType.GAS;
const ENERGY_STR = ResourceType.ENERGY;

function processResourceString(resourceType: string): ResourceType {
  if (resourceType === MINERALS_STR) {
    return MINERALS_STR;
  } else if (resourceType === GAS_STR) {
    return GAS_STR;
  } else {
    return "unknown";
  }
}

export { MINERALS_STR, GAS_STR, ENERGY_STR, processResourceString };
