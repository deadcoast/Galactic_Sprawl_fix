# Galactic Sprawl UI Testing Strategy

## Overview

This directory contains tests for the Galactic Sprawl UI components. The testing strategy includes:

1. **Unit Tests**: Testing individual components in isolation
2. **Integration Tests**: Testing component combinations and interactions
3. **Accessibility Tests**: Ensuring components meet accessibility standards
4. **Responsive Tests**: Verifying components behave correctly on different screen sizes

## Test Directory Structure

```
src/tests/
├── components/         # Unit tests for individual components
│   └── ui/             # Tests for UI components 
├── hooks/              # Tests for custom React hooks
├── integration/        # Integration tests for component combinations
├── accessibility/      # Accessibility compliance tests
├── utils/              # Test utilities and helpers
├── setup/              # Test setup and configuration
└── setup.ts            # Global test setup
```

## Running Tests

The following npm scripts are available for running tests:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with UI
npm run test:ui

# Generate test coverage report
npm run coverage
```

## Testing Tools

- **Vitest**: Test runner and assertion library
- **Testing Library**: DOM testing utilities
- **User-Event**: Simulating user interactions
- **Mock Service Worker**: API mocking

## Testing Guidelines

### Writing Unit Tests

- Test one component at a time
- Test component rendering, props, and states
- Use `screen.getByRole` when possible for better accessibility
- Test interactions using `user-event`

Example:

```tsx
it('Button calls onClick when clicked', async () => {
  const handleClick = vi.fn();
  const { user } = renderWithProviders(
    <Button onClick={handleClick}>Click Me</Button>
  );
  
  await user.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Writing Integration Tests

- Test how components work together
- Focus on user flows and interactions
- Test state changes across components

### Testing Accessibility

- Verify ARIA attributes
- Test keyboard navigation
- Ensure proper focus management
- Check for appropriate color contrast

### Testing Responsive Behavior

- Test component behavior at different viewport sizes
- Verify responsive layout adaptations
- Check touch interactions for mobile views

## Best Practices

1. Use `renderWithProviders` helper to ensure components have necessary context
2. Prefer role-based queries over test IDs when possible
3. Avoid testing implementation details
4. Mock external dependencies
5. Test edge cases and error states

## Test Data

Use the test fixtures in `src/tests/fixtures` for consistent test data across tests.

## Adding New Tests

When adding a new component, create corresponding tests in the appropriate directories:

1. Unit tests in `src/tests/components/ui`
2. Integration tests as needed in `src/tests/integration`
3. Accessibility tests in `src/tests/accessibility` 