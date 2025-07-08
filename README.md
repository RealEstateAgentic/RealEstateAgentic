# RealEstateAgentic

Gauntlet AI Cohort 2 Week 4 Open Source project. 
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
