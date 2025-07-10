// Firebase service for storing client and workflow data
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from './config';

interface BuyerData {
  agentId: string;
  name: string;
  email: string;
  phone?: string;
  formData: Record<string, any>;
  status: string;
  qualificationSummary?: string;
}

interface SellerData {
  agentId: string;
  name: string;
  email: string;
  phone?: string;
  propertyAddress?: string;
  formData: Record<string, any>;
  status: string;
  qualificationSummary?: string;
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
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const seller = {
      id: `seller_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    
    console.log('✅ Seller created:', seller.id);
    return seller;
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
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('✅ Buyer updated:', buyerId);
    return { id: buyerId, ...updates };
  },

  async updateSeller(sellerId: string, updates: Partial<SellerData>) {
    console.log('💾 Updating seller in Firebase:', sellerId);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('✅ Seller updated:', sellerId);
    return { id: sellerId, ...updates };
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

  async updateDocument(collection: string, documentId: string, updates: any) {
    console.log('💾 Updating document in Firebase:', collection, documentId);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('✅ Document updated:', documentId);
    return { id: documentId, ...updates };
  }
};