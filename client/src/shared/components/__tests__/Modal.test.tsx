import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Content
      </Modal>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and children when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal title">
        <div data-testid="modal-content">Inner Content</div>
      </Modal>
    );
    expect(screen.getByText('Test Modal title')).toBeInTheDocument();
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );
    
    // Find the X button - X icon usually renders an SVG inside a button
    // Or just find button by role and the aria label if it had one, or find by tag
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking the backdrop', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );
    
    // The backdrop has onClick={onClose}
    // and is portaled to document.body, so container.querySelector won't find it.
    const backdrop = document.querySelector('.bg-black\\/40');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalled();
    } else {
      throw new Error('Backdrop not found');
    }
  });

  it('renders footer when provided', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        title="Test Modal" 
        footer={<button>Confirm</button>}
      >
        Content
      </Modal>
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });
});
