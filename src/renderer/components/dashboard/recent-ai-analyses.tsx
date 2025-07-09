import { FileText, Download, Eye } from 'lucide-react'
import { Button } from '../ui/button'
import { dummyData } from '../../data/dummy-data'

export function RecentAIAnalyses() {
  const { recentAIAnalyses } = dummyData

  const getAnalysisIcon = (type: string) => {
    return <FileText className="size-4 text-[#3B7097]" />
  }

  const handleViewReport = (analysisId: number) => {
    console.log(`Viewing report ${analysisId}`)
    // This would normally open the report
  }

  const handleDownloadReport = (analysisId: number) => {
    console.log(`Downloading report ${analysisId}`)
    // This would normally download the report
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent AI-Analysis Queue</h3>
      
      <div className="space-y-3">
        {recentAIAnalyses.map((analysis) => (
          <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getAnalysisIcon(analysis.type)}
              <div>
                <div className="font-medium text-sm text-gray-800">
                  {analysis.type} for {analysis.property}
                </div>
                <div className="text-xs text-gray-500">
                  {analysis.client} • {formatDate(analysis.completedDate)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleViewReport(analysis.id)}
                className="text-[#3B7097] hover:text-[#3B7097]/80"
              >
                <Eye className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownloadReport(analysis.id)}
                className="text-[#3B7097] hover:text-[#3B7097]/80"
              >
                <Download className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {recentAIAnalyses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent analyses</p>
          </div>
        )}
      </div>
    </div>
  )
} 