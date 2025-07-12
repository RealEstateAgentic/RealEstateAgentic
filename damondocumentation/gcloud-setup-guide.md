# Google Cloud Setup Guide for AIgent Pro Flow (Google-Native Implementation)

## Current API Keys Analysis

### API Keys Currently in Use
```
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

### Google Cloud Migration Strategy

1. **Firebase Integration**: Already using Firebase for authentication, Firestore, and storage
2. **Google AI Integration**: Can integrate Google AI models through Vertex AI
3. **Service Account Setup**: Create dedicated service account for AIgent Pro automation
4. **API Key Management**: Centralize all Google services through single service account

## Step-by-Step Setup

### 1. Create Service Account
```bash
# Create service account
gcloud iam service-accounts create aigentpro-service \
--description="Service account for AIgent Pro automation" \
--display-name="AIgent Pro Service"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
--member="serviceAccount:aigentpro-service@$PROJECT_ID.iam.gserviceaccount.com" \
--role="roles/firebase.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
--member="serviceAccount:aigentpro-service@$PROJECT_ID.iam.gserviceaccount.com" \
--role="roles/firestore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
--member="serviceAccount:aigentpro-service@$PROJECT_ID.iam.gserviceaccount.com" \
--role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
--member="serviceAccount:aigentpro-service@$PROJECT_ID.iam.gserviceaccount.com" \
--role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
--member="serviceAccount:aigentpro-service@$PROJECT_ID.iam.gserviceaccount.com" \
--role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
--member="serviceAccount:aigentpro-service@$PROJECT_ID.iam.gserviceaccount.com" \
--role="roles/logging.logWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
--member="serviceAccount:aigentpro-service@$PROJECT_ID.iam.gserviceaccount.com" \
--role="roles/monitoring.metricWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
--member="serviceAccount:aigentpro-service@$PROJECT_ID.iam.gserviceaccount.com" \
--role="roles/cloudtrace.agent"

# Generate service account key
gcloud iam service-accounts keys create aigentpro-key.json \
--iam-account=aigentpro-service@recursor-56f01.iam.gserviceaccount.com
```

### 2. OAuth Setup for Gmail Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Create OAuth 2.0 Client ID
4. Application type: Desktop Application
5. Name it "AIgent Pro Desktop"