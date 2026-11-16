export interface SocketEvents {
  'lead:positive_reply': {
    workspaceId: string;
    campaignId: string;
    leadId: string;
    businessName: string;
    intent: 'INTERESTED';
    replySnippet: string;
    receivedAt: string;
  };
  'lead:generation_progress': {
    workspaceId: string;
    currentStep: 'expanding_queries' | 'scraping_data' | 'qualifying_leads' | 'completed';
    totalProcessed: number;
    qualifiedCount: number;
  };
}
