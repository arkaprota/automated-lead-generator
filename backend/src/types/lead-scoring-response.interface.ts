export interface LeadScoringResponse {
  leadScore: number;
  qualificationStatus: 'hot' | 'warm' | 'cold' | 'disqualified';
  reasons: string[];
  keyStrengths: string[];
  recommendedPitchAngle: string;
}
