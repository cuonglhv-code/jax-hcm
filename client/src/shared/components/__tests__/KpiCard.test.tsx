import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from '../KpiCard';
import { Users } from 'lucide-react';

describe('KpiCard component', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Total Users" value="1,234" />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders trend and delta correctly', () => {
    render(<KpiCard label="Revenue" value="$50,000" trend="up" delta="+12%" />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
    // Assuming trend classes like bg-success/text-success
    expect(screen.getByText('+12%').className).toContain('text-success');
  });

  it('shows skeleton when isLoading is true', () => {
    const { container } = render(<KpiCard label="Revenue" value="$50,000" isLoading />);
    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThan(0);
    // Real value should not be visible
    expect(screen.queryByText('$50,000')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(<KpiCard label="Users" value="100" icon={Users} />);
    // Check if lucide-users icon exists by class or child
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
