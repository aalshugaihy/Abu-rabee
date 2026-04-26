import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders children', () => {
    render(<StatusBadge tone="green">Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies the tone class', () => {
    const { container } = render(<StatusBadge tone="rose">Late</StatusBadge>);
    const span = container.querySelector('span');
    expect(span?.className).toContain('rose');
  });
});
