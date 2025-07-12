import { useState } from 'react';
import { Send, Loader2, Phone, Mail, MapPin, DollarSign, Calendar, User } from 'lucide-react';
import { startSellerWorkflow } from '../../services/automation';

interface SellerCardProps {
  seller: {
    id: number;
    name: string;
    email: string;
    phone: string;
    propertyAddress: string;
    stage: string;
    subStatus: string;
    estimatedValue: string;
    listingPrice?: string;
    leadSource: string;
    priority: 'high' | 'medium' | 'low';
    dateAdded: string;
    lastContact: string | null;
    notes: string;
  };
}

export function SellerCard({ seller }: SellerCardProps) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendSurvey = async () => {
    setIsSending(true);
    setError(null);

    try {
      const result = await startSellerWorkflow({
        agentId: 'agent_123',
        sellerEmail: seller.email,
        sellerName: seller.name,
        sellerPhone: seller.phone,
        propertyAddress: seller.propertyAddress
      });

      console.log('Survey sent successfully:', result);
    } catch (err) {
      console.error('Failed to send survey:', err);
      setError('Failed to send survey. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-green-200 bg-green-50'
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${priorityColors[seller.priority]} bg-white shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <User className="size-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900">{seller.name}</h3>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          seller.priority === 'high' ? 'bg-red-100 text-red-800' :
          seller.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {seller.priority}
        </span>
      </div>

      {/* Send Survey Button for new leads */}
      {seller.stage === 'new_leads' && (
        <div className="mb-3">
          <button
            onClick={handleSendSurvey}
            disabled={isSending}
            className="flex items-center gap-2 px-3 py-2 bg-[#28a745] hover:bg-[#28a745]/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
          >
            {isSending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Send Survey
              </>
            )}
          </button>
          {error && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="size-4" />
          <span>{seller.email}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="size-4" />
          <span>{seller.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="size-4" />
          <span>{seller.propertyAddress}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="size-4" />
          <span>{seller.estimatedValue}</span>
        </div>
        {seller.listingPrice && (
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="size-4" />
            <span className="font-medium">Listed: {seller.listingPrice}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="size-4" />
          <span>Added: {seller.dateAdded}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">
          <span className="font-medium">Source:</span> {seller.leadSource}
        </p>
        <p className="text-xs text-gray-500 mb-2">
          <span className="font-medium">Status:</span> {seller.subStatus.replace(/_/g, ' ')}
        </p>
        {seller.notes && (
          <p className="text-xs text-gray-600 italic">
            "{seller.notes}"
          </p>
        )}
      </div>
    </div>
  );
}