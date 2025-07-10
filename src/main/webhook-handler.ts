import { ipcMain } from 'electron';
import { firebaseCollections } from '../renderer/services/firebase/collections';

export function setupWebhookHandler() {
  // Handle webhook data processing
  ipcMain.handle('process-webhook', async (event, webhookData) => {
    try {
      console.log('🔗 Processing webhook data:', webhookData);
      
      // Extract form data
      const formData = webhookData.rawRequest || webhookData;
      const clientEmail = formData.email || formData.q3_email || formData.q1_email;
      const clientName = formData.name || formData.q2_name || formData.q1_name;
      const clientType = formData.client_type || 'buyer';
      
      if (!clientEmail) {
        throw new Error('No email found in webhook data');
      }
      
      // Find existing workflow
      const workflows = await firebaseCollections.getWorkflows();
      const workflow = workflows.find(w => 
        w.emailsSent.some(email => email.to === clientEmail)
      );
      
      if (workflow) {
        // Update workflow with form completion
        await firebaseCollections.updateWorkflow(workflow.id, {
          status: 'completed',
          steps: workflow.steps.map(step => 
            step.name === 'await_form_completion' 
              ? { ...step, status: 'completed', completedAt: new Date().toISOString() }
              : step
          ),
          formResponse: formData,
          completedAt: new Date().toISOString()
        });
        
        // Update client record
        if (clientType === 'buyer') {
          await firebaseCollections.updateBuyer(workflow.clientId, {
            formData: formData,
            status: 'form_completed',
            completedAt: new Date().toISOString()
          });
        }
        
        console.log('✅ Webhook processed successfully');
        return { success: true, workflowId: workflow.id };
      } else {
        console.log('⚠️ No matching workflow found for email:', clientEmail);
        return { success: false, error: 'No matching workflow found' };
      }
      
    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      throw error;
    }
  });
  
  console.log('🔗 Webhook handler registered');
}
