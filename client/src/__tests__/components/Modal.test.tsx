import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../components/Modal';
import { describe, it, expect, vi } from 'vitest';

describe('Modal Component', () => {
  it('does not render when open=false', () => {
    const { queryByText } = render(
      <Modal open={false} onClose={() => {}}>
        Modal Content
      </Modal>
    );
    expect(queryByText('Modal Content')).toBeNull();
  });

  it('renders title and children when open=true', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        Modal Content
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeDefined();
    expect(screen.getByText('Modal Content')).toBeDefined();
  });

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test Modal">
        Content
      </Modal>
    );
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        Content
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders footer when footer prop provided', () => {
    render(
      <Modal open={true} onClose={() => {}} footer={<button>Save</button>}>
        Content
      </Modal>
    );
    expect(screen.getByText('Save')).toBeDefined();
  });
});
