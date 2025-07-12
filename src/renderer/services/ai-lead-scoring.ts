import { firebaseCollections } from './firebase/collections';

export interface LeadScoringData {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientType: 'buyer' | 'seller';
  agentId: string;
  formData: Record<string, any>;
  aiSummary: string;
  analysisModel: string;
  createdAt: string;
  submissionId?: string;
}

export interface LeadScoringInsights {
  summary: string;
  qualificationScore: string;
  keyInsights: string[];
  recommendations: string[];
  analysisDate: string;
  model: string;
}

export class AILeadScoringService {
  /**
   * Check if a client has AI lead scoring data available
   */
  async hasLeadScoring(clientEmail: string): Promise<boolean> {
    try {
      const analyses = await firebaseCollections.getGPTAnalysesByClient(clientEmail);
      return analyses && analyses.length > 0;
    } catch (error) {
      console.error('Error checking lead scoring availability:', error);
      return false;
    }
  }

  /**
   * Get lead scoring data for a specific client
   */
  async getLeadScoringForClient(clientEmail: string): Promise<LeadScoringData | null> {
    try {
      const analyses = await firebaseCollections.getGPTAnalysesByClient(clientEmail);
      
      if (!analyses || analyses.length === 0) {
        return null;
      }

      // Return the most recent analysis
      const latestAnalysis = analyses.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      return latestAnalysis as LeadScoringData;
    } catch (error) {
      console.error('Error fetching lead scoring data:', error);
      return null;
    }
  }

  /**
   * Format raw analysis data into structured lead scoring insights
   */
  formatLeadScoringInsights(scoringData: LeadScoringData): LeadScoringInsights {
    const summary = scoringData.aiSummary || 'No analysis summary available';
    
    // Extract key insights from the AI summary
    const keyInsights = this.extractKeyInsights(summary);
    const recommendations = this.extractRecommendations(summary);
    const qualificationScore = this.extractQualificationScore(summary);

    return {
      summary,
      qualificationScore,
      keyInsights,
      recommendations,
      analysisDate: new Date(scoringData.createdAt).toLocaleDateString(),
      model: scoringData.analysisModel || 'GPT-4'
    };
  }

  /**
   * Extract key insights from AI summary text
   */
  private extractKeyInsights(summary: string): string[] {
    const insights: string[] = [];
    
    // Look for common patterns in AI summaries
    const lines = summary.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Look for bullet points or numbered lists
      if (trimmed.match(/^[•\-\*]\s/) || trimmed.match(/^\d+\.\s/)) {
        insights.push(trimmed.replace(/^[•\-\*\d+\.\s]+/, ''));
      }
      
      // Look for key phrases that indicate insights
      if (trimmed.toLowerCase().includes('key insight') || 
          trimmed.toLowerCase().includes('important') ||
          trimmed.toLowerCase().includes('notable')) {
        insights.push(trimmed);
      }
    });

    // If no structured insights found, extract first few sentences
    if (insights.length === 0) {
      const sentences = summary.split('.').filter(s => s.trim().length > 20);
      insights.push(...sentences.slice(0, 3).map(s => s.trim() + '.'));
    }

    return insights.slice(0, 5); // Limit to 5 insights
  }

  /**
   * Extract recommendations from AI summary text
   */
  private extractRecommendations(summary: string): string[] {
    const recommendations: string[] = [];
    
    const lines = summary.split('\n');
    let inRecommendationSection = false;
    
    lines.forEach(line => {
      const trimmed = line.trim().toLowerCase();
      
      // Look for recommendation sections
      if (trimmed.includes('recommend') || trimmed.includes('suggest') || 
          trimmed.includes('next step') || trimmed.includes('action')) {
        inRecommendationSection = true;
        
        // Extract the recommendation from this line
        const rec = line.trim().replace(/^[•\-\*\d+\.\s]+/, '');
        if (rec.length > 10) {
          recommendations.push(rec);
        }
      } else if (inRecommendationSection && (trimmed.match(/^[•\-\*]\s/) || trimmed.match(/^\d+\.\s/))) {
        const rec = line.trim().replace(/^[•\-\*\d+\.\s]+/, '');
        recommendations.push(rec);
      } else if (trimmed.length === 0) {
        inRecommendationSection = false;
      }
    });

    // If no specific recommendations found, provide generic ones
    if (recommendations.length === 0) {
      recommendations.push('Schedule initial consultation call');
      recommendations.push('Send relevant property listings or market information');
      recommendations.push('Follow up within 48 hours');
    }

    return recommendations.slice(0, 4); // Limit to 4 recommendations
  }

  /**
   * Extract or calculate qualification score
   */
  private extractQualificationScore(summary: string): string {
    const text = summary.toLowerCase();
    
    // Look for explicit scoring
    const scoreMatch = text.match(/score[:\s]+(\d+(?:\.\d+)?(?:\/\d+|%)?)/);
    if (scoreMatch) {
      return scoreMatch[1];
    }

    // Look for rating
    const ratingMatch = text.match(/rating[:\s]+(\d+(?:\.\d+)?(?:\/\d+)?)/);
    if (ratingMatch) {
      return ratingMatch[1] + '/5';
    }

    // Look for qualification level keywords
    if (text.includes('highly qualified') || text.includes('excellent')) {
      return 'A+ (90-100%)';
    } else if (text.includes('well qualified') || text.includes('strong')) {
      return 'A (80-89%)';
    } else if (text.includes('qualified') || text.includes('good')) {
      return 'B (70-79%)';
    } else if (text.includes('partially qualified') || text.includes('fair')) {
      return 'C (60-69%)';
    } else if (text.includes('unqualified') || text.includes('poor')) {
      return 'D (Below 60%)';
    }

    return 'B+ (75%)'; // Default moderate score
  }

  /**
   * Get all available lead scoring data for dashboard/reporting
   */
  async getAllLeadScoring(): Promise<LeadScoringData[]> {
    try {
      const analyses = await firebaseCollections.getGPTAnalyses();
      return analyses as LeadScoringData[];
    } catch (error) {
      console.error('Error fetching all lead scoring data:', error);
      return [];
    }
  }
}

// Export singleton instance
export const aiLeadScoringService = new AILeadScoringService();