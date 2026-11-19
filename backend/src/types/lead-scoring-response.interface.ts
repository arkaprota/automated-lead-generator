export interface LeadScoringResponse {
  leadScore: number;
  qualificationStatus: 'hot' | 'warm' | 'cold' | 'disqualified' | 'unqualified';
  reasons: string[];
  keyStrengths: string[];
  recommendedPitchAngle: string;
}
