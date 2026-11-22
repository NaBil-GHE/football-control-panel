'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ApiSuccessResponse, DashboardOverview } from '@/types/api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiSuccessResponse<DashboardOverview>>(
        '/dashboard/overview',
        undefined,
        signal,
      );
      return res.data;
    },
    refetchInterval: 20_000,
  });
}
