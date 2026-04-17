import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading prop is true', () => {
    render(<Button loading>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies the correct variant class', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-error'); // Corresponds to danger in variants map
  });
});
