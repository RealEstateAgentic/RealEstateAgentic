import { useState, useEffect } from 'react';
import { Star, TrendingUp, Lightbulb, CheckCircle, Calendar, Cpu, Download, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { aiLeadScoringService, LeadScoringData, LeadScoringInsights } from '../../services/ai-lead-scoring';

interface LeadScoringDisplayProps {
  clientEmail: string;
  clientName: string;
  onViewFull?: () => void;
  onDownload?: () => void;
}

export function LeadScoringDisplay({ 
  clientEmail, 
  clientName, 
  onViewFull, 
  onDownload 
}: LeadScoringDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [scoringData, setScoringData] = useState<LeadScoringData | null>(null);
  const [insights, setInsights] = useState<LeadScoringInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeadScoring();
  }, [clientEmail]);

  const loadLeadScoring = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await aiLeadScoringService.getLeadScoringForClient(clientEmail);
      
      if (data) {
        setScoringData(data);
        const formattedInsights = aiLeadScoringService.formatLeadScoringInsights(data);
        setInsights(formattedInsights);
      } else {
        setError('No AI lead scoring data available for this client.');
      }
    } catch (err) {
      console.error('Error loading lead scoring:', err);
      setError('Failed to load AI lead scoring data.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: string) => {
    const scoreText = score.toLowerCase();
    if (scoreText.includes('a+') || scoreText.includes('90') || scoreText.includes('excellent')) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (scoreText.includes('a') || scoreText.includes('8') || scoreText.includes('strong')) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    } else if (scoreText.includes('b') || scoreText.includes('7') || scoreText.includes('good')) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else if (scoreText.includes('c') || scoreText.includes('6') || scoreText.includes('fair')) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    } else {
      return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const handleViewFull = () => {
    if (onViewFull) {
      onViewFull();
    } else {
      // Default action - show full summary in alert (temporary)
      alert(`Full AI Analysis for ${clientName}:\n\n${insights?.summary}`);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default action - download as text file
      if (insights && scoringData) {
        const content = `AI Lead Scoring Report for ${clientName}
Generated: ${insights.analysisDate}
Model: ${insights.model}

Qualification Score: ${insights.qualificationScore}

Key Insights:
${insights.keyInsights.map(insight => `• ${insight}`).join('\n')}

Recommendations:
${insights.recommendations.map(rec => `• ${rec}`).join('\n')}

Full Analysis:
${insights.summary}`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-lead-scoring-${clientName.replace(/\s+/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-gray-500">
          <Cpu className="size-4 animate-pulse" />
          <span>Loading AI lead scoring...</span>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="text-center py-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <Cpu className="size-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-800 mb-2">No AI Lead Scoring Available</h3>
          <p className="text-sm text-gray-600">
            {error || 'This client has not completed a survey form yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <TrendingUp className="size-5 mr-2 text-blue-600" />
          AI Lead Scoring
        </h3>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={handleViewFull}>
            <Eye className="size-4 mr-1" />
            View Full
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="size-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* Qualification Score */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-800">Qualification Score</h4>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="size-3 mr-1" />
            {insights.analysisDate}
          </div>
        </div>
        <div className={`inline-flex items-center px-4 py-2 rounded-lg border font-semibold text-lg ${getScoreColor(insights.qualificationScore)}`}>
          <Star className="size-5 mr-2" />
          {insights.qualificationScore}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-800 mb-4 flex items-center">
          <Lightbulb className="size-4 mr-2 text-yellow-500" />
          Key Insights
        </h4>
        <div className="space-y-3">
          {insights.keyInsights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-700">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-800 mb-4 flex items-center">
          <CheckCircle className="size-4 mr-2 text-green-500" />
          Recommended Actions
        </h4>
        <div className="space-y-3">
          {insights.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle className="size-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
          <Cpu className="size-4 mr-2 text-blue-500" />
          AI Analysis Summary
        </h4>
        <div className="text-sm text-gray-700 leading-relaxed">
          {insights.summary.length > 300 ? (
            <>
              {insights.summary.substring(0, 300)}...
              <button 
                onClick={handleViewFull}
                className="text-blue-600 hover:text-blue-700 ml-1 font-medium"
              >
                Read more
              </button>
            </>
          ) : (
            insights.summary
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>Generated by {insights.model}</span>
          <span>Analysis ID: {scoringData?.id?.substring(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}