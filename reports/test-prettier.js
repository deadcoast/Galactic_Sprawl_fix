// This is a test file to check if Prettier is working
function testFunction(a, b) {
  return a + b;
}

const obj = {
  a: 1,
  b: 2,
  c: 3,
};

// Function to calculate the sum of object properties
function calculateObjectSum() {
  let sum = 0;
  for (const key in obj) {
    sum += obj[key];
  }
  return sum;
}

// Export the calculated sum for testing
export const objectSum = calculateObjectSum();

export default testFunction;
