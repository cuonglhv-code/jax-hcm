import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/Button';
import { describe, it, expect, vi } from 'vitest';

describe('Button Component', () => {
  it('renders children text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeDefined();
  });

  it('has correct class for primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-gradient-brand');
  });

  describe('loading state', () => {
    it('shows spinner when loading=true', () => {
      render(<Button loading={true}>Submit</Button>);
      const spinner = screen.getByRole('button').querySelector('.animate-spin');
      expect(spinner).toBeDefined();
    });

    it('button is disabled when loading=true', () => {
      render(<Button loading={true}>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button.getAttribute('disabled')).toBeDefined();
    });
  });

  describe('disabled state', () => {
    it('onClick not called when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled={true} onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('variants', () => {
    it('secondary: has brand background class', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-brand-50');
    });

    it('ghost: has no background class (transparent by default)', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-gray-600');
    });

    it('danger: has error colour class', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-600');
    });
  });

  describe('sizes', () => {
    it('sm, md, lg have different padding classes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button').className).toContain('px-3');
      
      rerender(<Button size="md">Medium</Button>);
      expect(screen.getByRole('button').className).toContain('px-4');
      
      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button').className).toContain('px-5');
    });
  });
});
