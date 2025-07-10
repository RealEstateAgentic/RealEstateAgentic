// JotForm API service to fetch actual forms
const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY || '';
const JOTFORM_API_BASE = 'https://api.jotform.com';

interface JotFormResponse {
  responseCode: number;
  message: string;
  content: any;
}

interface JotForm {
  id: string;
  title: string;
  url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function fetchUserForms(): Promise<JotForm[]> {
  try {
    const response = await fetch(`${JOTFORM_API_BASE}/user/forms?apiKey=${JOTFORM_API_KEY}`);
    const data: JotFormResponse = await response.json();
    
    if (data.responseCode === 200) {
      return data.content;
    } else {
      throw new Error(`JotForm API error: ${data.message}`);
    }
  } catch (error) {
    console.error('Failed to fetch JotForm forms:', error);
    throw error;
  }
}

export async function getBuyerAndSellerForms(): Promise<{ buyerForm: JotForm | null, sellerForm: JotForm | null }> {
  try {
    const forms = await fetchUserForms();
    
    // Find buyer and seller forms by title keywords
    const buyerForm = forms.find(form => 
      form.title.toLowerCase().includes('buyer') || 
      form.title.toLowerCase().includes('purchase')
    ) || null;
    
    const sellerForm = forms.find(form => 
      form.title.toLowerCase().includes('seller') || 
      form.title.toLowerCase().includes('sell') ||
      form.title.toLowerCase().includes('listing')
    ) || null;
    
    console.log('📋 Found forms:', { buyerForm, sellerForm });
    
    return { buyerForm, sellerForm };
  } catch (error) {
    console.error('Failed to get buyer and seller forms:', error);
    return { buyerForm: null, sellerForm: null };
  }
}

export async function getFormUrls(): Promise<{ buyerUrl: string, sellerUrl: string }> {
  try {
    const { buyerForm, sellerForm } = await getBuyerAndSellerForms();
    
    return {
      buyerUrl: buyerForm ? `https://form.jotform.com/${buyerForm.id}` : 'https://form.jotform.com/243446517804154',
      sellerUrl: sellerForm ? `https://form.jotform.com/${sellerForm.id}` : 'https://form.jotform.com/243446518905158'
    };
  } catch (error) {
    console.error('Failed to get form URLs:', error);
    // Fallback to default URLs
    return {
      buyerUrl: 'https://form.jotform.com/243446517804154',
      sellerUrl: 'https://form.jotform.com/243446518905158'
    };
  }
}