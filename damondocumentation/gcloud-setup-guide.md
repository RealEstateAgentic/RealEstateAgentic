# Google Cloud Setup Guide for Real Estate Agentic Flow (Google-Native Implementation)

## Current API Keys Analysis

### ✅ Available Keys (from .env)
- **OpenAI API Key**: `OPENAI_API_KEY` - Ready for LangChain integration
- **Firebase Configuration**: Complete set of Firebase credentials for project `recursor-56f01`

### ❌ Missing API Keys for Full Implementation
- **Google Cloud Service Account Key** (JSON file)
- **Google OAuth 2.0 Credentials** (for user consent flows)
- **Gamma API Key** (for presentation generation) - Optional

## IMPORTANT: Google-Native Approach Benefits
- **No SendGrid needed** - Using Gmail API instead
- **No Calendly needed** - Using Google Calendar API instead
- **Cost-effective** - Only Google Workspace APIs required
- **Unified authentication** - Single OAuth flow for all Google services

## Step 1: Google Cloud Project Setup

### 1.1 Access Google Cloud Console
```bash
# Install Google Cloud CLI if not already installed
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### 1.2 Set Your Project
```bash
# Use your existing Firebase project
gcloud config set project recursor-56f01
```

### 1.3 Enable Required APIs (Maximum Scope Coverage)
```bash
# Enable ALL necessary Google Workspace APIs
gcloud services enable gmail.googleapis.com
gcloud services enable calendar-json.googleapis.com
gcloud services enable sheets.googleapis.com
gcloud services enable docs.googleapis.com
gcloud services enable drive.googleapis.com
gcloud services enable forms.googleapis.com
gcloud services enable slides.googleapis.com
gcloud services enable contacts.googleapis.com
gcloud services enable people.googleapis.com
gcloud services enable oauth2.googleapis.com
gcloud services enable admin.googleapis.com
gcloud services enable groupssettings.googleapis.com
gcloud services enable script.googleapis.com
```

## Step 2: Service Account Creation

### 2.1 Create Service Account
```bash
# Create service account for backend automation
gcloud iam service-accounts create realestateagentic-service \
    --description="Service account for Real Estate Agentic automation" \
    --display-name="RealEstateAgentic Service"
```

### 2.2 Assign MAXIMUM Required Roles (Full Access)
```bash
# Get your project ID
PROJECT_ID="recursor-56f01"

# Assign MAXIMUM necessary roles for full Google Workspace access
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:realestateagentic-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/firebase.admin"

# Gmail - Full access (read, write, delete, compose, contacts)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:realestateagentic-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/gmail.admin"

# Calendar - Full access (read, write, delete, events, sharing)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:realestateagentic-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/calendar.admin"

# Drive - Full access (read, write, delete, share, organize)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:realestateagentic-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/drive.admin"

# Sheets - Full access (read, write, delete, format, share)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:realestateagentic-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/sheets.editor"

# Docs - Full access (read, write, delete, format, share)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:realestateagentic-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/docs.editor"

# Forms - Full access (create, edit, delete, responses)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:realestateagentic-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/forms.editor"

# Contacts/People - Full access (read, write, delete contacts)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:realestateagentic-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/contactcenterinsights.admin"

# Additional broad access roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:realestateagentic-service@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/editor"
```

### 2.3 Generate Service Account Key
```bash
# Create and download the service account key
gcloud iam service-accounts keys create ./credentials/service-account-key.json \
    --iam-account=realestateagentic-service@recursor-56f01.iam.gserviceaccount.com

# Create credentials directory if it doesn't exist
mkdir -p ./credentials
```

## Step 3: OAuth 2.0 Setup for User Consent

### 3.1 Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click "Create Credentials" > "OAuth 2.0 Client IDs"
4. Choose "Desktop application" as application type
5. Name it "RealEstateAgentic Desktop"
6. Download the client configuration JSON

### 3.2 Configure OAuth Scopes (MAXIMUM PERMISSIONS)
Required scopes for FULL ACCESS to all Google services:

#### Gmail Scopes (Full Access)
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.compose
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/gmail.metadata
https://www.googleapis.com/auth/gmail.labels
https://www.googleapis.com/auth/gmail.insert
https://www.googleapis.com/auth/gmail.settings.basic
https://www.googleapis.com/auth/gmail.settings.sharing
```

#### Calendar Scopes (Full Access)
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.events.readonly
https://www.googleapis.com/auth/calendar.settings.readonly
https://www.googleapis.com/auth/calendar.acls
https://www.googleapis.com/auth/calendar.acls.readonly
https://www.googleapis.com/auth/calendar.calendarlist
https://www.googleapis.com/auth/calendar.calendarlist.readonly
```

#### Drive Scopes (Full Access)
```
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/drive.appdata
https://www.googleapis.com/auth/drive.metadata
https://www.googleapis.com/auth/drive.metadata.readonly
https://www.googleapis.com/auth/drive.photos.readonly
https://www.googleapis.com/auth/drive.scripts
https://www.googleapis.com/auth/drive.activity
https://www.googleapis.com/auth/drive.activity.readonly
```

#### Sheets Scopes (Full Access)
```
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/spreadsheets.readonly
https://www.googleapis.com/auth/drive.file
```

#### Docs Scopes (Full Access)
```
https://www.googleapis.com/auth/documents
https://www.googleapis.com/auth/documents.readonly
https://www.googleapis.com/auth/drive.file
```

#### Forms Scopes (Full Access)
```
https://www.googleapis.com/auth/forms.body
https://www.googleapis.com/auth/forms.body.readonly
https://www.googleapis.com/auth/forms.responses.readonly
https://www.googleapis.com/auth/drive.file
```

#### Contacts/People Scopes (Full Access)
```
https://www.googleapis.com/auth/contacts
https://www.googleapis.com/auth/contacts.readonly
https://www.googleapis.com/auth/contacts.other.readonly
https://www.googleapis.com/auth/directory.readonly
https://www.googleapis.com/auth/user.addresses.read
https://www.googleapis.com/auth/user.birthday.read
https://www.googleapis.com/auth/user.emails.read
https://www.googleapis.com/auth/user.gender.read
https://www.googleapis.com/auth/user.organization.read
https://www.googleapis.com/auth/user.phonenumbers.read
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

#### Additional Scopes
```
https://www.googleapis.com/auth/script.projects
https://www.googleapis.com/auth/script.webapp.deploy
https://www.googleapis.com/auth/presentations
https://www.googleapis.com/auth/presentations.readonly
```

## Step 4: Update .env File

Add these new environment variables to your `.env` file:

```env
# Google Cloud Service Account (path to JSON file)
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials/service-account-key.json

# Google OAuth 2.0 (path to client secrets JSON)
GOOGLE_OAUTH_CLIENT_SECRETS_PATH=./credentials/oauth-client-secrets.json

# Google Cloud Project
GOOGLE_CLOUD_PROJECT_ID=recursor-56f01

# Agent Configuration (for personalized automation)
AGENT_EMAIL_ADDRESS=your-agent@gmail.com
AGENT_CALENDAR_ID=primary
AGENT_NAME="Your Agent Name"
AGENT_PHONE="+1234567890"
AGENT_VIDEO_URL="https://your-intro-video-url.com"

# Optional External API Keys
GAMMA_API_KEY=your_gamma_api_key_here

# Gmail Configuration
GMAIL_USER_EMAIL=your-agent@gmail.com

# Application URLs
APP_BASE_URL=http://localhost:3000
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

## Step 5: Test Authentication

### 5.1 Test Service Account
```bash
# Test service account authentication
gcloud auth activate-service-account \
    --key-file=./credentials/service-account-key.json

# Test API access
gcloud auth application-default print-access-token
```

### 5.2 Test OAuth Flow
Create a simple test script to verify OAuth setup:

```javascript
// comprehensive-auth-test.js
const { google } = require('googleapis');
const fs = require('fs');

async function testAllGoogleAPIs() {
    try {
        // Test service account with ALL required scopes
        const auth = new google.auth.GoogleAuth({
            keyFile: './credentials/service-account-key.json',
            scopes: [
                // Gmail scopes
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.compose',
                'https://www.googleapis.com/auth/gmail.modify',
                
                // Calendar scopes
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
                
                // Drive scopes
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.file',
                
                // Sheets scopes
                'https://www.googleapis.com/auth/spreadsheets',
                
                // Docs scopes
                'https://www.googleapis.com/auth/documents',
                
                // Forms scopes
                'https://www.googleapis.com/auth/forms.body',
                'https://www.googleapis.com/auth/forms.responses.readonly',
                
                // Contacts scopes
                'https://www.googleapis.com/auth/contacts',
                'https://www.googleapis.com/auth/contacts.readonly'
            ]
        });
        
        const authClient = await auth.getClient();
        console.log('✅ Service account authentication successful');
        
        // Test Gmail API
        const gmail = google.gmail({ version: 'v1', auth: authClient });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        console.log('✅ Gmail API access successful');
        
        // Test Calendar API
        const calendar = google.calendar({ version: 'v3', auth: authClient });
        const calendars = await calendar.calendarList.list();
        console.log('✅ Google Calendar API access successful');
        
        // Test Drive API
        const drive = google.drive({ version: 'v3', auth: authClient });
        const files = await drive.files.list({ pageSize: 1 });
        console.log('✅ Google Drive API access successful');
        
        // Test Sheets API
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        console.log('✅ Google Sheets API access successful');
        
        // Test Docs API
        const docs = google.docs({ version: 'v1', auth: authClient });
        console.log('✅ Google Docs API access successful');
        
        // Test Forms API
        const forms = google.forms({ version: 'v1', auth: authClient });
        console.log('✅ Google Forms API access successful');
        
        // Test People API (Contacts)
        const people = google.people({ version: 'v1', auth: authClient });
        console.log('✅ Google People API (Contacts) access successful');
        
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        console.error('Error details:', error);
    }
}

testAllGoogleAPIs();
```

## Step 6: Additional API Keys Setup

### 6.1 Gmail API Setup (No SendGrid Needed)
**Using Gmail API instead of SendGrid for cost savings and better integration:**
1. Gmail API will be authenticated via OAuth 2.0
2. Agent's personal Gmail account will send emails
3. Full access to Gmail features (compose, send, read, delete)
4. Access to contacts for lead management

### 6.2 Google Calendar API Setup (No Calendly Needed)
**Using Google Calendar API instead of Calendly:**
1. Create events directly in agent's Google Calendar
2. Send calendar invites automatically
3. Manage availability and conflicts
4. Generate meeting links and scheduling automation

### 6.3 Google Sheets API for CRM Functions
**Replace traditional CRM with Google Sheets:**
1. Auto-populate lead data from forms
2. Track buyer/seller progress
3. Generate reports and analytics
4. Share data with team members

### 6.4 Optional: Gamma API Setup
1. Visit [Gamma](https://gamma.app/)
2. Check their API documentation
3. Create API key if available
4. Add to .env as `GAMMA_API_KEY`

## Security Best Practices

1. **Never commit credentials to git**:
   ```bash
   # Add to .gitignore
   echo "credentials/" >> .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use environment-specific configs**:
   - `.env.development`
   - `.env.production`
   - `.env.test`

3. **Rotate keys regularly**

4. **Use least privilege principle** for service account roles

## Next Steps After Setup

1. **Test all authentication flows** (OAuth 2.0 and Service Account)
2. **Implement Firebase initialization** for data persistence
3. **Set up basic LangChain agent** for buyer/seller qualification
4. **Create first automation workflow** (form → email → calendar → sheets)
5. **Test Gmail API email sending** capabilities
6. **Test Google Calendar API** event creation
7. **Test Google Sheets API** data population
8. **Integrate Google Forms API** for dynamic form creation
9. **Test Google Drive API** for document management

## Complete Integration Workflow

### Buyer Onboarding Flow (Google-Native):
1. **Agent Action**: Click "Start Buyer Onboarding" button
2. **Form Creation**: Google Forms API creates personalized buyer qualification form
3. **Form Distribution**: Gmail API sends form link to buyer
4. **Form Completion**: Google Forms API captures responses
5. **Data Processing**: LangChain/OpenAI summarizes form responses
6. **Data Storage**: Google Sheets API logs all data
7. **Email Automation**: Gmail API sends personalized response with agent video
8. **Calendar Scheduling**: Google Calendar API creates consultation appointment
9. **Document Management**: Google Drive API stores all related documents
10. **Presentation Creation**: Gamma API generates buyer presentation
11. **Follow-up**: Gmail API sends presentation to agent for review

### Seller Onboarding Flow (Google-Native):
1. **Agent Action**: Click "Start Seller Onboarding" button
2. **Form Creation**: Google Forms API creates seller qualification form
3. **Form Distribution**: Gmail API sends form link to seller
4. **Form Completion**: Google Forms API captures responses
5. **Data Processing**: LangChain/OpenAI analyzes seller motivation and timeline
6. **Data Storage**: Google Sheets API logs all data
7. **Email Automation**: Gmail API sends personalized response
8. **Calendar Scheduling**: Google Calendar API creates listing appointment
9. **Document Management**: Google Drive API prepares listing documents
10. **Market Analysis**: Generate CMA using property data
11. **Follow-up**: Gmail API sends market analysis to agent

## Troubleshooting

### Common Issues:
- **Quota exceeded**: Enable billing in Google Cloud
- **Access denied**: Check service account roles
- **OAuth errors**: Verify redirect URIs
- **API not enabled**: Run the enable commands again

### Debug Commands:
```bash
# Check current auth
gcloud auth list

# Check enabled APIs
gcloud services list --enabled

# Test service account permissions
gcloud auth activate-service-account --key-file=./credentials/service-account-key.json
```