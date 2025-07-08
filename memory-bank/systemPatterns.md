# System Patterns: Real Estate Agentic

## Architecture Overview

### Electron Multi-Process Architecture
- **Main Process**: Node.js environment handling system APIs and window management
- **Renderer Process**: React application running in Chromium for UI
- **Preload Scripts**: Secure bridge between main and renderer processes

### Project Structure Pattern
```
src/
├── main/           # Electron main process
│   ├── index.ts    # Main entry point
│   └── windows/    # Window management
├── preload/        # Secure IPC bridge
├── renderer/       # React UI application
│   ├── components/ # Reusable UI components
│   ├── screens/    # Page-level components
│   └── lib/        # Utilities and helpers
└── shared/         # Cross-process shared code
```

## Key Technical Patterns

### Component Architecture
- **Functional Components**: Using React hooks for state management
- **Component Composition**: Building complex UI from simple, reusable components
- **Props Interface**: TypeScript interfaces for component contracts

### State Management Pattern
```typescript
// Simple state-based routing
const [currentRoute, setCurrentRoute] = useState('/')

// Navigation function pattern
const navigate = (path: string) => {
  setCurrentRoute(path)
}
```

### UI Component Patterns
- **shadcn/ui Components**: Pre-built, accessible components
- **Tailwind CSS**: Utility-first styling approach
- **Lucide Icons**: Consistent icon library
- **Responsive Design**: Mobile-first approach with desktop optimization

## Data Flow Patterns

### Navigation Flow
```
App Component
├── useState for route management
├── navigate function passed as props
├── Switch statement for screen rendering
└── Layout wrapper for consistent UI
```

### Component Communication
- **Props Down**: Data flows down through component hierarchy
- **Events Up**: User interactions bubble up through callbacks
- **Context (Future)**: For global state when needed

## File Organization Patterns

### Screen Components
- One screen per file in `src/renderer/screens/`
- Named exports with descriptive component names
- TypeScript documentation comments
- Props interface definitions

### UI Components
- Reusable components in `src/renderer/components/ui/`
- Following shadcn/ui patterns
- Consistent styling with Tailwind CSS
- Accessible by default

### Utility Functions
- Shared utilities in `src/shared/utils.ts`
- Renderer-specific utilities in `src/renderer/lib/utils.ts`
- Pure functions with TypeScript types

## Security Patterns

### Context Isolation
- Preload scripts with context isolation enabled
- No direct Node.js access in renderer process
- IPC communication for system operations

### Type Safety
- TypeScript throughout the application
- Strict type checking enabled
- Interface definitions for all data structures

## Build and Development Patterns

### Development Workflow
- **Hot Reload**: Instant feedback during development
- **TypeScript Compilation**: Type checking and transpilation
- **Vite Integration**: Fast build tool for modern development

### Code Quality
- **Biome**: Unified linting and formatting
- **TypeScript**: Static type checking
- **Consistent Formatting**: Automated code styling

## Error Handling Patterns

### Current Approach
- Basic error boundaries (to be implemented)
- Console logging for development
- Graceful fallbacks for missing components

### Planned Improvements
- Structured error logging
- User-friendly error messages
- Recovery mechanisms for failed operations

## Performance Patterns

### Electron Optimization
- Efficient IPC communication
- Lazy loading of heavy components
- Memory management for long-running processes

### React Optimization
- Functional components with hooks
- Memoization where appropriate
- Efficient re-rendering strategies

## Testing Patterns (Future)

### Planned Testing Strategy
- Unit tests for utility functions
- Component testing with React Testing Library
- Integration tests for main processes
- End-to-end testing for critical user flows

## Deployment Patterns

### Build Process
- Electron Builder for packaging
- Cross-platform builds (macOS, Windows, Linux)
- Automated dependency installation
- Release automation scripts

### Distribution
- DMG files for macOS
- Executable installers for Windows
- AppImage for Linux distributions 