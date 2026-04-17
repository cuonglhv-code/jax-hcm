import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table } from '../Table';

describe('Table component', () => {
  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'role', header: 'Role' },
  ];
  const data = [
    { name: 'John Doe', role: 'Admin' },
    { name: 'Jane Smith', role: 'User' },
  ];

  it('renders table headers correctly', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('renders data rows correctly', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane Smith', { exact: false })).toBeInTheDocument();
  });

  it('calls onSort when a sortable header is clicked', () => {
    const handleSort = vi.fn();
    render(<Table columns={columns} data={data} onSort={handleSort} />);
    
    fireEvent.click(screen.getByText('Name'));
    expect(handleSort).toHaveBeenCalled();
  });

  it('shows empty state when data is empty', () => {
    render(<Table columns={columns} data={[]} emptyState="No data available" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows loading skeletons when isLoading is true', () => {
    const { container } = render(<Table columns={columns} data={[]} isLoading />);
    // Check for skeletons - Skeleton is used in Table
    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThan(0);
  });
});
