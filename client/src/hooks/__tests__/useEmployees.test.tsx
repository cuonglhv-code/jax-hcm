import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployees } from '../useEmployees';
import { api } from '@/services/api';
import React from 'react';

// Mock api
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useEmployees hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches employees successfully', async () => {
    const mockData = { success: true, data: [{ id: '1', name: 'John' }] };
    (api.get as any).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useEmployees(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/employees', { params: undefined });
  });

  it('handles fetch error', async () => {
    (api.get as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEmployees(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
