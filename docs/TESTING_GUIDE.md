# 🧪 **Real Estate Agentic - Workflow Testing Guide**

This guide provides step-by-step instructions for testing all workflow automations in the Real Estate Agentic application.

## 📋 **Pre-Testing Setup**

### **1. Start the Application**
```bash
npm run dev
```

### **2. Authentication**
- Navigate to the application (should auto-open)
- Go to Agent Authentication (`/auth/agent`)
- Sign in with your agent credentials
- Verify you're redirected to the Agent Dashboard

---

## **🔍 Testing Each Workflow**

### **1. 📄 Document Generation Workflow**

**Access Path:** Agent Dashboard → Buyers Portal → Client Card → Generate Documents

**Testing Steps:**

1. **Navigate to Buyers Portal**
   - Click "Buyers Portal" in the sidebar
   - You should see client cards with different stages

2. **Select a Client**
   - Click on any client card (e.g., "David Thompson")
   - Client modal should open

3. **Generate Cover Letter**
   - Click "Generate Offer Cover Letter" button
   - DocumentGenerator modal should open
   - Verify the following are pre-populated:
     - Client information (David Thompson)
     - Document types (Cover Letter, Explanation Memo, etc.)
     - Generation options

4. **Test Document Generation**
   - Keep default selections or modify as needed
   - Click "Generate Documents" button
   - Watch the progress bar and status updates
   - **Expected Results:**
     - Progress bar should advance from 0% to 100%
     - Status should show "Generation complete!"
     - Documents Generated count should be > 0
     - Status should show "Success" (not "Failed")

5. **Review Generated Documents**
   - Click on different document types in the left sidebar
   - Each document should show:
     - Professional title
     - Realistic content relevant to the document type
     - Word count and reading time
     - Quality score

6. **Test Document Actions**
   - Click "Download" button for any document
   - Click "Share" button to test sharing functionality

**Expected Outcome:** ✅ Successfully generates multiple professional documents with realistic content

---

### **2. 🏠 Client Onboarding Workflow**

**Access Path:** Agent Dashboard → New Leads → Start Onboarding

**Testing Steps:**

1. **Access New Leads**
   - From Agent Dashboard, look for "New Leads" widget
   - Click on any lead card to open details

2. **Start Onboarding Process**
   - Click "Start Onboarding" button
   - System should trigger automated workflow
   - Check console for workflow logs

3. **Monitor Workflow Progress**
   - Workflow should:
     - Generate intake forms
     - Send automated emails
     - Create task lists
     - Set up follow-up reminders

**Expected Outcome:** ✅ Automated onboarding sequence initiates successfully

---

### **3. 🤝 Negotiation Pipeline Workflow**

**Access Path:** Agent Dashboard → Negotiations → Create Strategy

**Testing Steps:**

1. **Access Negotiations**
   - Click "Negotiations" in the sidebar
   - Navigate to negotiation dashboard

2. **Create Negotiation Strategy**
   - Click "Create New Strategy"
   - Fill in property and client details
   - Generate negotiation documents

3. **Test Multi-Round Support**
   - Create counter-offers
   - Generate response letters
   - Test strategic analysis

**Expected Outcome:** ✅ Generates comprehensive negotiation strategies and documents

---

### **4. 📊 Report Generation Workflow**

**Access Path:** Agent Dashboard → Repair Estimator → Generate Report

**Testing Steps:**

1. **Access Repair Estimator**
   - Click "Repair Estimator" in the sidebar
   - Upload sample PDF documents or use existing reports

2. **Generate Analysis Report**
   - Click "Generate Report" button
   - Monitor progress logs
   - Wait for completion

3. **Review Generated Report**
   - Check for issue identification
   - Verify cost estimates
   - Review executive summary

**Expected Outcome:** ✅ Generates professional repair analysis reports

---

### **5. 🔐 Document Sharing Workflow**

**Access Path:** Any generated document → Share button

**Testing Steps:**

1. **Generate a Document First**
   - Follow Document Generation steps above
   - Generate any document type

2. **Test Sharing Functionality**
   - Click "Share" button on any document
   - Verify sharing options appear
   - Test link generation
   - Check access controls

**Expected Outcome:** ✅ Creates secure sharing links with proper access controls

---

## **🎯 Quick Actions Testing**

### **Agent Dashboard Quick Actions**

1. **Add Buyer Button**
   - Click "Add Buyer" → Should navigate to Buyers Portal

2. **Add Listing Button**
   - Click "Add Listing" → Should navigate to Sellers Portal

3. **Generate Document Button**
   - Click "Generate Document" → Should open DocumentGenerator

4. **Market Analysis Button**
   - Click "Market Analysis" → Should show market analysis tools

**Expected Outcome:** ✅ All quick actions navigate to appropriate screens

---

## **🔧 Troubleshooting Common Issues**

### **Issue: Document Generation Shows "Status: Failed"**

**Solution:**
- Check browser console for error messages
- Verify client and agent profile data is complete
- The system now uses fallback content for testing - you should see realistic documents even if AI generation fails

### **Issue: Buttons Don't Respond**

**Solution:**
- Check browser console for JavaScript errors
- Verify you're properly authenticated
- Refresh the page and try again

### **Issue: Modal Doesn't Close**

**Solution:**
- Click the X button in the top-right corner
- Press Escape key
- Click outside the modal area

---

## **📊 Expected Results Summary**

After testing all workflows, you should have:

✅ **Document Generation:** Professional documents with realistic content
✅ **Client Onboarding:** Automated workflow sequences
✅ **Negotiation Pipeline:** Strategic documents and analysis
✅ **Report Generation:** Comprehensive repair analysis
✅ **Document Sharing:** Secure sharing capabilities
✅ **Quick Actions:** Smooth navigation between features

---

## **🎉 Success Indicators**

- [ ] All buttons respond to clicks
- [ ] Modals open and close properly
- [ ] Documents generate with realistic content
- [ ] Progress bars and status updates work
- [ ] Navigation between screens functions
- [ ] No critical console errors
- [ ] Workflows complete end-to-end

---

## **📞 Support**

If you encounter issues:
1. Check browser console for errors
2. Verify authentication status
3. Clear browser cache if needed
4. Check that all dependencies are installed (`npm install`)

**Note:** The system includes fallback content for testing. Even if AI generation isn't configured, you'll see realistic professional documents that demonstrate the workflow functionality. 