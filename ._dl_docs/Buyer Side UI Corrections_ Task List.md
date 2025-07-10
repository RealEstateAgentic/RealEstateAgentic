# **Buyer Side UI Corrections: Task List**

This document outlines the required UI/UX corrections and enhancements for the Buyer Client pop-up modal.

### **1\. Client Pop-Up Modal: General Layout & Behavior**

These changes apply to the modal when opened from either the main Kanban board or the Archive page.

* **Modal Sizing:**  
  * Increase the modal's dimensions to occupy approximately **85% of the total application window height and width**.  
  * The modal must remain centered within the window.  
  * The background behind the modal should remain a dark, semi-transparent overlay.  
* **Workflow Button Row:**  
  * The bottom row containing action buttons (e.g., `Archive`, `Progress to...`) must **wrap to a new row** if the number of buttons exceeds the available width.  
  * This row should **not** become horizontally scrollable.  
* **Content Scrolling:**  
  * The main content area within the tabs (see section 2\) must become vertically scrollable if the content exceeds the modal's viewable height. The overall modal should not scroll; only the content within the active tab.

### **2\. Client Pop-Up Modal: Tabbed Interface Implementation**

Implement a primary tabbed navigation system within the modal to organize client information. The following tabs must be created, with visibility conditional on the client's stage:

1. **Overview**  
2. **Stage Details**  
3. **Summary**  
4. **Offers** (Visible in `Active Search` stage only)  
5. **Contingencies** (Visible in `Under Contract` stage only)  
6. **Content**  
7. **Email History**  
8. **Calendar**

### **3\. Tab-Specific Requirements**

#### **3.1. `Overview` Tab**

* This tab will contain the high-level, AI-generated bullet point summary of the client's profile. This was previously referred to as the "Client Summary".

#### **3.2. `Stage Details` Tab**

* This tab will house the context-aware, stage-specific information and action widgets.  
* **`New Leads` Stage Content:** Shows the survey results and AI briefing.  
* **`Under Contract` Stage Content:**  
  * Shows the Transaction Timeline and Inspection Hub.  
  * **Inspection Hub Action:** The "Upload Inspection Report" button within this hub should redirect the user to the dedicated "repair-estimator" page.  
  * The Option Period deadline must be prominently displayed.  
  * Must include a **"Key Contacts" widget** to display and manage contact information for the Lender, Title/Escrow Officer, and the Co-operating Agent for the specific transaction.

#### **3.3. `Summary` Tab**

* **Content:** This tab will display a concise, AI-generated bullet-point summary derived from *all* available client data in the RAG database (surveys, emails, meeting transcripts, notes, etc.).  
* **Action Buttons:** At the bottom of this tab's content area (above the main workflow button row), add two buttons:  
  * `See Full Summary`: Opens a new, secondary pop-up modal displaying a comprehensive, long-form summary document.  
  * `Download Full Summary`: Allows the user to download the comprehensive summary as a file.

#### **3.4. `Offers` Tab**

* **Visibility:** This tab should **only be visible** when a client is in the `Active Search` stage.  
* **Workflow Integration:** Add a new workflow button, `Upload Offer`, to the bottom button row when a client is in the `Active Search` stage.  
* **Content:**  
  * Displays a list of all offers associated with the client.  
  * The list must be vertically scrollable.  
  * Each list item must display relevant metadata, such as `Property Address` and `Offer Price`.

#### **3.5. `Contingencies` Tab**

* **Visibility:** This tab should **only be visible** when a client is in the `Under Contract` stage.  
* **Content:** This tab will feature an **interactive checklist** for all major contingencies.  
  * Each contingency (e.g., Inspection, Appraisal, Loan) will be a list item with a checkbox.  
  * The agent can manually check off each item as it is cleared, providing a clear visual indicator of progress.

#### **3.6. `Content` Tab**

* **Functionality:** This tab serves as a central document repository for all files related to the client.  
* **Content:**  
  * Display a list view of all uploaded and generated files (documents, audio files, images, presentations).  
  * Each item in the list must have a `View` button (opens the file in a new pop-up modal) and a `Download` button.  
* **AI File Naming:**  
  * When a file is uploaded, an AI workflow must analyze it and assign a descriptive title if one isn't present (e.g., an untitled PDF becomes "Inspection Report \- 123 Main St.pdf").  
  * The file title must be editable by the agent.



#### **3.8. `Calendar` Tab**

* **Functionality:** This tab provides a client-specific timeline of all scheduled events.  
* **Content (List View):**  
  * The view must be a vertically scrollable list, not a grid calendar.  
  * The list must be divided into two sections:  
    1. **Coming Events:** Sorted with the soonest event at the top.  
    2. **Past Events:** Appears below "Coming Events," sorted with the most recent event at the top.

### **4\. Workflow Button Changes**

* **"Send Survey" Button Relocation (`New Leads` Stage):**  
  * The action to send the initial onboarding survey must be moved from the Kanban card into the pop-up modal.  
  * Add a **`Send Survey`** button to the main workflow button row at the bottom of the modal, visible only during the `New Leads` stage.  
  * If the survey has already been sent, this button's text and function should change to **`Resend Survey`**.  
  * **Developer's Note:** Ensure the existing LangChain workflow for sending the survey via email is correctly linked to this new button in the modal to preserve functionality.  
* **"Generate Closing Packet" Button (`Closed` Stage):**  
  * Add a **`Generate Closing Packet`** button to the main workflow button row at the bottom of the modal, visible only during the `Closed` stage.  
  * This button will trigger a workflow to compile all key documents from the `Content` tab into a single downloadable archive.  
* **"Return to Previous Stage" Button:**  
  * For all stages *except* `New Leads`, add a **`Return to [Previous Stage Title]`** button to the workflow button row.  
  * This button should be positioned after the `Progress to [Next Stage Title]` button.

### **5\. New Feature: Manual Lead Entry**

This section details the requirements for adding a new buyer lead manually.

* **Button for Manual Entry:**  
  * **Location:** In the right-hand sidebar of the Buyers Portal, positioned directly *above* the "Client Communication Feed" widget.  
  * **UI:** A prominent button labeled **"Add New Buyer Lead"** with an appropriate icon (e.g., a plus sign). The design should be consistent with the "Buyer Archive" button (blue-outlined style).  
* **"Add New Lead" Pop-Up Modal:**  
  * **Trigger:** Clicking the "Add New Buyer Lead" button opens a new pop-up modal.  
  * **Content:** The modal will contain a form for the agent to input the lead's information.  
    * **Required Fields:** Name, Email, Phone Number.  
    * **Optional Fields:** Lead Source, Notes.  
    * **Document Upload:** A section to drag-and-drop or browse for any initial documents (e.g., a pre-approval letter, notes from a call).  
* **Submission Workflow:**  
  * **Action:** Upon clicking "Submit" in the modal.  
  * **Result:**  
    * A new client card is created and automatically placed in the **`New Leads`** column of the Kanban board.  
    * All information entered into the form and any uploaded documents will be automatically populated into the corresponding sections of the new client's pop-up modal (e.g., contact info in the vitals, documents in the `Content` tab).

#### **3.7. `Email History` Tab**

* **Functionality:** This tab provides a view of email correspondence with the client.  
* **Content (List View):**  
  * Display a vertically scrollable list of email threads.  
  * Each list item should show the **Subject Line**, the **first 1-2 lines** of the latest message, and a circular badge indicating the **number of messages** in the thread.  
* **Action:**  
  * Clicking on any thread in the list will open a new, secondary pop-up modal.  
  * This new modal will display the full email thread, which must be vertically scrollable.