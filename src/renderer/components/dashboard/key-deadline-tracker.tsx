import React from 'react';
import { Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

export default function KeyDeadlineTracker({ deadlines }: { deadlines: any[] }) {
  const getTimeRemaining = (daysRemaining: number) => {
    if (daysRemaining <= 0) return 'Overdue';
    if (daysRemaining === 1) return '1 day remaining';
    return `${daysRemaining} days remaining`;
  };

  const getIcon = (daysRemaining: number) => {
    if (daysRemaining <= 0) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (daysRemaining <= 3) return <Clock className="w-5 h-5 text-orange-600" />;
    return <Calendar className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Key Deadlines</h2>
      <div className="space-y-4">
        {deadlines.map((deadline) => (
          <div
            key={deadline.id}
            className="w-full p-4 rounded-lg border transition-all hover:shadow-md flex-shrink-0"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getIcon(deadline.daysRemaining)}
                <div>
                  <h3 className="font-medium text-gray-900">{deadline.type}</h3>
                  <p className="text-sm text-gray-600">{deadline.client}</p>
                  <p className="text-sm text-gray-500">{deadline.property}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {getTimeRemaining(deadline.daysRemaining)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 