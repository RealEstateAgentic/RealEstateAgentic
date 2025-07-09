// Environment variables are handled by the main process
// We don't need to load them again in the renderer

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.process === 'undefined';

// Import services (these will be lazy-loaded to avoid initialization issues)
let buyerAgent: any;
let sellerAgent: any;
let firebaseCollections: any;
let sendEmailWithTemplate: any;
let createJotForm: any;
let generateGammaPresentation: any;
let exportToExcel: any;

// Lazy load services to avoid initialization issues
async function loadServices() {
  if (!buyerAgent) {
    const agents = await import('../../services/langchain/agents');
    buyerAgent = agents.buyerAgent;
    sellerAgent = agents.sellerAgent;
  }
  
  if (!firebaseCollections) {
    const { firebaseCollections: fc } = await import('../../services/firebase/collections');
    firebaseCollections = fc;
  }
  
  if (!sendEmailWithTemplate) {
    const { sendEmailWithTemplate: set } = await import('../../services/email/templates');
    sendEmailWithTemplate = set;
  }
  
  if (!createJotForm) {
    const { createJotForm: cjf } = await import('../../services/google/forms');
    createJotForm = cjf;
  }
  
  if (!generateGammaPresentation) {
    const { generateGammaPresentation: ggp } = await import('../../services/gamma/presentation');
    generateGammaPresentation = ggp;
  }
  
  if (!exportToExcel) {
    const { exportToExcel: ete } = await import('../../services/excel/export');
    exportToExcel = ete;
  }
}

// Buyer workflow handler
export async function startBuyerWorkflow({ agentId, buyerEmail, buyerName, buyerPhone }: {
  agentId: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone?: string;
}) {
  try {
    await loadServices();
    
    if (!agentId || !buyerEmail || !buyerName) {
      throw new Error('Missing required fields');
    }

    console.log('Starting buyer workflow for:', buyerName);

    const buyer = await firebaseCollections.createBuyer({
      agentId,
      name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
      formData: {},
      status: 'new'
    });

    const workflow = await firebaseCollections.createWorkflow({
      clientId: buyer.id,
      clientType: 'buyer',
      agentId,
      type: 'onboarding',
      status: 'in-progress',
      steps: [
        { name: 'create_form', status: 'pending' },
        { name: 'send_form_email', status: 'pending' },
        { name: 'await_completion', status: 'pending' },
        { name: 'process_responses', status: 'pending' },
        { name: 'send_summary_email', status: 'pending' },
        { name: 'generate_presentation', status: 'pending' }
      ],
      emailsSent: [],
      documentsGenerated: []
    });

    const formData = {
      title: `Buyer Qualification Form - ${buyerName}`,
      description: 'Please complete this form to help us better understand your home buying needs and timeline.',
      fields: [
        { type: 'text' as const, title: 'Current Housing Situation', required: true },
        { type: 'multiple_choice' as const, title: 'Pre-approval Status', choices: ['Pre-approved', 'Planning to get pre-approved', 'Not sure what this means'], required: true },
        { type: 'text' as const, title: 'Budget Range', required: true },
        { type: 'text' as const, title: 'Preferred Locations', required: true },
        { type: 'multiple_choice' as const, title: 'Timeline to Purchase', choices: ['Immediately (0-3 months)', 'Soon (3-6 months)', 'Future (6+ months)'], required: true },
        { type: 'text' as const, title: 'Reason for Buying', required: true },
        { type: 'multiple_choice' as const, title: 'Down Payment Readiness', choices: ['Have funds ready', 'Saving currently', 'Need assistance with options'], required: true },
        { type: 'text' as const, title: 'Must-have Features', required: false },
        { type: 'text' as const, title: 'Deal Breakers', required: false },
        { type: 'text' as const, title: 'Additional Comments', required: false }
      ]
    };

    const formUrl = await createJotForm(formData);

    await firebaseCollections.updateWorkflow(workflow.id, {
      formId: formUrl,
      steps: workflow.steps.map((step: any, index: number) => 
        index === 0 ? { ...step, status: 'completed', completedAt: new Date() } : step
      )
    });

    await sendEmailWithTemplate({
      to: buyerEmail,
      template: 'buyer_form_request',
      data: {
        buyerName,
        formUrl,
        agentName: 'Your Real Estate Agent'
      }
    });

    return {
      success: true,
      workflowId: workflow.id,
      buyerId: buyer.id,
      formUrl,
      message: 'Buyer onboarding workflow started successfully'
    };

  } catch (error) {
    console.error('Buyer workflow error:', error);
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
    await loadServices();
    
    if (!agentId || !sellerEmail || !sellerName) {
      throw new Error('Missing required fields');
    }

    console.log('Starting seller workflow for:', sellerName);

    const seller = await firebaseCollections.createSeller({
      agentId,
      name: sellerName,
      email: sellerEmail,
      phone: sellerPhone,
      propertyAddress,
      formData: {},
      status: 'new'
    });

    const workflow = await firebaseCollections.createWorkflow({
      clientId: seller.id,
      clientType: 'seller',
      agentId,
      type: 'onboarding',
      status: 'in-progress',
      steps: [
        { name: 'create_form', status: 'pending' },
        { name: 'send_form_email', status: 'pending' },
        { name: 'await_completion', status: 'pending' },
        { name: 'process_responses', status: 'pending' },
        { name: 'send_summary_email', status: 'pending' },
        { name: 'generate_presentation', status: 'pending' }
      ],
      emailsSent: [],
      documentsGenerated: []
    });

    const formData = {
      title: `Seller Consultation Form - ${sellerName}`,
      description: 'Please complete this form to help us understand your selling goals and timeline.',
      fields: [
        { type: 'text' as const, title: 'Property Address', required: true },
        { type: 'text' as const, title: 'Reason for Selling', required: true },
        { type: 'multiple_choice' as const, title: 'Timeline to Sell', choices: ['ASAP (0-3 months)', 'Soon (3-6 months)', 'Flexible (6+ months)'], required: true },
        { type: 'text' as const, title: 'Expected Sale Price', required: true },
        { type: 'multiple_choice' as const, title: 'Property Condition', choices: ['Move-in ready', 'Minor updates needed', 'Major renovations needed'], required: true },
        { type: 'text' as const, title: 'Recent Improvements', required: false },
        { type: 'multiple_choice' as const, title: 'Current Mortgage Status', choices: ['Paid off', 'Low balance', 'Substantial balance remaining'], required: true },
        { type: 'text' as const, title: 'Next Home Plans', required: true },
        { type: 'text' as const, title: 'Biggest Concerns', required: false },
        { type: 'text' as const, title: 'Additional Information', required: false }
      ]
    };

    const formUrl = await createJotForm(formData);

    await firebaseCollections.updateWorkflow(workflow.id, {
      formId: formUrl,
      steps: workflow.steps.map((step: any, index: number) => 
        index === 0 ? { ...step, status: 'completed', completedAt: new Date() } : step
      )
    });

    await sendEmailWithTemplate({
      to: sellerEmail,
      template: 'seller_form_request',
      data: {
        sellerName,
        formUrl,
        agentName: 'Your Real Estate Agent'
      }
    });

    return {
      success: true,
      workflowId: workflow.id,
      sellerId: seller.id,
      formUrl,
      message: 'Seller onboarding workflow started successfully'
    };

  } catch (error) {
    console.error('Seller workflow error:', error);
    throw new Error(`Failed to start seller workflow: ${error.message}`);
  }
}

// Initialize services
export async function initializeServices() {
  try {
    console.log('🔥 Initializing Firebase and LangChain services...');
    
    // Initialize Firebase first
    const { initializeFirebase } = await import('../../services/firebase/config');
    initializeFirebase();
    
    // Then load other services
    await loadServices();
    
    console.log('✅ Services initialized successfully with REAL OpenAI agents and Firebase');
    return { 
      success: true, 
      message: 'Firebase + LangChain + Email services ready'
    };
  } catch (error) {
    console.error('❌ Services initialization failed:', error);
    throw new Error(`Failed to initialize services: ${error.message}`);
  }
}

console.log('🚀 Automation services loaded in renderer');