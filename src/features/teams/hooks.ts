'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '@/features/dashboard/hooks';
import { api } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  CreateTeamPayload,
  PaginatedResponse,
  Team,
  UpdateTeamPayload,
} from '@/types/api';

export interface TeamsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  sort?: string;
}

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (params: TeamsQueryParams) => [...teamKeys.lists(), params] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
};

export function useTeams(params: TeamsQueryParams = {}) {
  return useQuery({
    queryKey: teamKeys.list(params),
    queryFn: ({ signal }) =>
      api.get<PaginatedResponse<Team>>(
        '/teams',
        {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          search: params.search,
          country: params.country,
          sort: params.sort,
        },
        signal,
      ),
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiSuccessResponse<Team>>(
        `/teams/${id}`,
        undefined,
        signal,
      );
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) =>
      api.post<ApiSuccessResponse<Team>>('/teams', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeamPayload }) =>
      api.patch<ApiSuccessResponse<Team>>(`/teams/${id}`, payload),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: teamKeys.lists() });
      qc.invalidateQueries({ queryKey: teamKeys.detail(id) });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: true; message: string }>(`/teams/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
