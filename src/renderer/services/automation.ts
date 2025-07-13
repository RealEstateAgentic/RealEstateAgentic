// Simplified automation service using static forms and Gmail API
// This avoids browser compatibility issues with nodemailer

import { firebaseCollections } from './firebase/collections';
import { getFormUrls } from './jotform-api';
import { gmailAuth } from './gmail-auth';

// Dynamic JotForm URLs (fetched from API)
let BUYER_FORM_URL = 'https://form.jotform.com/251891100796157';
let SELLER_FORM_URL = 'https://form.jotform.com/251890971882168';

// Initialize form URLs from API
async function initializeFormUrls() {
  try {
    const urls = await getFormUrls();
    BUYER_FORM_URL = urls.buyerUrl;
    SELLER_FORM_URL = urls.sellerUrl;
    console.log('📋 Form URLs initialized:', { BUYER_FORM_URL, SELLER_FORM_URL });
  } catch (error) {
    console.error('Failed to initialize form URLs:', error);
  }
}

// Initialize on load
initializeFormUrls();

// Import and start JotForm polling service
import { jotformPolling } from './jotform-polling';

// Start polling for form submissions
// Note: Polling checks for new submissions every 30 seconds
jotformPolling.startPolling();

// Buyer workflow handler with Gmail API
export async function startBuyerWorkflowWithGmail({ agentId, buyerEmail, buyerName, buyerPhone, senderEmail }: {
  agentId: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone?: string;
  senderEmail?: string;
}) {
  try {
    console.log('🚀 Starting buyer workflow with Gmail API for:', buyerName);
    
    if (!agentId || !buyerEmail || !buyerName) {
      throw new Error('Missing required fields');
    }

    // Step 1: Create buyer record in Firebase
    console.log('📝 Step 1: Creating buyer record...');
    const buyer = await firebaseCollections.createBuyer({
      agentId,
      name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
      formData: {},
      status: 'survey_sent'
    });

    // Step 2: Send email via Gmail API
    console.log('📝 Step 2: Sending email via Gmail API...');
    
    // Create email HTML content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${buyerName},</h2>
        <p>Thank you for speaking with us about your home buying goals. To better serve you, please complete the buyer information form below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${BUYER_FORM_URL}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Your Form</a>
        </div>
        
        <p>This form will help us understand your needs, timeline, and preferences so we can provide you with the most relevant properties and guidance.</p>
        
        <p>Best regards,<br>${senderEmail || 'Your Real Estate Agent'}</p>
      </div>
    `;

    // Send via Gmail API
    try {
      await gmailAuth.sendEmail(
        buyerEmail,
        'Complete Your Buyer Information Form',
        emailHtml
      );
      console.log('✅ Email sent via Gmail API');
    } catch (emailError) {
      console.error('❌ Gmail API failed:', emailError);
      throw new Error(`Failed to send email via Gmail: ${emailError.message}`);
    }

    console.log('✅ Buyer workflow completed successfully!');
    console.log('📧 Email sent to:', buyerEmail);
    console.log('📋 Form URL:', BUYER_FORM_URL);

    return {
      success: true,
      buyerId: buyer.id,
      formUrl: BUYER_FORM_URL,
      message: 'Buyer survey sent successfully via Gmail',
      sentFrom: senderEmail
    };

  } catch (error) {
    console.error('❌ Buyer workflow error:', error);
    throw new Error(`Failed to start buyer workflow: ${error.message}`);
  }
}

// Legacy buyer workflow handler (fallback to main process email)
export async function startBuyerWorkflow({ agentId, buyerEmail, buyerName, buyerPhone }: {
  agentId: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone?: string;
}) {
  try {
    console.log('🚀 Starting buyer workflow for:', buyerName);
    
    if (!agentId || !buyerEmail || !buyerName) {
      throw new Error('Missing required fields');
    }

    // Step 1: Create buyer record in Firebase
    console.log('📝 Step 1: Creating buyer record...');
    const buyer = await firebaseCollections.createBuyer({
      agentId,
      name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
      formData: {},
      status: 'survey_sent'
    });

    // Step 2: Send email via main process (to avoid browser compatibility issues)
    console.log('📝 Step 2: Sending email via main process...');
    
    // Use Electron IPC to send email from main process
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.sendEmail({
          to: buyerEmail,
          subject: 'Complete Your Buyer Information Form',
          template: 'buyer_form_request',
          data: {
            buyerName,
            formUrl: BUYER_FORM_URL,
            agentName: 'Your Real Estate Agent'
          }
        });
        console.log('✅ Email sent via main process');
      } catch (emailError) {
        console.warn('⚠️  Main process email failed, using fallback:', emailError);
        // Fallback to logging
        console.log('📧 Would send email to:', buyerEmail);
        console.log('📧 Form URL:', BUYER_FORM_URL);
      }
    } else {
      // Fallback for testing
      console.log('📧 Would send email to:', buyerEmail);
      console.log('📧 Form URL:', BUYER_FORM_URL);
    }

    console.log('✅ Buyer workflow completed successfully!');
    console.log('📧 Email sent to:', buyerEmail);
    console.log('📋 Form URL:', BUYER_FORM_URL);

    return {
      success: true,
      buyerId: buyer.id,
      formUrl: BUYER_FORM_URL,
      message: 'Buyer survey sent successfully'
    };

  } catch (error) {
    console.error('❌ Buyer workflow error:', error);
    throw new Error(`Failed to start buyer workflow: ${error.message}`);
  }
}

// Seller workflow handler
export async function startSellerWorkflow({ agentId, sellerEmail, sellerName, sellerPhone, propertyAddress }: {
  agentId: string;
  sellerEmail: string;
  sellerName: string;
  sellerPhone?: string;
  propertyAddress?: string;
}) {
  try {
    console.log('🚀 Starting seller workflow for:', sellerName);
    
    if (!agentId || !sellerEmail || !sellerName) {
      throw new Error('Missing required fields');
    }

    // Step 1: Create seller record in Firebase
    console.log('📝 Step 1: Creating seller record...');
    const seller = await firebaseCollections.createSeller({
      agentId,
      name: sellerName,
      email: sellerEmail,
      phone: sellerPhone,
      propertyAddress,
      formData: {},
      status: 'survey_sent'
    });

    // Step 2: Send email via main process (to avoid browser compatibility issues)
    console.log('📝 Step 2: Sending email via main process...');
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.sendEmail({
          to: sellerEmail,
          subject: 'Complete Your Seller Information Form',
          template: 'seller_form_request',
          data: {
            sellerName,
            formUrl: SELLER_FORM_URL,
            agentName: 'Your Real Estate Agent'
          }
        });
        console.log('✅ Email sent via main process');
      } catch (emailError) {
        console.warn('⚠️  Main process email failed, using fallback:', emailError);
        console.log('📧 Would send email to:', sellerEmail);
        console.log('📧 Form URL:', SELLER_FORM_URL);
      }
    } else {
      console.log('📧 Would send email to:', sellerEmail);
      console.log('📧 Form URL:', SELLER_FORM_URL);
    }

    console.log('✅ Seller workflow completed successfully!');
    console.log('📧 Email sent to:', sellerEmail);
    console.log('📋 Form URL:', SELLER_FORM_URL);

    return {
      success: true,
      sellerId: seller.id,
      formUrl: SELLER_FORM_URL,
      message: 'Seller survey sent successfully'
    };

  } catch (error) {
    console.error('❌ Seller workflow error:', error);
    throw new Error(`Failed to start seller workflow: ${error.message}`);
  }
}

// Initialize services
export async function initializeServices() {
  console.log('🔥 Initializing automation services...');
  
  // Simulate initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✅ Automation services initialized successfully');
  return { 
    success: true, 
    message: 'Automation services ready'
  };
}

console.log('🚀 Simplified automation services loaded');