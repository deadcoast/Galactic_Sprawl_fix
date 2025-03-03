# UI Testing Best Practices for Galactic Sprawl

This document outlines the best practices for UI testing in the Galactic Sprawl project. It covers component testing, integration testing, and end-to-end testing approaches.

## Testing Hierarchy

We follow a testing pyramid approach:

1. **Unit Tests** (Base layer - most numerous)

   - Test individual functions and classes in isolation
   - Fast to run, easy to maintain
   - Focus on logic, not UI rendering

2. **Component Tests** (Middle layer)

   - Test individual UI components in isolation
   - Verify appearance and behavior of UI elements
   - Mock all external dependencies and state

3. **Integration Tests** (Upper middle layer)

   - Test how components work together
   - Verify UI updates correctly based on state changes
   - Limited mocking, test more realistic scenarios

4. **End-to-End Tests** (Top layer - least numerous)
   - Test complete user workflows
   - Verify the application works as a whole
   - Run against a fully functional application

## Component Testing with React Testing Library

### Principles

1. **Test behavior, not implementation**

   - Focus on what the user sees and does
   - Avoid testing implementation details
   - Prefer user-centric queries (`getByText`, `getByRole`) over implementation-centric ones (`getByTestId`)

2. **Follow user interactions**

   - Simulate real user behavior (clicks, typing, etc.)
   - Use `userEvent` over `fireEvent` when possible
   - Follow the natural flow a user would take

3. **Assertions should match user expectations**
   - Assert on visible text and UI states
   - Verify that the UI responds correctly to user actions
   - Check that error states and success messages are displayed appropriately

### Example Component Test

```tsx
// Good component test example
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceDisplay } from './ResourceDisplay';

test('shows resource shortage warning when below threshold', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<ResourceDisplay resource="minerals" amount={50} threshold={100} />);

  // Assert initial state
  expect(screen.getByText('Minerals: 50')).toBeInTheDocument();
  expect(screen.getByTestId('warning-indicator')).toBeInTheDocument();

  // Act - user adds resources
  await user.click(screen.getByRole('button', { name: /add/i }));

  // Assert updated state
  expect(screen.getByText('Minerals: 60')).toBeInTheDocument();
  expect(screen.getByTestId('warning-indicator')).toBeInTheDocument();

  // Act - user adds more resources to exceed threshold
  await user.click(screen.getByRole('button', { name: /add/i }));
  await user.click(screen.getByRole('button', { name: /add/i }));
  await user.click(screen.getByRole('button', { name: /add/i }));
  await user.click(screen.getByRole('button', { name: /add/i }));

  // Assert warning is gone
  expect(screen.getByText('Minerals: 100')).toBeInTheDocument();
  expect(screen.queryByTestId('warning-indicator')).not.toBeInTheDocument();
});
```

### Snapshot Testing

Use snapshot testing sparingly and appropriately:

- Good for visual UI regression testing
- Update snapshots intentionally when UI changes
- Use for simple, stable components
- Avoid for complex components with many dynamic elements

Example:

```tsx
test('ResourceIcon renders correctly', () => {
  const { container } = render(<ResourceIcon type="minerals" size="medium" />);
  expect(container).toMatchSnapshot();
});
```

## Integration Testing UI with State

For integration tests that combine UI components with state management:

1. **Set up the component with realistic state**

   - Use actual state management (Redux, Context)
   - Initialize with realistic mock data
   - Render with necessary providers

2. **Test interactions across component boundaries**

   - Verify that actions in one component affect another
   - Test state flow from user interaction to UI updates
   - Verify complex behaviors involving multiple components

3. **Mock external services, not internal behavior**
   - Mock API calls, not state management
   - Keep realistic internal state transitions
   - Test the component relations, not internal details

Example:

```tsx
test('ResourceManagement system manages resource transfers correctly', async () => {
  // Set up with real store and providers
  const { user } = renderWithProviders(
    <>
      <ResourceDisplay planetId="planet1" />
      <ResourceTransferControl sourcePlanetId="planet1" targetPlanetId="planet2" />
    </>
  );

  // Check initial state
  expect(screen.getByTestId('planet1-minerals')).toHaveTextContent('100');
  expect(screen.getByTestId('planet2-minerals')).toHaveTextContent('50');

  // Act - transfer resources
  await user.type(screen.getByLabelText(/amount/i), '30');
  await user.click(screen.getByRole('button', { name: /transfer/i }));

  // Assert both components update correctly
  expect(screen.getByTestId('planet1-minerals')).toHaveTextContent('70');
  expect(screen.getByTestId('planet2-minerals')).toHaveTextContent('80');
});
```

## End-to-End Testing with Playwright

End-to-end tests verify complete user flows across multiple pages:

1. **Focus on critical user journeys**

   - Test the most important user workflows
   - Cover key business processes
   - Test common user paths

2. **Stabilize tests with proper waiting**

   - Wait for elements to be visible before interacting
   - Use assertions as implicit waits
   - Avoid arbitrary timeouts

3. **Use Page Object Model pattern**
   - Abstract page interactions into classes
   - Keep tests readable and maintainable
   - Reuse page interaction logic

Example:

```typescript
// Player journey test
test('player can mine resources and upgrade buildings', async ({ page }) => {
  // Setup
  const gamePage = new GamePage(page);
  await gamePage.login('testuser', 'password');

  // Mining operation
  const miningPage = await gamePage.navigateToMining();
  await miningPage.assignShipToResource('Iron Deposit', 'Mining Vessel Alpha');

  // Collect resources
  await miningPage.waitForResourcesCollected('Iron', 100);

  // Building upgrade
  const buildingPage = await gamePage.navigateToBuildingManagement();
  await buildingPage.selectBuilding('Research Lab');
  await buildingPage.upgradeBuilding();

  // Verify upgrade completed
  await expect(buildingPage.getBuildingLevel()).resolves.toBe(2);
});
```

## Mocking Best Practices

1. **Mock external dependencies, not internal behavior**

   - Mock API calls, database, and external services
   - Use real state management and internal logic
   - Keep component relationships intact

2. **Make mocks realistic**

   - Return realistic data structures
   - Simulate real timing and behaviors
   - Consider edge cases and errors

3. **Use explicit, per-test mocks**
   - Reset mocks between tests
   - Set up specific mock behaviors per test
   - Avoid global mocks that affect all tests

Example:

```tsx
// Good mocking example
test('ResourceDisplay handles loading and error states', async () => {
  // Mock API call with loading, then error
  server.use(
    rest.get('/api/resources', (req, res, ctx) => {
      return res(
        ctx.delay(100), // Realistic timing
        ctx.status(500),
        ctx.json({ error: 'Server error' })
      );
    })
  );

  render(<ResourceDisplay planetId="planet1" />);

  // Should show loading state initially
  expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

  // Should show error state after failed request
  await waitForElementToBeRemoved(() => screen.queryByTestId('loading-indicator'));
  expect(screen.getByText(/couldn't load resources/i)).toBeInTheDocument();
});
```

## Testing Accessibility

Integrate accessibility testing into all UI tests:

1. **Use `jest-axe` for automated accessibility checking**

   ```tsx
   import { axe } from 'jest-axe';

   test('ResourceDisplay has no accessibility violations', async () => {
     const { container } = render(<ResourceDisplay resource="minerals" amount={100} />);
     const results = await axe(container);
     expect(results).toHaveNoViolations();
   });
   ```

2. **Test keyboard navigation**

   ```tsx
   test('ResourceControls can be operated with keyboard', async () => {
     const { user } = renderWithProviders(<ResourceControls />);

     // Focus the first button
     await user.tab();
     expect(screen.getByRole('button', { name: /increase/i })).toHaveFocus();

     // Press it with Enter key
     await user.keyboard('{Enter}');
     expect(screen.getByText('Amount: 1')).toBeInTheDocument();

     // Move to the next button
     await user.tab();
     expect(screen.getByRole('button', { name: /decrease/i })).toHaveFocus();
   });
   ```

## Test Organization and Naming

Follow these patterns for test organization:

1. **File structure mirrors source code**

   - Put tests alongside source code or mirror structure in `tests` directory
   - Use consistent naming patterns

2. **Organize tests by features and behaviors**

   - Group tests for related functionality
   - Use descriptive test blocks (`describe`, `it`)
   - Nest test blocks for related behavior

3. **Naming convention for test files**
   - Component tests: `ComponentName.test.tsx`
   - Integration tests: `FeatureName.integration.test.tsx`
   - E2E tests: `userflow.spec.ts`

Example test organization:

```tsx
describe('ResourceControls', () => {
  describe('when resources are plentiful', () => {
    it('allows allocation to any project', () => {
      // Test implementation
    });

    it('shows no warnings', () => {
      // Test implementation
    });
  });

  describe('when resources are limited', () => {
    it('restricts allocation to non-critical projects', () => {
      // Test implementation
    });

    it('displays warning indicators', () => {
      // Test implementation
    });
  });
});
```

## Performance Testing UI

Include performance considerations in UI tests:

1. **Measure key metrics**

   - Component render time
   - Time to interactive
   - Frame rate during animations

2. **Set performance budgets**
   - Establish maximum acceptable render times
   - Fail tests that exceed these limits
   - Monitor trends over time

Example:

```tsx
test('ResourceGrid renders 100 items efficiently', async () => {
  // Setup performance observer
  const measures: PerformanceMeasure[] = [];
  performance.mark('start-render');

  // Render large grid
  render(<ResourceGrid resources={generateManyResources(100)} />);

  // Measure time
  performance.mark('end-render');
  performance.measure('render-time', 'start-render', 'end-render');
  const measure = performance.getEntriesByName('render-time')[0];

  // Assert on performance
  expect(measure.duration).toBeLessThan(100); // Under 100ms
});
```

## Testing Complex Animations and Interactions

For complex interactions and animations:

1. **Split testing concerns**

   - Test logic and state separately from animations
   - Verify animation classes/states are applied
   - Manual testing for visual quality

2. **Mock timing functions**
   - Fast-forward animations in tests
   - Control timing to make tests deterministic
   - Verify states before, during, and after animations

## CI/CD Integration

Integrate UI tests into CI/CD:

1. **Run fast tests on every commit**

   - Unit and basic component tests on every PR
   - Keep them under 1 minute total

2. **Run slower tests on important branches**

   - Integration and E2E tests on main/develop branches
   - Schedule comprehensive test runs nightly

3. **Visual testing for UI**
   - Use visual comparison tools for UI regression
   - Generate and review reports for visual changes
   - Automate approval for expected changes
