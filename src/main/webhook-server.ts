import express from 'express';
import { BrowserWindow } from 'electron';
import { firebaseCollections } from '../renderer/services/firebase/collections';

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JotForm webhook endpoint
app.post('/webhook/jotform', async (req, res) => {
  try {
    console.log('🔔 JotForm webhook received:', req.body);
    
    // Extract form data
    const formData = req.body;
    const clientEmail = formData.q3_email || formData.q1_email || formData.email;
    const clientName = formData.q2_name || formData.q1_name || formData.name;
    
    if (!clientEmail) {
      console.error('❌ No email found in webhook data');
      return res.status(400).json({ error: 'No email found' });
    }
    
    // Find matching workflow
    const workflows = await firebaseCollections.getWorkflows();
    const workflow = workflows.find(w => 
      w.emailsSent.some(email => email.to === clientEmail)
    );
    
    if (!workflow) {
      console.error('❌ No matching workflow found for:', clientEmail);
      return res.status(404).json({ error: 'No matching workflow found' });
    }
    
    // Update workflow with form completion
    await firebaseCollections.updateWorkflow(workflow.id, {
      status: 'form_completed',
      steps: workflow.steps.map(step => 
        step.name === 'await_form_completion' 
          ? { ...step, status: 'completed', completedAt: new Date().toISOString() }
          : step
      ),
      formResponse: formData,
      completedAt: new Date().toISOString()
    });
    
    // Update client record
    if (workflow.clientType === 'buyer') {
      await firebaseCollections.updateBuyer(workflow.clientId, {
        formData: formData,
        status: 'form_completed',
        completedAt: new Date().toISOString()
      });
    } else {
      await firebaseCollections.updateSeller(workflow.clientId, {
        formData: formData,
        status: 'form_completed',
        completedAt: new Date().toISOString()
      });
    }
    
    // Trigger next steps
    await processFormSubmission(workflow, formData);
    
    console.log('✅ Webhook processed successfully');
    res.json({ success: true, message: 'Webhook processed successfully' });
    
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function processFormSubmission(workflow: any, formData: any) {
  try {
    // Step 1: Create Google Sheets
    console.log('📊 Creating Google Sheets...');
    const sheetUrl = await createGoogleSheet(workflow, formData);
    
    // Step 2: Send email summary
    console.log('📧 Sending email summary...');
    await sendEmailSummary(workflow, formData, sheetUrl);
    
    // Step 3: Update workflow as completed
    await firebaseCollections.updateWorkflow(workflow.id, {
      status: 'completed',
      documentsGenerated: [...(workflow.documentsGenerated || []), { type: 'google_sheet', url: sheetUrl }],
      steps: workflow.steps.map(step => ({ ...step, status: 'completed', completedAt: new Date().toISOString() }))
    });
    
    console.log('🎉 Form submission processing completed!');
    
  } catch (error) {
    console.error('❌ Form submission processing failed:', error);
  }
}

async function createGoogleSheet(workflow: any, formData: any): Promise<string> {
  // TODO: Implement Google Sheets creation
  console.log('📊 Google Sheets creation placeholder');
  return 'https://docs.google.com/spreadsheets/d/placeholder';
}

async function sendEmailSummary(workflow: any, formData: any, sheetUrl: string): Promise<void> {
  // TODO: Implement email summary
  console.log('📧 Email summary placeholder');
}

// Start webhook server
export function startWebhookServer() {
  app.listen(PORT, () => {
    console.log(`🔗 Webhook server running on http://localhost:${PORT}`);
    console.log(`📝 JotForm webhook URL: http://localhost:${PORT}/webhook/jotform`);
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});