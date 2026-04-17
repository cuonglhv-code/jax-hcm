import { render, screen, fireEvent } from '@testing-library/react';
import { Table, Pagination, Column } from '../../components/Table';
import { describe, it, expect, vi } from 'vitest';

describe('Table Component', () => {
  const columns: Column<{ id: string; name: string }>[] = [
    { key: 'name', header: 'Name' },
    { key: 'action', header: 'Action', render: (row) => <button>View {row.name}</button> }
  ];
  
  const data = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' }
  ];

  it('renders column headers', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Action')).toBeDefined();
  });

  it('renders data rows correctly', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
  });

  it('calls render() function for custom cell', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('View Alice')).toBeDefined();
  });

  it('shows Skeleton rows when loading=true', () => {
    const { container } = render(<Table columns={columns} data={[]} loading={true} />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows emptyMessage when data=[] and not loading', () => {
    render(<Table columns={columns} data={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeDefined();
  });
});

describe('Pagination Component', () => {
  it('calls onPageChange with correct page number', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} total={50} limit={10} onPageChange={onPageChange} />);
    
    const nextButton = screen.getAllByRole('button')[screen.getAllByRole('button').length - 1];
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(3);
    
    const prevButton = screen.getAllByRole('button')[0];
    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('previous button disabled on page 1', () => {
    render(<Pagination page={1} totalPages={5} total={50} limit={10} onPageChange={() => {}} />);
    const prevButton = screen.getAllByRole('button')[0];
    expect(prevButton.getAttribute('disabled')).toBeDefined();
  });

  it('next button disabled on last page', () => {
    render(<Pagination page={5} totalPages={5} total={50} limit={10} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons[buttons.length - 1];
    expect(nextButton.getAttribute('disabled')).toBeDefined();
  });
});
