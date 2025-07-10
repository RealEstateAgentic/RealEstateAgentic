import { onSnapshot, collection, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase/config';
import { firebaseCollections } from './firebase/collections';

interface FormSubmission {
  id: string;
  email: string;
  name: string;
  formData: any;
  formType: 'buyer' | 'seller';
  submittedAt: any;
  processed: boolean;
}

let unsubscribe: (() => void) | null = null;

export function startFormSubmissionListener() {
  if (unsubscribe) {
    console.log('📱 Form submission listener already active');
    return;
  }

  console.log('📱 Starting form submission listener...');

  // Listen for new unprocessed form submissions
  const q = query(
    collection(db, 'form_submissions'),
    where('processed', '==', false),
    orderBy('submittedAt', 'desc'),
    limit(10)
  );

  unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const submission = {
          id: change.doc.id,
          ...change.doc.data()
        } as FormSubmission;
        
        console.log('🔔 New form submission received:', submission);
        processFormSubmission(submission);
      }
    });
  });

  console.log('✅ Form submission listener started');
}

export function stopFormSubmissionListener() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log('📱 Form submission listener stopped');
  }
}

async function processFormSubmission(submission: FormSubmission) {
  try {
    console.log('🔄 Processing form submission:', submission.id);

    // Find matching workflow by email
    const workflows = await firebaseCollections.getWorkflows();
    const workflow = workflows.find(w => 
      w.emailsSent && w.emailsSent.some(email => email.to === submission.email)
    );

    if (!workflow) {
      console.warn('⚠️ No matching workflow found for email:', submission.email);
      return;
    }

    console.log('✅ Found matching workflow:', workflow.id);

    // Update workflow with form completion
    await firebaseCollections.updateWorkflow(workflow.id, {
      status: 'form_completed',
      steps: workflow.steps.map(step => 
        step.name === 'await_form_completion' 
          ? { ...step, status: 'completed', completedAt: new Date().toISOString() }
          : step
      ),
      formResponse: submission.formData,
      completedAt: new Date().toISOString()
    });

    // Update client record
    if (workflow.clientType === 'buyer') {
      await firebaseCollections.updateBuyer(workflow.clientId, {
        formData: submission.formData,
        status: 'form_completed',
        completedAt: new Date().toISOString()
      });
    } else {
      await firebaseCollections.updateSeller(workflow.clientId, {
        formData: submission.formData,
        status: 'form_completed',
        completedAt: new Date().toISOString()
      });
    }

    // Process Google Sheets and Email Summary
    await processNextSteps(workflow, submission);

    // Mark submission as processed
    const submissionRef = doc(db, 'form_submissions', submission.id);
    await updateDoc(submissionRef, {
      processed: true,
      processedAt: new Date().toISOString()
    });

    console.log('🎉 Form submission processed successfully!');

  } catch (error) {
    console.error('❌ Form submission processing failed:', error);
  }
}

async function processNextSteps(workflow: any, submission: FormSubmission) {
  try {
    console.log('📊 Creating Google Sheets...');
    const sheetUrl = await createGoogleSheet(workflow, submission);
    
    console.log('📧 Sending email summary...');
    await sendEmailSummary(workflow, submission, sheetUrl);
    
    // Update workflow as fully completed
    await firebaseCollections.updateWorkflow(workflow.id, {
      status: 'completed',
      documentsGenerated: [
        ...(workflow.documentsGenerated || []),
        { 
          type: 'google_sheet', 
          url: sheetUrl, 
          createdAt: new Date().toISOString() 
        }
      ],
      steps: workflow.steps.map(step => ({ 
        ...step, 
        status: 'completed', 
        completedAt: new Date().toISOString() 
      }))
    });

    console.log('✅ All workflow steps completed!');

  } catch (error) {
    console.error('❌ Next steps processing failed:', error);
  }
}

async function createGoogleSheet(workflow: any, submission: FormSubmission): Promise<string> {
  console.log('📊 Creating Google Sheets document...');
  
  // Create a simple data structure for Google Sheets
  const sheetData = {
    clientInfo: {
      name: submission.name,
      email: submission.email,
      type: submission.formType,
      submittedAt: new Date().toISOString()
    },
    formData: submission.formData,
    workflow: {
      id: workflow.id,
      agentId: workflow.agentId,
      completedAt: new Date().toISOString()
    }
  };
  
  console.log('📊 Sheet data prepared:', sheetData);
  
  // For now, return a mock URL - we'll implement actual Google Sheets API next
  const mockSheetUrl = `https://docs.google.com/spreadsheets/d/workflow-${workflow.id}`;
  console.log('📊 Google Sheets created (mock):', mockSheetUrl);
  
  return mockSheetUrl;
}

async function sendEmailSummary(workflow: any, submission: FormSubmission, sheetUrl: string): Promise<void> {
  console.log('📧 Sending email summary...');
  
  // Use the existing email system to send summary
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      await window.electronAPI.sendEmail({
        to: workflow.agentId === 'agent_123' ? 'damonbodine@gmail.com' : 'agent@example.com',
        subject: `Form Completed: ${submission.name} (${submission.formType})`,
        template: 'form_completion_summary',
        data: {
          clientName: submission.name,
          clientEmail: submission.email,
          formType: submission.formType,
          sheetUrl: sheetUrl,
          submittedAt: new Date().toISOString(),
          agentName: 'Real Estate Agent'
        }
      });
      console.log('✅ Email summary sent successfully');
    } catch (error) {
      console.error('❌ Failed to send email summary:', error);
    }
  }
}

// Manual testing function - we'll create a fake form submission
export async function createTestFormSubmission(email: string, name: string, formType: 'buyer' | 'seller' = 'buyer') {
  try {
    console.log('🧪 Creating test form submission...');
    
    const testSubmission = {
      email: email,
      name: name,
      formData: {
        q1_email: email,
        q2_name: name,
        q3_phone: '(555) 123-4567',
        q4_budget: formType === 'buyer' ? '$400,000 - $600,000' : '$500,000',
        q5_timeline: '3-6 months',
        q6_preferences: formType === 'buyer' ? 'Modern condo with parking' : 'Quick sale needed'
      },
      formType: formType,
      submittedAt: new Date().toISOString(),
      processed: false
    };
    
    // Add to Firebase
    const docRef = await firebaseCollections.addDocument('form_submissions', testSubmission);
    
    console.log('✅ Test form submission created:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Failed to create test form submission:', error);
    throw error;
  }
}

// Manual processing function for testing
export async function processTestSubmission(email: string, name: string) {
  try {
    console.log('🧪 Manually processing test submission for:', email);
    
    const mockSubmission: FormSubmission = {
      id: `test_${Date.now()}`,
      email: email,
      name: name,
      formData: {
        q1_email: email,
        q2_name: name,
        q3_phone: '(555) 123-4567',
        q4_budget: '$400,000 - $600,000',
        q5_timeline: '3-6 months',
        q6_preferences: 'Modern condo with parking'
      },
      formType: 'buyer',
      submittedAt: new Date().toISOString(),
      processed: false
    };
    
    await processFormSubmission(mockSubmission);
    console.log('✅ Test submission processed successfully');
    
  } catch (error) {
    console.error('❌ Failed to process test submission:', error);
    throw error;
  }
}