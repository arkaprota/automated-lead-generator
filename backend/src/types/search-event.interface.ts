import { EventStatus } from '../enums/event-status.enum.js';

export interface ISearchEvent {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  location: string;
  scheduleCron: string;
  status: EventStatus;
  queryPrompt?: string | null;
  totalLeadsFound: number;
  lastRunAt?: Date | null;
  nextRunAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
