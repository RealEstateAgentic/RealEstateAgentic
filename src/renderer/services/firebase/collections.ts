// Firebase service for storing client and workflow data
import { collection, addDoc, updateDoc, doc, getDocs, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './config';

interface BuyerData {
  agentId: string;
  name: string;
  email: string;
  phone: string;
  leadSource?: string;
  notes?: string;
  stage: string;
  subStatus: string;
  priority: string;
  dateAdded: string;
  lastContact: string | null;
  isArchived: boolean;
  archivedDate: string | null;
  archivedFromStage: string | null;
  uploadedDocuments: {
    name: string;
    url: string;
    type: string;
    size: number;
    uploadDate: string;
  }[];
  // Legacy fields for backward compatibility
  formData?: Record<string, any>;
  status?: string;
  qualificationSummary?: string;
}

interface SellerData {
  agentId: string;
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
  leadSource?: string;
  notes?: string;
  stage: string;
  subStatus: string;
  priority: string;
  dateAdded: string;
  lastContact: string | null;
  isArchived: boolean;
  archivedDate: string | null;
  archivedFromStage: string | null;
  uploadedDocuments: {
    name: string;
    url: string;
    type: string;
    size: number;
    uploadDate: string;
  }[];
  // Legacy fields for backward compatibility
  formData?: Record<string, any>;
  status?: string;
  qualificationSummary?: string;
}

interface GPTAnalysisData {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientType: 'buyer' | 'seller';
  agentId: string;
  formData: Record<string, any>;
  aiSummary: string;
  analysisModel: string;
  createdAt: string;
  submissionId?: string;
}

interface WorkflowData {
  clientId: string;
  clientType: 'buyer' | 'seller';
  agentId: string;
  type: string;
  status: string;
  steps: any[];
  emailsSent: any[];
  documentsGenerated: any[];
  formId?: string;
}

/**
 * Get default sub-status for a given stage
 */
function getDefaultSubStatus(stage: string): string {
  switch (stage) {
    case 'new_lead': return 'to_initiate_contact';
    case 'pre_listing': return 'preparing_cma';
    case 'active_listing': return 'active';
    case 'under_contract': return 'pending_inspection';
    case 'closed': return 'completed';
    case 'qualified': return 'searching';
    case 'showing': return 'viewing_properties';
    case 'offer_made': return 'negotiating';
    case 'under_contract_buyer': return 'pending_inspection';
    case 'closed_buyer': return 'completed';
    default: return 'unknown';
  }
}

export const firebaseCollections = {
  async createBuyer(data: BuyerData) {
    console.log('💾 Creating buyer in Firebase:', data.name);
    
    try {
      const docRef = await addDoc(collection(db, 'buyers'), {
        ...data,
        createdAt: new Date().toISOString()
      });
      
      const buyer = {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString()
      };
      
      console.log('✅ Buyer created:', buyer.id);
      return buyer;
    } catch (error) {
      console.error('❌ Error creating buyer:', error);
      throw error;
    }
  },

  async createSeller(data: SellerData) {
    console.log('💾 Creating seller in Firebase:', data.name);
    
    try {
      const docRef = await addDoc(collection(db, 'sellers'), {
        ...data,
        createdAt: new Date().toISOString()
      });
      
      const seller = {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString()
      };
      
      console.log('✅ Seller created:', seller.id);
      return seller;
    } catch (error) {
      console.error('❌ Error creating seller:', error);
      throw error;
    }
  },

  async createWorkflow(data: WorkflowData) {
    console.log('💾 Creating workflow in Firebase:', data.type);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const workflow = {
      id: `workflow_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    
    console.log('✅ Workflow created:', workflow.id);
    return workflow;
  },

  async updateWorkflow(workflowId: string, updates: Partial<WorkflowData>) {
    console.log('💾 Updating workflow in Firebase:', workflowId);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('✅ Workflow updated:', workflowId);
    return { id: workflowId, ...updates };
  },

  async updateBuyer(buyerId: string, updates: Partial<BuyerData>) {
    console.log('💾 Updating buyer in Firebase:', buyerId);
    
    try {
      const docRef = doc(db, 'buyers', buyerId);
      
      // If updating stage, ensure subStatus is set
      if (updates.stage && !updates.subStatus) {
        updates.subStatus = getDefaultSubStatus(updates.stage);
      }
      
      await updateDoc(docRef, updates);
      
      console.log('✅ Buyer updated:', buyerId);
      return { id: buyerId, ...updates };
    } catch (error) {
      console.error('❌ Error updating buyer:', error);
      throw error;
    }
  },

  async archiveBuyer(buyerId: string, currentStage: string) {
    console.log('💾 Archiving buyer in Firebase:', buyerId);
    
    try {
      const docRef = doc(db, 'buyers', buyerId);
      const archiveData = {
        isArchived: true,
        archivedDate: new Date().toISOString(),
        archivedFromStage: currentStage
      };
      
      await updateDoc(docRef, archiveData);
      
      console.log('✅ Buyer archived:', buyerId);
      return { id: buyerId, ...archiveData };
    } catch (error) {
      console.error('❌ Error archiving buyer:', error);
      throw error;
    }
  },

  async updateSeller(sellerId: string, updates: Partial<SellerData>) {
    console.log('💾 Updating seller in Firebase:', sellerId);
    
    try {
      const docRef = doc(db, 'sellers', sellerId);
      
      // If updating stage, ensure subStatus is set
      if (updates.stage && !updates.subStatus) {
        updates.subStatus = getDefaultSubStatus(updates.stage);
      }
      
      await updateDoc(docRef, updates);
      
      console.log('✅ Seller updated:', sellerId);
      return { id: sellerId, ...updates };
    } catch (error) {
      console.error('❌ Error updating seller:', error);
      throw error;
    }
  },

  async archiveSeller(sellerId: string, currentStage: string) {
    console.log('💾 Archiving seller in Firebase:', sellerId);
    
    try {
      const docRef = doc(db, 'sellers', sellerId);
      const archiveData = {
        isArchived: true,
        archivedDate: new Date().toISOString(),
        archivedFromStage: currentStage
      };
      
      await updateDoc(docRef, archiveData);
      
      console.log('✅ Seller archived:', sellerId);
      return { id: sellerId, ...archiveData };
    } catch (error) {
      console.error('❌ Error archiving seller:', error);
      throw error;
    }
  },

  async getBuyer(buyerId: string) {
    console.log('💾 Getting buyer from Firebase:', buyerId);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock buyer data
    return {
      id: buyerId,
      name: 'Mock Buyer',
      email: 'buyer@email.com',
      status: 'qualified'
    };
  },

  async getSeller(sellerId: string) {
    console.log('💾 Getting seller from Firebase:', sellerId);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock seller data
    return {
      id: sellerId,
      name: 'Mock Seller',
      email: 'seller@email.com',
      status: 'qualified'
    };
  },

  async getWorkflow(workflowId: string) {
    console.log('💾 Getting workflow from Firebase:', workflowId);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock workflow data
    return {
      id: workflowId,
      status: 'completed',
      steps: []
    };
  },

  async getWorkflows() {
    console.log('💾 Getting all workflows from Firebase');
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock workflows data
    return [
      {
        id: 'workflow_123',
        status: 'in-progress',
        clientId: 'buyer_123',
        clientType: 'buyer',
        emailsSent: [{ to: 'damonbodine@gmail.com', sentAt: new Date().toISOString() }],
        steps: []
      }
    ];
  },

  async addDocument(collectionName: string, data: any) {
    console.log('💾 Adding document to Firebase collection:', collectionName);
    
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      console.log('✅ Document created:', docRef.id);
      return { id: docRef.id };
    } catch (error) {
      console.error('❌ Error adding document:', error);
      throw error;
    }
  },

  async getBuyers(agentId?: string) {
    console.log('💾 Getting buyers from Firebase', agentId ? `for agent: ${agentId}` : '(all)');
    
    try {
      const buyersCollection = collection(db, 'buyers');
      let q = query(buyersCollection, where('isArchived', '==', false));
      
      if (agentId) {
        q = query(buyersCollection, where('agentId', '==', agentId), where('isArchived', '==', false));
      }
      
      const querySnapshot = await getDocs(q);
      const buyers: (BuyerData & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        buyers.push({
          id: doc.id,
          ...doc.data()
        } as BuyerData & { id: string });
      });
      
      console.log('✅ Retrieved', buyers.length, 'buyers');
      return buyers;
    } catch (error) {
      console.error('❌ Error getting buyers:', error);
      throw error;
    }
  },

  getBuyersRealTime(agentId: string, onUpdate: (buyers: (BuyerData & { id: string })[]) => void, onError: (error: Error) => void) {
    console.log('💾 Setting up real-time buyers listener for agent:', agentId);
    
    try {
      const buyersCollection = collection(db, 'buyers');
      const q = query(
        buyersCollection, 
        where('agentId', '==', agentId), 
        where('isArchived', '==', false),
        orderBy('dateAdded', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const buyers: (BuyerData & { id: string })[] = [];
        
        querySnapshot.forEach((doc) => {
          buyers.push({
            id: doc.id,
            ...doc.data()
          } as BuyerData & { id: string });
        });
        
        console.log('✅ Real-time update: Retrieved', buyers.length, 'buyers');
        onUpdate(buyers);
      }, (error) => {
        console.error('❌ Error in buyers real-time listener:', error);
        onError(error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up buyers real-time listener:', error);
      onError(error as Error);
      return () => {}; // Return empty unsubscribe function
    }
  },

  async getSellers(agentId?: string) {
    console.log('💾 Getting sellers from Firebase', agentId ? `for agent: ${agentId}` : '(all)');
    
    try {
      const sellersCollection = collection(db, 'sellers');
      let q = query(sellersCollection, where('isArchived', '==', false));
      
      if (agentId) {
        q = query(sellersCollection, where('agentId', '==', agentId), where('isArchived', '==', false));
      }
      
      const querySnapshot = await getDocs(q);
      const sellers: (SellerData & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        sellers.push({
          id: doc.id,
          ...doc.data()
        } as SellerData & { id: string });
      });
      
      console.log('✅ Retrieved', sellers.length, 'sellers');
      return sellers;
    } catch (error) {
      console.error('❌ Error getting sellers:', error);
      throw error;
    }
  },

  getSellersRealTime(agentId: string, onUpdate: (sellers: (SellerData & { id: string })[]) => void, onError: (error: Error) => void) {
    console.log('💾 Setting up real-time sellers listener for agent:', agentId);
    
    try {
      const sellersCollection = collection(db, 'sellers');
      const q = query(
        sellersCollection, 
        where('agentId', '==', agentId), 
        where('isArchived', '==', false),
        orderBy('dateAdded', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const sellers: (SellerData & { id: string })[] = [];
        
        querySnapshot.forEach((doc) => {
          sellers.push({
            id: doc.id,
            ...doc.data()
          } as SellerData & { id: string });
        });
        
        console.log('✅ Real-time update: Retrieved', sellers.length, 'sellers');
        onUpdate(sellers);
      }, (error) => {
        console.error('❌ Error in sellers real-time listener:', error);
        onError(error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up sellers real-time listener:', error);
      onError(error as Error);
      return () => {}; // Return empty unsubscribe function
    }
  },

  async createGPTAnalysis(analysisData: GPTAnalysisData) {
    console.log('💾 Creating GPT analysis in Firebase for:', analysisData.clientName);
    
    try {
      const analysisWithTimestamp = {
        ...analysisData,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'gpt-analysis'), analysisWithTimestamp);
      
      console.log('✅ GPT analysis created:', docRef.id);
      return { id: docRef.id };
    } catch (error) {
      console.error('❌ Error creating GPT analysis:', error);
      throw error;
    }
  },

  async getGPTAnalyses() {
    console.log('💾 Getting all GPT analyses from Firebase');
    
    try {
      const analysesCollection = collection(db, 'gpt-analysis');
      const querySnapshot = await getDocs(analysesCollection);
      const analyses: (GPTAnalysisData & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        analyses.push({
          id: doc.id,
          ...doc.data()
        } as GPTAnalysisData & { id: string });
      });
      
      console.log('✅ Retrieved', analyses.length, 'GPT analyses');
      return analyses;
    } catch (error) {
      console.error('❌ Error getting GPT analyses:', error);
      throw error;
    }
  },

  async getGPTAnalysesByClient(clientEmail: string) {
    console.log('💾 Getting GPT analyses for client:', clientEmail);
    
    try {
      const analysesCollection = collection(db, 'gpt-analysis');
      const q = query(analysesCollection, where('clientEmail', '==', clientEmail));
      const querySnapshot = await getDocs(q);
      const analyses: (GPTAnalysisData & { id: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        analyses.push({
          id: doc.id,
          ...doc.data()
        } as GPTAnalysisData & { id: string });
      });
      
      console.log('✅ Retrieved', analyses.length, 'GPT analyses for', clientEmail);
      return analyses;
    } catch (error) {
      console.error('❌ Error getting GPT analyses for client:', error);
      throw error;
    }
  },

  async getGPTAnalysisBySubmissionId(submissionId: string) {
    console.log('💾 Checking if submission already processed:', submissionId);
    
    try {
      const analysesCollection = collection(db, 'gpt-analysis');
      const q = query(analysesCollection, where('submissionId', '==', submissionId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('✅ Submission not processed yet:', submissionId);
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const analysis = {
        id: doc.id,
        ...doc.data()
      };
      
      console.log('⚠️ Submission already processed:', submissionId);
      return analysis;
    } catch (error) {
      console.error('❌ Error checking submission:', error);
      throw error;
    }
  },

  async updateDocument(collection: string, documentId: string, updates: any) {
    console.log('💾 Updating document in Firebase:', collection, documentId);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('✅ Document updated:', documentId);
    return { id: documentId, ...updates };
  },

  async getPollingState(formId: string) {
    console.log('💾 Getting polling state for form:', formId);
    
    try {
      const stateCollection = collection(db, 'polling-state');
      const q = query(stateCollection, where('formId', '==', formId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('✅ No polling state found for form:', formId);
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const state = {
        id: doc.id,
        ...doc.data()
      };
      
      console.log('✅ Retrieved polling state for form:', formId);
      return state;
    } catch (error) {
      console.error('❌ Error getting polling state:', error);
      throw error;
    }
  },

  async updatePollingState(formId: string, lastProcessedTime: string) {
    console.log('💾 Updating polling state for form:', formId);
    
    try {
      const stateCollection = collection(db, 'polling-state');
      const q = query(stateCollection, where('formId', '==', formId));
      const querySnapshot = await getDocs(q);
      
      const stateData = {
        formId,
        lastProcessedTime,
        updatedAt: new Date().toISOString()
      };
      
      if (querySnapshot.empty) {
        // Create new state document
        const docRef = await addDoc(stateCollection, stateData);
        console.log('✅ Created new polling state:', docRef.id);
        return { id: docRef.id };
      } else {
        // Update existing state document
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, stateData);
        console.log('✅ Updated polling state:', docRef.id);
        return { id: docRef.id };
      }
    } catch (error) {
      console.error('❌ Error updating polling state:', error);
      throw error;
    }
  }
};