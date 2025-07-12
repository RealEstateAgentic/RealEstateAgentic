import { useState, useEffect } from 'react';
import { firebaseCollections } from '../services/firebase/collections';
import { fetchAllFormQuestions } from '../services/jotform-api';

interface FormData {
  formData: Record<string, any>;
  aiSummary: string;
  submissionDate: string;
  loading: boolean;
  error: string | null;
  formQuestions: Record<string, string>;
}

/**
 * Custom hook to fetch completed form data and GPT analysis for a client
 * @param clientEmail - Client's email to match against form submissions
 * @param clientType - Type of client (buyer/seller) for form field mapping
 */
export function useFormData(clientEmail: string, clientType: 'buyer' | 'seller'): FormData {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [aiSummary, setAiSummary] = useState<string>('');
  const [submissionDate, setSubmissionDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formQuestions, setFormQuestions] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchFormData() {
      if (!clientEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch both form data and actual questions from JotForm
        const [analyses, questions] = await Promise.all([
          firebaseCollections.getGPTAnalysesByClient(clientEmail),
          fetchAllFormQuestions()
        ]);
        
        // Set the appropriate questions based on client type
        const clientQuestions = clientType === 'buyer' ? questions.buyerQuestions : questions.sellerQuestions;
        setFormQuestions(clientQuestions);
        
        if (analyses && analyses.length > 0) {
          // Get the most recent analysis
          const latestAnalysis = analyses.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          setFormData(latestAnalysis.formData || {});
          setAiSummary(latestAnalysis.aiSummary || '');
          setSubmissionDate(latestAnalysis.createdAt || '');
        } else {
          // No form data found
          setFormData({});
          setAiSummary('');
          setSubmissionDate('');
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch form data');
      } finally {
        setLoading(false);
      }
    }

    fetchFormData();
  }, [clientEmail, clientType]);

  return {
    formData,
    aiSummary,
    submissionDate,
    loading,
    error,
    formQuestions
  };
}

/**
 * Helper function to extract human-readable values from JotForm answers
 * @param answers - Raw JotForm answers object
 * @param fieldKey - The field key to extract
 */
export function extractFormField(answers: Record<string, any>, fieldKey: string): string {
  // Try different possible field formats from JotForm
  const possibleKeys = [
    fieldKey,
    `q${fieldKey}_${fieldKey}`,
    `q1_${fieldKey}`,
    `q2_${fieldKey}`,
    `q3_${fieldKey}`,
    `q4_${fieldKey}`,
    `q5_${fieldKey}`,
    fieldKey.toLowerCase(),
    fieldKey.toUpperCase()
  ];

  for (const key of possibleKeys) {
    if (answers[key]?.answer) {
      return answers[key].answer;
    }
  }

  return '';
}

/**
 * Maps JotForm field IDs to human-readable question labels
 * Separated by form type (buyer vs seller)
 */
export const JOTFORM_FIELD_MAPPING = {
  // Common fields that appear in both forms
  common: {
    '2': 'Full Name',
    '3': 'Email Address', 
    '4': 'Phone Number',
  },
  
  // Buyer form field mappings (based on actual form structure)
  buyer: {
    '5': 'Are you pre-approved for a mortgage?',
    '6': 'Preferred Real Estate Agent Name',
    '7': 'Agent Email Address',
    '8': 'Maximum Budget ($)',
    '9': 'Down Payment Amount ($)',
    '10': 'Preferred Location/Neighborhood',
    '11': 'Property Type Preference',
    '12': 'Minimum Bedrooms',
    '13': 'Minimum Bathrooms',
    '14': 'Desired Square Footage',
    '15': 'Timeline to Purchase',
    '16': 'Special Requirements/Features',
    '17': 'Current Housing Situation',
    '18': 'Financing Type',
    '19': 'Additional Comments',
    '20': 'Move-in Timeline',
    '21': 'Other Requirements'
  },
  
  // Seller form field mappings
  seller: {
    '5': 'Property Address',
    '6': 'Property Type',
    '7': 'Year Built',
    '8': 'Square Footage',
    '9': 'Number of Bedrooms',
    '10': 'Number of Bathrooms',
    '11': 'Lot Size',
    '12': 'Asking Price Range',
    '13': 'Reason for Selling',
    '14': 'Timeline to Sell',
    '15': 'Current Mortgage Balance',
    '16': 'Recent Improvements/Repairs',
    '17': 'Property Condition',
    '18': 'Showing Availability',
    '19': 'Additional Property Details'
  }
};

/**
 * Gets the appropriate field label based on field ID and real form questions
 */
export function getFieldLabel(fieldId: string, clientType: 'buyer' | 'seller', formQuestions?: Record<string, string>, fallbackLabel?: string): string {
  // First try to use the real form questions
  if (formQuestions && formQuestions[fieldId]) {
    return formQuestions[fieldId];
  }
  
  // Fallback to hardcoded mapping
  // First check common fields
  if (JOTFORM_FIELD_MAPPING.common[fieldId]) {
    return JOTFORM_FIELD_MAPPING.common[fieldId];
  }
  
  // Then check client-type specific fields
  if (JOTFORM_FIELD_MAPPING[clientType] && JOTFORM_FIELD_MAPPING[clientType][fieldId]) {
    return JOTFORM_FIELD_MAPPING[clientType][fieldId];
  }
  
  // If we have a fallback label, use it
  if (fallbackLabel) {
    return fallbackLabel;
  }
  
  // Generate a generic label from the field ID
  return `Question ${fieldId}`;
}

/**
 * Maps common form fields to human-readable labels (legacy support)
 */
export const FORM_FIELD_LABELS = {
  // Buyer fields
  budget: 'Budget Range',
  timeline: 'Timeline',
  location: 'Preferred Location',
  propertyType: 'Property Type Desired',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  features: 'Desired Features',
  financing: 'Financing Type',
  preapproval: 'Pre-approval Status',
  
  // Seller fields
  propertyAddress: 'Property Address',
  askingPrice: 'Asking Price',
  reasonForSelling: 'Reason for Selling',
  timeframe: 'Selling Timeframe',
  currentMortgage: 'Current Mortgage',
  repairs: 'Needed Repairs',
  showingAvailability: 'Showing Availability',
  
  // Common fields
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  notes: 'Additional Notes'
};