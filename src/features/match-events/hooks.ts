'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '@/features/dashboard/hooks';
import { leagueKeys } from '@/features/leagues/hooks';
import { matchKeys } from '@/features/matches/hooks';
import { api } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  CreateMatchEventPayload,
  MatchEvent,
  MatchEventMutationResponse,
  UpdateMatchEventPayload,
} from '@/types/api';

export function useMatchEvents(matchId: string) {
  return useQuery({
    queryKey: matchKeys.events(matchId),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiSuccessResponse<MatchEvent[]>>(
        `/matches/${matchId}/events`,
        undefined,
        signal,
      );
      return res.data;
    },
    enabled: Boolean(matchId),
  });
}

export function useCreateMatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      matchId,
      payload,
    }: {
      matchId: string;
      payload: CreateMatchEventPayload;
    }) =>
      api.post<MatchEventMutationResponse>(
        `/matches/${matchId}/events`,
        payload,
      ),
    onSuccess: (_res, { matchId }) => {
      qc.invalidateQueries({ queryKey: matchKeys.events(matchId) });
      qc.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      qc.invalidateQueries({ queryKey: matchKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
      qc.invalidateQueries({ queryKey: leagueKeys.all });
    },
  });
}

export function useUpdateMatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      matchId,
      eventId,
      payload,
    }: {
      matchId: string;
      eventId: string;
      payload: UpdateMatchEventPayload;
    }) =>
      api.patch<MatchEventMutationResponse>(
        `/matches/${matchId}/events/${eventId}`,
        payload,
      ),
    onSuccess: (_res, { matchId }) => {
      qc.invalidateQueries({ queryKey: matchKeys.events(matchId) });
      qc.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      qc.invalidateQueries({ queryKey: matchKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
      qc.invalidateQueries({ queryKey: leagueKeys.all });
    },
  });
}

export function useDeleteMatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, eventId }: { matchId: string; eventId: string }) =>
      api.delete<{
        success: true;
        message: string;
        score: { homeScore: number; awayScore: number };
      }>(`/matches/${matchId}/events/${eventId}`),
    onSuccess: (_res, { matchId }) => {
      qc.invalidateQueries({ queryKey: matchKeys.events(matchId) });
      qc.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      qc.invalidateQueries({ queryKey: matchKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
      qc.invalidateQueries({ queryKey: leagueKeys.all });
    },
  });
}
