'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '@/features/dashboard/hooks';
import { leagueKeys } from '@/features/leagues/hooks';
import { api } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  CreateMatchPayload,
  Match,
  MatchStatus,
  PaginatedResponse,
  SimulationConfig,
  SimulationState,
  UpdateMatchPayload,
} from '@/types/api';

export interface MatchesQueryParams {
  page?: number;
  limit?: number;
  league?: string;
  season?: string;
  team?: string;
  status?: MatchStatus | '';
  from?: string;
  to?: string;
  sort?: string;
  isSimulation?: '' | 'true' | 'false';
}

export type LifecycleAction =
  | 'start'
  | 'halftime'
  | 'resume'
  | 'finish'
  | 'postpone'
  | 'cancel';

export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (params: MatchesQueryParams) => [...matchKeys.lists(), params] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
  events: (id: string) => [...matchKeys.detail(id), 'events'] as const,
  simulation: (id: string) => [...matchKeys.detail(id), 'simulation'] as const,
};

export function useMatches(params: MatchesQueryParams = {}) {
  return useQuery({
    queryKey: matchKeys.list(params),
    queryFn: ({ signal }) =>
      api.get<PaginatedResponse<Match>>(
        '/matches',
        {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          league: params.league || undefined,
          season: params.season || undefined,
          team: params.team || undefined,
          status: params.status || undefined,
          from: params.from || undefined,
          to: params.to || undefined,
          sort: params.sort ?? '-kickoff',
          isSimulation: params.isSimulation || undefined,
        },
        signal,
      ),
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiSuccessResponse<Match>>(
        `/matches/${id}`,
        undefined,
        signal,
      );
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMatchPayload) =>
      api.post<ApiSuccessResponse<Match>>('/matches', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: matchKeys.all });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMatchPayload }) =>
      api.patch<ApiSuccessResponse<Match>>(`/matches/${id}`, payload),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: matchKeys.lists() });
      qc.invalidateQueries({ queryKey: matchKeys.detail(id) });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
      qc.invalidateQueries({ queryKey: leagueKeys.all });
    },
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: true; message: string }>(`/matches/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: matchKeys.all });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
      qc.invalidateQueries({ queryKey: leagueKeys.all });
    },
  });
}

export function useMatchLifecycleAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      body,
    }: {
      id: string;
      action: LifecycleAction;
      body?: Record<string, unknown>;
    }) => api.post<ApiSuccessResponse<Match>>(`/matches/${id}/${action}`, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: matchKeys.lists() });
      qc.invalidateQueries({ queryKey: matchKeys.detail(id) });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
      qc.invalidateQueries({ queryKey: leagueKeys.all });
    },
  });
}

export function useUpdateMatchMinute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, minute }: { id: string; minute: number }) =>
      api.patch<ApiSuccessResponse<Match>>(`/matches/${id}/minute`, { minute }),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: matchKeys.detail(id) });
      qc.invalidateQueries({ queryKey: matchKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateMatchScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      homeScore,
      awayScore,
    }: {
      id: string;
      homeScore: number;
      awayScore: number;
    }) =>
      api.patch<ApiSuccessResponse<Match>>(`/matches/${id}/score`, {
        homeScore,
        awayScore,
      }),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: matchKeys.detail(id) });
      qc.invalidateQueries({ queryKey: matchKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
      qc.invalidateQueries({ queryKey: leagueKeys.all });
    },
  });
}

export function useSimulationState(matchId: string, enabled: boolean) {
  return useQuery({
    queryKey: matchKeys.simulation(matchId),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiSuccessResponse<SimulationState>>(
        `/matches/${matchId}/simulation`,
        undefined,
        signal,
      );
      return res.data;
    },
    enabled: Boolean(matchId) && enabled,
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false;
      return query.state.data?.simulationStatus === 'running' ? 2000 : false;
    },
    refetchIntervalInBackground: false,
  });
}

function useApplySimulationSuccess(matchId: string) {
  const qc = useQueryClient();
  return (res: ApiSuccessResponse<SimulationState>) => {
    qc.setQueryData(matchKeys.simulation(matchId), res.data);
    qc.setQueryData(matchKeys.detail(matchId), res.data.match);
    qc.invalidateQueries({ queryKey: matchKeys.events(matchId) });
    qc.invalidateQueries({ queryKey: matchKeys.lists() });
    qc.invalidateQueries({ queryKey: dashboardKeys.all });
    qc.invalidateQueries({ queryKey: leagueKeys.all });
  };
}

export function useStartSimulation(matchId: string) {
  const onSuccess = useApplySimulationSuccess(matchId);
  return useMutation({
    mutationFn: (body?: {
      simulationSpeed?: number;
      simulationSeed?: string;
      simulationConfig?: SimulationConfig;
    }) =>
      api.post<ApiSuccessResponse<SimulationState>>(
        `/matches/${matchId}/simulation/start`,
        body ?? {},
      ),
    onSuccess,
  });
}

export function usePauseSimulation(matchId: string) {
  const onSuccess = useApplySimulationSuccess(matchId);
  return useMutation({
    mutationFn: () =>
      api.post<ApiSuccessResponse<SimulationState>>(
        `/matches/${matchId}/simulation/pause`,
      ),
    onSuccess,
  });
}

export function useResumeSimulation(matchId: string) {
  const onSuccess = useApplySimulationSuccess(matchId);
  return useMutation({
    mutationFn: () =>
      api.post<ApiSuccessResponse<SimulationState>>(
        `/matches/${matchId}/simulation/resume`,
      ),
    onSuccess,
  });
}

export function useChangeSimulationSpeed(matchId: string) {
  const onSuccess = useApplySimulationSuccess(matchId);
  return useMutation({
    mutationFn: (simulationSpeed: number) =>
      api.patch<ApiSuccessResponse<SimulationState>>(
        `/matches/${matchId}/simulation/speed`,
        { simulationSpeed },
      ),
    onSuccess,
  });
}

export function useAdvanceSimulation(matchId: string) {
  const onSuccess = useApplySimulationSuccess(matchId);
  return useMutation({
    mutationFn: () =>
      api.post<ApiSuccessResponse<SimulationState>>(
        `/matches/${matchId}/simulation/next`,
      ),
    onSuccess,
  });
}

export function useStopSimulation(matchId: string) {
  const onSuccess = useApplySimulationSuccess(matchId);
  return useMutation({
    mutationFn: () =>
      api.post<ApiSuccessResponse<SimulationState>>(
        `/matches/${matchId}/simulation/stop`,
      ),
    onSuccess,
  });
}

export function useResetSimulation(matchId: string) {
  const onSuccess = useApplySimulationSuccess(matchId);
  return useMutation({
    mutationFn: (body?: { simulationSeed?: string; simulationSpeed?: number }) =>
      api.post<ApiSuccessResponse<SimulationState>>(
        `/matches/${matchId}/simulation/reset`,
        body ?? {},
      ),
    onSuccess,
  });
}
