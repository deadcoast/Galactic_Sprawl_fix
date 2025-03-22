/**
 * @context: ui-system, component-library, testing
 * 
 * Integration tests for UI component combinations
 * 
 * These tests verify that components work correctly together
 * in realistic usage scenarios.
 */

import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '../utils/test-utils';
import { Button } from '../../ui/components/Button';
import { Card, CardElevation } from '../../ui/components/Card';
import { ComponentVariant, ComponentSize } from '../../types/ui/ComponentTypes';

// Example container components for testing interactions
const CardWithActionButtons = ({ 
  title,
  content,
  onSave,
  onCancel
}: {
  title: string;
  content: string;
  onSave?: () => void;
  onCancel?: () => void;
}) => (
  <Card title={title}>
    <div className="card-content">{content}</div>
    <div className="card-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
      <Button variant={ComponentVariant.SECONDARY} onClick={onCancel}>
        Cancel
      </Button>
      <Button variant={ComponentVariant.PRIMARY} onClick={onSave}>
        Save
      </Button>
    </div>
  </Card>
);

// Interactive form component
const InteractiveForm = ({ onSubmit }: { onSubmit: (data: { name: string }) => void }) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSubmit = () => {
    setIsSaving(true);
    // Simulate async operation
    setTimeout(() => {
      onSubmit({ name });
      setIsSaving(false);
    }, 500);
  };
  
  return (
    <Card title="User Form">
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={handleSubmit} loading={isSaving}>
          Submit
        </Button>
      </div>
    </Card>
  );
};

describe('UI Component Integration', () => {
  // Test component combinations
  it('CardWithActionButtons renders all components correctly', () => {
    renderWithProviders(
      <CardWithActionButtons
        title="Test Card"
        content="This is a test card with action buttons"
      />
    );
    
    // Verify Card rendered correctly
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('This is a test card with action buttons')).toBeInTheDocument();
    
    // Verify Buttons rendered correctly
    const saveButton = screen.getByRole('button', { name: 'Save' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    
    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    
    // Verify button styling
    expect(saveButton).toHaveClass('gs-button--primary');
    expect(cancelButton).toHaveClass('gs-button--secondary');
  });
  
  // Test interactive behaviors
  it('CardWithActionButtons triggers callbacks when buttons are clicked', async () => {
    const handleSave = vi.fn();
    const handleCancel = vi.fn();
    
    const { user } = renderWithProviders(
      <CardWithActionButtons
        title="Interactive Card"
        content="Click the buttons to test callbacks"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
    
    // Click the Save button
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(handleSave).toHaveBeenCalledTimes(1);
    
    // Click the Cancel button
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
  
  // Test form interactions
  it('InteractiveForm submits data correctly', async () => {
    const handleSubmit = vi.fn();
    
    const { user } = renderWithProviders(
      <InteractiveForm onSubmit={handleSubmit} />
    );
    
    // Type in the input field
    await user.type(screen.getByLabelText('Name:'), 'Test User');
    
    // Click the submit button
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    // Button should be in loading state
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    
    // Wait for the submission to complete
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ name: 'Test User' });
    }, { timeout: 1000 });
    
    // Button should no longer be in loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
    });
  });
  
  // Test complex component nesting
  it('handles nested components correctly', () => {
    renderWithProviders(
      <Card title="Parent Card">
        <p>Parent content</p>
        <Card
          title="Child Card"
          elevation={CardElevation.LOW}
        >
          <p>Child content</p>
          <Button size={ComponentSize.SMALL}>
            Nested Button
          </Button>
        </Card>
      </Card>
    );
    
    // Verify parent card rendered
    expect(screen.getByText('Parent Card')).toBeInTheDocument();
    expect(screen.getByText('Parent content')).toBeInTheDocument();
    
    // Verify child card rendered
    expect(screen.getByText('Child Card')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
    
    // Verify button rendered
    expect(screen.getByRole('button', { name: 'Nested Button' })).toBeInTheDocument();
  });
}); 