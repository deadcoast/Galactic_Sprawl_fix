/**
 * @context: ui-system, component-library, testing
 *
 * Button component tests
 */

import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentSize, ComponentVariant } from '../../../types/ui/ComponentTypes';
import { Button } from '../../../ui/components/Button';
import { renderWithProviders, screen } from '../../utils/test-utils';

describe('Button Component', () => {
  // Reset mocks between tests
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic rendering tests
  it('renders correctly with default props', () => {
    renderWithProviders(<Button>Test Button</Button>);

    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('gs-button', 'gs-button--primary', 'gs-button--medium');
    expect(button).not.toBeDisabled();
  });

  it('renders with custom className', () => {
    renderWithProviders(<Button className="custom-class">Custom Button</Button>);

    const button = screen.getByRole('button', { name: 'Custom Button' });
    expect(button).toHaveClass('custom-class');
  });

  it('applies data-testid attribute', () => {
    renderWithProviders(<Button data-testid="test-button">Button with ID</Button>);

    expect(screen.getByTestId('test-button')).toBeInTheDocument();
  });

  // Variant tests
  it.each([
    [ComponentVariant.PRIMARY, 'gs-button--primary'],
    [ComponentVariant.SECONDARY, 'gs-button--secondary'],
    [ComponentVariant.SUCCESS, 'gs-button--success'],
    [ComponentVariant.DANGER, 'gs-button--danger'],
  ])('renders with %s variant and correct class', (variant, expectedClass) => {
    renderWithProviders(<Button variant={variant}>{variant} Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass(expectedClass);
  });

  // Size tests
  it.each([
    [ComponentSize.SMALL, 'gs-button--small'],
    [ComponentSize.MEDIUM, 'gs-button--medium'],
    [ComponentSize.LARGE, 'gs-button--large'],
  ])('renders with %s size and correct class', (size, expectedClass) => {
    renderWithProviders(<Button size={size}>{size} Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass(expectedClass);
  });

  // State tests
  it('renders in disabled state', () => {
    renderWithProviders(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('gs-button--disabled');
  });

  it('renders in loading state', () => {
    renderWithProviders(<Button loading>Loading Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('gs-button--loading');
    expect(button.querySelector('.gs-button__loading-indicator')).toBeInTheDocument();
  });

  // Display options tests
  it('renders with fullWidth class when fullWidth is true', () => {
    renderWithProviders(<Button fullWidth>Full Width Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('gs-button--full-width');
  });

  it('renders leading icon', () => {
    renderWithProviders(
      <Button leadingIcon={<span data-testid="leading-icon">Icon</span>}>
        Button with Leading Icon
      </Button>
    );

    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('gs-button--with-leading-icon');
  });

  it('renders trailing icon', () => {
    renderWithProviders(
      <Button trailingIcon={<span data-testid="trailing-icon">Icon</span>}>
        Button with Trailing Icon
      </Button>
    );

    expect(screen.getByTestId('trailing-icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('gs-button--with-trailing-icon');
  });

  // Interaction tests
  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const { user } = renderWithProviders(<Button onClick={handleClick}>Clickable Button</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const { user } = renderWithProviders(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    );

    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when in loading state', async () => {
    const handleClick = vi.fn();
    const { user } = renderWithProviders(
      <Button onClick={handleClick} loading>
        Loading Button
      </Button>
    );

    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  // Type attribute tests
  it('has the correct type attribute', () => {
    renderWithProviders(<Button type="submit">Submit Button</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  // Accessibility tests
  it('has appropriate ARIA attributes', () => {
    renderWithProviders(
      <Button aria-label="Close dialog" aria-describedby="button-desc">
        X
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close dialog');
    expect(button).toHaveAttribute('aria-describedby', 'button-desc');
  });

  it('loading indicator has aria-hidden', () => {
    renderWithProviders(<Button loading>Loading Button</Button>);

    const loadingIndicator = screen
      .getByText('Loading Button')
      .parentElement?.querySelector('.gs-button__loading-indicator');

    expect(loadingIndicator).toHaveAttribute('aria-hidden', 'true');
  });
});
