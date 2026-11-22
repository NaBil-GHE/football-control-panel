'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, apiRequest } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  AuthUser,
  HealthResponse,
  LoginPayload,
} from '@/types/api';

export const authKeys = {
  me: ['auth', 'me'] as const,
  health: ['system', 'health'] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async ({ signal }) => {
      const res = await apiRequest<ApiSuccessResponse<AuthUser>>(
        '/api/session/me',
        { method: 'GET', local: true, signal },
      );
      return res.data;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useApiHealth() {
  return useQuery({
    queryKey: authKeys.health,
    queryFn: ({ signal }) => api.get<HealthResponse>('/health', undefined, signal),
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      apiRequest<ApiSuccessResponse<{ user: AuthUser }>>('/api/session/login', {
        method: 'POST',
        body: payload,
        local: true,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(authKeys.me, res.data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () =>
      apiRequest<{ success: true }>('/api/session/logout', {
        method: 'POST',
        local: true,
      }),
    onSuccess: () => {
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    },
  });
}
