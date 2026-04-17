import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployees, useCreateEmployee } from '../../hooks/useEmployees';
import { api } from '../../services/api';
import React from 'react';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useEmployees hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /employees with correct params', async () => {
    const mockResponse = { data: { success: true, data: [], meta: { total: 0 } } };
    (api.get as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useEmployees({ page: 1, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/employees'), expect.objectContaining({
      params: expect.objectContaining({ page: 1, limit: 10 })
    }));
  });

  it('returns data + meta from response', async () => {
    const mockData = { success: true, data: [{ id: '1' }], meta: { total: 1 } };
    (api.get as any).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useEmployees(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.data).toEqual(mockData.data);
    expect(result.current.data.meta).toEqual(mockData.meta);
  });
});

describe('useCreateEmployee hook', () => {
  it('calls POST /employees with body', async () => {
    (api.post as any).mockResolvedValue({ data: { success: true, data: { id: 'new' } } });
    
    const { result } = renderHook(() => useCreateEmployee(), {
      wrapper: createWrapper(),
    });

    const employeeData = { firstName: 'New', lastName: 'Emp' };
    await result.current.mutateAsync(employeeData as any);

    expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/employees'), employeeData);
  });
});
