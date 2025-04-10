/**
 * Test file for unused variables
 * This file contains common patterns of unused variables
 * that should be detected and fixed by the fix_unused_vars.sh script
 */

// Unused function parameter
function processData(data: unknown, _options: unknown): void {
  // options is never used
  console.log(`Processing data: ${data}`);
}

// Unused variable in function body
function calculateTotal(prices: number[]): number {
  const _count = prices.length; // count is never used
  let sum = 0;

  for (let i = 0; i < prices.length; i++) {
    sum += prices[i];
  }

  return sum;
}

// Unused destructured variable
function getUserInfo({ name, age, _email }: { name: string; age: number; email: string }): string {
  // email is never used
  return `${name}, ${age} years old`;
}

// Unused import (would be detected by ESLint)
// import { Something } from './something';

// Unused variable in arrow function
const getFirstItem = (items: string[]) => {
  const _length = items.length; // length is never used
  return items[0];
};

// Unused variable in class
class DataProcessor {
  private data: unknown;
  private _config: unknown; // config is never used

  constructor(data: unknown, config: unknown) {
    this.data = data;
    this._config = config;
  }

  process(): void {
    console.log(`Processing: ${this.data}`);
  }
}

// Unused function parameter in callback
function processArray<T>(array: T[], callback: (item: T, index: number) => void): void {
  array.forEach((item, index) => {
    callback(item, index);
  });
}

// Usage with unused parameter
processArray([1, 2, 3], (item, _index) => {
  // index is never used
  console.log(`Item: ${item}`);
});

// Unused catch error
function safelyProcess(fn: () => void): void {
  try {
    fn();
  } catch (_error) {
    // error is never used
    console.log('An error occurred');
  }
}

// Unused variable in for loop
function findIndex(array: unknown[], value: unknown): number {
  for (let i = 0; i < array.length; i++) {
    const _item = array[i]; // Could use array[i] directly
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
}

// Unused variable in destructuring
const person = { name: 'John', age: 30, city: 'New York' };
const { name, age, _city } = person; // city is never used
console.log(`${name} is ${age} years old`);

// Export to avoid unused export warnings
export {
  calculateTotal, DataProcessor, findIndex,
  getFirstItem,
  getUserInfo,
  processArray,
  processData,
  safelyProcess
};

