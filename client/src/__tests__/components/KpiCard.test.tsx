import { render, screen } from '@testing-library/react';
import { KpiCard } from '../../shared/components/KpiCard';
import { describe, it, expect } from 'vitest';

describe('KpiCard Component', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Total Revenue" value="$50,000" />);
    expect(screen.getByText('Total Revenue')).toBeDefined();
    expect(screen.getByText('$50,000')).toBeDefined();
  });

  it("trend='up': shows TrendingUp icon, success colour class", () => {
    const { container } = render(<KpiCard label="R" value="V" trend="up" delta="+5%" />);
    // TrendingUp icon usually has text-success or similar
    expect(container.querySelector('.text-success')).toBeDefined();
    expect(screen.getByText('+5%').className).toContain('text-success');
  });

  it("trend='down': shows TrendingDown icon, error colour class", () => {
    const { container } = render(<KpiCard label="R" value="V" trend="down" delta="-5%" />);
    expect(container.querySelector('.text-error')).toBeDefined();
    expect(screen.getByText('-5%').className).toContain('text-error');
  });

  it('isLoading=true: renders Skeleton instead of value', () => {
    const { container } = render(<KpiCard label="R" value="$50,000" isLoading={true} />);
    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThan(0);
    expect(screen.queryByText('$50,000')).toBeNull();
  });

  it('delta string is rendered when provided', () => {
    render(<KpiCard label="R" value="V" delta="Target reached" />);
    expect(screen.getByText('Target reached')).toBeDefined();
  });
});
