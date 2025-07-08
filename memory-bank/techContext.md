# Tech Context: Real Estate Agentic

## Core Technology Stack

### Confirmed Technologies
Based on the current implementation and project requirements:

- **Desktop Application**: Electron-based cross-platform desktop app
- **Frontend Framework**: React with TypeScript for type safety
- **Backend Services**: Firebase for authentication, database, and storage
- **Styling**: Tailwind CSS for modern, responsive design
- **Build System**: Vite for fast development and building

### Runtime Environment
- **Node.js**: v16+ for development and build processes
- **Electron**: v34.3.0 for desktop application framework
- **React**: v19.0.0 for UI framework
- **TypeScript**: v5.1.6 for type safety

### Backend Services (Firebase)
- **Firebase Authentication**: User management and secure access
- **Cloud Firestore**: NoSQL database for properties, estimates, and user data
- **Cloud Storage**: File storage for property photos and documents
- **Firebase SDK**: v10+ for client-side integration
- **Custom React Hooks**: Seamless Firebase integration with React components

### Build and Development Tools
- **Vite**: v6.2.0 for fast development and building
- **electron-vite**: v3.0.0 for Electron + Vite integration
- **electron-builder**: v25.1.8 for packaging and distribution
- **Biome**: v1.9.4 for unified linting and formatting

### UI and Styling
- **Tailwind CSS**: v4.0.9 for utility-first CSS
- **shadcn/ui**: For pre-built accessible components
- **Lucide React**: v0.477.0 for consistent icons
- **class-variance-authority**: v0.7.1 for component variants

## Firebase Integration Details

### Authentication Service
```typescript
// Complete user authentication flow
- User registration with email/password
- Secure login and logout
- Authentication state management
- Password reset functionality
- Real-time auth state updates
```

### Database Service (Firestore)
```typescript
// Data models for real estate application
- User profiles and preferences
- Property data with detailed information
- Repair estimates with itemized costs
- Document storage references
- Transaction history and analytics
```

### Storage Service
```typescript
// File handling capabilities
- Property photo uploads
- Inspection report documents
- Generated PDF reports
- Secure file access controls
- Optimized image handling
```

### Custom React Hooks
```typescript
// Firebase integration hooks
- useAuth: Authentication state management
- useFirestore: Database operations
- useStorage: File upload/download
- Real-time data synchronization
- Error handling and loading states
```

## Dependencies Analysis

### Production Dependencies
```json
{
  "class-variance-authority": "^0.7.1",    // Component variant management
  "clsx": "^2.1.1",                       // Conditional class names
  "electron-router-dom": "^2.1.0",        // Electron routing utilities
  "firebase": "^10.x",                    // Firebase SDK for backend services
  "lucide-react": "^0.477.0",             // Icon library
  "react": "^19.0.0",                     // UI framework
  "react-dom": "^19.0.0",                 // React DOM bindings
  "react-router-dom": "^7.2.0",           // Routing (available but not used)
  "tailwind-merge": "^3.0.2",             // Tailwind class merging
  "tailwindcss-animate": "^1.0.7"         // Animation utilities
}
```

### Development Dependencies
```json
{
  "@biomejs/biome": "^1.9.4",             // Linting and formatting
  "@tailwindcss/vite": "^4.0.9",          // Tailwind Vite integration
  "@types/node": "^22.13.8",              // Node.js types
  "@types/react": "^19.0.10",             // React types
  "@types/react-dom": "^19.0.4",          // React DOM types
  "@vitejs/plugin-react": "^4.0.4",       // React Vite plugin
  "electron": "^34.3.0",                  // Electron runtime
  "electron-builder": "^25.1.8",          // Packaging tool
  "typescript": "^5.1.6",                 // TypeScript compiler
  "vite": "^6.2.0"                        // Build tool
}
```

## Development Setup

### Prerequisites
- Node.js v16 or later
- npm (comes with Node.js)
- Git for version control
- Firebase project with authentication, Firestore, and Storage enabled

### Installation Commands
```bash
# Clone repository
git clone https://github.com/RealEstateAgentic/RealEstateAgentic.git
cd RealEstateAgentic

# Install dependencies
npm install

# Configure Firebase (environment variables required)
# Create .env file with Firebase configuration
```

### Development Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Clean development build
npm run clean:dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Create release build
npm run make:release
```

## Configuration Files

### Firebase Configuration
- Firebase project configuration in environment variables
- Type-safe Firebase service initialization
- Error handling for Firebase operations
- Security rules for Firestore and Storage

### TypeScript Configuration
- `tsconfig.json`: TypeScript compiler settings
- Strict mode enabled for type safety
- Path mapping for clean imports
- Firebase type definitions

### Build Configuration
- `electron-builder.ts`: Packaging configuration
- `electron.vite.config.ts`: Vite configuration for Electron
- `vite-tsconfig-paths` for path resolution

### Code Quality
- `biome.json`: Biome configuration for linting and formatting
- `.editorconfig`: Editor configuration
- `.npmrc`: npm configuration

### UI Framework Configuration
- `components.json`: shadcn/ui component configuration
- `tailwind.config.js`: Tailwind CSS configuration (generated)
- `globals.css`: Global styles and Tailwind directives

## Technical Constraints

### Electron Security
- Context isolation enabled in preload scripts
- No direct Node.js access in renderer process
- IPC communication for system operations
- Firebase SDK properly configured for Electron environment

### Firebase Limitations
- Offline capability considerations
- Data synchronization patterns
- File size limits for storage
- Firestore query limitations

### Performance Considerations
- Electron bundle size optimization
- React component rendering efficiency
- Firebase real-time listener management
- Memory management for long-running desktop app

### Cross-Platform Compatibility
- macOS, Windows, and Linux support
- Platform-specific build configurations
- Consistent UI across operating systems
- Firebase SDK compatibility across platforms

## Development Workflow

### Hot Reload Development
- Vite dev server for instant feedback
- Automatic TypeScript compilation
- Hot module replacement for React components
- Firebase emulator support for development

### Code Quality Checks
- TypeScript compilation errors
- Biome linting and formatting
- Firebase security rules validation
- Pre-commit hooks (to be implemented)

### Build Process
1. TypeScript compilation
2. Vite bundling
3. Firebase configuration validation
4. Electron packaging
5. Distribution file generation

## Environment Variables

### Development
- `NODE_ENV=development` for development mode
- Firebase configuration variables
- Hot reload and developer tools enabled

### Production
- Optimized builds
- Minified code
- Production Firebase configuration
- No development tools

## Future Technical Considerations

### Planned Additions
- **AI Service Integration**: OpenAI API or similar for intelligent analysis
- **Testing Framework**: Jest/Vitest for comprehensive testing
- **State Management**: Zustand/Redux for complex state needs
- **Real-time Features**: Firebase real-time database for live updates
- **Analytics**: Firebase Analytics for usage tracking

### Performance Optimizations
- Code splitting for larger application
- Lazy loading of heavy components
- Firebase query optimization
- Memory leak prevention
- Efficient real-time listener management

### Security Enhancements
- Input validation and sanitization
- Secure file handling
- Firebase security rules
- Encrypted local storage
- Safe external API communication

### Scalability Considerations
- Database indexing strategies
- File storage optimization
- Caching mechanisms
- Offline-first architecture
- Multi-tenant support for brokerages 