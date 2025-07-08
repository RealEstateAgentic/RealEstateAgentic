# Tech Context: Real Estate Agentic

## Core Technology Stack

### Runtime Environment
- **Node.js**: v16+ for development and build processes
- **Electron**: v34.3.0 for desktop application framework
- **React**: v19.0.0 for UI framework
- **TypeScript**: v5.1.6 for type safety

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

## Dependencies Analysis

### Production Dependencies
```json
{
  "class-variance-authority": "^0.7.1",    // Component variant management
  "clsx": "^2.1.1",                       // Conditional class names
  "electron-router-dom": "^2.1.0",        // Electron routing utilities
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

### Installation Commands
```bash
# Clone repository
git clone https://github.com/RealEstateAgentic/RealEstateAgentic.git
cd RealEstateAgentic

# Install dependencies
npm install
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

### TypeScript Configuration
- `tsconfig.json`: TypeScript compiler settings
- Strict mode enabled for type safety
- Path mapping for clean imports

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

### Performance Considerations
- Electron bundle size optimization
- React component rendering efficiency
- Memory management for long-running desktop app

### Cross-Platform Compatibility
- macOS, Windows, and Linux support
- Platform-specific build configurations
- Consistent UI across operating systems

## Development Workflow

### Hot Reload Development
- Vite dev server for instant feedback
- Automatic TypeScript compilation
- Hot module replacement for React components

### Code Quality Checks
- TypeScript compilation errors
- Biome linting and formatting
- Pre-commit hooks (to be implemented)

### Build Process
1. TypeScript compilation
2. Vite bundling
3. Electron packaging
4. Distribution file generation

## Environment Variables

### Development
- `NODE_ENV=development` for development mode
- Hot reload and developer tools enabled

### Production
- Optimized builds
- Minified code
- No development tools

## Future Technical Considerations

### Planned Additions
- Testing framework (Jest/Vitest)
- State management (Zustand/Redux)
- Database integration (SQLite)
- AI service integration
- File system operations

### Performance Optimizations
- Code splitting for larger application
- Lazy loading of heavy components
- Memory leak prevention
- Efficient IPC communication

### Security Enhancements
- Input validation
- Secure file handling
- Encrypted data storage
- Safe external API communication 