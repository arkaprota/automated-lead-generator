export interface CreateEventPayload {
  name: string;
  category: string;
  location: string;
  scheduleCron?: string;
  queryPrompt?: string;
}
