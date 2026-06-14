import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { listJobs } from '@/src/api/jobs';
import {
  ensureNotificationPermissions,
  notifyDownloadComplete,
  notifyDownloadFailed,
} from '@/src/services/notifications';
import type { Job, JobStatus } from '@/src/types/musicgrabber';
import { formatJobError } from '@/src/utils/formatJobError';

const NOTIFY_STATUSES: JobStatus[] = ['completed', 'failed'];

export function useJobNotifications(enabled: boolean) {
  const seenRef = useRef<Map<number, JobStatus>>(new Map());
  const initializedRef = useRef(false);

  const jobsQuery = useQuery({
    queryKey: ['jobs'],
    queryFn: listJobs,
    enabled,
    refetchInterval: (query) => {
      const jobs = query.state.data ?? [];
      const hasActive = jobs.some((job) =>
        ['queued', 'downloading', 'processing'].includes(job.status)
      );
      return hasActive ? 3000 : 8000;
    },
  });

  useEffect(() => {
    if (!enabled) return;
    void ensureNotificationPermissions();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !jobsQuery.data) return;

    const jobs = jobsQuery.data;

    if (!initializedRef.current) {
      for (const job of jobs) {
        seenRef.current.set(job.id, job.status);
      }
      initializedRef.current = true;
      return;
    }

    for (const job of jobs) {
      const previous = seenRef.current.get(job.id);
      seenRef.current.set(job.id, job.status);

      if (!previous || !NOTIFY_STATUSES.includes(job.status)) continue;
      if (previous === job.status) continue;

      if (job.status === 'completed') {
        void notifyDownloadComplete(job.title, job.artist);
      } else if (job.status === 'failed') {
        const formatted = job.error ? formatJobError(job.error) : null;
        void notifyDownloadFailed(job.title, formatted?.message ?? 'Download failed');
      }
    }
  }, [enabled, jobsQuery.data]);
}
