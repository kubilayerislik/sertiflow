import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useConfig() {
  const { data } = useQuery({
    queryKey: ['config'],
    queryFn: () => api<{ mailEnabled: boolean; publicBaseUrl: string }>('/api/config'),
    staleTime: 60_000,
  });
  return { mailEnabled: data?.mailEnabled ?? false, publicBaseUrl: data?.publicBaseUrl };
}
