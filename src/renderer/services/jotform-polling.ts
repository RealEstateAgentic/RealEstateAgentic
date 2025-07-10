import { firebaseCollections } from './firebase/collections';
import { getBuyerAndSellerForms } from './jotform-api';
import { BuyerQualificationAgent, SellerQualificationAgent } from '../../../RealEstateAgentic/src/services/langchain/agents';
import { googleSheetsService } from './google-sheets';

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY || '';
const JOTFORM_API_BASE = 'https://api.jotform.com';
const POLLING_INTERVAL = 30000; // 30 seconds

interface JotFormSubmission {
  id: string;
  form_id: string;
  ip: string;
  created_at: string;
  status: string;
  answers: Record<string, any>;
}

interface JotFormResponse {
  responseCode: number;
  message: string;
  content: JotFormSubmission[];
}

class JotFormPollingService {
  private isPolling = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastProcessedTime: Record<string, string> = {};
  private buyerFormId: string | null = null;
  private sellerFormId: string | null = null;
  private buyerAgent: BuyerQualificationAgent;
  private sellerAgent: SellerQualificationAgent;

  async initialize() {
    console.log('🚀 Initializing JotForm polling service...');
    
    // Initialize AI agents and Google Sheets service
    try {
      this.buyerAgent = new BuyerQualificationAgent();
      this.sellerAgent = new SellerQualificationAgent();
      await googleSheetsService.initialize();
      console.log('✅ AI agents and Google Sheets service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
    
    // Get buyer and seller form IDs
    const { buyerForm, sellerForm } = await getBuyerAndSellerForms();
    this.buyerFormId = buyerForm?.id || '243446517804154';
    this.sellerFormId = sellerForm?.id || '243446518905158';
    
    console.log('📋 Form IDs:', {
      buyer: this.buyerFormId,
      seller: this.sellerFormId
    });
    
    // Initialize last processed time for each form
    this.lastProcessedTime[this.buyerFormId] = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
    this.lastProcessedTime[this.sellerFormId] = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
  }

  async startPolling() {
    if (this.isPolling) {
      console.log('⏰ Polling already active');
      return;
    }

    await this.initialize();
    
    console.log('⏰ Starting JotForm polling...');
    this.isPolling = true;
    
    // Initial poll
    await this.pollForSubmissions();
    
    // Set up interval polling
    this.pollingInterval = setInterval(async () => {
      await this.pollForSubmissions();
    }, POLLING_INTERVAL);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('⏰ JotForm polling stopped');
  }

  private async pollForSubmissions() {
    try {
      console.log('🔄 Polling for new submissions...');
      
      // Poll buyer form
      if (this.buyerFormId) {
        await this.pollFormSubmissions(this.buyerFormId, 'buyer');
      }
      
      // Poll seller form
      if (this.sellerFormId) {
        await this.pollFormSubmissions(this.sellerFormId, 'seller');
      }
      
    } catch (error) {
      console.error('❌ Error during polling:', error);
    }
  }

  private async pollFormSubmissions(formId: string, formType: 'buyer' | 'seller') {
    try {
      const response = await fetch(
        `${JOTFORM_API_BASE}/form/${formId}/submissions?apiKey=${JOTFORM_API_KEY}&limit=10&orderby=created_at`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: JotFormResponse = await response.json();
      
      if (data.responseCode !== 200) {
        throw new Error(`JotForm API error: ${data.message}`);
      }
      
      // Filter new submissions since last check
      const newSubmissions = data.content.filter(submission => {
        const submissionTime = new Date(submission.created_at).toISOString();
        return submissionTime > this.lastProcessedTime[formId];
      });
      
      if (newSubmissions.length > 0) {
        console.log(`🔔 Found ${newSubmissions.length} new ${formType} submissions`);
        
        // Process each new submission
        for (const submission of newSubmissions) {
          await this.processSubmission(submission, formType);
        }
        
        // Update last processed time
        const latestSubmission = newSubmissions[0]; // Should be most recent due to orderby
        this.lastProcessedTime[formId] = new Date(latestSubmission.created_at).toISOString();
      }
      
    } catch (error) {
      console.error(`❌ Error polling ${formType} form ${formId}:`, error);
    }
  }

  private async processSubmission(submission: JotFormSubmission, formType: 'buyer' | 'seller') {
    try {
      console.log(`🔄 Processing ${formType} submission:`, submission.id);
      
      // Extract client info from answers
      const clientInfo = this.extractClientInfo(submission.answers);
      
      if (!clientInfo.email) {
        console.warn('⚠️ No email found in submission, skipping');
        return;
      }
      
      // Store in appropriate collection
      if (formType === 'buyer') {
        await this.processBuyerSubmission(clientInfo, submission);
      } else {
        await this.processSellerSubmission(clientInfo, submission);
      }
      
      console.log(`✅ ${formType} submission processed successfully`);
      
    } catch (error) {
      console.error(`❌ Error processing ${formType} submission:`, error);
    }
  }

  private async processBuyerSubmission(clientInfo: any, submission: JotFormSubmission) {
    try {
      console.log('🤖 Generating AI analysis for buyer...');
      
      // Ensure AI agents are initialized
      if (!this.buyerAgent) {
        console.log('⚠️ AI agents not initialized, initializing now...');
        await this.initialize();
      }
      
      // Convert form data to readable format for AI analysis
      const formDataText = this.formatFormDataForAI(submission.answers, 'buyer');
      
      // Generate AI summary
      const aiSummary = await this.buyerAgent.summarizeQualification(formDataText);
      
      console.log('✅ AI analysis completed for buyer');
      
      // Save GPT analysis to Firebase
      await this.saveGPTAnalysis('buyer', clientInfo, submission.answers, aiSummary, submission.id);
      
      // Check if buyer already exists
      const existingBuyer = await this.findExistingBuyer(clientInfo.email);
      
      if (existingBuyer) {
        // Update existing buyer with form data and AI analysis
        await firebaseCollections.updateBuyer(existingBuyer.id, {
          formData: submission.answers,
          aiSummary: aiSummary,
          status: 'form_completed',
          completedAt: new Date().toISOString()
        });
        
        console.log('📝 Updated existing buyer:', existingBuyer.id);
        
        // Create Google Sheet
        const sheetUrl = await this.createGoogleSheet('buyer', clientInfo, submission.answers, aiSummary);
        
        // Send agent notification email
        await this.sendAgentNotification('buyer', clientInfo, submission.answers, aiSummary, existingBuyer.agentId, sheetUrl);
      } else {
        // Create new buyer record
        const buyer = await firebaseCollections.createBuyer({
          agentId: 'agent_123', // Default agent ID, should be configurable
          name: clientInfo.name,
          email: clientInfo.email,
          phone: clientInfo.phone,
          formData: submission.answers,
          aiSummary: aiSummary,
          status: 'form_completed'
        });
        
        console.log('📝 Created new buyer:', buyer.id);
        
        // Create Google Sheet
        const sheetUrl = await this.createGoogleSheet('buyer', clientInfo, submission.answers, aiSummary);
        
        // Send agent notification email
        await this.sendAgentNotification('buyer', clientInfo, submission.answers, aiSummary, buyer.agentId, sheetUrl);
      }
    } catch (error) {
      console.error('❌ Error processing buyer submission with AI:', error);
      
      // Fallback: save without AI analysis
      const existingBuyer = await this.findExistingBuyer(clientInfo.email);
      
      if (existingBuyer) {
        await firebaseCollections.updateBuyer(existingBuyer.id, {
          formData: submission.answers,
          status: 'form_completed',
          completedAt: new Date().toISOString()
        });
      } else {
        await firebaseCollections.createBuyer({
          agentId: 'agent_123',
          name: clientInfo.name,
          email: clientInfo.email,
          phone: clientInfo.phone,
          formData: submission.answers,
          status: 'form_completed'
        });
      }
    }
  }

  private async processSellerSubmission(clientInfo: any, submission: JotFormSubmission) {
    try {
      console.log('🤖 Generating AI analysis for seller...');
      
      // Ensure AI agents are initialized
      if (!this.sellerAgent) {
        console.log('⚠️ AI agents not initialized, initializing now...');
        await this.initialize();
      }
      
      // Convert form data to readable format for AI analysis
      const formDataText = this.formatFormDataForAI(submission.answers, 'seller');
      
      // Generate AI summary
      const aiSummary = await this.sellerAgent.summarizeQualification(formDataText);
      
      console.log('✅ AI analysis completed for seller');
      
      // Save GPT analysis to Firebase
      await this.saveGPTAnalysis('seller', clientInfo, submission.answers, aiSummary, submission.id);
      
      // Check if seller already exists
      const existingSeller = await this.findExistingSeller(clientInfo.email);
      
      if (existingSeller) {
        // Update existing seller with form data and AI analysis
        await firebaseCollections.updateSeller(existingSeller.id, {
          formData: submission.answers,
          aiSummary: aiSummary,
          status: 'form_completed',
          completedAt: new Date().toISOString()
        });
        
        console.log('📝 Updated existing seller:', existingSeller.id);
        
        // Create Google Sheet
        const sheetUrl = await this.createGoogleSheet('seller', clientInfo, submission.answers, aiSummary);
        
        // Send agent notification email
        await this.sendAgentNotification('seller', clientInfo, submission.answers, aiSummary, existingSeller.agentId, sheetUrl);
      } else {
        // Create new seller record
        const seller = await firebaseCollections.createSeller({
          agentId: 'agent_123', // Default agent ID, should be configurable
          name: clientInfo.name,
          email: clientInfo.email,
          phone: clientInfo.phone,
          formData: submission.answers,
          aiSummary: aiSummary,
          status: 'form_completed'
        });
        
        console.log('📝 Created new seller:', seller.id);
        
        // Create Google Sheet
        const sheetUrl = await this.createGoogleSheet('seller', clientInfo, submission.answers, aiSummary);
        
        // Send agent notification email
        await this.sendAgentNotification('seller', clientInfo, submission.answers, aiSummary, seller.agentId, sheetUrl);
      }
    } catch (error) {
      console.error('❌ Error processing seller submission with AI:', error);
      
      // Fallback: save without AI analysis
      const existingSeller = await this.findExistingSeller(clientInfo.email);
      
      if (existingSeller) {
        await firebaseCollections.updateSeller(existingSeller.id, {
          formData: submission.answers,
          status: 'form_completed',
          completedAt: new Date().toISOString()
        });
      } else {
        await firebaseCollections.createSeller({
          agentId: 'agent_123',
          name: clientInfo.name,
          email: clientInfo.email,
          phone: clientInfo.phone,
          formData: submission.answers,
          status: 'form_completed'
        });
      }
    }
  }

  private extractClientInfo(answers: Record<string, any>) {
    // Based on actual JotForm API structure:
    // Field "2" = Name, Field "3" = Email, Field "4" = Phone
    
    // Extract name (field 2)
    const name = answers['2']?.answer || 
                answers['q2_name']?.answer || 
                answers['q1_name']?.answer ||
                answers['name']?.answer;

    // Extract email (field 3 - second field after name)
    const email = answers['3']?.answer || 
                 answers['q3_email']?.answer || 
                 answers['q1_email']?.answer ||
                 answers['email']?.answer;

    // Extract phone (field 4)
    const phone = answers['4']?.answer || 
                 answers['q3_phone']?.answer || 
                 answers['q4_phone']?.answer ||
                 answers['phone']?.answer;

    return {
      email,
      name,
      phone
    };
  }

  private async findExistingBuyer(email: string) {
    try {
      const buyers = await firebaseCollections.getBuyers();
      return buyers.find(buyer => buyer.email === email);
    } catch (error) {
      console.error('Error finding existing buyer:', error);
      return null;
    }
  }

  private async findExistingSeller(email: string) {
    try {
      const sellers = await firebaseCollections.getSellers();
      return sellers.find(seller => seller.email === email);
    } catch (error) {
      console.error('Error finding existing seller:', error);
      return null;
    }
  }

  private async saveGPTAnalysis(
    clientType: 'buyer' | 'seller',
    clientInfo: any,
    formData: Record<string, any>,
    aiSummary: string,
    submissionId: string
  ) {
    try {
      console.log(`💾 Saving GPT analysis for ${clientType}...`);
      
      const analysisData = {
        clientId: `${clientType}_${clientInfo.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientType: clientType,
        agentId: 'agent_123', // Default agent ID, should be configurable
        formData: formData,
        aiSummary: aiSummary,
        analysisModel: 'gpt-4',
        createdAt: new Date().toISOString(),
        submissionId: submissionId
      };
      
      await firebaseCollections.createGPTAnalysis(analysisData);
      console.log(`✅ GPT analysis saved for ${clientType}`);
      
    } catch (error) {
      console.error('❌ Failed to save GPT analysis:', error);
      // Don't throw error - this shouldn't break the main flow
    }
  }

  private formatFormDataForAI(answers: Record<string, any>, formType: 'buyer' | 'seller'): string {
    const formattedData = [];
    
    formattedData.push(`=== ${formType.toUpperCase()} FORM SUBMISSION ===\n`);
    
    // Extract and format key information
    Object.entries(answers).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value.answer) {
        const cleanKey = key.replace(/^q\d+_/, '').replace(/_/g, ' ').toLowerCase();
        formattedData.push(`${cleanKey}: ${value.answer}`);
      }
    });
    
    formattedData.push(`\nSubmission Time: ${new Date().toISOString()}`);
    
    return formattedData.join('\n');
  }

  private async createGoogleSheet(
    clientType: 'buyer' | 'seller',
    clientInfo: any,
    formData: Record<string, any>,
    aiSummary: string
  ): Promise<string> {
    try {
      console.log(`📊 Creating Google Sheet for ${clientType}...`);
      
      const sheetData = {
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone || '',
        formType: clientType,
        submittedAt: new Date().toISOString(),
        formData: formData,
        aiSummary: aiSummary
      };
      
      const sheetUrl = await googleSheetsService.createSheet(sheetData);
      console.log(`✅ Google Sheet created for ${clientType}:`, sheetUrl);
      
      return sheetUrl;
    } catch (error) {
      console.error('❌ Failed to create Google Sheet:', error);
      // Return a fallback URL if sheet creation fails
      return `https://docs.google.com/spreadsheets/d/error_${Date.now()}`;
    }
  }

  private async sendAgentNotification(
    clientType: 'buyer' | 'seller',
    clientInfo: any,
    formData: Record<string, any>,
    aiSummary: string,
    agentId: string,
    sheetUrl: string
  ) {
    try {
      console.log(`📧 Sending agent notification for ${clientType}...`);
      
      // Format form data for email
      const formattedFormData = Object.entries(formData)
        .map(([key, value]) => {
          if (value && typeof value === 'object' && value.answer) {
            const cleanKey = key.replace(/^q\d+_/, '').replace(/_/g, ' ');
            return `${cleanKey}: ${value.answer}`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');

      // Agent email is always damon.bodine@gauntletai.com
      const agentEmail = 'damon.bodine@gauntletai.com';
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.sendEmail({
          to: agentEmail,
          subject: `New ${clientType} Form Completed - ${clientInfo.name}`,
          template: 'agent_summary',
          data: {
            clientType: clientType,
            clientName: clientInfo.name,
            summary: aiSummary,
            formData: formattedFormData,
            excelUrl: sheetUrl
          }
        });
        
        console.log(`✅ Agent notification sent for ${clientType}`);
      } else {
        console.log(`📧 Would send agent notification to: ${agentEmail}`);
        console.log(`📝 AI Summary: ${aiSummary.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.error('❌ Failed to send agent notification:', error);
    }
  }
}

// Export singleton instance
export const jotformPolling = new JotFormPollingService();

// Test functions for manual testing
export async function createTestSubmission(email: string, name: string, formType: 'buyer' | 'seller' = 'buyer') {
  try {
    console.log('🧪 Creating test submission for polling service...');
    
    const mockSubmission: JotFormSubmission = {
      id: `test_${Date.now()}`,
      form_id: formType === 'buyer' ? '243446517804154' : '243446518905158',
      ip: '127.0.0.1',
      created_at: new Date().toISOString(),
      status: 'ACTIVE',
      answers: {
        q1_email: { answer: email },
        q2_name: { answer: name },
        q3_phone: { answer: '(555) 123-4567' },
        q4_budget: { answer: formType === 'buyer' ? '$400,000 - $600,000' : '$500,000' },
        q5_timeline: { answer: '3-6 months' },
        q6_preferences: { answer: formType === 'buyer' ? 'Modern condo with parking' : 'Quick sale needed' }
      }
    };
    
    // Process the test submission directly
    const clientInfo = {
      email: email,
      name: name,
      phone: '(555) 123-4567'
    };
    
    if (formType === 'buyer') {
      await jotformPolling['processBuyerSubmission'](clientInfo, mockSubmission);
    } else {
      await jotformPolling['processSellerSubmission'](clientInfo, mockSubmission);
    }
    
    console.log('✅ Test submission processed successfully');
    return mockSubmission.id;
    
  } catch (error) {
    console.error('❌ Failed to create test submission:', error);
    throw error;
  }
}

export async function processTestSubmission(email: string, name: string) {
  // This function is just for compatibility - createTestSubmission already processes everything
  console.log('📝 processTestSubmission called - but createTestSubmission already handled everything');
  return `test_${Date.now()}_already_processed`;
}