import { apiRequest } from '@/src/api/client';
import type { Job, JobsResponse } from '@/src/types/musicgrabber';

export async function listJobs(): Promise<Job[]> {
  const response = await apiRequest<JobsResponse | Job[]>('/api/jobs');
  if (Array.isArray(response)) return response;
  return response.jobs ?? [];
}

export async function getJob(id: number): Promise<Job> {
  return apiRequest<Job>(`/api/jobs/${id}`);
}

export async function retryJob(id: number): Promise<void> {
  await apiRequest<void>(`/api/jobs/${id}/retry`, { method: 'POST' });
}

export function getJobStreamPath(id: number): string {
  return `/api/jobs/${id}/stream`;
}
