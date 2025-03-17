/**
 * Test file with string literals for ResourceType
 */

const MINERALS_STR = "minerals";
const GAS_STR = "gas";
const ENERGY_STR = "energy";

function processResourceString(resourceType: string): string {
  if (resourceType === MINERALS_STR) {
    return MINERALS_STR;
  } else if (resourceType === GAS_STR) {
    return GAS_STR;
  } else {
    return "unknown";
  }
}

export { MINERALS_STR, GAS_STR, ENERGY_STR, processResourceString };
