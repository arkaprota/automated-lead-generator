import { EventStatus } from './event-status.enum';

export interface SearchEventItem {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  location: string;
  scheduleCron: string;
  status: EventStatus | 'active' | 'stopped' | 'completed' | 'failed';
  queryPrompt?: string | null;
  totalLeadsFound: number;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
