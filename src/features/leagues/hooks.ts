'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '@/features/dashboard/hooks';
import { api } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  CreateLeaguePayload,
  CreateSeasonPayload,
  League,
  LeagueStandingsResponse,
  LeagueType,
  LeagueWithSeasons,
  PaginatedResponse,
  Season,
  UpdateLeaguePayload,
  UpdateSeasonPayload,
} from '@/types/api';

export interface LeaguesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  type?: LeagueType | '';
  sort?: string;
}

export const leagueKeys = {
  all: ['leagues'] as const,
  lists: () => [...leagueKeys.all, 'list'] as const,
  list: (params: LeaguesQueryParams) => [...leagueKeys.lists(), params] as const,
  details: () => [...leagueKeys.all, 'detail'] as const,
  detail: (id: string) => [...leagueKeys.details(), id] as const,
  seasons: (leagueId: string) =>
    [...leagueKeys.detail(leagueId), 'seasons'] as const,
  standings: (leagueId: string, seasonId?: string) =>
    [...leagueKeys.detail(leagueId), 'standings', seasonId ?? 'current'] as const,
};

export function useLeagues(params: LeaguesQueryParams = {}) {
  return useQuery({
    queryKey: leagueKeys.list(params),
    queryFn: ({ signal }) =>
      api.get<PaginatedResponse<League>>(
        '/leagues',
        {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          search: params.search,
          country: params.country,
          type: params.type || undefined,
          sort: params.sort,
        },
        signal,
      ),
  });
}

export function useLeague(id: string) {
  return useQuery({
    queryKey: leagueKeys.detail(id),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiSuccessResponse<LeagueWithSeasons>>(
        `/leagues/${id}`,
        undefined,
        signal,
      );
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useLeagueSeasons(leagueId: string) {
  return useQuery({
    queryKey: leagueKeys.seasons(leagueId),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiSuccessResponse<Season[]>>(
        `/leagues/${leagueId}/seasons`,
        undefined,
        signal,
      );
      return res.data;
    },
    enabled: Boolean(leagueId),
  });
}

export function useLeagueStandings(leagueId: string, seasonId?: string) {
  return useQuery({
    queryKey: leagueKeys.standings(leagueId, seasonId),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiSuccessResponse<LeagueStandingsResponse>>(
        `/leagues/${leagueId}/standings`,
        { season: seasonId },
        signal,
      );
      return res.data;
    },
    enabled: Boolean(leagueId),
  });
}

export function useCreateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeaguePayload) =>
      api.post<ApiSuccessResponse<League>>('/leagues', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leagueKeys.all });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateLeaguePayload;
    }) => api.patch<ApiSuccessResponse<League>>(`/leagues/${id}`, payload),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: leagueKeys.lists() });
      qc.invalidateQueries({ queryKey: leagueKeys.detail(id) });
    },
  });
}

export function useDeleteLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: true; message: string }>(`/leagues/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leagueKeys.all });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useCreateSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      leagueId,
      payload,
    }: {
      leagueId: string;
      payload: CreateSeasonPayload;
    }) =>
      api.post<ApiSuccessResponse<Season>>(
        `/leagues/${leagueId}/seasons`,
        payload,
      ),
    onSuccess: (_res, { leagueId }) => {
      qc.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) });
      qc.invalidateQueries({ queryKey: leagueKeys.seasons(leagueId) });
    },
  });
}

export function useUpdateSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      leagueId,
      seasonId,
      payload,
    }: {
      leagueId: string;
      seasonId: string;
      payload: UpdateSeasonPayload;
    }) =>
      api.patch<ApiSuccessResponse<Season>>(
        `/leagues/${leagueId}/seasons/${seasonId}`,
        payload,
      ),
    onSuccess: (_res, { leagueId }) => {
      qc.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) });
      qc.invalidateQueries({ queryKey: leagueKeys.seasons(leagueId) });
    },
  });
}

export function useDeleteSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      leagueId,
      seasonId,
    }: {
      leagueId: string;
      seasonId: string;
    }) =>
      api.delete<{ success: true; message: string }>(
        `/leagues/${leagueId}/seasons/${seasonId}`,
      ),
    onSuccess: (_res, { leagueId }) => {
      qc.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) });
      qc.invalidateQueries({ queryKey: leagueKeys.seasons(leagueId) });
    },
  });
}
