# AIgent Pro

🏠 **AI-Powered Real Estate Agent Platform**

A comprehensive desktop application designed to empower real estate agents with AI-driven document generation, offer analysis, and negotiation support.

## Features

- **AI Document Generation**: Create cover letters, negotiation strategies, and explanation memos
- **Offer Analysis**: Comprehensive property and financial analysis
- **Client Management**: Track buyers and sellers through the sales process
- **Repair Estimation**: Generate detailed repair reports and cost estimates
- **Market Analytics**: AI-powered market analysis and insights

## Quick Start

```bash
git clone https://github.com/RealEstateAgentic/RealEstateAgentic.git
cd RealEstateAgentic
```

## Prerequisites

- **Node.js** (v16 or later) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

## Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/RealEstateAgentic/RealEstateAgentic.git
cd RealEstateAgentic

# Install dependencies
npm install
```

### 2. Development

```bash
# Start the development server
npm run dev

# This will:
# - Build the app in development mode
# - Open the Electron window
# - Enable hot reload for changes
# - Open developer tools automatically
```

### 3. Building

```bash
# Build for production
npm run build

# This will:
# - Compile the app
# - Create distributable files (DMG, ZIP for macOS)
# - Output files will be in the `dist/` folder
```

### 4. Other Commands

```bash
# Clean development build
npm run clean:dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Create release build
npm run make:release
```

## Google Cloud Setup

This application integrates with Google Cloud services (Gmail, Calendar, Drive, Docs, Sheets, etc.). To enable these integrations:

### 1. Install Google Cloud CLI

```bash
# macOS (using Homebrew)
brew install --cask google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 2. Authenticate with Google Cloud

```bash
# Login with your Google account
gcloud auth login

# Set your project (use the project ID from your .env file)
gcloud config set project YOUR_PROJECT_ID

# Verify your setup
gcloud config list
```

### 3. Enable Required APIs

```bash
# Enable Google Workspace APIs for real estate features
gcloud services enable \
  gmail.googleapis.com \
  calendar-json.googleapis.com \
  drive.googleapis.com \
  docs.googleapis.com \
  sheets.googleapis.com \
  people.googleapis.com \
  tasks.googleapis.com

# Check enabled services
gcloud services list --enabled
```

### 4. Set up Authentication

```bash
# For development - enables application default credentials
gcloud auth application-default login
```

### Available Google Services

- **📧 Gmail API**: Send property alerts, follow-ups
- **📅 Calendar API**: Schedule showings, appointments  
- **📁 Drive API**: Store property documents, photos
- **📄 Docs API**: Generate contracts, reports
- **📊 Sheets API**: Track leads, analytics
- **👥 People API**: Manage client contacts
- **✅ Tasks API**: Task management integration

## Project Structure

```
src/
├── main/           # Electron main process
├── preload/        # Preload scripts
├── renderer/       # React frontend
│   ├── components/ # Reusable UI components
│   ├── screens/    # Application screens
│   └── lib/        # Utilities and libraries
└── shared/         # Shared types and constants
```

## Tech Stack

- **Electron** - Desktop app framework
- **React** - Frontend UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool
- **Biome** - Fast linter and formatter

## Contributing

Please read our [contributing guide](CONTRIBUTING.md) to learn how you can help out. 
