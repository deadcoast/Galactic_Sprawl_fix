/**
 * @context: ui-system, component-library, testing
 * 
 * Card component tests
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { Card, CardElevation } from '../../../ui/components/Card';
import { renderWithProviders, screen } from '../../utils/test-utils';
import '@testing-library/jest-dom';

describe('Card Component', () => {
  // Basic rendering tests
  it('renders correctly with default props', () => {
    renderWithProviders(
      <Card>
        <div>Card Content</div>
      </Card>
    );
    
    const card = screen.getByText('Card Content').closest('.gs-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('gs-card', 'gs-card--elevation-medium');
  });
  
  it('renders with custom className', () => {
    renderWithProviders(
      <Card className="custom-class">
        <div>Card Content</div>
      </Card>
    );
    
    const card = screen.getByText('Card Content').closest('.gs-card');
    expect(card).toHaveClass('custom-class');
  });
  
  it('applies data-testid attribute', () => {
    renderWithProviders(
      <Card data-testid="test-card">
        <div>Card Content</div>
      </Card>
    );
    
    expect(screen.getByTestId('test-card')).toBeInTheDocument();
  });
  
  // Elevation tests
  it.each([
    [CardElevation.NONE, 'gs-card--elevation-none'],
    [CardElevation.LOW, 'gs-card--elevation-low'],
    [CardElevation.MEDIUM, 'gs-card--elevation-medium'],
    [CardElevation.HIGH, 'gs-card--elevation-high'],
  ])('renders with %s elevation and correct class', (elevation, expectedClass) => {
    renderWithProviders(
      <Card elevation={elevation}>
        <div>Card Content</div>
      </Card>
    );
    
    const card = screen.getByText('Card Content').closest('.gs-card');
    expect(card).toHaveClass(expectedClass);
  });
  
  // State tests
  it('renders in disabled state', () => {
    renderWithProviders(
      <Card disabled>
        <div>Disabled Card</div>
      </Card>
    );
    
    const card = screen.getByText('Disabled Card').closest('.gs-card');
    expect(card).toHaveClass('gs-card--disabled');
    expect(card).toHaveAttribute('aria-disabled', 'true');
  });
  
  // Display options tests
  it('renders with fullWidth class when fullWidth is true', () => {
    renderWithProviders(
      <Card fullWidth>
        <div>Full Width Card</div>
      </Card>
    );
    
    const card = screen.getByText('Full Width Card').closest('.gs-card');
    expect(card).toHaveClass('gs-card--full-width');
  });
  
  it('renders with interactive class when interactive is true', () => {
    renderWithProviders(
      <Card interactive>
        <div>Interactive Card</div>
      </Card>
    );
    
    const card = screen.getByText('Interactive Card').closest('.gs-card');
    expect(card).toHaveClass('gs-card--interactive');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });
  
  // Title and subtitle tests
  it('renders title when provided', () => {
    renderWithProviders(
      <Card title="Card Title">
        <div>Card Content</div>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Title').closest('.gs-card__title')).toBeInTheDocument();
  });
  
  it('renders subtitle when provided', () => {
    renderWithProviders(
      <Card subtitle="Card Subtitle">
        <div>Card Content</div>
      </Card>
    );
    
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle').closest('.gs-card__subtitle')).toBeInTheDocument();
  });
  
  it('renders both title and subtitle when provided', () => {
    renderWithProviders(
      <Card title="Card Title" subtitle="Card Subtitle">
        <div>Card Content</div>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card Title').closest('.gs-card__header')).toBeInTheDocument();
  });
  
  // Footer tests
  it('renders footer when provided', () => {
    renderWithProviders(
      <Card footer={<div>Card Footer</div>}>
        <div>Card Content</div>
      </Card>
    );
    
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
    expect(screen.getByText('Card Footer').closest('.gs-card__footer')).toBeInTheDocument();
  });
  
  // Interaction tests
  it('calls onClick handler when clicked and interactive', async () => {
    const handleClick = vi.fn();
    const { user } = renderWithProviders(
      <Card onClick={handleClick} interactive>
        <div>Clickable Card</div>
      </Card>
    );
    
    await user.click(screen.getByText('Clickable Card').closest('.gs-card') as HTMLElement);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const { user } = renderWithProviders(
      <Card onClick={handleClick} interactive disabled>
        <div>Disabled Card</div>
      </Card>
    );
    
    await user.click(screen.getByText('Disabled Card').closest('.gs-card') as HTMLElement);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('does not call onClick when not interactive', async () => {
    const handleClick = vi.fn();
    const { user } = renderWithProviders(
      <Card onClick={handleClick}>
        <div>Non-Interactive Card</div>
      </Card>
    );
    
    await user.click(screen.getByText('Non-Interactive Card').closest('.gs-card') as HTMLElement);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  // Style tests
  it('applies custom padding when provided', () => {
    renderWithProviders(
      <Card padding="20px">
        <div>Card with Custom Padding</div>
      </Card>
    );
    
    const card = screen.getByText('Card with Custom Padding').closest('.gs-card');
    expect(card).toHaveStyle({ padding: '20px' });
  });
  
  // Accessibility tests
  it('has appropriate ARIA attributes', () => {
    renderWithProviders(
      <Card 
        aria-label="Example card"
        aria-describedby="card-desc"
        interactive
      >
        <div>Accessible Card</div>
      </Card>
    );
    
    const card = screen.getByText('Accessible Card').closest('.gs-card');
    expect(card).toHaveAttribute('aria-label', 'Example card');
    expect(card).toHaveAttribute('aria-describedby', 'card-desc');
    expect(card).toHaveAttribute('role', 'button');
  });
}); 